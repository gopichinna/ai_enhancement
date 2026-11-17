@ECHO OFF
:: D2 SmartView SDK Environment Activator for Command Prompt on Windows

:: If JAVA_HOME is not set, try standard locations
IF "%JAVA_HOME%"=="" (
    IF EXIST "D:\dev-tools\jdk-17\bin\javac.exe" SET "JAVA_HOME=D:\dev-tools\jdk-17"
    IF EXIST "%USERPROFILE%\dev-tools\jdk-17\bin\javac.exe" SET "JAVA_HOME=%USERPROFILE%\dev-tools\jdk-17"
    IF EXIST "C:\dev-tools\jdk-17\bin\javac.exe" SET "JAVA_HOME=C:\dev-tools\jdk-17"
    IF EXIST "C:\Program Files\Eclipse Adoptium\jdk-17*\bin\javac.exe" (
        FOR /D %%D IN ("C:\Program Files\Eclipse Adoptium\jdk-17*") DO SET "JAVA_HOME=%%D"
    )
)

:: If MAVEN_HOME is not set, try standard locations
IF "%MAVEN_HOME%"=="" (
    IF EXIST "D:\dev-tools\apache-maven-3.8.8\bin\mvn.cmd" SET "MAVEN_HOME=D:\dev-tools\apache-maven-3.8.8"
    IF EXIST "%USERPROFILE%\dev-tools\apache-maven-3.8.8\bin\mvn.cmd" SET "MAVEN_HOME=%USERPROFILE%\dev-tools\apache-maven-3.8.8"
    IF EXIST "C:\dev-tools\apache-maven-3.8.8\bin\mvn.cmd" SET "MAVEN_HOME=C:\dev-tools\apache-maven-3.8.8"
)

:: Try finding Node.js
IF EXIST "D:\dev-tools\node-v20\node.exe" SET "PATH=D:\dev-tools\node-v20;%PATH%"
IF EXIST "%USERPROFILE%\dev-tools\node-v20\node.exe" SET "PATH=%USERPROFILE%\dev-tools\node-v20;%PATH%"
IF EXIST "C:\dev-tools\node-v20\node.exe" SET "PATH=C:\dev-tools\node-v20;%PATH%"

IF NOT "%JAVA_HOME%"=="" SET "PATH=%JAVA_HOME%\bin;%PATH%"
IF NOT "%MAVEN_HOME%"=="" SET "PATH=%MAVEN_HOME%\bin;%PATH%"

ECHO -------------------------------------------------------------
ECHO D2 SmartView SDK Environment Activated (Windows):
ECHO   JAVA_HOME  : %JAVA_HOME%
ECHO   MAVEN_HOME : %MAVEN_HOME%
ECHO   Node       : 
node -v 2>NUL || ECHO   Node not found on PATH
ECHO   Maven      : 
CALL mvn -version 2>NUL | FINDSTR "Apache Maven" || ECHO   Maven not found on PATH
ECHO -------------------------------------------------------------
