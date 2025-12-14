# AI Assistant Backend

A modular, scalable backend structure for an AI-powered assistant with tool integrations for Gmail, Calendar, Docs, Slack, and SMS.

## 🏗️ Architecture

```
backend/
├── db/                      # Database connectors
│   ├── mongo_client.py      # MongoDB async client
│   └── __init__.py
├── models/                  # Data models and schemas
│   ├── schema.py            # Pydantic models
│   └── __init__.py
├── tools/                   # External service integrations
│   ├── gmail_tool.py        # Gmail API
│   ├── calendar_tool.py     # Google Calendar API
│   ├── docs_tool.py         # Google Docs API
│   ├── slack_tool.py        # Slack API
│   ├── sms_tool.py          # Twilio SMS API
│   ├── google_auth.py       # Google OAuth handler
│   └── __init__.py
├── utils/                   # Utility modules
│   ├── config.py            # Configuration management
│   ├── auth.py              # Authentication utilities
│   ├── gemini_client.py     # Gemini AI client
│   ├── llm_router.py        # LLM request router
│   ├── state_manager.py     # Redis state management
│   └── __init__.py
├── main.py                  # FastAPI application
├── requirements.txt         # Python dependencies
├── Dockerfile              # Docker configuration
├── .env.example            # Environment variables template
└── .gitignore              # Git ignore rules
```

## 🚀 Features

- **Modular Architecture**: Easy to add new tools and APIs
- **Async Support**: Built with async/await for high performance
- **State Management**: Redis-based conversation state tracking
- **Database Integration**: MongoDB for persistent storage
- **LLM Integration**: Gemini AI for intelligent routing
- **Tool Connectors**: Gmail, Calendar, Docs, Slack, SMS
- **Docker Ready**: Complete Docker and docker-compose setup
- **Health Checks**: Built-in health monitoring endpoints

## 📋 Prerequisites

Before running this application, you need to obtain the following API keys and credentials:

### Required

1. **Google Cloud Platform** (for Gmail, Calendar, Docs)
   - Create a project at [Google Cloud Console](https://console.cloud.google.com/)
   - Enable APIs: Gmail API, Google Calendar API, Google Docs API
   - Create OAuth 2.0 credentials
   - Download `credentials.json` and place in `backend/` directory

2. **Google Gemini AI**
   - Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Add to `.env` file as `GEMINI_API_KEY`

### Optional (based on features you want to use)

3. **Slack** (for Slack integration)
   - Create a Slack app at [Slack API](https://api.slack.com/apps)
   - Install app to workspace
   - Copy Bot User OAuth Token
   - Add to `.env` file as `SLACK_BOT_TOKEN`

4. **Twilio** (for SMS integration)
   - Sign up at [Twilio](https://www.twilio.com/)
   - Get Account SID, Auth Token, and Phone Number
   - Add to `.env` file

## 🛠️ Setup Instructions

### 1. Clone and Navigate

```bash
cd TEAM-41
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp backend/.env.example backend/.env

# Edit .env and add your API keys
# Required: GEMINI_API_KEY
# Optional: SLACK_BOT_TOKEN, TWILIO_* (if using those features)
```

### 3. Add Google Credentials

- Download `credentials.json` from Google Cloud Console
- Place it in the `backend/` directory

### 4. Run with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Check service status
docker-compose ps
```

### 5. Verify Installation

```bash
# Check health endpoint
curl http://localhost:8000/health

# Expected response:
# {
#   "status": "healthy",
#   "mongodb": true,
#   "redis": true,
#   "timestamp": "2024-01-01T00:00:00.000000"
# }
```

## 🔧 Development Setup (Without Docker)

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Start Services Manually

```bash
# Start MongoDB (in separate terminal)
mongod --dbpath ./data/db

# Start Redis (in separate terminal)
redis-server

# Update .env with local URLs
# MONGODB_URL=mongodb://localhost:27017
# REDIS_URL=redis://localhost:6379

# Run the application
python main.py
```

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Chat
```
POST /chat
Body: {
  "user_id": "string",
  "message": "string",
  "session_id": "string (optional)"
}
```

### Confirm Action
```
POST /confirm/{session_id}?confirmed=true
```

## 🔑 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GEMINI_API_KEY` | ✅ | Google Gemini AI API key | `AIza...` |
| `GOOGLE_CREDENTIALS_FILE` | ✅ | Path to Google OAuth credentials | `credentials.json` |
| `MONGODB_URL` | ✅ | MongoDB connection string | `mongodb://mongodb:27017` |
| `REDIS_URL` | ✅ | Redis connection string | `redis://redis:6379` |
| `SLACK_BOT_TOKEN` | ❌ | Slack bot token (if using Slack) | `xoxb-...` |
| `TWILIO_ACCOUNT_SID` | ❌ | Twilio account SID (if using SMS) | `AC...` |
| `TWILIO_AUTH_TOKEN` | ❌ | Twilio auth token (if using SMS) | `...` |
| `TWILIO_PHONE_NUMBER` | ❌ | Twilio phone number (if using SMS) | `+1234567890` |
| `SECRET_KEY` | ✅ | Secret key for JWT | `your-secret-key` |

## 🧩 Adding New Tools

The architecture makes it easy to add new tool connectors:

1. Create a new file in `backend/tools/` (e.g., `notion_tool.py`)
2. Implement your tool class with required methods
3. Add the tool to `backend/tools/__init__.py`
4. Update `utils/llm_router.py` to handle the new tool type
5. Add any new dependencies to `requirements.txt`

Example:
```python
# backend/tools/notion_tool.py
class NotionTool:
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    def create_page(self, title: str, content: str):
        # Implementation
        pass
```

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Rebuild after code changes
docker-compose up -d --build

# Access MongoDB shell
docker exec -it mongodb mongosh

# Access Redis CLI
docker exec -it redis redis-cli

# Remove all data (volumes)
docker-compose down -v
```

## 📊 Service Ports

- **Backend API**: http://localhost:8000
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## 🔒 Security Notes

- Never commit `.env` file or `credentials.json` to version control
- Change `SECRET_KEY` in production
- Use environment-specific configurations
- Implement proper authentication for production use
- Restrict CORS origins in production

## 📝 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

For issues and questions, please open an issue on GitHub.
