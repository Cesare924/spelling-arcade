@echo off
rem Spelling Stars - run on the Android Studio emulator.
rem Double-click this file. The first run installs packages (a few minutes).
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js is not installed. Opening nodejs.org - install the LTS version,
  echo then close this window and double-click start-android.bat again.
  start https://nodejs.org
  pause
  exit /b 1
)

if not defined ANDROID_HOME set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%"

if not exist node_modules (
  echo Installing packages - first run only...
  call npm install
  if errorlevel 1 goto failed
  call npx expo install --fix
  if errorlevel 1 goto failed
)

echo.
echo Make sure your Android emulator is running (Android Studio ^> Device Manager ^> Play).
echo Starting the app...
call npx expo start --android
goto :eof

:failed
echo.
echo Something went wrong. Copy the red error text above and paste it to Claude.
pause
