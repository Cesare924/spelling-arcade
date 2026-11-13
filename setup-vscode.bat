@echo off
rem Copies the VS Code settings, tasks and recommended extensions into .vscode.
cd /d "%~dp0"
if not exist .vscode mkdir .vscode
copy /y vscode-setup\*.json .vscode\ >nul
echo VS Code setup is in place. In VS Code: File ^> Open Folder ^> C:\ss
echo Then install the recommended extensions when VS Code asks.
pause
