package org.abhisaran.questions.dto;

import java.time.Instant;
import java.util.UUID;

public class QuestionVersionSummaryDTO {
    private UUID id;
    private int versionNumber;
    private String text;
    private String severity;
    private boolean scored;
    private String status;
    private UUID createdBy;
    private Instant createdAt;

    public QuestionVersionSummaryDTO() {
    }

    public QuestionVersionSummaryDTO(UUID id, int versionNumber, String text, String severity, boolean scored, String status, UUID createdBy, Instant createdAt) {
        this.id = id;
        this.versionNumber = versionNumber;
        this.text = text;
        this.severity = severity;
        this.scored = scored;
        this.status = status;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public int getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(int versionNumber) {
        this.versionNumber = versionNumber;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public boolean isScored() {
        return scored;
    }

    public void setScored(boolean scored) {
        this.scored = scored;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
