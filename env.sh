#!/bin/bash
# Environment setup for D2SV Smartview SDK 24.4.0 (AI Enhancement Workspace)

export JAVA_HOME="/Users/gopiparthiban/Library/Java/JavaVirtualMachines/jdk-17.0.20+8/Contents/Home"
export SDK_DEV_TOOLS="/Users/gopiparthiban/coding_space/ai_enhancement/.dev-tools"

export PATH="$SDK_DEV_TOOLS/node-v20.18.3-darwin-arm64/bin:$SDK_DEV_TOOLS/apache-maven-3.8.8/bin:$JAVA_HOME/bin:$PATH"

echo "D2SV-SDK Environment Loaded (ai_enhancement):"
echo "  JAVA_HOME : $JAVA_HOME"
echo "  Node      : $(node -v 2>/dev/null || echo 'Not Found')"
echo "  NPM       : $(npm -v 2>/dev/null || echo 'Not Found')"
echo "  Maven     : $(mvn -version 2>/dev/null | head -n 1 || echo 'Not Found')"
