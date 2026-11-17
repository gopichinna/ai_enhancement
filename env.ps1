# D2 SmartView SDK Environment Activator for PowerShell on Windows

if (-not $env:JAVA_HOME) {
    $candidates = @(
        "D:\dev-tools\jdk-17",
        "$env:USERPROFILE\dev-tools\jdk-17",
        "C:\dev-tools\jdk-17"
    ) + (Get-Item "C:\Program Files\Eclipse Adoptium\jdk-17*" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName)
    
    foreach ($c in $candidates) {
        if ($c -and (Test-Path "$c\bin\javac.exe")) {
            $env:JAVA_HOME = $c
            break
        }
    }
}

if (-not $env:MAVEN_HOME) {
    $mCandidates = @(
        "D:\dev-tools\apache-maven-3.8.8",
        "$env:USERPROFILE\dev-tools\apache-maven-3.8.8",
        "C:\dev-tools\apache-maven-3.8.8"
    )
    foreach ($m in $mCandidates) {
        if ($m -and (Test-Path "$m\bin\mvn.cmd")) {
            $env:MAVEN_HOME = $m
            break
        }
    }
}

$nodeCandidates = @(
    "D:\dev-tools\node-v20",
    "$env:USERPROFILE\dev-tools\node-v20",
    "C:\dev-tools\node-v20"
)
foreach ($n in $nodeCandidates) {
    if ($n -and (Test-Path "$n\node.exe")) {
        $env:PATH = "$n;$env:PATH"
        break
    }
}

if ($env:JAVA_HOME) { $env:PATH = "$env:JAVA_HOME\bin;$env:PATH" }
if ($env:MAVEN_HOME) { $env:PATH = "$env:MAVEN_HOME\bin;$env:PATH" }

Write-Host "-------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "D2 SmartView SDK Environment Activated (PowerShell):" -ForegroundColor Cyan
Write-Host "  JAVA_HOME  : $env:JAVA_HOME"
Write-Host "  MAVEN_HOME : $env:MAVEN_HOME"
Write-Host "  Node       : $(node -v 2>$null)"
Write-Host "  Maven      : $((mvn -version 2>$null | Select-Object -First 1))"
Write-Host "-------------------------------------------------------------" -ForegroundColor Cyan
