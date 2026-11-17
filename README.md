# D2 SmartView - AI Summary Enhancement Workspace

> 📖 **Master Blueprint & Architecture Guide:**  
> For the complete deep-dive documentation, line-by-line file explanations, runtime execution sequences, and troubleshooting, read **[flow.md](flow.md)**!

This workspace contains the complete, isolated setup for the **AI Summary** plugin in OpenText Documentum D2 SmartView (25.4.1 / 25.4.0).

---

## 📁 Workspace Structure

- `plugins/D2SV-AI-Summary/` - The AI Summary plugin source code (Java backend, XML menus, SmartView frontend JS & Handlebars template).
- `dist/D2SV-AI-Summary-1.0.0.jar` - The compiled, ready-to-deploy plugin JAR.
- `lib/` - Documentum DFC & D2FS platform libraries.
- `.dev-tools/` - Pre-configured JDK 17, Maven 3.8, and Node 20 runtimes.
- `env.sh` - Loads the build environment variables.

---

## ⚡ How It Works

1. **User Action:** Right-clicks a document in SmartView $\rightarrow$ The **AI Summary** menu item is enabled.
2. **Server Execution (`AiSummaryAction.java`):**
   - Extracts the selected document's `r_object_id` and document name.
   - Reads the full content stream from Documentum filestore via DFC (`sysObject.getContent()`).
   - Sends an HTTP POST request to your internal AI Summary service.
   - Receives the JSON response (`{"summary": "..."}`).
3. **Client Presentation (`ai.summary.command.js` & `ai.summary.dialog.view.js`):**
   - SmartView pops up a modal dialog displaying the document name and formatted AI executive summary.
   - Users can read the summary or click **"Copy Summary"** to copy it directly to their clipboard.

---

## 🚀 Quick Start on Windows Server 2022 (AWS WorkSpaces)

If you are cloning this repository on a Windows Server 2022 Datacenter VM / AWS WorkSpace:

1. **One-Shot Automated Setup (Admin or Standard User):**
   Open Command Prompt or PowerShell in the cloned folder and run:
   ```cmd
   setup-windows.bat
   ```
   *(Or in PowerShell: `powershell -ExecutionPolicy Bypass -File .\setup-windows.ps1`)*

   **What it does automatically:**
   - Detects or installs OpenJDK 17 LTS, Node.js 20 LTS, Apache Maven 3.8.8, and Python 3 into `D:\dev-tools` (the persistent AWS WorkSpaces User Volume).
   - Sets persistent user environment variables (`JAVA_HOME`, `MAVEN_HOME`, `PATH`).
   - Updates `pom.xml` paths automatically for Windows.
   - Configures VS Code settings (`.vscode/settings.json`) so Java Language Server and Maven extensions work immediately.
   - Verifies the setup by running `mvn clean package` and outputting `dist/D2SV-AI-Summary-1.0.0.jar`.

2. **Opening in VS Code:**
   Open the folder in VS Code. Open a terminal inside VS Code, run `.\env.bat` (CMD) or `.\env.ps1` (PowerShell) to verify your tools, and run `mvn clean package` anytime.

---

## 🚀 How to Build and Deploy

### 1. Configure Your AI Service URL
Open:
`plugins/D2SV-AI-Summary/src/main/java/com/opentext/d2/smartview/d2svaisummary/actions/AiSummaryAction.java`

Update `AI_SERVICE_URL` with your internal AI summary endpoint:
```java
private static final String AI_SERVICE_URL = "http://your-ai-host:port/api/summarize";
```

### 2. Build the JAR
From the `ai_enhancement` root directory:
```bash
# Load environment
source env.sh

# Build with Maven (automatically runs Grunt to bundle UI)
mvn clean package
```

The output JAR will be generated at:
`dist/D2SV-AI-Summary-1.0.0.jar`

### 3. Deploy to Tomcat
1. Copy `dist/D2SV-AI-Summary-1.0.0.jar` into your Tomcat's `webapps/D2-Smartview/WEB-INF/lib/` folder.
2. Restart Tomcat.
3. In Chrome, open DevTools (`F12`), check **Disable Cache** under the **Network** tab, and hard-refresh (`Cmd+Shift+R`).
4. Select a document $\rightarrow$ right-click $\rightarrow$ click **AI Summary**!
