"""FastAPI application for AI Assistant backend."""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import uuid
from datetime import datetime

from models.schema import (
    UserRequest,
    AgentResponse,
    HealthResponse,
    ConversationState,
    ConversationStatus,
    ToolType,
    ToolAction
)
from db.mongo_client import MongoDBClient, mongodb_client
from utils.config import get_settings
from utils.state_manager import StateManager, state_manager
from utils.gemini_client import GeminiClient
from utils.llm_router import LLMRouter
from tools.google_auth import GoogleAuthHandler
from tools.gmail_tool import GmailTool
from tools.calendar_tool import CalendarTool
from tools.docs_tool import DocsTool
from tools.slack_tool import SlackTool
from tools.sms_tool import SMSTool

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting up application...")
    
    # Initialize MongoDB
    global mongodb_client
    mongodb_client = MongoDBClient(
        connection_string=settings.mongodb_url,
        database_name=settings.mongodb_database
    )
    await mongodb_client.connect()
    
    # Initialize Redis State Manager
    global state_manager
    state_manager = StateManager(
        redis_url=settings.redis_url,
        default_ttl=settings.redis_ttl
    )
    await state_manager.connect()
    
    logger.info("Application started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    await mongodb_client.disconnect()
    await state_manager.disconnect()
    logger.info("Application shutdown complete")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "AI Assistant Backend API",
        "version": settings.app_version,
        "status": "running"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    mongodb_healthy = await mongodb_client.health_check()
    redis_healthy = await state_manager.health_check()
    
    status = "healthy" if (mongodb_healthy and redis_healthy) else "unhealthy"
    
    return HealthResponse(
        status=status,
        mongodb=mongodb_healthy,
        redis=redis_healthy,
        timestamp=datetime.utcnow()
    )


@app.post("/chat", response_model=AgentResponse)
async def chat(request: UserRequest):
    try:
        session_id = request.session_id or str(uuid.uuid4())

        state = await state_manager.get_state(session_id)

        if not state:
            state = ConversationState(
                session_id=session_id,
                user_id=request.user_id,
                status=ConversationStatus.PENDING
            )

        # 🔥 CONFIRMATION HANDLER
        if state.status == ConversationStatus.AWAITING_CONFIRMATION:
            user_reply = request.message.strip().lower()

            if user_reply in ["yes", "y", "confirm"]:
                return await confirm_action(session_id, confirmed=True)

            if user_reply in ["no", "n", "cancel"]:
                return await confirm_action(session_id, confirmed=False)

            if user_reply == "modify":
                state.status = ConversationStatus.PENDING
                state.pending_action = None
                await state_manager.save_state(state)

                return AgentResponse(
                    response="Sure. What would you like to change?",
                    session_id=session_id,
                    action_required=False
                )

        # Add user message to history
        state.conversation_history.append({
            "role": "user",
            "content": request.message,
            "timestamp": datetime.utcnow().isoformat()
        })

        # -------- EXISTING LOGIC CONTINUES (UNCHANGED) --------
        llm_client = None

        if settings.llm_provider == "groq":
            from utils.groq_client import GroqClient
            llm_client = GroqClient(
                api_key=settings.groq_api_key,
                model_name=settings.groq_model
            )
        else:
            llm_client = GeminiClient(
                api_key=settings.gemini_api_key,
                model_name=settings.gemini_model
            )

        llm_router = LLMRouter(llm_client)
        analysis = llm_router.analyze_request(request.message)

        tool_action = llm_router.create_tool_action(
            analysis["intent"],
            analysis["parameters"]
        )

        if tool_action and tool_action.requires_confirmation:
            # Store action
            state.pending_action = tool_action
            state.status = ConversationStatus.AWAITING_CONFIRMATION
            await state_manager.save_state(state)

            # 🔥 AUTO-CONFIRM (YES)
            confirm_result = await confirm_pending_action(
                session_id=session_id,
                confirmed=True
            )

            return AgentResponse(
                response=confirm_result["message"],
                session_id=session_id,
                action_required=False,
                metadata={
                    "result": confirm_result.get("result")
                }
            )

        elif tool_action:
            result = await execute_tool_action(tool_action)

            state.status = ConversationStatus.COMPLETED
            state.conversation_history.append({
                "role": "assistant",
                "content": f"Action completed: {result}",
                "timestamp": datetime.utcnow().isoformat()
            })

            await state_manager.save_state(state)

            return AgentResponse(
                response=f"I've completed the action: {result}",
                session_id=session_id
            )

        else:
            response_text = llm_client.generate_response(request.message)

            state.conversation_history.append({
                "role": "assistant",
                "content": response_text,
                "timestamp": datetime.utcnow().isoformat()
            })

            await state_manager.save_state(state)

            return AgentResponse(
                response=response_text,
                session_id=session_id
            )

    except Exception as e:
        logger.exception("Chat error")
        raise HTTPException(status_code=500, detail=str(e))
async def confirm_pending_action(session_id: str, confirmed: bool) -> dict:
    state = await state_manager.get_state(session_id)

    if not state:
        raise HTTPException(status_code=404, detail="Session not found")

    if state.status != ConversationStatus.AWAITING_CONFIRMATION:
        raise HTTPException(status_code=400, detail="No pending action to confirm")

    if not confirmed:
        state.status = ConversationStatus.PENDING
        state.pending_action = None
        await state_manager.save_state(state)
        return {"message": "Action cancelled"}

    result = await execute_tool_action(state.pending_action)

    state.status = ConversationStatus.COMPLETED
    state.pending_action = None
    state.conversation_history.append({
        "role": "system",
        "content": f"Action executed: {result}",
        "timestamp": datetime.utcnow().isoformat()
    })

    await state_manager.save_state(state)

    return {
        "message": "Action completed successfully",
        "result": result
    }


@app.post("/confirm/{session_id}")
async def confirm_action(session_id: str, confirmed: bool):
    return await confirm_pending_action(session_id, confirmed)
    """
    Confirm or reject a pending action.
    
    Args:
        session_id: Session identifier
        confirmed: Whether the action is confirmed
        
    Returns:
        Result of the action
    """
    try:
        # Get conversation state
        state = await state_manager.get_state(session_id)
        
        if not state:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if state.status != ConversationStatus.AWAITING_CONFIRMATION:
            raise HTTPException(status_code=400, detail="No pending action to confirm")
        
        if not confirmed:
            state.status = ConversationStatus.PENDING
            state.pending_action = None
            await state_manager.save_state(state)
            
            return {"message": "Action cancelled"}
        
        # Execute the pending action
        result = await execute_tool_action(state.pending_action)
        
        state.status = ConversationStatus.COMPLETED
        state.pending_action = None
        state.conversation_history.append({
            "role": "system",
            "content": f"Action executed: {result}",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        await state_manager.save_state(state)
        
        return {
            "message": "Action completed successfully",
            "result": result
        }
    
    except Exception as e:
        logger.error(f"Error confirming action: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def execute_tool_action(tool_action):
    """
    Execute a tool action.
    
    Args:
        tool_action: ToolAction to execute
        
    Returns:
        Execution result
    """
    logger.info(f"Executing tool action: {tool_action.tool_type} - {tool_action.action}")
    
    try:
        # Initialize Google Auth Handler
        auth_handler = GoogleAuthHandler(
            credentials_file=settings.google_credentials_file,
            token_file=settings.google_token_file
        )
        
        # Execute based on tool type
        if tool_action.tool_type == ToolType.GMAIL:
            gmail_tool = GmailTool(auth_handler)
            return await execute_gmail_action(gmail_tool, tool_action)
        
        elif tool_action.tool_type == ToolType.CALENDAR:
            calendar_tool = CalendarTool(auth_handler)
            return await execute_calendar_action(calendar_tool, tool_action)
        
        elif tool_action.tool_type == ToolType.DOCS:
            docs_tool = DocsTool(auth_handler)
            return await execute_docs_action(docs_tool, tool_action)
        
        elif tool_action.tool_type == ToolType.SLACK:
            slack_tool = SlackTool(settings.slack_bot_token)
            return await execute_slack_action(slack_tool, tool_action)
        
        elif tool_action.tool_type == ToolType.SMS:
            sms_tool = SMSTool(
                account_sid=settings.twilio_account_sid,
                auth_token=settings.twilio_auth_token,
                from_number=settings.twilio_phone_number
            )
            return await execute_sms_action(sms_tool, tool_action)
        
        else:
            raise ValueError(f"Unknown tool type: {tool_action.tool_type}")
    
    except Exception as e:
        logger.error(f"Failed to execute tool action: {e}")
        raise


async def execute_gmail_action(gmail_tool: GmailTool, tool_action: ToolAction) -> str:
    """Execute Gmail-specific actions."""
    action = tool_action.action
    params = tool_action.parameters
    
    if action == "send_email":
        result = gmail_tool.send_email(
            to=params.get("to"),
            subject=params.get("subject"),
            body=params.get("body"),
            cc=params.get("cc"),
            bcc=params.get("bcc"),
            attachments=params.get("attachments")
        )
        return f"Email sent successfully to {params.get('to')}. Message ID: {result['id']}"
    
    elif action == "list_messages":
        max_results = params.get("max_results", 10)
        query = params.get("query")
        messages = gmail_tool.list_messages(max_results=max_results, query=query)
        
        if not messages:
            return "No messages found."
        
        # Get full details for each message
        detailed_messages = []
        for msg in messages[:5]:  # Limit to 5 for brevity
            full_msg = gmail_tool.get_message(msg['id'])
            parsed = gmail_tool.parse_message(full_msg)
            detailed_messages.append(f"From: {parsed.get('from', 'Unknown')}\nSubject: {parsed.get('subject', 'No subject')}\nSnippet: {parsed.get('snippet', '')}")
        
        return f"Found {len(messages)} messages. Here are the most recent:\n\n" + "\n---\n".join(detailed_messages)
    
    elif action == "search_messages":
        query = params.get("query", "")
        max_results = params.get("max_results", 10)
        messages = gmail_tool.search_messages(query=query, max_results=max_results)
        
        if not messages:
            return f"No messages found matching '{query}'."
        
        summaries = [f"From: {m.get('from', 'Unknown')}\nSubject: {m.get('subject', 'No subject')}" for m in messages[:5]]
        return f"Found {len(messages)} messages matching '{query}':\n\n" + "\n---\n".join(summaries)
    
    elif action == "get_unread_messages":
        max_results = params.get("max_results", 10)
        messages = gmail_tool.get_unread_messages(max_results=max_results)
        
        if not messages:
            return "No unread messages."
        
        summaries = [f"From: {m.get('from', 'Unknown')}\nSubject: {m.get('subject', 'No subject')}" for m in messages[:5]]
        return f"You have {len(messages)} unread messages:\n\n" + "\n---\n".join(summaries)
    
    else:
        raise ValueError(f"Unknown Gmail action: {action}")


async def execute_calendar_action(calendar_tool: CalendarTool, tool_action: ToolAction) -> str:
    """Execute Calendar-specific actions."""
    action = tool_action.action
    params = tool_action.parameters
    
    if action == "create_event":
        from datetime import datetime
        
        # Parse datetime strings if needed
        start_time = params.get("start_time")
        end_time = params.get("end_time")
        
        if isinstance(start_time, str):
            start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        if isinstance(end_time, str):
            end_time = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
        
        result = calendar_tool.create_event(
            summary=params.get("summary"),
            start_time=start_time,
            end_time=end_time,
            description=params.get("description"),
            location=params.get("location"),
            attendees=params.get("attendees")
        )
        return f"Calendar event '{params.get('summary')}' created successfully. Event ID: {result['id']}"
    
    elif action == "search_events":
        from datetime import datetime
        
        start_date = params.get("start_date")
        end_date = params.get("end_date")
        query = params.get("query")
        max_results = params.get("max_results", 10)
        
        if isinstance(start_date, str):
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if isinstance(end_date, str):
            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        events = calendar_tool.search_events(
            start_date=start_date,
            end_date=end_date,
            query=query,
            max_results=max_results
        )
        
        if not events:
            return "No events found."
        
        summaries = [f"{e.get('summary', 'No title')} - {e.get('start', {}).get('dateTime', 'No time')}" for e in events]
        return f"Found {len(events)} events:\n" + "\n".join(summaries)
    
    elif action == "get_events_today":
        events = calendar_tool.get_events_today()
        
        if not events:
            return "No events scheduled for today."
        
        summaries = [f"{e.get('summary', 'No title')} - {e.get('start', {}).get('dateTime', 'No time')}" for e in events]
        return f"Today's events ({len(events)}):\n" + "\n".join(summaries)
    
    elif action == "get_events_this_week":
        events = calendar_tool.get_events_this_week()
        
        if not events:
            return "No events scheduled for this week."
        
        summaries = [f"{e.get('summary', 'No title')} - {e.get('start', {}).get('dateTime', 'No time')}" for e in events]
        return f"This week's events ({len(events)}):\n" + "\n".join(summaries)
    
    elif action == "update_event":
        from datetime import datetime
        
        event_id = params.get("event_id")
        start_time = params.get("start_time")
        end_time = params.get("end_time")
        
        if isinstance(start_time, str):
            start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        if isinstance(end_time, str):
            end_time = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
        
        result = calendar_tool.update_event(
            event_id=event_id,
            summary=params.get("summary"),
            start_time=start_time,
            end_time=end_time,
            description=params.get("description"),
            location=params.get("location")
        )
        return f"Calendar event updated successfully. Event ID: {event_id}"
    
    elif action == "delete_event":
        event_id = params.get("event_id")
        calendar_tool.delete_event(event_id)
        return f"Calendar event deleted successfully. Event ID: {event_id}"
    
    else:
        raise ValueError(f"Unknown Calendar action: {action}")


async def execute_docs_action(docs_tool: DocsTool, tool_action: ToolAction) -> str:
    """Execute Docs-specific actions."""
    action = tool_action.action
    params = tool_action.parameters
    
    if action == "create_document":
        result = docs_tool.create_document(
            title=params.get("title"),
            content=params.get("content")
        )
        return f"Document '{params.get('title')}' created successfully. Document ID: {result.get('documentId')}"
    
    else:
        raise ValueError(f"Unknown Docs action: {action}")


async def execute_slack_action(slack_tool: SlackTool, tool_action: ToolAction) -> str:
    """Execute Slack-specific actions."""
    action = tool_action.action
    params = tool_action.parameters
    
    if action == "send_message":
        result = slack_tool.send_message(
            channel=params.get("channel"),
            message=params.get("message")
        )
        return f"Slack message sent successfully to {params.get('channel')}"
    
    else:
        raise ValueError(f"Unknown Slack action: {action}")


async def execute_sms_action(sms_tool: SMSTool, tool_action: ToolAction) -> str:
    """Execute SMS-specific actions."""
    action = tool_action.action
    params = tool_action.parameters
    
    if action == "send_sms":
        result = sms_tool.send_sms(
            to_number=params.get("to_number"),
            message=params.get("message")
        )
        return f"SMS sent successfully to {params.get('to_number')}"
    
    else:
        raise ValueError(f"Unknown SMS action: {action}")



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
