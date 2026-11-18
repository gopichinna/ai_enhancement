package com.opentext.d2.smartview.d2svaisummary.actions;

import com.documentum.fc.client.IDfSysObject;
import com.emc.d2fs.dctm.plugin.IPluginAction;
import com.emc.d2fs.dctm.web.services.D2fsContext;
import com.emc.d2fs.models.attribute.Attribute;
import com.emc.d2fs.utils.AttributeUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

public class AiSummaryAction implements IPluginAction {

    private static final Logger LOGGER = LoggerFactory.getLogger(AiSummaryAction.class);

    // AI Service URL resolution (System property > Environment variable > localhost fallback)
    private static String getAiServiceUrl() {
        String url = System.getProperty("ai.service.url");
        if (url == null || url.trim().isEmpty()) {
            url = System.getenv("AI_SERVICE_URL");
        }
        if (url == null || url.trim().isEmpty()) {
            url = "http://localhost:5000/api/summarize";
        }
        return url.trim();
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            switch (ch) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (ch < ' ') {
                        String hex = "000" + Integer.toHexString(ch);
                        sb.append("\\u").append(hex.substring(hex.length() - 4));
                    } else {
                        sb.append(ch);
                    }
                    break;
            }
        }
        return sb.toString();
    }

    // Called by D2ActionService via reflection for U4Generic dynamic actions
    public List<Attribute> execute(D2fsContext context) throws Exception {
        List<Attribute> returnAttributes = new ArrayList<>();

        // 1. Get the selected Documentum object
        IDfSysObject sysObject = (IDfSysObject) context.getFirstObject();
        if (sysObject == null) {
            LOGGER.error("AiSummaryAction: No document found in context.");
            returnAttributes.add(AttributeUtils.createAttribute("summary", "{\"error\":\"No document found in context.\"}"));
            return returnAttributes;
        }

        String objectName = sysObject.getObjectName();
        String objectId = sysObject.getObjectId().getId();
        LOGGER.info("AiSummaryAction: Processing document [{}] with ID [{}]", objectName, objectId);

        // 2. Extract content stream from Documentum filestore
        String fullContentText = "";
        try (InputStream inputStream = sysObject.getContent()) {
            if (inputStream != null) {
                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                byte[] data = new byte[8192];
                int nRead;
                // Read up to 2MB to keep payload manageable for AI model
                int totalBytes = 0;
                while ((nRead = inputStream.read(data, 0, data.length)) != -1 && totalBytes < 2 * 1024 * 1024) {
                    buffer.write(data, 0, nRead);
                    totalBytes += nRead;
                }
                buffer.flush();
                fullContentText = buffer.toString(StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            LOGGER.warn("Could not read text stream directly, passing metadata: {}", e.getMessage());
        }

        // 3. Build JSON payload
        String jsonPayload = String.format(
            "{\"objectId\":\"%s\", \"objectName\":\"%s\", \"content\":\"%s\"}",
            escapeJson(objectId), escapeJson(objectName), escapeJson(fullContentText)
        );

        // 4. Send HTTP POST to AI service
        String aiServiceUrl = getAiServiceUrl();
        String summaryResult;
        LOGGER.info("AiSummaryAction: Calling AI service at [{}]...", aiServiceUrl);

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(aiServiceUrl))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(60))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                summaryResult = response.body();
                LOGGER.info("AiSummaryAction: Received AI response successfully.");
            } else {
                summaryResult = "{\"summary\":\"AI Service error (HTTP " + response.statusCode() + "): " + escapeJson(response.body()) + "\"}";
                LOGGER.error("AI service error: {}", summaryResult);
            }
        } catch (Exception ex) {
            LOGGER.error("Error communicating with AI Service at [{}]", aiServiceUrl, ex);
            // Informative message showing content extraction worked and how to configure AI endpoint
            summaryResult = "{\"summary\":\"[Document Extracted Successfully]\\n\\n" +
                    "• Document: " + escapeJson(objectName) + "\\n" +
                    "• Document ID: " + escapeJson(objectId) + "\\n" +
                    "• Content Extracted: " + fullContentText.length() + " characters\\n\\n" +
                    "Note: The AI Service endpoint (" + escapeJson(aiServiceUrl) + ") is currently unreachable (" + escapeJson(ex.getMessage()) + ").\\n\\n" +
                    "To point to your real AI model API, configure the endpoint using System Property -Dai.service.url=http://your-server:port/api/summarize or Environment Variable AI_SERVICE_URL in your Tomcat startup.\"}";
        }

        // 5. Return the summary attribute to SmartView with type DF_STRING (type=2)
        Attribute summaryAttr = AttributeUtils.createAttribute("summary", summaryResult);
        returnAttributes.add(summaryAttr);

        return returnAttributes;
    }
}
