@echo off
set PYTHON=C:\Users\17819\AppData\Local\Programs\Python\Python312\python.exe

echo ========================================
echo   AI Essay Assistant
echo ========================================
echo.

echo [1/2] Installing dependencies...
"%PYTHON%" -m pip install -r requirements.txt -q

echo.
echo [2/2] Starting server...
echo.
echo ========================================
echo   Server URL: http://localhost:5000
echo   Press Ctrl+C to stop
echo ========================================
echo.

"%PYTHON%" app.py
pause
