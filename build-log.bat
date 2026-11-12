@echo off
rem Re-runs the Android build and saves everything to build-log.txt so Claude can read the error.
cd /d "%~dp0"
if not defined ANDROID_HOME set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if not defined JAVA_HOME if exist "%ProgramFiles%\Android\Android Studio\jbr" set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"
echo Building... this saves the full output to build-log.txt (a few minutes).
cd android
call gradlew.bat app:assembleDebug -x lint -x test --configure-on-demand --build-cache -PreactNativeArchitectures=x86_64 > ..\build-log.txt 2>&1
cd ..
echo Done. Tell Claude "log is ready".
pause
