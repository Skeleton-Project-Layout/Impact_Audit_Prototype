package org.abhisaran.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AiExtractTextResponse {

    @JsonProperty("evidence_id")
    private String evidenceId;

    @JsonProperty("extracted_text")
    private String extractedText;

    @JsonProperty("confidence")
    private double confidence;

    @JsonProperty("blocks_count")
    private int blocksCount;

    public AiExtractTextResponse() {}

    public String getEvidenceId() { return evidenceId; }
    public void setEvidenceId(String evidenceId) { this.evidenceId = evidenceId; }

    public String getExtractedText() { return extractedText; }
    public void setExtractedText(String extractedText) { this.extractedText = extractedText; }

    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }

    public int getBlocksCount() { return blocksCount; }
    public void setBlocksCount(int blocksCount) { this.blocksCount = blocksCount; }
}
