# Architecture, Flow & Implementation Guide: `AI Summary` in D2 SmartView

Welcome to the **D2 SmartView AI Summary Enhancement** project (**OpenText D2 SmartView SDK 25.4.1 / Runtime 25.4.0**).

This document serves as the **master blueprint and runtime guide**. If you are opening this workspace in a new session or handing this off to another engineer, **everything you need to understand, customize, build, deploy, and troubleshoot** this project is detailed here.

> **SDK & Platform Baseline:**
> * **D2 SmartView SDK Version:** `25.4.1` ([`pom.xml`](pom.xml) `<d2.version>25.4.1</d2.version>`)
> * **SmartView Web Core:** `@dctm/dctm-web-core` `25.4.4` / `smartui-grunt-support` `7.1.1`
> * **Documentum Platform:** DFC `25.4.0`, D2FS `25.4.0`, Spring `6.1.13`, Jakarta EE
> * **Java & Build Tooling:** OpenJDK 17, Node v20 LTS, Apache Maven 3.8+

---

## 📚 Table of Contents
1. [Executive Overview & What This Project Does](#1-executive-overview--what-this-project-does)
2. [Core Architecture Primer](#2-core-architecture-primer)
3. [Complete File & Class Reference](#3-complete-file--class-reference)
4. [Deep-Dive: How Every Component Works](#4-deep-dive-how-every-component-works)
5. [Visual Architecture & End-to-End Sequence](#5-visual-architecture--end-to-end-sequence)
6. [Detailed Checklist: What Needs to Be Done Next](#6-detailed-checklist-what-needs-to-be-done-next)
7. [How to Configure the Internal AI Service Endpoint](#7-how-to-configure-the-internal-ai-service-endpoint)
8. [Local Testing with Mock AI Server](#8-local-testing-with-mock-ai-server)
9. [Build, Deployment & Verification](#9-build-deployment--verification)
10. [Troubleshooting & Framework Quirks](#10-troubleshooting--framework-quirks)

---

## 1. Executive Overview & What This Project Does

This project delivers an enterprise **AI Summary** feature inside OpenText Documentum D2 SmartView:

1. **Smart Context Menu Integration:** When a user selects **exactly one document** in any SmartView Doclist / Search / Folder view, a new menu item **`AI Summary`** is dynamically enabled.
2. **Server-Side Content Extraction:** When clicked, the backend D2FS Java service connects to Documentum filestore via DFC (`IDfSysObject`), extracts the document's **full content stream**, and reads its metadata (`r_object_id`, `object_name`).
3. **Internal AI POST Call:** The server sends an HTTP POST request carrying the document text and metadata to your internal AI Summary service (`/api/summarize`).
4. **Interactive Modal Presentation:** Upon receiving the AI response (`{"summary": "..."}`), SmartView launches a high-fidelity modal dialog (`DialogView` + Marionette + Handlebars) displaying the formatted executive summary with a 1-click **"Copy Summary"** button.

---

## 2. Core Architecture Primer

Documentum D2 SmartView is a **hybrid web application**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   BROWSER (FRONTEND)                                   │
│  • Frameworks : Backbone.js, Marionette.js, Handlebars (hbs!), RequireJS, jQuery       │
│  • Components : CommandModel (ai.summary.command.js) & DialogView (ai.summary.dialog)  │
│  • Build Tool : Grunt (smartuiCompile, minification, bundle packaging)                │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTP POST /d2-generic-action-service
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   TOMCAT (BACKEND JAVA)                                │
│  • Frameworks : Spring WebMVC, D2FS (D2 Foundation Services), Documentum DFC           │
│  • Components : AiSummaryAction (IPluginAction), Java 17 HttpClient                    │
│  • Build Tool : Apache Maven 3.8 (maven-antrun-plugin, maven-dependency-plugin)        │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTP POST (Internal Network / JSON)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               INTERNAL AI SUMMARY SERVICE                              │
│  • Endpoints  : REST API accepting JSON payload {objectId, objectName, content}        │
│  • Response   : JSON payload {summary: "..."}                                          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Why use Server-Side Content Extraction instead of Browser-Side?
1. **Network Performance:** Documents can be large (10MB–50MB+). Fetching them down to the user's browser just to re-upload them to an AI service is slow and consumes client bandwidth.
2. **CORS Avoidance:** Internal enterprise AI services typically do not expose permissive CORS headers to client browsers.
3. **Security:** API tokens, internal endpoints, and sensitive credentials remain secure inside the Tomcat server container.
4. **Native DFC Access:** D2FS runs directly inside Documentum's authenticated context with full session management (`context.getSession()`).

---

## 3. Complete File & Class Reference

All plugin code is isolated inside **`plugins/D2SV-AI-Summary`**:

| # | File Path | Type | Role & Responsibility |
|---|---|---|---|
| 1 | [`pom.xml`](plugins/D2SV-AI-Summary/pom.xml) | Maven POM | Declares DFC/D2FS dependencies and configures packaging into `dist/D2SV-AI-Summary-1.0.0.jar`. |
| 2 | [`src/main/resources/xml/unitymenu/MenuContextDelta.xml`](plugins/D2SV-AI-Summary/src/main/resources/xml/unitymenu/MenuContextDelta.xml) | XML Delta | Injects `<menuitem id="ai_summary">` into `MenuContext` and binds it to `U4Generic` dynamic action. |
| 3 | [`src/main/resources/strings/menu/MenuContext/MenuContext_en.properties`](plugins/D2SV-AI-Summary/src/main/resources/strings/menu/MenuContext/MenuContext_en.properties) | Properties | English label: `ai_summary = AI Summary`. |
| 4 | [`src/main/java/.../actions/AiSummaryAction.java`](plugins/D2SV-AI-Summary/src/main/java/com/opentext/d2/smartview/d2svaisummary/actions/AiSummaryAction.java) | Java | Extracts document stream via DFC, POSTs to AI endpoint, and returns summary attribute. |
| 5 | [`src/main/java/.../D2SVAiSummaryPlugin.java`](plugins/D2SV-AI-Summary/src/main/java/com/opentext/d2/smartview/d2svaisummary/D2SVAiSummaryPlugin.java) | Java | Implements `ID2fsPlugin` for runtime discovery by D2FS plugin manager. |
| 6 | [`src/main/java/.../api/D2SVAiSummaryVersion.java`](plugins/D2SV-AI-Summary/src/main/java/com/opentext/d2/smartview/d2svaisummary/api/D2SVAiSummaryVersion.java) | Java | Reads version and package info from `d2svaisummary-version.properties`. |
| 7 | [`src/main/java/com/emc/D2PluginVersion.java`](plugins/D2SV-AI-Summary/src/main/java/com/emc/D2PluginVersion.java) | Java | Root EMC plugin interface implementation for D2 runtime compatibility. |
| 8 | [`src/main/resources/smartview/SmartView.properties`](plugins/D2SV-AI-Summary/src/main/resources/smartview/SmartView.properties) | Properties | Binds Java plugin to UI namespace `d2svaisummary` and bundle `d2svaisummary-bundle`. |
| 9 | [`src/main/smartview/src/d2svaisummary-extensions.json`](plugins/D2SV-AI-Summary/src/main/smartview/src/d2svaisummary-extensions.json) | JSON | Registers command in SmartView's global command repository (`csui/utils/commands`). |
| 10 | [`src/main/smartview/src/bundles/d2svaisummary-bundle.js`](plugins/D2SV-AI-Summary/src/main/smartview/src/bundles/d2svaisummary-bundle.js) | JS Bundle | Defines which modules Grunt compiles and minifies into the release bundle. |
| 11 | [`src/main/smartview/src/commands/ai.summary.command.js`](plugins/D2SV-AI-Summary/src/main/smartview/src/commands/ai.summary.command.js) | JS Command | Checks document selection (`enabled`), receives summary payload, and launches `DialogView`. |
| 12 | [`src/main/smartview/src/dialogs/ai.summary.dialog.view.js`](plugins/D2SV-AI-Summary/src/main/smartview/src/dialogs/ai.summary.dialog.view.js) | Marionette View | Controller for modal dialog body, mapping template variables. |
| 13 | [`src/main/smartview/src/dialogs/impl/ai.summary.dialog.hbs`](plugins/D2SV-AI-Summary/src/main/smartview/src/dialogs/impl/ai.summary.dialog.hbs) | Handlebars | HTML structure of the summary modal (document header badge, scrollable summary box). |

---

## 4. Deep-Dive: How Every Component Works

### A. The Menu Definition (`MenuContextDelta.xml`)
```xml
<insert position-after="menuContextCopyLink">
  <menuitem id="ai_summary">
    <dynamic-action class="com.emc.d2fs.dctm.ui.dynamicactions.actions.U4Generic"
                    eService="com.opentext.d2.smartview.d2svaisummary.actions.AiSummaryAction"
                    eMethod="execute"
                    eMode="SINGLE"
                    rAction="d2svaisummary/commands/ai.summary.command:execute"
                    rType="JS"/>
  </menuitem>
</insert>
```
* `position-after="menuContextCopyLink"`: Puts the menu button right next to standard Copy Link.
* `eService`: Specifies the server-side Java class to run when clicked.
* `eMode="SINGLE"`: D2 automatically ensures this action only triggers for single-object selection.
* `rType="JS"` & `rAction="...:execute"`: Tells SmartView to load the JavaScript module and invoke its `execute` method after the backend Java call finishes.

---

### B. The Server-Side Handler (`AiSummaryAction.java`)
```java
public class AiSummaryAction implements IPluginAction {
    private static final String AI_SERVICE_URL = "http://localhost:5000/api/summarize";

    public List<Attribute> execute(D2fsContext context) throws Exception {
        // 1. Get Documentum object from context
        IDfSysObject sysObject = (IDfSysObject) context.getFirstObject();
        String objectName = sysObject.getObjectName();
        String objectId = sysObject.getObjectId().getId();

        // 2. Read content bytes from filestore
        InputStream inputStream = sysObject.getContent();
        // ... read stream into fullContentText ...

        // 3. Send HTTP POST to AI endpoint via Java 17 HttpClient
        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(AI_SERVICE_URL))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(60))
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        // 4. Return summary attribute to SmartView client
        Attribute summaryAttr = new Attribute();
        summaryAttr.setName("summary");
        summaryAttr.setValue(response.body());
        return List.of(summaryAttr);
    }
}
```
* **Notice:** `IPluginAction` is a marker interface. Do not put `@Override` on `execute(D2fsContext)` or Maven compilation will fail.
* If the AI service is offline, a graceful mock summary fallback is returned so the UI doesn't crash during development.

---

### C. The Frontend Command (`ai.summary.command.js`)
```javascript
enabled: function (status) {
  var nodes = CommandHelper.getAtLeastOneNode(status);
  if (!nodes || nodes.length !== 1) { return false; }
  var node = nodes.at ? nodes.at(0) : (nodes.models ? nodes.models[0] : nodes[0]);
  return node && typeof node.get === 'function' && node.get('type') === Constants.Types.DOCUMENT;
}
```
* `enabled(status)`: SmartView continuously evaluates this. The button only enables if `type === Constants.Types.DOCUMENT` (Documentum `dm_document`, type 144) and selection length is exactly 1.
* In `execute(status)`: Receives `status.data.summary` returned by the server, parses the JSON payload, and renders the modal dialog.

---

### D. The Modal Presentation (`ai.summary.dialog.view.js` & `DialogView`)
```javascript
var dialog = new DialogView({
  title: 'AI Summary',
  largeSize: true,
  view: bodyView,
  buttons: [
    {
      id: 'copyBtn',
      label: 'Copy Summary',
      variant: 'primary',
      click: function (_args) {
        navigator.clipboard.writeText(displayText);
        GlobalMessage.showMessage('success', 'Summary copied to clipboard!');
      }
    },
    { id: 'closeBtn', label: 'Close', close: true }
  ]
});
dialog.show();
```
* Utilizes `smart/controls/dialog/dialog.view` (OpenText SmartUI standard modal wrapper).
* Supports clipboard copy with fallback `<textarea>` mechanism if running over plain HTTP.

---

## 5. Visual Architecture & End-to-End Sequence

```
User selects Document in SmartView
                 │
                 ▼
Right-click ──► Click "AI Summary"
                 │
                 ▼
SmartView reads MenuContextDelta.xml
Sends HTTP POST /d2-generic-action-service
                 │
                 ▼
Tomcat D2ActionService instantiates:
com.opentext.d2.smartview.d2svaisummary.actions.AiSummaryAction
                 │
                 ▼
1. context.getFirstObject() ──► IDfSysObject
2. sysObject.getContent()   ──► Full text/content stream extracted
3. Java 17 HttpClient       ──► POST to AI_SERVICE_URL with JSON
                 │
                 ▼
Internal AI Service generates summary ──► Returns JSON: {"summary": "..."}
                 │
                 ▼
AiSummaryAction returns Attribute("summary", jsonResponse)
Tomcat responds HTTP 200 OK
                 │
                 ▼
SmartView call.service.js receives 200 OK
Invokes: d2svaisummary/commands/ai.summary.command:execute
                 │
                 ▼
Command parses status.data.summary
Instantiates: AiSummaryDialogView
Calls: DialogView.show()
                 │
                 ▼
POPUP MODAL APPEARS ON SCREEN!
• Title: AI Summary
• Badge: Document Name
• Body: Formatted AI Executive Summary
• Actions: [Copy Summary]  [Close]
```

---

## 6. Detailed Checklist: What Needs to Be Done Next

When you start work in this workspace, follow this exact checklist:

- [ ] **Step 1: Check Environment**
  Open a terminal in the project root directory and run:
  ```bash
  source env.sh
  ```
  Verify that JDK 17, Node v20, and Maven 3.8 are detected.

- [ ] **Step 2: Align AI Service Contract**
  Determine your internal AI service specifications:
  - What is the URL? (e.g., `http://ai-service.corp.local:8000/v1/summary`)
  - What JSON format does it expect? (e.g., `{"text": "...", "max_tokens": 500}`)
  - Does it require an Authorization header? (e.g., `Bearer <token>`)

- [ ] **Step 3: Update `AiSummaryAction.java`**
  Open [`AiSummaryAction.java`](plugins/D2SV-AI-Summary/src/main/java/com/opentext/d2/smartview/d2svaisummary/actions/AiSummaryAction.java) and set:
  1. `AI_SERVICE_URL`
  2. The JSON payload structure in `jsonPayload`
  3. Any required HTTP headers (e.g. `.header("Authorization", "Bearer ...")`)

- [ ] **Step 4: Build the Plugin JAR**
  ```bash
  mvn clean package
  ```
  Ensure it ends with `BUILD SUCCESS`. The output JAR is at `dist/D2SV-AI-Summary-1.0.0.jar`.

- [ ] **Step 5: Deploy to Tomcat**
  ```bash
  cp dist/D2SV-AI-Summary-1.0.0.jar <TOMCAT_HOME>/webapps/D2-Smartview/WEB-INF/lib/
  ```
  Restart Tomcat.

- [ ] **Step 6: Test in Chrome**
  - Open Chrome DevTools (`F12`), check **Disable Cache** under the **Network** tab.
  - Hard reload (`Cmd+Shift+R`).
  - Right-click any document and verify **AI Summary** appears and functions.

---

## 7. How to Configure the Internal AI Service Endpoint

In [`AiSummaryAction.java`](plugins/D2SV-AI-Summary/src/main/java/com/opentext/d2/smartview/d2svaisummary/actions/AiSummaryAction.java#L23-L25):

```java
// Line 23: Change this to your actual internal endpoint
private static final String AI_SERVICE_URL = "http://your-ai-host:port/api/summarize";
```

### If your AI service requires an API Key / Bearer Token:
Add `.header("Authorization", "Bearer YOUR_SECRET_TOKEN")` to the request builder:

```java
HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(AI_SERVICE_URL))
        .header("Content-Type", "application/json")
        .header("Authorization", "Bearer " + System.getenv().getOrDefault("AI_API_KEY", "default-key"))
        .timeout(Duration.ofSeconds(60))
        .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
        .build();
```

---

## 8. Local Testing with Mock AI Server

To test the entire end-to-end flow locally on your machine without needing the real AI service online, we created a lightweight Python mock server script: [`mock_ai_server.py`](mock_ai_server.py).

### How to run the mock server:
```bash
python3 mock_ai_server.py
```
* It starts on `http://localhost:5000/api/summarize`.
* It receives the document payload, prints the document name and content length in your terminal, and returns a realistic AI executive summary JSON response.
* This allows you to verify the entire pipeline (Tomcat $\rightarrow$ AI $\rightarrow$ SmartView Modal) locally!

---

## 9. Build, Deployment & Verification

### Build Command:
```bash
source env.sh
mvn clean package
```

### What Maven Does Under the Hood:
1. `init-npm`: Runs `npm run setup` in `src/main/smartview`, ensuring symlinks to `lib` and `node_modules`.
2. `npm-run-build`: Runs `grunt compile`, which executes ESLint, compiles Handlebars templates, bundles RequireJS modules, and outputs to `out-release/`.
3. `maven-compiler-plugin`: Compiles Java classes against DFC & D2FS APIs.
4. `maven-jar-plugin`: Combines Java bytecode, XML deltas, properties, and compiled SmartView bundles into `dist/D2SV-AI-Summary-1.0.0.jar`.

---

## 10. Troubleshooting & Common Pitfalls

| Issue | Root Cause | Solution |
|---|---|---|
| **Eslint Error on Build:**<br>`'args' is defined but never used` | SmartUI eslint rules disallow unused function arguments. | Prefix any unused argument with an underscore (e.g., `_args`). |
| **Java Compilation Error:**<br>`method does not override or implement a method from a supertype` | `IPluginAction` is a marker interface (it has no methods). | Do not put `@Override` on `execute(D2fsContext)`. |
| **500 Error in SmartView:**<br>`ClassNotFoundException` | Tomcat cannot find the `eService` class named in `MenuContextDelta.xml`. | Ensure the package name in `eService` matches the Java package (`com.opentext.d2.smartview.d2svaisummary.actions.AiSummaryAction`). |
| **Red Toast Error in UI:**<br>`Cannot read properties of undefined (reading 'apply')` | `rAction` in XML omitted the method name. | Ensure `rAction` ends with `:execute` (`d2svaisummary/commands/ai.summary.command:execute`). |
| **Changes Don't Show in Browser** | Chrome aggressively caches RequireJS bundles. | Open DevTools (`F12`), check **Disable Cache** under Network tab, and press `Cmd+Shift+R`. |
| **AI Request Times Out** | LLM inference on large documents exceeds HTTP client timeout. | In `AiSummaryAction.java`, adjust `.timeout(Duration.ofSeconds(120))` as needed. |
| **CSS/Style Linting Warnings** | D2SV 25.4 replaced legacy `.csslintrc` with Stylelint. | Configuration is defined in `plugins/D2SV-AI-Summary/src/main/smartview/.stylelintrc.yml`. |

---

*End of Guide. You are ready to develop and deploy!*
