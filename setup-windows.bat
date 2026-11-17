@ECHO OFF
SETLOCAL EnableDelayedExpansion

TITLE D2 SmartView AI Enhancement - Windows One-Shot Setup

ECHO =================================================================
ECHO   Launching Windows Setup for D2 SmartView AI Enhancement
ECHO   Target: Windows Server 2022 Datacenter (AWS WorkSpace)
ECHO =================================================================
ECHO.

SET SCRIPT_DIR=%~dp0

:: Check for PowerShell
WHERE powershell >NUL 2>&1
IF %ERRORLEVEL% NEQ 0 (
    ECHO [ERROR] powershell.exe was not found on PATH.
    PAUSE
    EXIT /B 1
)

:: Run the master PowerShell setup script with ExecutionPolicy Bypass
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%setup-windows.ps1" %*

IF %ERRORLEVEL% NEQ 0 (
    ECHO.
    ECHO [ERROR] Setup encountered an issue. See logs above.
    PAUSE
    EXIT /B %ERRORLEVEL%
)

ECHO.
ECHO Setup completed successfully!
PAUSE
EXIT /B 0
