package org.abhisaran.audit.dto;

import java.time.Instant;
import java.util.UUID;

public class EvidenceDTO {
    private UUID id;
    private String questionId;
    private String fileName;
    private long fileSizeBytes;
    private String mimeType;
    private Instant createdAt;
    private String downloadUrl;

    public EvidenceDTO() {
    }

    public EvidenceDTO(UUID id, String questionId, String fileName, long fileSizeBytes,
                       String mimeType, Instant createdAt, String downloadUrl) {
        this.id = id;
        this.questionId = questionId;
        this.fileName = fileName;
        this.fileSizeBytes = fileSizeBytes;
        this.mimeType = mimeType;
        this.createdAt = createdAt;
        this.downloadUrl = downloadUrl;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getQuestionId() {
        return questionId;
    }

    public void setQuestionId(String questionId) {
        this.questionId = questionId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public void setFileSizeBytes(long fileSizeBytes) {
        this.fileSizeBytes = fileSizeBytes;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getDownloadUrl() {
        return downloadUrl;
    }

    public void setDownloadUrl(String downloadUrl) {
        this.downloadUrl = downloadUrl;
    }
}
