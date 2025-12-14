"""LLM router for handling different types of requests."""
from typing import Dict, Any, Optional, Union
import logging
from .gemini_client import GeminiClient
from .groq_client import GroqClient
from models.schema import ToolAction, ToolType

logger = logging.getLogger(__name__)


class LLMRouter:
    """Routes user requests to appropriate handlers based on LLM analysis."""
    
    def __init__(self, llm_client: Union[GeminiClient, GroqClient]):
        """
        Initialize LLM router.
        
        Args:
            llm_client: LLM client instance (Gemini or Groq)
        """
        self.llm_client = llm_client
    
    def analyze_request(self, user_message: str) -> Dict[str, Any]:
        """
        Analyze user request and determine the appropriate action.
        
        Args:
            user_message: User's message
            
        Returns:
            Analysis result with intent and parameters
        """
        intent = self.llm_client.classify_intent(user_message)
        
        logger.info(f"Classified intent: {intent}")
        
        # Extract parameters based on intent
        parameters = self._extract_parameters(user_message, intent)
        
        return {
            "intent": intent,
            "parameters": parameters,
            "requires_confirmation": self._requires_confirmation(intent)
        }
    
    def _extract_parameters(self, message: str, intent: str) -> Dict[str, Any]:
        """
        Extract parameters from message based on intent.
        
        Args:
            message: User message
            intent: Classified intent
            
        Returns:
            Extracted parameters
        """
        schemas = {
            # Gmail intents
            "send_email": {
                "to": "email address",
                "subject": "email subject",
                "body": "email body content"
            },
            "read_email": {
                "max_results": "number of emails to read (default 10)",
                "query": "search query (optional)"
            },
            "search_email": {
                "query": "search query",
                "max_results": "number of results (default 10)"
            },
            "get_unread_emails": {
                "max_results": "number of emails (default 10)"
            },
            "reply_to_email": {
                "message_id": "email message ID to reply to",
                "body": "reply message body"
            },
            
            # Calendar intents
            "create_calendar_event": {
                "summary": "event title",
                "start_time": "start date and time",
                "end_time": "end date and time",
                "description": "event description (optional)",
                "location": "event location (optional)"
            },
            "list_calendar_events": {
                "start_date": "start date (optional)",
                "end_date": "end date (optional)",
                "max_results": "number of events (default 10)"
            },
            "search_calendar_events": {
                "query": "search query",
                "start_date": "start date (optional)",
                "end_date": "end date (optional)"
            },
            "update_calendar_event": {
                "event_id": "event identifier",
                "summary": "new title (optional)",
                "start_time": "new start time (optional)",
                "end_time": "new end time (optional)"
            },
            "delete_calendar_event": {
                "event_id": "event identifier"
            },
            "get_today_events": {},
            "get_week_events": {},
            
            # Other tools
            "create_document": {
                "title": "document title",
                "content": "document content"
            },
            "send_slack_message": {
                "channel": "channel name or ID",
                "message": "message text"
            },
            "send_sms": {
                "to_number": "phone number",
                "message": "SMS message text"
            }
        }
        
        schema = schemas.get(intent, {})
        
        if not schema:
            return {}
        
        try:
            return self.llm_client.extract_structured_data(message, schema)
        except Exception as e:
            logger.error(f"Failed to extract parameters: {e}")
            return {}
    
    def _requires_confirmation(self, intent: str) -> bool:
        """
        Determine if an intent requires user confirmation.
        
        Args:
            intent: Intent type
            
        Returns:
            True if confirmation is required
        """
        # Actions that modify external state require confirmation
        confirmation_required = [
            "send_email",
            "create_calendar_event",
            "update_calendar_event",
            "delete_calendar_event",
            "send_slack_message",
            "send_sms",
            "reply_to_email"
        ]
        
        return intent in confirmation_required
    
    def create_tool_action(
        self,
        intent: str,
        parameters: Dict[str, Any]
    ) -> Optional[ToolAction]:
        """
        Create a ToolAction from intent and parameters.
        
        Args:
            intent: Classified intent
            parameters: Extracted parameters
            
        Returns:
            ToolAction object or None if not a tool action
        """
        intent_to_tool = {
            # Gmail actions
            "send_email": (ToolType.GMAIL, "send_email"),
            "read_email": (ToolType.GMAIL, "list_messages"),
            "search_email": (ToolType.GMAIL, "search_messages"),
            "get_unread_emails": (ToolType.GMAIL, "get_unread_messages"),
            "reply_to_email": (ToolType.GMAIL, "reply_to_email"),
            
            # Calendar actions
            "create_calendar_event": (ToolType.CALENDAR, "create_event"),
            "list_calendar_events": (ToolType.CALENDAR, "search_events"),
            "search_calendar_events": (ToolType.CALENDAR, "search_events"),
            "update_calendar_event": (ToolType.CALENDAR, "update_event"),
            "delete_calendar_event": (ToolType.CALENDAR, "delete_event"),
            "get_today_events": (ToolType.CALENDAR, "get_events_today"),
            "get_week_events": (ToolType.CALENDAR, "get_events_this_week"),
            
            # Other tools
            "create_document": (ToolType.DOCS, "create_document"),
            "send_slack_message": (ToolType.SLACK, "send_message"),
            "send_sms": (ToolType.SMS, "send_sms")
        }
        
        if intent not in intent_to_tool:
            return None
        
        tool_type, action = intent_to_tool[intent]
        
        return ToolAction(
            tool_type=tool_type,
            action=action,
            parameters=parameters,
            requires_confirmation=self._requires_confirmation(intent)
        )
    
    def generate_confirmation_message(
        self,
        tool_action: ToolAction
    ) -> str:
        """
        Generate a confirmation message for a tool action.
        
        Args:
            tool_action: Tool action to confirm
            
        Returns:
            Confirmation message
        """
        templates = {
            ToolType.GMAIL: {
                "send_email": "I'll send an email to {to} with subject '{subject}'. Should I proceed?",
                "reply_to_email": "I'll reply to the email. Should I proceed?"
            },
            ToolType.CALENDAR: {
                "create_event": "I'll create a calendar event '{summary}' from {start_time} to {end_time}. Should I proceed?",
                "update_event": "I'll update the calendar event. Should I proceed?",
                "delete_event": "I'll delete the calendar event. Should I proceed?"
            },
            ToolType.DOCS: {
                "create_document": "I'll create a document titled '{title}'. Should I proceed?"
            },
            ToolType.SLACK: {
                "send_message": "I'll send a message to {channel}. Should I proceed?"
            },
            ToolType.SMS: {
                "send_sms": "I'll send an SMS to {to_number}. Should I proceed?"
            }
        }
        
        tool_templates = templates.get(tool_action.tool_type, {})
        template = tool_templates.get(tool_action.action, "Should I proceed with this action?")
        
        try:
            return template.format(**tool_action.parameters)
        except KeyError:
            return "Should I proceed with this action?"

