# API Key Setup Guide

## How to Fix the "API key not configured" Error

### Step 1: Get Your Google Gemini API Key

1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key" or use an existing key
4. Copy your API key

### Step 2: Add API Key to .env File

1. Open the `.env` file in the `GVP` directory
2. Replace `your_api_key_here` with your actual API key:

```
VITE_API_KEY=your_actual_api_key_here
```

**Example:**
```
VITE_API_KEY=AIzaSyAbc123def456ghi789jkl012mno345pqr678
```

### Step 3: Restart Development Server

After adding the API key, you need to restart the development server:

1. Stop the current server (press `Ctrl + C` in the terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

### Step 4: Test

1. Go to Tech Accelerator page
2. Upload a resume or enter skills
3. Click "Analyze Readiness"
4. The analysis should work now!

---

## Troubleshooting

- **Still getting error?** Make sure:
  - The `.env` file is in the `GVP` directory (same folder as `package.json`)
  - The variable name is exactly `VITE_API_KEY` (case-sensitive)
  - There are no spaces around the `=` sign
  - You've restarted the development server after adding the key

- **API key not working?** Check:
  - Your API key is valid and active
  - You have API access enabled in Google AI Studio
  - There are no extra quotes or spaces in the .env file

