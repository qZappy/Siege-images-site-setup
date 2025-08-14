@echo off
setlocal
echo This will generate manifest.json for your Siege Viewer app.
echo.

set "SCRIPT_DIR=%~dp0"
set "PS1=%SCRIPT_DIR%generate_manifest_prompt.ps1"

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%"
echo.
pause
