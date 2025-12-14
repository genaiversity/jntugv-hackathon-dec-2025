# System Architecture Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER / FRONTEND                             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ HTTP Requests
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                         FASTAPI BACKEND (main.py)                        │
│                                                                           │
│  ┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │  /chat endpoint │    │ /confirm endpoint│    │ /health endpoint │   │
│  └────────┬────────┘    └────────┬─────────┘    └──────────────────┘   │
│           │                      │                                       │
│           │                      │                                       │
│  ┌────────▼──────────────────────▼────────────────────────────────┐    │
│  │              Conversation State Manager (Redis)                 │    │
│  │  - Session tracking                                             │    │
│  │  - Pending actions                                              │    │
│  │  - Conversation history                                         │    │
│  └────────┬────────────────────────────────────────────────────────┘    │
│           │                                                              │
└───────────┼──────────────────────────────────────────────────────────────┘
            │
            │
┌───────────▼──────────────────────────────────────────────────────────────┐
│                        LLM ROUTER (llm_router.py)                         │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Gemini 1.5 Pro (gemini_client.py)             │   │
│  │                                                                   │   │
│  │  1. Intent Classification                                        │   │
│  │     - send_email, read_email, search_email                       │   │
│  │     - create_calendar_event, list_calendar_events, etc.          │   │
│  │                                                                   │   │
│  │  2. Parameter Extraction                                         │   │
│  │     - Natural language → Structured data                         │   │
│  │                                                                   │   │
│  │  3. Confirmation Decision                                        │   │
│  │     - State-changing actions require confirmation                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      Tool Action Creator                          │   │
│  │  - Maps intent to tool type and action                           │   │
│  │  - Creates ToolAction objects                                    │   │
│  └────────────────────────────┬─────────────────────────────────────┘   │
└────────────────────────────────┼──────────────────────────────────────────┘
                                 │
                                 │
┌────────────────────────────────▼──────────────────────────────────────────┐
│                    TOOL ACTION EXECUTOR (main.py)                          │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                   Google Auth Handler                             │    │
│  │  - OAuth 2.0 authentication                                       │    │
│  │  - Token management & refresh                                     │    │
│  └────────────────────────────┬──────────────────────────────────────┘    │
│                                │                                           │
│         ┌──────────────────────┼──────────────────────┐                   │
│         │                      │                      │                   │
│  ┌──────▼──────┐    ┌─────────▼────────┐    ┌───────▼────────┐          │
│  │ Gmail Tool  │    │ Calendar Tool    │    │  Other Tools   │          │
│  │             │    │                  │    │  - Docs        │          │
│  │ - Send      │    │ - Create Event   │    │  - Slack       │          │
│  │ - Read      │    │ - List Events    │    │  - SMS         │          │
│  │ - Search    │    │ - Update Event   │    └────────────────┘          │
│  │ - Watch     │    │ - Delete Event   │                                 │
│  │ - Mark      │    │ - Watch Calendar │                                 │
│  └──────┬──────┘    └─────────┬────────┘                                 │
│         │                     │                                           │
└─────────┼─────────────────────┼───────────────────────────────────────────┘
          │                     │
          │                     │
┌─────────▼─────────────────────▼───────────────────────────────────────────┐
│                         GOOGLE APIs                                        │
│                                                                             │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │   Gmail API      │    │  Calendar API    │    │   Docs API       │   │
│  │   (v1)           │    │  (v3)            │    │   (v1)           │   │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


## Real-Time Integration Flow

┌─────────────────────────────────────────────────────────────────────────┐
│                         REAL-TIME MONITORING                             │
└─────────────────────────────────────────────────────────────────────────┘

Gmail Watch Flow:
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ Gmail Tool   │────────▶│ Gmail API    │────────▶│ Pub/Sub      │
│ watch_mailbox│         │ users.watch()│         │ Topic        │
└──────────────┘         └──────────────┘         └──────┬───────┘
                                                          │
                                                          │ Push
                                                          │ Notification
                                                          │
                                                   ┌──────▼───────┐
                                                   │ Your Backend │
                                                   │ Subscriber   │
                                                   └──────────────┘

Calendar Watch Flow:
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│Calendar Tool │────────▶│Calendar API  │────────▶│ Your Webhook │
│watch_calendar│         │events.watch()│         │ Endpoint     │
└──────────────┘         └──────────────┘         └──────┬───────┘
                                                          │
                                                          │ HTTP POST
                                                          │ Notification
                                                          │
                                                   ┌──────▼───────┐
                                                   │ Your Backend │
                                                   │ Handler      │
                                                   └──────────────┘


## MCP Server Architecture

┌─────────────────────────────────────────────────────────────────────────┐
│                      MCP SERVER LAYER (Optional)                         │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              GoogleMCPServer (google_mcp_server.py)              │  │
│  │                                                                   │  │
│  │  Async Methods:                                                  │  │
│  │  ┌────────────────────┐    ┌────────────────────┐              │  │
│  │  │ Gmail Methods      │    │ Calendar Methods   │              │  │
│  │  │                    │    │                    │              │  │
│  │  │ - list_messages    │    │ - list_events      │              │  │
│  │  │ - get_message      │    │ - get_event        │              │  │
│  │  │ - search_messages  │    │ - create_event     │              │  │
│  │  │ - send_email       │    │ - update_event     │              │  │
│  │  │ - start_watch      │    │ - start_watch      │              │  │
│  │  └────────────────────┘    └────────────────────┘              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  Benefits:                                                                │
│  - Protocol-compliant interface                                          │
│  - Async/await support                                                   │
│  - Clean separation of concerns                                          │
│  - Easy to extend                                                        │
└─────────────────────────────────────────────────────────────────────────┘


## Data Flow Example: Send Email

1. User Request
   ↓
   "Send an email to john@example.com saying hello"
   ↓

2. FastAPI /chat Endpoint
   ↓
   UserRequest(user_id="user123", message="...")
   ↓

3. LLM Router
   ↓
   Gemini 1.5 Pro analyzes message
   ↓
   Intent: "send_email"
   Parameters: {to: "john@example.com", subject: "Hello", body: "hello"}
   ↓

4. Tool Action Creator
   ↓
   ToolAction(
     tool_type=GMAIL,
     action="send_email",
     parameters={...},
     requires_confirmation=True
   )
   ↓

5. State Manager
   ↓
   Save to Redis:
   - session_id
   - pending_action
   - status: "awaiting_confirmation"
   ↓

6. Response to User
   ↓
   "I'll send an email to john@example.com. Should I proceed?"
   ↓

7. User Confirms
   ↓
   POST /confirm/SESSION_ID?confirmed=true
   ↓

8. Tool Executor
   ↓
   GoogleAuthHandler.authenticate()
   ↓
   GmailTool.send_email(...)
   ↓
   Gmail API call
   ↓

9. Result
   ↓
   "Email sent successfully. Message ID: abc123"
   ↓

10. State Update
    ↓
    Redis: status = "completed"
    MongoDB: Log conversation
    ↓

11. Response to User
    ↓
    "Email sent successfully!"


## Database Schema

Redis (Temporary State):
┌─────────────────────────────────────────┐
│ Key: session:{session_id}               │
│ TTL: 3600 seconds (1 hour)              │
│                                          │
│ Value: {                                 │
│   session_id: "uuid",                    │
│   user_id: "user123",                    │
│   status: "awaiting_confirmation",       │
│   pending_action: {                      │
│     tool_type: "gmail",                  │
│     action: "send_email",                │
│     parameters: {...}                    │
│   },                                     │
│   conversation_history: [...],           │
│   created_at: "timestamp",               │
│   updated_at: "timestamp"                │
│ }                                        │
└─────────────────────────────────────────┘

MongoDB (Persistent Storage):
┌─────────────────────────────────────────┐
│ Collection: conversations                │
│                                          │
│ Document: {                              │
│   _id: ObjectId,                         │
│   session_id: "uuid",                    │
│   user_id: "user123",                    │
│   messages: [                            │
│     {                                    │
│       role: "user",                      │
│       content: "...",                    │
│       timestamp: "..."                   │
│     },                                   │
│     {                                    │
│       role: "assistant",                 │
│       content: "...",                    │
│       timestamp: "..."                   │
│     }                                    │
│   ],                                     │
│   tool_actions: [                        │
│     {                                    │
│       tool_type: "gmail",                │
│       action: "send_email",              │
│       parameters: {...},                 │
│       result: "...",                     │
│       timestamp: "..."                   │
│     }                                    │
│   ],                                     │
│   created_at: "timestamp",               │
│   updated_at: "timestamp"                │
│ }                                        │
└─────────────────────────────────────────┘


## Security Layers

┌─────────────────────────────────────────────────────────────────────────┐
│                            SECURITY LAYERS                               │
│                                                                           │
│  1. Environment Variables                                                │
│     - API keys in .env (gitignored)                                      │
│     - Credentials in credentials.json (gitignored)                       │
│     - Tokens in token.json (gitignored)                                  │
│                                                                           │
│  2. OAuth 2.0                                                            │
│     - Secure token storage                                               │
│     - Auto-refresh mechanism                                             │
│     - Scope-based permissions                                            │
│                                                                           │
│  3. Confirmation Flow                                                    │
│     - State-changing actions require user approval                       │
│     - Read-only operations execute immediately                           │
│     - Cancel option available                                            │
│                                                                           │
│  4. Session Management                                                   │
│     - Redis TTL for automatic cleanup                                    │
│     - Session-based isolation                                            │
│     - No cross-session data leakage                                      │
│                                                                           │
│  5. CORS                                                                 │
│     - Configurable allowed origins                                       │
│     - Credentials support                                                │
│     - Preflight handling                                                 │
└─────────────────────────────────────────────────────────────────────────┘


## Deployment Architecture

Development:
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Backend    │    │   MongoDB    │    │    Redis     │
│ localhost:   │    │ localhost:   │    │ localhost:   │
│   8000       │    │   27017      │    │   6379       │
└──────────────┘    └──────────────┘    └──────────────┘

Docker Compose:
┌──────────────────────────────────────────────────────────┐
│                    Docker Network                         │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   backend    │  │   mongodb    │  │    redis     │   │
│  │   :8000      │  │   :27017     │  │    :6379     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                            │
└──────────────────────────────────────────────────────────┘
         │
         │ Exposed Port
         ▼
    localhost:8000

Production:
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer                           │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐     ┌────▼────┐    ┌────▼────┐
    │Backend 1│     │Backend 2│    │Backend 3│
    └────┬────┘     └────┬────┘    └────┬────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐     ┌────▼────┐    ┌────▼────┐
    │ MongoDB │     │  Redis  │    │ Pub/Sub │
    │ Cluster │     │ Cluster │    │         │
    └─────────┘     └─────────┘    └─────────┘
