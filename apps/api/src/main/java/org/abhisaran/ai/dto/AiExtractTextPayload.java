package org.abhisaran.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AiExtractTextPayload {

    @JsonProperty("evidence_id")
    private String evidenceId;

    @JsonProperty("file_name")
    private String fileName;

    @JsonProperty("content_base64")
    private String contentBase64;

    public AiExtractTextPayload() {}

    public AiExtractTextPayload(String evidenceId, String fileName, String contentBase64) {
        this.evidenceId = evidenceId;
        this.fileName = fileName;
        this.contentBase64 = contentBase64;
    }

    public String getEvidenceId() { return evidenceId; }
    public void setEvidenceId(String evidenceId) { this.evidenceId = evidenceId; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getContentBase64() { return contentBase64; }
    public void setContentBase64(String contentBase64) { this.contentBase64 = contentBase64; }
}
