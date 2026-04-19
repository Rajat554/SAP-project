:: ===========================================================
::  install-task-scheduler.bat
::
::  Run this file ONCE as Administrator to register the
::  Keep-Alive script as a Windows Task Scheduler job.
::
::  After this, the keep-alive will automatically:
::    - Start when you log in to Windows
::    - Run in the background 24/7
::    - Restart itself if it crashes
:: ===========================================================
@echo off
setlocal

:: Must be run as Admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo =====================================================
    echo  ERROR: Please right-click this file and choose
    echo         "Run as Administrator"
    echo =====================================================
    pause
    exit /b 1
)

set "TASK_NAME=BTP-App-Keep-Alive"
set "SCRIPT_DIR=%~dp0"
set "BAT_FILE=%SCRIPT_DIR%start-keep-alive.bat"

echo =====================================================
echo  Registering Windows Task: %TASK_NAME%
echo  Script: %BAT_FILE%
echo =====================================================
echo.

:: Delete existing task if it exists (don't fail if not present)
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

:: Create new task:
::   - Trigger: At logon of any user
::   - Action : run start-keep-alive.bat
::   - Run in a minimised hidden window
::   - Run whether user is logged on or not
schtasks /create ^
  /tn "%TASK_NAME%" ^
  /tr "cmd /c \"%BAT_FILE%\"" ^
  /sc ONLOGON ^
  /rl HIGHEST ^
  /f

if %errorlevel% equ 0 (
    echo.
    echo =====================================================
    echo  SUCCESS!
    echo  The keep-alive task has been registered.
    echo.
    echo  It will start automatically every time you log in.
    echo  To start it NOW without rebooting, run:
    echo    schtasks /run /tn "%TASK_NAME%"
    echo =====================================================
) else (
    echo.
    echo  ERROR: Task creation failed. See message above.
)

echo.
pause
