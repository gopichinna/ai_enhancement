<!--- Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. --->

Getting started with the D2SV-SDK-24.4.0
=======================================================================
Prepare the development environment
------------------------------------------

1. Download developer tools
2. Install developer tools
3. Create the development workspace
4. Continue to packaged documentation

### 1. Download the developer tools for your OS:

    JDK         - JDK is required to compile Java code present within a development workspace. 
                  Use JDK 17 or later.
                  See https://openjdk.java.net
    Maven       - Apache maven is the secondary build tool used in this SDK development workspace. 
                  Recommended version 3.8.2. A different version may not be fully compatible.
                  See https://maven.apache.org
    NodeJS      - JavaScript VM to execute the SDK tools, build tools and to run the development web server for UI code. 
                  Recommended version is 20 LTS. A different version may not be fully compatible.
                  See http://nodejs.org.
    Grunt       - JavaScript task runner for building and testing UI code.
                  See http://gruntjs.com. Nothing to be downloaded from this URL though.

### 2. Install the developer tools for your OS


    JDK         - Run installer. Set the JAVA_HOME path variable to point to the JDK root directory.
    Maven       - Unzip & extract to a directory. Set MAVEN_HOME environment variable pointing to the directory.
                  Update PATH environment variable so that Maven commands can be executed from command-line/terminal.
    NodeJS      - Install the package for your OS. Set NPM_HOME environment variable pointing to the NodeJS 
                  installation directory. Update PATH accordingly so that NodeJS commands can be executed from command-line.
                  It is recommended to avoid installing NodeJS under 'Program Files' as doing that has been known to create
                  problem some times.
    NPM         - Update the NPM module management tool to the latest version:
                    npm install -g npm@latest
                  
    Grunt       - Install the command line task runner client as a global NPM module.
                    npm install -g grunt-cli

### 3. Create the development workspace:

    # 1. Extract the SDK
    # 2. Open a command-prompt inside the extracted folder
    
    # Execute batch script ws-init.bat
    >ws-init.bat

    # It will take a while to fully initialize the workspace. It might fail as well if necessary dev tools are missing.
    # Once initialization successfully completes, the workspace assistant starts automatically.
    # It doesn't require to run ws-init.bat inside the initialized workspace again, unless some other instructions specifically says to do so.

### 4. Continue to packaged documentaion
    Select "Check out documentation" option in the workspace assitant. or,

    >npm run documentation
    # open http://localhost:7777/d2sv-sdk/ in your browser and continue to that documentation.
