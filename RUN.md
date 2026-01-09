# How to Run EduBridge in Command Prompt (CMD)

## Step-by-Step Instructions

### 1. Open Command Prompt (CMD)
- Press `Win + R`, type `cmd`, and press Enter
- OR search for "Command Prompt" in Windows Start menu

### 2. Navigate to Project Directory
```cmd
cd /d D:\NAGA-DOC\GVP\GVP
```

### 3. Install Dependencies (First Time Only)
```cmd
npm install
```
This will install all required packages. You only need to do this once, or when dependencies change.

### 4. Start Development Server
```cmd
npm run dev
```

The server will start at `http://localhost:3000` and automatically open in your browser.

### 5. Stop the Server
Press `Ctrl + C` in the CMD window to stop the server.

---

## Quick Commands Summary

```cmd
REM Navigate to project
cd /d D:\NAGA-DOC\GVP\GVP

REM Install dependencies (first time)
npm install

REM Start development server
npm run dev
```

---

## Alternative: Using PowerShell

If you prefer PowerShell:

```powershell
cd D:\NAGA-DOC\GVP\GVP
npm install
npm run dev
```

---

## Troubleshooting

### If `npm` is not recognized:
- Install Node.js from https://nodejs.org/
- Restart CMD after installation

### If port 3000 is already in use:
- The server will automatically try the next available port
- Or change the port in `vite.config.ts`

### To run in production mode:
```cmd
npm run build
npm run preview
```

