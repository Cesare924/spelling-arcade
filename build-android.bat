@echo off
rem Spelling Arcade - full native Android build.
rem Creates the "android" folder (openable in Android Studio) and installs
rem the app on the running emulator. First run takes 10-20 minutes.
rem Close the "android" project in Android Studio before running this.
cd /d "%~dp0"
rem Let npm accept small version mismatches between packages (common with Expo).
set "npm_config_legacy_peer_deps=true"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Opening nodejs.org - install the LTS version,
  echo then double-click build-android.bat again.
  start https://nodejs.org
  pause
  exit /b 1
)

rem Use Android Studio's SDK and its built-in Java.
if not defined ANDROID_HOME set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if not defined JAVA_HOME if exist "%ProgramFiles%\Android\Android Studio\jbr" set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%"

if not exist "%ANDROID_HOME%" (
  echo Can't find the Android SDK at %ANDROID_HOME%.
  echo In Android Studio: Settings ^> Languages ^& Frameworks ^> Android SDK - copy the
  echo "Android SDK Location" and paste it to Claude.
  pause
  exit /b 1
)
if not defined JAVA_HOME (
  echo Can't find Java. In Android Studio: Settings ^> Build, Execution, Deployment ^>
  echo Build Tools ^> Gradle ^> Gradle JDK - paste the path shown there to Claude.
  pause
  exit /b 1
)

echo Installing packages...
call npm install || goto failed
call npx expo install --fix || goto failed

echo.
echo Creating the android folder...
call npx expo prebuild --platform android --clean --no-install || goto failed

echo.
echo Make sure your emulator is running (Android Studio ^> Device Manager ^> Play).
echo Building and installing - the first build is slow, that's normal.
call npx expo run:android || goto failed
goto :eof

:failed
echo.
echo Something went wrong. Copy the error text above and paste it to Claude.
pause
