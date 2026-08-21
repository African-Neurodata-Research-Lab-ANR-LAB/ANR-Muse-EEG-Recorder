@echo off
title ANR Muse EEG Workbench
cd /d "%~dp0"

echo.
echo ==========================================================
echo            ANR Muse EEG Workbench
echo       Muse-only research acquisition platform
echo ==========================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not available on PATH.
  echo Install Node.js LTS and run this launcher again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo First run: installing web packages...
  call npm install
  if errorlevel 1 (
    echo.
    echo Package installation failed.
    pause
    exit /b 1
  )
)

echo.
echo Starting ANR Muse EEG Workbench...
echo Browser address: http://127.0.0.1:5173
echo Keep this window open while recording.
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:5173"
call npm run dev
pause
