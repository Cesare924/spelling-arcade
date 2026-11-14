@echo off
rem Connects this folder to github.com/Cesare924/spelling-arcade without changing your files.
cd /d "%~dp0"
where git >nul 2>nul
if errorlevel 1 (
  echo Git is not installed. Get it from https://git-scm.com, then run this again.
  pause
  exit /b 1
)
if exist .git (
  rem Already linked: make sure it points at the renamed project.
  git remote set-url origin https://github.com/Cesare924/spelling-arcade.git
  echo This folder is linked to:
  git remote -v
  pause
  exit /b 0
)
git init -b main || goto failed
git remote add origin https://github.com/Cesare924/spelling-arcade.git || goto failed
echo Downloading the project history from GitHub...
git fetch origin main || goto failed
rem Point at GitHub's latest version but keep every file in this folder exactly as it is.
git reset --mixed origin/main || goto failed
git branch --set-upstream-to=origin/main main || goto failed

git config user.email >nul 2>nul
if errorlevel 1 goto askname
goto done

:askname
echo.
echo Git needs a name and email to label your saves (commits).
set /p GNAME=Your name: 
set /p GMAIL=Your email: 
git config user.name "%GNAME%"
git config user.email "%GMAIL%"

:done
echo.
echo Linked to github.com/Cesare924/spelling-arcade
echo Files that differ from GitHub (normal: package-lock.json and similar):
git status --short
echo.
echo Next: in VS Code, open Source Control (Ctrl+Shift+G).
pause
exit /b 0

:failed
echo.
echo Something went wrong. Copy the text above and paste it to Claude.
pause
