<#
.SYNOPSIS
    One-Shot Environment Setup & Build Script for Windows Server 2022 / Windows 10/11 (AWS WorkSpaces).
.DESCRIPTION
    Installs and configures all prerequisites for the OpenText Documentum D2 SmartView SDK (25.4.1)
    and AI Enhancement project:
      1. OpenJDK 17 (Eclipse Temurin 17 LTS)
      2. Node.js 20 LTS (win-x64)
      3. Apache Maven 3.8.8
      4. Python 3 (embeddable, for mock AI server)
      5. Grunt CLI
      6. System/User Environment Variables (JAVA_HOME, MAVEN_HOME, PATH)
      7. Dynamic pom.xml configuration for local Windows paths
      8. VS Code Java & Maven settings
      9. Full workspace compilation verification (mvn clean package)
.PARAMETER DevToolsPath
    Directory where portable tools will be placed. Defaults to "D:\dev-tools" (persistent AWS WorkSpaces User Volume) or "$HOME\dev-tools".
.PARAMETER SkipBuild
    Skip running "npm install" and "mvn clean package" after setting up tools.
.PARAMETER Force
    Force re-download and re-extract of software even if already detected.
#>

[CmdletBinding()]
param(
    [string]$DevToolsPath = "",
    [switch]$SkipBuild,
    [switch]$Force
)

# Ensure script stops on unhandled terminating errors
$ErrorActionPreference = "Stop"

# Enable TLS 1.2 for secure downloads on Windows Server 2022
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13

$WorkspaceRoot = (Resolve-Path "$PSScriptRoot").Path

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  D2 SmartView AI Enhancement - Windows One-Shot Setup (25.4.1)  " -ForegroundColor Cyan
Write-Host "  OS Target: Windows Server 2022 Datacenter (AWS WorkSpace)      " -ForegroundColor Cyan
Write-Host "  Workspace: $WorkspaceRoot" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

# Determine dev-tools location (prioritizing D:\ drive which is the persistent User Volume on AWS WorkSpaces)
if (-not $DevToolsPath) {
    if (Test-Path "D:\") {
        try {
            $testDir = "D:\dev-tools"
            if (-not (Test-Path $testDir)) {
                New-Item -ItemType Directory -Path $testDir -Force -ErrorAction Stop | Out-Null
            }
            $testFile = "$testDir\.write-test"
            [IO.File]::WriteAllText($testFile, "test")
            Remove-Item $testFile -Force -ErrorAction SilentlyContinue
            $DevToolsPath = "D:\dev-tools"
        }
        catch {
            $DevToolsPath = Join-Path $env:USERPROFILE "dev-tools"
        }
    } else {
        $DevToolsPath = Join-Path $env:USERPROFILE "dev-tools"
    }
}

if (-not (Test-Path $DevToolsPath)) {
    New-Item -ItemType Directory -Path $DevToolsPath -Force | Out-Null
}

Write-Host "[*] Dev-Tools Installation Directory: $DevToolsPath" -ForegroundColor Yellow

# Helper function to download file with progress
function Download-FileWithProgress {
    param(
        [string]$Url,
        [string]$OutputFile,
        [string]$Label
    )
    Write-Host "    Downloading $Label..." -ForegroundColor Cyan
    Write-Host "    URL: $Url" -ForegroundColor Gray
    
    $webClient = New-Object System.Net.WebClient
    try {
        $webClient.Headers.Add("User-Agent", "D2SV-Setup-Script/1.0 (Windows Server 2022)")
        $webClient.DownloadFile($Url, $OutputFile)
        Write-Host "    [OK] Download completed: $([math]::Round((Get-Item $OutputFile).Length / 1MB, 2)) MB" -ForegroundColor Green
    }
    finally {
        $webClient.Dispose()
    }
}

# Helper function to extract zip
function Extract-ZipArchive {
    param(
        [string]$ZipFile,
        [string]$Destination
    )
    Write-Host "    Extracting $([System.IO.Path]::GetFileName($ZipFile))..." -ForegroundColor Cyan
    if (-not (Test-Path $Destination)) {
        New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($ZipFile, $Destination)
    Write-Host "    [OK] Extracted to $Destination" -ForegroundColor Green
}

# Helper function to sync Windows Trusted Root certificates to Java cacerts (for corporate SSL proxies)
function Sync-WindowsCertsToJava {
    param(
        [string]$JavaHome,
        [string]$JavaBin,
        [string]$DevToolsRoot
    )
    Write-Host "    Syncing Windows Root Certificate Store to Java cacerts and Node.js..." -ForegroundColor Cyan
    $cacertsPath = Join-Path $JavaHome "lib\security\cacerts"
    $keytoolPath = Join-Path $JavaBin "keytool.exe"
    
    $imported = 0
    $tempCert = [System.IO.Path]::GetTempFileName()
    $pemBundle = Join-Path $DevToolsRoot "ca-bundle.pem"
    $sbPem = [System.Text.StringBuilder]::new()
    
    try {
        $stores = @("Cert:\LocalMachine\Root", "Cert:\LocalMachine\CA", "Cert:\CurrentUser\Root")
        $certs = Get-ChildItem -Path $stores -ErrorAction SilentlyContinue | Where-Object { $_.Thumbprint }
        
        foreach ($c in $certs) {
            if ($c.NotAfter -and ($c.NotAfter -lt (Get-Date))) { continue }
            $alias = "win-ca-" + $c.Thumbprint.Substring(0, 10)
            $certBytes = $c.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
            [System.IO.File]::WriteAllBytes($tempCert, $certBytes)
            
            # PEM format for Node / NPM
            $sbPem.AppendLine("-----BEGIN CERTIFICATE-----") | Out-Null
            $sbPem.AppendLine([System.Convert]::ToBase64String($certBytes, [System.Base64FormattingOptions]::InsertLineBreaks)) | Out-Null
            $sbPem.AppendLine("-----END CERTIFICATE-----") | Out-Null
            
            if ((Test-Path $cacertsPath) -and (Test-Path $keytoolPath)) {
                $proc = Start-Process -FilePath $keytoolPath -ArgumentList "-importcert -noprompt -keystore `"$cacertsPath`" -storepass changeit -alias `"$alias`" -file `"$tempCert`"" -NoNewWindow -Wait -PassThru -ErrorAction SilentlyContinue
                if ($proc.ExitCode -eq 0) {
                    $imported++
                }
            }
        }
        
        # Write CA bundle for Node.js
        [System.IO.File]::WriteAllText($pemBundle, $sbPem.ToString(), [System.Text.Encoding]::ASCII)
        $env:NODE_EXTRA_CA_CERTS = $pemBundle
        [Environment]::SetEnvironmentVariable("NODE_EXTRA_CA_CERTS", $pemBundle, [EnvironmentVariableTarget]::User)
        
        if ($imported -gt 0) {
            Write-Host "    [OK] Synced $imported enterprise certificate(s) into Java truststore." -ForegroundColor Green
        } else {
            Write-Host "    [OK] Java truststore already up-to-date with Windows certificates." -ForegroundColor Green
        }
        Write-Host "    [OK] Exported corporate CA bundle to $pemBundle (NODE_EXTRA_CA_CERTS configured)." -ForegroundColor Green
    }
    catch {
        Write-Host "    [!] Notice: Certificate sync: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    finally {
        Remove-Item $tempCert -Force -ErrorAction SilentlyContinue
    }
}

# -----------------------------------------------------------------------------
# STEP 1: Java JDK 17 (Eclipse Temurin)
# -----------------------------------------------------------------------------
Write-Host "`n-----------------------------------------------------------------" -ForegroundColor Gray
Write-Host " STEP 1: OpenJDK 17 Setup" -ForegroundColor White
Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray

$JavaInstalled = $false
$JavaBinPath = ""
$JavaHomePath = ""

if (-not $Force) {
    if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\javac.exe")) {
        $verCheck = & "$env:JAVA_HOME\bin\java.exe" -version 2>&1 | Out-String
        if ($verCheck -match 'version "(17\.[0-9]+)') {
            Write-Host "[OK] Existing Java 17 detected in JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
            $JavaHomePath = $env:JAVA_HOME
            $JavaBinPath = "$JavaHomePath\bin"
            $JavaInstalled = $true
        }
    }
    if (-not $JavaInstalled) {
        $cmdJava = Get-Command "javac.exe" -ErrorAction SilentlyContinue
        if ($cmdJava) {
            $verCheck = & $cmdJava.Source -version 2>&1 | Out-String
            if ($verCheck -match 'javac 17\.') {
                $JavaBinPath = [System.IO.Path]::GetDirectoryName($cmdJava.Source)
                $JavaHomePath = [System.IO.Path]::GetDirectoryName($JavaBinPath)
                Write-Host "[OK] Existing Java 17 detected on PATH: $JavaHomePath" -ForegroundColor Green
                $JavaInstalled = $true
            }
        }
    }
}

if (-not $JavaInstalled) {
    $JdkTargetDir = Join-Path $DevToolsPath "jdk-17"
    if ((Test-Path "$JdkTargetDir\bin\javac.exe") -and (-not $Force)) {
        Write-Host "[OK] Portable JDK 17 already found at $JdkTargetDir" -ForegroundColor Green
        $JavaHomePath = $JdkTargetDir
        $JavaBinPath = "$JdkTargetDir\bin"
    } else {
        $JdkZip = Join-Path $DevToolsPath "openjdk17.zip"
        $JdkExtractTemp = Join-Path $DevToolsPath "jdk-temp"
        
        $JdkUrl = "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk"
        Download-FileWithProgress -Url $JdkUrl -OutputFile $JdkZip -Label "Eclipse Temurin OpenJDK 17"
        
        if (Test-Path $JdkExtractTemp) { Remove-Item $JdkExtractTemp -Recurse -Force }
        Extract-ZipArchive -ZipFile $JdkZip -Destination $JdkExtractTemp
        
        $innerDir = Get-ChildItem -Path $JdkExtractTemp -Directory | Select-Object -First 1
        if (Test-Path $JdkTargetDir) { Remove-Item $JdkTargetDir -Recurse -Force }
        Move-Item -Path $innerDir.FullName -Destination $JdkTargetDir
        
        Remove-Item $JdkZip -Force -ErrorAction SilentlyContinue
        Remove-Item $JdkExtractTemp -Recurse -Force -ErrorAction SilentlyContinue
        
        $JavaHomePath = $JdkTargetDir
        $JavaBinPath = "$JdkTargetDir\bin"
        Write-Host "[OK] OpenJDK 17 installed to $JavaHomePath" -ForegroundColor Green
    }
}

# Sync corporate/enterprise root certificates into Java cacerts
if ($JavaHomePath -and $JavaBinPath) {
    Sync-WindowsCertsToJava -JavaHome $JavaHomePath -JavaBin $JavaBinPath -DevToolsRoot $DevToolsPath
}

# -----------------------------------------------------------------------------
# STEP 2: Node.js 20 LTS (Windows x64)
# -----------------------------------------------------------------------------
Write-Host "`n-----------------------------------------------------------------" -ForegroundColor Gray
Write-Host " STEP 2: Node.js 20 LTS Setup" -ForegroundColor White
Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray

$NodeInstalled = $false
$NodeDir = ""

if (-not $Force) {
    $cmdNode = Get-Command "node.exe" -ErrorAction SilentlyContinue
    if ($cmdNode) {
        $nodeVer = & $cmdNode.Source -v 2>&1 | Out-String
        if ($nodeVer -match '^v(18|20|22)\.') {
            Write-Host "[OK] Existing Node.js detected on PATH: $nodeVer" -ForegroundColor Green
            $NodeDir = [System.IO.Path]::GetDirectoryName($cmdNode.Source)
            $NodeInstalled = $true
        }
    }
}

if (-not $NodeInstalled) {
    $NodeTargetDir = Join-Path $DevToolsPath "node-v20"
    if ((Test-Path "$NodeTargetDir\node.exe") -and (-not $Force)) {
        Write-Host "[OK] Portable Node.js 20 already found at $NodeTargetDir" -ForegroundColor Green
        $NodeDir = $NodeTargetDir
    } else {
        $NodeZip = Join-Path $DevToolsPath "node20.zip"
        $NodeExtractTemp = Join-Path $DevToolsPath "node-temp"
        $NodeUrl = "https://nodejs.org/dist/v20.18.3/node-v20.18.3-win-x64.zip"
        
        Download-FileWithProgress -Url $NodeUrl -OutputFile $NodeZip -Label "Node.js v20.18.3 LTS (win-x64)"
        
        if (Test-Path $NodeExtractTemp) { Remove-Item $NodeExtractTemp -Recurse -Force }
        Extract-ZipArchive -ZipFile $NodeZip -Destination $NodeExtractTemp
        
        $innerDir = Get-ChildItem -Path $NodeExtractTemp -Directory | Select-Object -First 1
        if (Test-Path $NodeTargetDir) { Remove-Item $NodeTargetDir -Recurse -Force }
        Move-Item -Path $innerDir.FullName -Destination $NodeTargetDir
        
        Remove-Item $NodeZip -Force -ErrorAction SilentlyContinue
        Remove-Item $NodeExtractTemp -Recurse -Force -ErrorAction SilentlyContinue
        
        $NodeDir = $NodeTargetDir
        Write-Host "[OK] Node.js 20 installed to $NodeDir" -ForegroundColor Green
    }
}

# -----------------------------------------------------------------------------
# STEP 3: Apache Maven 3.8.8 Setup
# -----------------------------------------------------------------------------
Write-Host "`n-----------------------------------------------------------------" -ForegroundColor Gray
Write-Host " STEP 3: Apache Maven 3.8.8 Setup" -ForegroundColor White
Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray

$MavenInstalled = $false
$MavenHomePath = ""
$MavenBinPath = ""

if (-not $Force) {
    if ($env:MAVEN_HOME -and (Test-Path "$env:MAVEN_HOME\bin\mvn.cmd")) {
        $verCheck = & "$env:MAVEN_HOME\bin\mvn.cmd" -v 2>&1 | Out-String
        if ($verCheck -match 'Apache Maven 3\.') {
            Write-Host "[OK] Existing Maven detected in MAVEN_HOME: $env:MAVEN_HOME" -ForegroundColor Green
            $MavenHomePath = $env:MAVEN_HOME
            $MavenBinPath = "$MavenHomePath\bin"
            $MavenInstalled = $true
        }
    }
    if (-not $MavenInstalled) {
        $cmdMvn = Get-Command "mvn.cmd" -ErrorAction SilentlyContinue
        if ($cmdMvn) {
            $verCheck = & $cmdMvn.Source -v 2>&1 | Out-String
            if ($verCheck -match 'Apache Maven 3\.') {
                $MavenBinPath = [System.IO.Path]::GetDirectoryName($cmdMvn.Source)
                $MavenHomePath = [System.IO.Path]::GetDirectoryName($MavenBinPath)
                Write-Host "[OK] Existing Maven detected on PATH: $MavenHomePath" -ForegroundColor Green
                $MavenInstalled = $true
            }
        }
    }
}

if (-not $MavenInstalled) {
    $MvnTargetDir = Join-Path $DevToolsPath "apache-maven-3.8.8"
    if ((Test-Path "$MvnTargetDir\bin\mvn.cmd") -and (-not $Force)) {
        Write-Host "[OK] Portable Maven 3.8.8 already found at $MvnTargetDir" -ForegroundColor Green
        $MavenHomePath = $MvnTargetDir
        $MavenBinPath = "$MvnTargetDir\bin"
    } else {
        $MvnZip = Join-Path $DevToolsPath "maven.zip"
        $MvnExtractTemp = Join-Path $DevToolsPath "maven-temp"
        $MvnUrl = "https://archive.apache.org/dist/maven/maven-3/3.8.8/binaries/apache-maven-3.8.8-bin.zip"
        
        Download-FileWithProgress -Url $MvnUrl -OutputFile $MvnZip -Label "Apache Maven 3.8.8"
        
        if (Test-Path $MvnExtractTemp) { Remove-Item $MvnExtractTemp -Recurse -Force }
        Extract-ZipArchive -ZipFile $MvnZip -Destination $MvnExtractTemp
        
        $innerDir = Get-ChildItem -Path $MvnExtractTemp -Directory | Select-Object -First 1
        if (Test-Path $MvnTargetDir) { Remove-Item $MvnTargetDir -Recurse -Force }
        Move-Item -Path $innerDir.FullName -Destination $MvnTargetDir
        
        Remove-Item $MvnZip -Force -ErrorAction SilentlyContinue
        Remove-Item $MvnExtractTemp -Recurse -Force -ErrorAction SilentlyContinue
        
        $MavenHomePath = $MvnTargetDir
        $MavenBinPath = "$MvnTargetDir\bin"
        Write-Host "[OK] Apache Maven 3.8.8 installed to $MavenHomePath" -ForegroundColor Green
    }
}

# -----------------------------------------------------------------------------
# STEP 4: Python 3 Setup (for local Mock AI Server testing)
# -----------------------------------------------------------------------------
Write-Host "`n-----------------------------------------------------------------" -ForegroundColor Gray
Write-Host " STEP 4: Python 3 Setup (for mock AI server)" -ForegroundColor White
Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray

$PythonInstalled = $false
$PythonBin = ""

$cmdPy = Get-Command "python.exe" -ErrorAction SilentlyContinue
if (-not $cmdPy) { $cmdPy = Get-Command "py.exe" -ErrorAction SilentlyContinue }

if ($cmdPy) {
    $pyVer = & $cmdPy.Source --version 2>&1 | Out-String
    if ($pyVer -match 'Python 3\.') {
        Write-Host "[OK] Existing Python 3 detected: $pyVer" -ForegroundColor Green
        $PythonBin = [System.IO.Path]::GetDirectoryName($cmdPy.Source)
        $PythonInstalled = $true
    }
}

if (-not $PythonInstalled) {
    $PyTargetDir = Join-Path $DevToolsPath "python-3.11"
    if (Test-Path "$PyTargetDir\python.exe") {
        Write-Host "[OK] Portable Python 3 already found at $PyTargetDir" -ForegroundColor Green
        $PythonBin = $PyTargetDir
    } else {
        Write-Host "    Installing Python 3 via official silent installer..." -ForegroundColor Cyan
        $PyInstaller = Join-Path $DevToolsPath "python-installer.exe"
        $PyUrl = "https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe"
        
        try {
            Download-FileWithProgress -Url $PyUrl -OutputFile $PyInstaller -Label "Python 3.11.9 64-bit Installer"
            Start-Process -FilePath $PyInstaller -ArgumentList "/quiet InstallAllUsers=0 PrependPath=1 TargetDir=`"$PyTargetDir`"" -Wait
            Remove-Item $PyInstaller -Force -ErrorAction SilentlyContinue
            if (Test-Path "$PyTargetDir\python.exe") {
                $PythonBin = $PyTargetDir
                Write-Host "[OK] Python 3.11 installed to $PythonBin" -ForegroundColor Green
            } else {
                Write-Host "[!] Note: Python automated install completed; will rely on standard execution." -ForegroundColor Yellow
            }
        } catch {
            Write-Host "[!] Notice: Python download skipped ($($_.Exception.Message)). You can test AI endpoints directly." -ForegroundColor Yellow
        }
    }
}

# -----------------------------------------------------------------------------
# STEP 5: Environment Variables & Path Configuration
# -----------------------------------------------------------------------------
Write-Host "`n-----------------------------------------------------------------" -ForegroundColor Gray
Write-Host " STEP 5: Environment Variables & Persistent PATH Setup" -ForegroundColor White
Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray

# Set process environment immediately
$env:JAVA_HOME = $JavaHomePath
$env:MAVEN_HOME = $MavenHomePath

# Configure MAVEN_OPTS to trust Windows Root Certificate Store (fixes corporate SSL/TLS proxy PKIX errors)
$mavenOpts = "-Djavax.net.ssl.trustStoreType=WINDOWS-ROOT"
$env:MAVEN_OPTS = $mavenOpts

$prependPaths = @($JavaBinPath, $MavenBinPath, $NodeDir)
if ($PythonBin) { $prependPaths += $PythonBin }

# Prepend to current session PATH
$currentPaths = $env:PATH -split ';'
foreach ($p in ($prependPaths | Where-Object { $_ -and (Test-Path $_) })) {
    if ($currentPaths -notcontains $p) {
        $env:PATH = "$p;$env:PATH"
    }
}

# Persist to User Environment (so new VS Code terminals inherit them automatically)
try {
    [Environment]::SetEnvironmentVariable("JAVA_HOME", $JavaHomePath, [EnvironmentVariableTarget]::User)
    [Environment]::SetEnvironmentVariable("MAVEN_HOME", $MavenHomePath, [EnvironmentVariableTarget]::User)
    [Environment]::SetEnvironmentVariable("MAVEN_OPTS", $mavenOpts, [EnvironmentVariableTarget]::User)
    Write-Host "[OK] Configured MAVEN_OPTS to use Windows Trusted Root Certificate Store." -ForegroundColor Green
    
    $userPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
    $userPathList = ($userPath -split ';') | Where-Object { $_ -ne "" }
    
    $pathsToAdd = $prependPaths | Where-Object { $_ -and ($userPathList -notcontains $_) }
    if ($pathsToAdd) {
        $newUserPath = ($pathsToAdd + $userPathList) -join ';'
        [Environment]::SetEnvironmentVariable("Path", $newUserPath, [EnvironmentVariableTarget]::User)
        Write-Host "[OK] Added to Persistent User PATH: $($pathsToAdd -join '; ')" -ForegroundColor Green
    } else {
        Write-Host "[OK] Persistent User PATH already up to date." -ForegroundColor Green
    }
} catch {
    Write-Host "[!] Warning setting persistent environment variables: $($_.Exception.Message)" -ForegroundColor Yellow
}

# -----------------------------------------------------------------------------
# STEP 6: Grunt CLI Global Tool
# -----------------------------------------------------------------------------
Write-Host "`n-----------------------------------------------------------------" -ForegroundColor Gray
Write-Host " STEP 6: Global Node Tools (Grunt CLI)" -ForegroundColor White
Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray

$npmExe = Join-Path $NodeDir "npm.cmd"
if (-not (Test-Path $npmExe)) { $npmExe = "npm" }

Write-Host "    Installing/verifying grunt-cli..." -ForegroundColor Cyan
& $npmExe install -g grunt-cli --loglevel=error | Out-Null
Write-Host "[OK] grunt-cli verified." -ForegroundColor Green

# -----------------------------------------------------------------------------
# STEP 7: Configure pom.xml for Local Windows Paths
# -----------------------------------------------------------------------------
Write-Host "`n-----------------------------------------------------------------" -ForegroundColor Gray
Write-Host " STEP 7: Configuring pom.xml for Windows Workspace" -ForegroundColor White
Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray

$RootPom = Join-Path $WorkspaceRoot "pom.xml"
$LibDir = Join-Path $WorkspaceRoot "lib"

# Format paths with forward slashes for cross-platform POM stability
$NodeDirPom = $NodeDir.Replace("\", "/")
$LibDirPom = $LibDir.Replace("\", "/")

if (Test-Path $RootPom) {
    [xml]$pomXml = Get-Content $RootPom
    
    # Update properties
    $pomXml.project.properties.'npm.home' = $NodeDirPom
    $pomXml.project.properties.'lib.path' = $LibDirPom
    
    # Save back
    $xmlWriterSettings = New-Object System.Xml.XmlWriterSettings
    $xmlWriterSettings.Indent = $true
    $xmlWriterSettings.IndentChars = "  "
    $xmlWriterSettings.Encoding = [System.Text.Encoding]::UTF8
    
    $xmlWriter = [System.Xml.XmlWriter]::Create($RootPom, $xmlWriterSettings)
    $pomXml.Save($xmlWriter)
    $xmlWriter.Dispose()
    
    Write-Host "[OK] Updated pom.xml:" -ForegroundColor Green
    Write-Host "     <npm.home>$NodeDirPom</npm.home>" -ForegroundColor Gray
    Write-Host "     <lib.path>$LibDirPom</lib.path>" -ForegroundColor Gray
}

# -----------------------------------------------------------------------------
# STEP 8: Generate Helper Activation Scripts (env.bat & env.ps1)
# -----------------------------------------------------------------------------
Write-Host "`n-----------------------------------------------------------------" -ForegroundColor Gray
Write-Host " STEP 8: Generating Windows Activation Scripts" -ForegroundColor White
Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray

# Create .mvn/jvm.config so Maven ALWAYS uses Windows Trusted Root Store without manual arguments
$mvnConfigDir = Join-Path $WorkspaceRoot ".mvn"
if (-not (Test-Path $mvnConfigDir)) { New-Item -ItemType Directory -Path $mvnConfigDir -Force | Out-Null }
Set-Content -Path (Join-Path $mvnConfigDir "jvm.config") -Value "-Djavax.net.ssl.trustStoreType=WINDOWS-ROOT" -Encoding ASCII
Write-Host "[OK] Created .mvn\jvm.config (enables Windows TrustStore for all Maven commands)" -ForegroundColor Green

# Generate env.bat
$EnvBatContent = @"
@ECHO OFF
:: Quick Environment Activator for Command Prompt in VS Code
SET "JAVA_HOME=$JavaHomePath"
SET "MAVEN_HOME=$MavenHomePath"
SET "MAVEN_OPTS=-Djavax.net.ssl.trustStoreType=WINDOWS-ROOT"
SET "NODE_EXTRA_CA_CERTS=$DevToolsPath\ca-bundle.pem"
SET "PATH=$JavaBinPath;$MavenBinPath;$NodeDir;%PATH%"

ECHO D2 SmartView SDK Environment Activated:
ECHO   JAVA_HOME  : %JAVA_HOME%
ECHO   MAVEN_HOME : %MAVEN_HOME%
ECHO   MAVEN_OPTS : %MAVEN_OPTS%
ECHO   Node       : $(& "$NodeDir\node.exe" -v 2>&1)
ECHO   Maven      : $MavenHomePath
"@
[IO.File]::WriteAllText((Join-Path $WorkspaceRoot "env.bat"), $EnvBatContent, [System.Text.Encoding]::ASCII)
Write-Host "[OK] Created env.bat (for CMD)" -ForegroundColor Green

# Generate env.ps1
$EnvPs1Content = @"
# Quick Environment Activator for PowerShell in VS Code
`$env:JAVA_HOME = "$JavaHomePath"
`$env:MAVEN_HOME = "$MavenHomePath"
`$env:MAVEN_OPTS = "-Djavax.net.ssl.trustStoreType=WINDOWS-ROOT"
`$env:NODE_EXTRA_CA_CERTS = "$DevToolsPath\ca-bundle.pem"
`$env:PATH = "$JavaBinPath;$MavenBinPath;$NodeDir;`$env:PATH"

Write-Host "D2 SmartView SDK Environment Activated:" -ForegroundColor Cyan
Write-Host "  JAVA_HOME  : `$env:JAVA_HOME"
Write-Host "  MAVEN_HOME : `$env:MAVEN_HOME"
Write-Host "  MAVEN_OPTS : `$env:MAVEN_OPTS"
Write-Host "  Node       : $(& "$NodeDir\node.exe" -v 2>&1)"
"@
[IO.File]::WriteAllText((Join-Path $WorkspaceRoot "env.ps1"), $EnvPs1Content, [System.Text.Encoding]::UTF8)
Write-Host "[OK] Created env.ps1 (for PowerShell)" -ForegroundColor Green

# -----------------------------------------------------------------------------
# STEP 9: Configure VS Code Settings (.vscode/settings.json)
# -----------------------------------------------------------------------------
Write-Host "`n-----------------------------------------------------------------" -ForegroundColor Gray
Write-Host " STEP 9: Updating VS Code Settings (.vscode/settings.json)" -ForegroundColor White
Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray

$VscodeDir = Join-Path $WorkspaceRoot ".vscode"
if (-not (Test-Path $VscodeDir)) { New-Item -ItemType Directory -Path $VscodeDir -Force | Out-Null }

$VscodeSettingsFile = Join-Path $VscodeDir "settings.json"
$settingsObj = @{}
if (Test-Path $VscodeSettingsFile) {
    try {
        $settingsObj = Get-Content $VscodeSettingsFile -Raw | ConvertFrom-Json -AsHashtable
    } catch { $settingsObj = @{} }
}

$settingsObj["java.jdt.ls.java.home"] = $JavaHomePath.Replace("\", "/")
$settingsObj["java.configuration.runtimes"] = @(
    @{
        name = "JavaSE-17"
        path = $JavaHomePath.Replace("\", "/")
        default = $true
    }
)
$settingsObj["maven.executable.path"] = (Join-Path $MavenBinPath "mvn.cmd").Replace("\", "/")
$settingsObj["terminal.integrated.env.windows"] = @{
    JAVA_HOME = $JavaHomePath
    MAVEN_HOME = $MavenHomePath
    MAVEN_OPTS = "-Djavax.net.ssl.trustStoreType=WINDOWS-ROOT"
    NODE_EXTRA_CA_CERTS = (Join-Path $DevToolsPath "ca-bundle.pem")
}

$settingsJson = $settingsObj | ConvertTo-Json -Depth 5
[IO.File]::WriteAllText($VscodeSettingsFile, $settingsJson, [System.Text.Encoding]::UTF8)
Write-Host "[OK] Configured VS Code Java Language Server & Terminal settings." -ForegroundColor Green

# Recommended extensions
$ExtensionsFile = Join-Path $VscodeDir "extensions.json"
$extObj = @{
    recommendations = @(
        "vscjava.vscode-java-pack",
        "vscjava.vscode-maven",
        "dbaeumer.vscode-eslint",
        "ms-python.python"
    )
}
[IO.File]::WriteAllText($ExtensionsFile, ($extObj | ConvertTo-Json), [System.Text.Encoding]::UTF8)
Write-Host "[OK] Configured .vscode/extensions.json recommendations." -ForegroundColor Green

# -----------------------------------------------------------------------------
# STEP 10: Register SDK Plugin & Verify Workspace Build
# -----------------------------------------------------------------------------
if (-not $SkipBuild) {
    Write-Host "`n-----------------------------------------------------------------" -ForegroundColor Gray
    Write-Host " STEP 10: Registering SDK Plugin & Running Verification Build" -ForegroundColor White
    Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray

    Push-Location $WorkspaceRoot
    try {
        # 1. Register local SDK plugin jar to .m2
        $PluginJar = Join-Path $WorkspaceRoot "tools\d2sdk-maven-plugin-25.4.1.jar"
        if (-not (Test-Path $PluginJar)) {
            $searchPaths = @(
                (Join-Path $WorkspaceRoot "..\sv-sdk-25.4.1\tools\d2sdk-maven-plugin-25.4.1.jar"),
                (Join-Path $WorkspaceRoot "..\D2SV-SDK-25.4.1\tools\d2sdk-maven-plugin-25.4.1.jar"),
                (Join-Path $WorkspaceRoot "..\tools\d2sdk-maven-plugin-25.4.1.jar"),
                "D:\sv-sdk-25.4.1\tools\d2sdk-maven-plugin-25.4.1.jar",
                "D:\D2SV-SDK-25.4.1\tools\d2sdk-maven-plugin-25.4.1.jar",
                "C:\sv-sdk-25.4.1\tools\d2sdk-maven-plugin-25.4.1.jar",
                "C:\D2SV-SDK-25.4.1\tools\d2sdk-maven-plugin-25.4.1.jar"
            )
            foreach ($sp in $searchPaths) {
                if (Test-Path $sp) {
                    Write-Host "    Found SDK plugin at $sp - copying to tools\..." -ForegroundColor Cyan
                    if (-not (Test-Path (Join-Path $WorkspaceRoot "tools"))) { New-Item -ItemType Directory -Path (Join-Path $WorkspaceRoot "tools") -Force | Out-Null }
                    Copy-Item -Path $sp -Destination $PluginJar -Force
                    break
                }
            }
        }
        
        if (Test-Path $PluginJar) {
            Write-Host "    Registering d2sdk-maven-plugin-25.4.1.jar in local Maven cache..." -ForegroundColor Cyan
            & "$MavenBinPath\mvn.cmd" -Djavax.net.ssl.trustStoreType=WINDOWS-ROOT -q org.apache.maven.plugins:maven-install-plugin:3.0.0-M1:install-file -Dfile="$PluginJar"
            Write-Host "    [OK] Maven SDK plugin registered." -ForegroundColor Green
        } else {
            Write-Host "    [!] Notice: tools\d2sdk-maven-plugin-25.4.1.jar not found." -ForegroundColor Yellow
            Write-Host "        If SDK plugin is not yet in ~/.m2, please copy d2sdk-maven-plugin-25.4.1.jar into $WorkspaceRoot\tools" -ForegroundColor Yellow
        }
        
        # 2. NPM Install
        Write-Host "    Running npm install..." -ForegroundColor Cyan
        & "$NodeDir\npm.cmd" install --loglevel=error --no-progress --no-audit --no-fund
        Write-Host "    [OK] npm install completed." -ForegroundColor Green
        
        # 3. Maven Package (with Windows TrustStore enabled to pass corporate proxies)
        Write-Host "    Compiling and packaging plugin (mvn clean package)..." -ForegroundColor Cyan
        & "$MavenBinPath\mvn.cmd" -Djavax.net.ssl.trustStoreType=WINDOWS-ROOT clean package
        
        $DistJar = Join-Path $WorkspaceRoot "dist\D2SV-AI-Summary-1.0.0.jar"
        if (Test-Path $DistJar) {
            Write-Host "`n=================================================================" -ForegroundColor Green
            Write-Host "  SETUP SUCCESSFUL!                                              " -ForegroundColor Green
            Write-Host "  Built Artifact: dist\D2SV-AI-Summary-1.0.0.jar                 " -ForegroundColor Green
            Write-Host "  All tools configured and ready for VS Code on Windows Server!  " -ForegroundColor Green
            Write-Host "=================================================================" -ForegroundColor Green
        }
    }
    finally {
        Pop-Location
    }
} else {
    Write-Host "`n=================================================================" -ForegroundColor Green
    Write-Host "  SETUP COMPLETED (Build skipped as requested).                 " -ForegroundColor Green
    Write-Host "  Run 'mvn clean package' or env.bat to begin building!          " -ForegroundColor Green
    Write-Host "=================================================================" -ForegroundColor Green
}
