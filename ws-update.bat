:: Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text.
@ECHO off

SETLOCAL EnableDelayedExpansion

SET DIR=%~dp0

FOR /F "delims= eol=|" %%f IN ('
    DIR "%DIR%/tools" /B /A:-D-S-H /O:-D ^| FINDSTR /E /R /I "^d2sdk-maven-plugin-[0-9]*\.[0-9]*\.[0-9]*\.jar$"
') DO (
	SET TOOL_NAME=%%f
	GOTO POSTSEARCH
)

:POSTSEARCH
SET CHK=T
IF "%TOOL_NAME%"=="" SET CHK=F

IF "%CHK%" == "F" (
    ECHO .
    ECHO An expected tool could not be found in the 'tools' directory.
    ECHO Please make sure not to have deleted anything from the extracted distribution.
    ECHO Or, alternatively start with a freshly extracted distribution.
    ECHO .
    EXIT /B 1
)

SET SHOW_INTERFACE=T
:PARSEARG
SET ARG_MATCH=F
IF "%1" == "-fo" SET ARG_MATCH=T
IF "%1" == "--force-overwrite" SET ARG_MATCH=T
IF "%ARG_MATCH%" == "T" (
	SET UPDATE_ARG=-DforceOverwrite=true
    SHIFT & GOTO :PARSEARG
)
IF "%1" == "-ni" SET ARG_MATCH=T
IF "%1" == "--no-interface" SET ARG_MATCH=T
IF "%ARG_MATCH%" == "T" (
    SET SHOW_INTERFACE=F
    SHIFT & GOTO :PARSEARG
)

ECHO Updating workspace...

CALL mvn -q org.apache.maven.plugins:maven-install-plugin:3.0.0-M1:install-file -Dfile="%DIR%\tools\%TOOL_NAME%" && ^
CALL mvn -N com.opentext.d2.sdk:d2sdk-maven-plugin:workspace-update %UPDATE_ARG% && ^
ECHO Updating NodeJS components... && ^
CALL npm install --loglevel=error --no-progress --no-audit --no-fund

IF %ERRORLEVEL% EQU 0 (
    ECHO:
    ECHO Workspace updated.
    
    IF "%SHOW_INTERFACE%" == "T" (
        CALL npm start
    )

    IF "%SHOW_INTERFACE%" == "F" (
        ECHO Use "npm start" to run workspace assistant anytime.
    )
)

