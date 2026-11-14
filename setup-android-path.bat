@echo off
rem One-time setup: tells Windows (and VS Code) where the Android SDK and emulator are.
rem Saves ANDROID_HOME and adds the SDK tools to your user PATH. Safe to run more than once.
set "SDK=%LOCALAPPDATA%\Android\Sdk"
if not exist "%SDK%\emulator\emulator.exe" (
  echo Can't find the Android SDK at %SDK%.
  echo In Android Studio: Settings ^> Languages ^& Frameworks ^> Android SDK - copy the
  echo "Android SDK Location" and paste it to Claude.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$sdk = $env:LOCALAPPDATA + '\Android\Sdk';" ^
  "[Environment]::SetEnvironmentVariable('ANDROID_HOME', $sdk, 'User');" ^
  "$p = [Environment]::GetEnvironmentVariable('Path', 'User'); if (-not $p) { $p = '' };" ^
  "$parts = $p.Split(';') | Where-Object { $_ -ne '' };" ^
  "foreach ($d in @($sdk + '\platform-tools', $sdk + '\emulator')) { if ($parts -notcontains $d) { $parts += $d } };" ^
  "[Environment]::SetEnvironmentVariable('Path', ($parts -join ';'), 'User');" ^
  "Write-Host 'Done. ANDROID_HOME =' $sdk"
echo.
echo Now close VS Code completely and open it again so it picks up the change.
pause
