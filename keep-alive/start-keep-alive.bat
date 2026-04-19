@echo off
:: ===========================================================
::  BTP App Keep-Alive - Windows Startup Script
::  Double-click this file OR add it to Windows Task Scheduler
::  to keep your BTP app alive 24/7.
:: ===========================================================

title BTP Keep-Alive

:: Get the directory where this .bat file lives
set "SCRIPT_DIR=%~dp0"

echo ================================================
echo  BTP App Keep-Alive
echo  Starting...
echo ================================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo         Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Run the keep-alive script (stays running in this window)
node "%SCRIPT_DIR%keep-alive.js"

:: If node exits unexpectedly, pause so user can see the error
echo.
echo [INFO] Keep-Alive script stopped.
pause
