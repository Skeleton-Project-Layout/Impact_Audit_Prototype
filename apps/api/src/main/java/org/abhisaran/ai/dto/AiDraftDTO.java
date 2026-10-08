package org.abhisaran.ai.dto;

import java.time.Instant;
import java.util.UUID;

public class AiDraftDTO {
    private UUID id;
    private String targetType;
    private UUID targetId;
    private String serviceId;
    private String outputText;
    private String qualityMetadata;
    private String status;
    private UUID acceptedById;
    private String acceptedByUsername;
    private Instant acceptedAt;
    private Instant createdAt;

    public AiDraftDTO() {}

    public AiDraftDTO(UUID id, String targetType, UUID targetId, String serviceId,
                      String outputText, String qualityMetadata, String status,
                      UUID acceptedById, String acceptedByUsername, Instant acceptedAt, Instant createdAt) {
        this.id = id;
        this.targetType = targetType;
        this.targetId = targetId;
        this.serviceId = serviceId;
        this.outputText = outputText;
        this.qualityMetadata = qualityMetadata;
        this.status = status;
        this.acceptedById = acceptedById;
        this.acceptedByUsername = acceptedByUsername;
        this.acceptedAt = acceptedAt;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }

    public UUID getTargetId() { return targetId; }
    public void setTargetId(UUID targetId) { this.targetId = targetId; }

    public String getServiceId() { return serviceId; }
    public void setServiceId(String serviceId) { this.serviceId = serviceId; }

    public String getOutputText() { return outputText; }
    public void setOutputText(String outputText) { this.outputText = outputText; }

    public String getQualityMetadata() { return qualityMetadata; }
    public void setQualityMetadata(String qualityMetadata) { this.qualityMetadata = qualityMetadata; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UUID getAcceptedById() { return acceptedById; }
    public void setAcceptedById(UUID acceptedById) { this.acceptedById = acceptedById; }

    public String getAcceptedByUsername() { return acceptedByUsername; }
    public void setAcceptedByUsername(String acceptedByUsername) { this.acceptedByUsername = acceptedByUsername; }

    public Instant getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(Instant acceptedAt) { this.acceptedAt = acceptedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
