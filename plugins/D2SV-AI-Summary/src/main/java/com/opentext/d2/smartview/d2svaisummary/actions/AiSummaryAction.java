package com.opentext.d2.smartview.d2svaisummary.actions;

import com.documentum.fc.client.IDfSysObject;
import com.emc.d2fs.dctm.plugin.IPluginAction;
import com.emc.d2fs.dctm.web.services.D2fsContext;
import com.emc.d2fs.models.attribute.Attribute;
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

    // Default internal AI Service endpoint (Update this URL for your AI backend)
    private static final String AI_SERVICE_URL = "http://localhost:5000/api/summarize";

    // Called by D2ActionService via reflection for U4Generic dynamic actions
    public List<Attribute> execute(D2fsContext context) throws Exception {
        List<Attribute> returnAttributes = new ArrayList<>();

        // 1. Get the selected Documentum object
        IDfSysObject sysObject = (IDfSysObject) context.getFirstObject();
        if (sysObject == null) {
            LOGGER.error("AiSummaryAction: No document found in context.");
            return returnAttributes;
        }

        String objectName = sysObject.getObjectName();
        String objectId = sysObject.getObjectId().getId();
        LOGGER.info("AiSummaryAction: Processing document [{}] with ID [{}]", objectName, objectId);

        // 2. Extract full content stream from Documentum filestore
        String fullContentText = "";
        try (InputStream inputStream = sysObject.getContent()) {
            if (inputStream != null) {
                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                byte[] data = new byte[8192];
                int nRead;
                while ((nRead = inputStream.read(data, 0, data.length)) != -1) {
                    buffer.write(data, 0, nRead);
                }
                buffer.flush();
                fullContentText = buffer.toString(StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            LOGGER.warn("Could not read text stream directly, passing metadata: {}", e.getMessage());
        }

        // 3. Build JSON payload
        String escapedContent = fullContentText.replace("\\", "\\\\")
                                              .replace("\"", "\\\"")
                                              .replace("\n", "\\n")
                                              .replace("\r", "\\r");

        String jsonPayload = String.format(
            "{\"objectId\":\"%s\", \"objectName\":\"%s\", \"content\":\"%s\"}",
            objectId, objectName, escapedContent
        );

        // 4. Send HTTP POST to Internal AI service
        String summaryResult;
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(AI_SERVICE_URL))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(60))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                summaryResult = response.body();
            } else {
                summaryResult = "{\"summary\":\"AI Service error (HTTP " + response.statusCode() + "): " + response.body() + "\"}";
                LOGGER.error("AI service error: {}", summaryResult);
            }
        } catch (Exception ex) {
            LOGGER.error("Error communicating with AI Service", ex);
            // Fallback mock summary for offline / testing if endpoint is unreachable
            summaryResult = "{\"summary\":\"[AI Summary for " + objectName + "]\\n\\nThis document outlines key project objectives, operational standards, and implementation deliverables.\\n\\n• Document ID: " + objectId + "\\n• Content Length: " + fullContentText.length() + " characters\\n• Note: AI Service (" + AI_SERVICE_URL + ") was unreachable: " + ex.getMessage() + "\"}";
        }

        // 5. Return the summary to the SmartView frontend
        Attribute summaryAttr = new Attribute();
        summaryAttr.setName("summary");
        summaryAttr.setValue(summaryResult);
        returnAttributes.add(summaryAttr);

        return returnAttributes;
    }
}
