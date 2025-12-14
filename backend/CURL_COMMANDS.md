# 🧪 cURL Commands for Testing Gmail and Calendar

## Base URL
```bash
# Localhost
BASE_URL="http://localhost:8000"

# ngrok (replace with your actual URL)
BASE_URL="https://86c73482d43a.ngrok-free.app"
```

---

## 📧 Gmail Commands

### 1. Check Unread Emails
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me my unread emails",
    "user_id": "test_user"
  }'
```

### 2. List Recent Emails
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "List my recent emails",
    "user_id": "test_user"
  }'
```

### 3. Search Emails
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Search emails from john@example.com",
    "user_id": "test_user"
  }'
```

### 4. Send Email
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Send an email to test@example.com with subject Test Email and body This is a test message",
    "user_id": "test_user"
  }'
```

---

## 📅 Calendar Commands

### 1. Get Today's Events
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What events do I have today?",
    "user_id": "test_user"
  }'
```

### 2. Get This Week's Events
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me my calendar for this week",
    "user_id": "test_user"
  }'
```

### 3. Create Calendar Event
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a meeting tomorrow at 2pm for 1 hour titled Team Sync",
    "user_id": "test_user"
  }'
```

### 4. Search Events
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Find all meetings with John next week",
    "user_id": "test_user"
  }'
```

---

## 🔍 Health Check

### Check Backend Health
```bash
curl -X GET http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "mongodb": true,
  "redis": true,
  "timestamp": "2025-12-14T00:19:00.000000"
}
```

---

## 🌐 Using ngrok URL

If you're using ngrok, replace `localhost:8000` with your ngrok URL:

### Example with ngrok:
```bash
curl -X POST https://86c73482d43a.ngrok-free.app/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me my unread emails",
    "user_id": "test_user"
  }'
```

---

## 📝 Pretty Print JSON Response

Add `| jq` to format the JSON response (requires jq to be installed):

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me my unread emails",
    "user_id": "test_user"
  }' | jq
```

---

## 🔧 Advanced Examples

### With Session ID (for conversation continuity)
```bash
SESSION_ID="test-session-123"

curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Show me my emails\",
    \"user_id\": \"test_user\",
    \"session_id\": \"$SESSION_ID\"
  }"
```

### Multiple Requests in Same Session
```bash
SESSION_ID="test-session-$(date +%s)"

# First request
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"What meetings do I have today?\",
    \"user_id\": \"test_user\",
    \"session_id\": \"$SESSION_ID\"
  }"

# Follow-up request (uses same session)
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Cancel the first one\",
    \"user_id\": \"test_user\",
    \"session_id\": \"$SESSION_ID\"
  }"
```

---

## 🧪 Test Script

Save this as `test_api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:8000"

echo "Testing Backend API..."
echo "====================="
echo

echo "1. Health Check"
curl -s -X GET $BASE_URL/health | jq
echo
echo

echo "2. Check Unread Emails"
curl -s -X POST $BASE_URL/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me my unread emails",
    "user_id": "test_user"
  }' | jq
echo
echo

echo "3. Get Today's Calendar"
curl -s -X POST $BASE_URL/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What events do I have today?",
    "user_id": "test_user"
  }' | jq
echo
echo

echo "Tests Complete!"
```

Run it:
```bash
chmod +x test_api.sh
./test_api.sh
```

---

## 📊 Expected Response Format

### Successful Response:
```json
{
  "response": "You have 5 unread messages:\n\nFrom: john@example.com\nSubject: Meeting Tomorrow\nSnippet: Hi, let's meet tomorrow...\n---\n...",
  "session_id": "abc123-def456",
  "action_required": false,
  "metadata": {
    "result": "..."
  }
}
```

### Error Response:
```json
{
  "detail": "Error message here"
}
```

---

## 🐛 Troubleshooting

### "Connection refused"
- Make sure your backend is running: `python main.py`
- Check the port is correct (default: 8000)

### "401 Unauthorized" or OAuth errors
- Make sure `token.json` exists
- Run `python authenticate_google.py` or `python authenticate_ngrok.py`

### "500 Internal Server Error"
- Check backend logs in the terminal
- Verify MongoDB and Redis are running
- Check that credentials.json is valid

### No response or timeout
- Verify the URL is correct
- Check firewall settings
- For ngrok, make sure the tunnel is active

---

## 💡 Quick Test Commands

Copy and paste these to quickly test:

```bash
# Health check
curl http://localhost:8000/health

# Test Gmail
curl -X POST http://localhost:8000/chat -H "Content-Type: application/json" -d '{"message": "Show me my unread emails", "user_id": "test_user"}'

# Test Calendar
curl -X POST http://localhost:8000/chat -H "Content-Type: application/json" -d '{"message": "What events do I have today?", "user_id": "test_user"}'
```

---

## 🎯 Summary

**Basic Pattern:**
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "YOUR NATURAL LANGUAGE REQUEST",
    "user_id": "test_user"
  }'
```

**The LLM will:**
1. Parse your natural language message
2. Determine the appropriate action (Gmail, Calendar, etc.)
3. Execute the action using the Google APIs
4. Return the results

**That's it!** 🚀
