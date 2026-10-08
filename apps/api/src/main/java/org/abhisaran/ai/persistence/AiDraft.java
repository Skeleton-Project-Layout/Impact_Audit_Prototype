package org.abhisaran.ai.persistence;

import jakarta.persistence.*;
import org.abhisaran.users.User;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_drafts")
public class AiDraft {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "target_type", nullable = false, length = 32)
    private String targetType;

    @Column(name = "target_id", nullable = false)
    private UUID targetId;

    @Column(name = "service_id", nullable = false, length = 64)
    private String serviceId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "input_refs", nullable = false, columnDefinition = "jsonb")
    private String inputRefs;

    @Column(name = "output_text", nullable = false, columnDefinition = "text")
    private String outputText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "quality_metadata", columnDefinition = "jsonb")
    private String qualityMetadata;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "DRAFT";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accepted_by")
    private User acceptedBy;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public AiDraft() {}

    public AiDraft(UUID id, String targetType, UUID targetId, String serviceId,
                   String inputRefs, String outputText, String qualityMetadata,
                   String status, User acceptedBy, Instant acceptedAt) {
        this.id = id;
        this.targetType = targetType;
        this.targetId = targetId;
        this.serviceId = serviceId;
        this.inputRefs = inputRefs;
        this.outputText = outputText;
        this.qualityMetadata = qualityMetadata;
        this.status = status;
        this.acceptedBy = acceptedBy;
        this.acceptedAt = acceptedAt;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }

    public UUID getTargetId() { return targetId; }
    public void setTargetId(UUID targetId) { this.targetId = targetId; }

    public String getServiceId() { return serviceId; }
    public void setServiceId(String serviceId) { this.serviceId = serviceId; }

    public String getInputRefs() { return inputRefs; }
    public void setInputRefs(String inputRefs) { this.inputRefs = inputRefs; }

    public String getOutputText() { return outputText; }
    public void setOutputText(String outputText) { this.outputText = outputText; }

    public String getQualityMetadata() { return qualityMetadata; }
    public void setQualityMetadata(String qualityMetadata) { this.qualityMetadata = qualityMetadata; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public User getAcceptedBy() { return acceptedBy; }
    public void setAcceptedBy(User acceptedBy) { this.acceptedBy = acceptedBy; }

    public Instant getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(Instant acceptedAt) { this.acceptedAt = acceptedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
