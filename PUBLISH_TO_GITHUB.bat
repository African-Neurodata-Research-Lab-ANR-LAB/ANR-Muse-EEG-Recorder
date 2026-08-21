@echo off
setlocal
title Publish ANR Muse EEG Recorder to GitHub
cd /d "%~dp0"

set REPO_NAME=ANR-Muse-EEG-Recorder
set GITHUB_USER=Duruhjunior77
set REMOTE_URL=https://github.com/%GITHUB_USER%/%REPO_NAME%.git
set REPO_WEB=https://github.com/%GITHUB_USER%/%REPO_NAME%

echo.
echo ============================================================
echo      ANR Muse EEG Recorder - GitHub Publisher
echo ============================================================
echo.
echo Target repository:
echo %REPO_WEB%
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo ERROR: Git is not installed or is not available on PATH.
  echo Install Git for Windows, then run this file again.
  echo.
  start https://git-scm.com/download/win
  pause
  exit /b 1
)

echo Checking Git identity...
for /f "delims=" %%A in ('git config user.name 2^>nul') do set GIT_NAME=%%A
for /f "delims=" %%A in ('git config user.email 2^>nul') do set GIT_EMAIL=%%A

if not defined GIT_NAME (
  echo.
  set /p GIT_NAME=Enter the name you want shown on GitHub commits: 
  git config --local user.name "%GIT_NAME%"
)

if not defined GIT_EMAIL (
  echo.
  set /p GIT_EMAIL=Enter your GitHub commit email: 
  git config --local user.email "%GIT_EMAIL%"
)

if not exist ".git" (
  echo.
  echo Initializing Git repository...
  git init -b main
  if errorlevel 1 goto :fail
)

echo.
echo Adding project files...
git add .
if errorlevel 1 goto :fail

git diff --cached --quiet
if errorlevel 1 (
  echo Creating commit...
  git commit -m "Initial release: ANR Muse EEG Recorder"
  if errorlevel 1 goto :fail
) else (
  echo No new file changes need committing.
)

git remote get-url origin >nul 2>nul
if errorlevel 1 (
  echo.
  echo Adding GitHub remote...
  git remote add origin %REMOTE_URL%
) else (
  git remote set-url origin %REMOTE_URL%
)

echo.
echo Trying to contact GitHub repository...
git ls-remote %REMOTE_URL% >nul 2>nul
if errorlevel 1 (
  echo.
  echo ------------------------------------------------------------
  echo The GitHub repository does not exist yet, or GitHub needs you
  echo to sign in.
  echo.
  echo 1. A GitHub page will open.
  echo 2. Create a PUBLIC repository named:
  echo.
  echo       %REPO_NAME%
  echo.
  echo 3. Do NOT add README, .gitignore or license.
  echo 4. Return here and press any key.
  echo ------------------------------------------------------------
  echo.
  start https://github.com/new?name=%REPO_NAME%^&description=Browser-based+Muse+EEG+research+recorder+from+African+NeuroData+Research+Lab
  pause
)

echo.
echo Pushing main branch to GitHub...
echo If a GitHub sign-in window opens, complete the sign-in.
git push -u origin main
if errorlevel 1 (
  echo.
  echo Push did not complete.
  echo If the repository was just created, run this publisher again.
  goto :fail
)

echo.
echo ============================================================
echo SUCCESS: Project pushed to GitHub
echo ============================================================
echo.
echo Repository:
echo %REPO_WEB%
echo.
echo Next: GitHub Pages.
echo Open Settings ^> Pages and select "GitHub Actions".
echo The deployment workflow is already included in this project.
echo.
echo Expected website after deployment:
echo https://%GITHUB_USER%.github.io/%REPO_NAME%/
echo.
start %REPO_WEB%
echo.
pause
exit /b 0

:fail
echo.
echo Publishing stopped because one of the Git commands failed.
echo Take a screenshot of this window and send it to me.
echo.
pause
exit /b 1
