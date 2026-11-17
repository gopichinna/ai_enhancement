@echo off

:: version
set version=%~1

set d2svPath=%USERPROFILE%\.d2sv\%version%
set node_modules_location=%d2svPath%\node_modules
set lib_location=%d2svPath%\lib

:: Create the base directory if it doesn't exist
if not exist %d2svPath% (
    echo %version% is not available, please run set-sv-versions.bat to get this version.
)

:: Create junction link for node_modules
echo Creating junction link: node_modules to %node_modules_location%
if exist "node_modules" (
    rmdir "node_modules"
)
mklink /J "node_modules" "%node_modules_location%"

:: Create junction link for lib
echo Creating junction link: lib to %lib_location%
if exist "lib" (
    rmdir "lib"
)
mklink /J "lib" "%lib_location%"

