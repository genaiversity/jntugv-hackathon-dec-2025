# API Keys and Credentials Required

This document lists all the API keys, credentials, and configuration items you need to provide to run the AI Assistant Backend.

## 🔑 Required Credentials

### 1. Google Cloud Platform (GCP)

**Purpose**: Gmail, Google Calendar, and Google Docs integration

**Steps to obtain**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Gmail API
   - Google Calendar API
   - Google Docs API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Create credentials for "Desktop app"
7. Download the JSON file and rename it to `credentials.json`
8. Place `credentials.json` in the `backend/` directory

**Files needed**:
- `credentials.json` (place in `backend/` directory)

**Environment variables**: None (handled by OAuth flow)

---

### 2. Google Gemini AI API

**Purpose**: LLM for intent classification and response generation

**Steps to obtain**:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

**Environment variable**:
```env
GEMINI_API_KEY=your_api_key_here
```

**Add to**: `backend/.env`

---

## 🔧 Optional Credentials (Feature-Specific)

### 3. Slack Bot Token

**Purpose**: Send messages to Slack channels and users

**Steps to obtain**:
1. Go to [Slack API](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name your app and select workspace
4. Go to "OAuth & Permissions"
5. Add Bot Token Scopes:
   - `chat:write`
   - `channels:read`
   - `users:read`
   - `files:write`
6. Install app to workspace
7. Copy "Bot User OAuth Token" (starts with `xoxb-`)

**Environment variable**:
```env
SLACK_BOT_TOKEN=xoxb-your-token-here
```

**Add to**: `backend/.env`

---

### 4. Twilio Credentials (SMS)(optional)

**Purpose**: Send SMS and MMS messages

**Steps to obtain**:
1. Sign up at [Twilio](https://www.twilio.com/try-twilio)
2. Verify your email and phone number
3. From the Twilio Console dashboard, copy:
   - Account SID
   - Auth Token
4. Get a Twilio phone number:
   - Go to "Phone Numbers" → "Manage" → "Buy a number"
   - Select a number with SMS capabilities
   - Purchase the number

**Environment variables**:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Add to**: `backend/.env`

---

## 📋 Configuration Checklist

### Minimum Setup (Required)
- [ ] Google Cloud credentials (`credentials.json`)
- [ ] Gemini API key (`GEMINI_API_KEY`)
- [ ] Secret key for JWT (`SECRET_KEY` - can use any random string)

### Optional Features
- [ ] Slack integration (`SLACK_BOT_TOKEN`)
- [ ] SMS integration (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`)

---

## 🚀 Quick Start Configuration

1. **Copy environment template**:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Edit `backend/.env`** and add your credentials:
   ```env
   # Required
   GEMINI_API_KEY=your_gemini_api_key_here
   SECRET_KEY=your_random_secret_key_here
   
   # Optional
   SLACK_BOT_TOKEN=xoxb-your-slack-token-here
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   ```

3. **Add Google credentials**:
   - Download `credentials.json` from Google Cloud Console
   - Place in `backend/` directory

4. **Start the application**:
   ```bash
   docker-compose up -d
   ```

---

## 🔒 Security Best Practices

1. **Never commit credentials to Git**:
   - `.env` file is already in `.gitignore`
   - `credentials.json` is already in `.gitignore`
   - `token.json` (auto-generated) is already in `.gitignore`

2. **Use strong secret keys**:
   ```bash
   # Generate a secure random key
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

3. **Restrict API key permissions**:
   - Only enable necessary scopes
   - Use API key restrictions in Google Cloud Console
   - Rotate keys periodically

4. **Environment-specific configurations**:
   - Use different keys for development and production
   - Never use production keys in development

---

## 📞 Getting Help

### Google Cloud Platform
- [GCP Documentation](https://cloud.google.com/docs)
- [OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)

### Gemini AI
- [Gemini API Documentation](https://ai.google.dev/docs)

### Slack
- [Slack API Documentation](https://api.slack.com/docs)
- [Bot Token Guide](https://api.slack.com/authentication/token-types)

### Twilio
- [Twilio Documentation](https://www.twilio.com/docs)
- [SMS Quickstart](https://www.twilio.com/docs/sms/quickstart)

---

## 💡 Cost Considerations

| Service | Free Tier | Pricing |
|---------|-----------|---------|
| **Google Cloud APIs** | Limited free quota | Pay per API call |
| **Gemini AI** | Free tier available | Pay per token |
| **Slack** | Free for basic features | Free for bot usage |
| **Twilio** | Trial credits | Pay per SMS |
| **MongoDB** | Self-hosted (Docker) | Free |
| **Redis** | Self-hosted (Docker) | Free |

**Note**: Monitor your usage to avoid unexpected charges, especially for Gemini AI and Twilio.
