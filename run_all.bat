@echo off
setlocal

REM AI Innovation Hub - Run All (Backend + Frontend)
REM - Starts backend and frontend in separate terminal windows.
REM - LM Studio server must be started manually.

set ROOT=%~dp0
set BACKEND_DIR=%ROOT%ai-innovation-hub-backend
set FRONTEND_DIR=%ROOT%ai-innovation-hub-frontend

echo [INFO] Repo root: %ROOT%
echo [INFO] Backend:   %BACKEND_DIR%
echo [INFO] Frontend:  %FRONTEND_DIR%
echo.

echo [INFO] NOTE: Start LM Studio local server before generating phases.
echo.

REM ---- Backend ----
if not exist "%BACKEND_DIR%\venv\Scripts\activate.bat" (
  echo [ERROR] Backend venv not found at "%BACKEND_DIR%\venv".
  echo         Create it with: python -m venv venv
  echo.
  goto :frontend
)

start "AI Innovation Hub - Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && call venv\Scripts\activate.bat && python -m pip install -r requirements.txt && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo [INFO] Backend window started.
echo.

:frontend
REM ---- Frontend ----
if not exist "%FRONTEND_DIR%\package.json" (
  echo [ERROR] Frontend package.json not found at "%FRONTEND_DIR%".
  echo.
  goto :done
)

start "AI Innovation Hub - Frontend" cmd /k "cd /d ""%FRONTEND_DIR%"" && npm install && npm run dev"

echo [INFO] Frontend window started.
echo.

echo [INFO] Open:
echo   - Frontend: http://localhost:3000
echo   - Backend:  http://localhost:8000/docs
echo.

goto :done

:done
endlocal
exit /b 0
