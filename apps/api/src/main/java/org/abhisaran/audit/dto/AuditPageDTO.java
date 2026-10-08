package org.abhisaran.audit.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class AuditPageDTO {
    private UUID id;
    private UUID pilotLocationId;
    private int pageNumber;
    private String status;
    private Map<String, AuditAnswerDTO> answers;
    private Map<String, List<EvidenceDTO>> evidence;
    private Instant createdAt;
    private Instant updatedAt;

    public AuditPageDTO() {
    }

    public AuditPageDTO(UUID id, UUID pilotLocationId, int pageNumber, String status,
                        Map<String, AuditAnswerDTO> answers, Map<String, List<EvidenceDTO>> evidence,
                        Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.pilotLocationId = pilotLocationId;
        this.pageNumber = pageNumber;
        this.status = status;
        this.answers = answers;
        this.evidence = evidence;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getPilotLocationId() {
        return pilotLocationId;
    }

    public void setPilotLocationId(UUID pilotLocationId) {
        this.pilotLocationId = pilotLocationId;
    }

    public int getPageNumber() {
        return pageNumber;
    }

    public void setPageNumber(int pageNumber) {
        this.pageNumber = pageNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Map<String, AuditAnswerDTO> getAnswers() {
        return answers;
    }

    public void setAnswers(Map<String, AuditAnswerDTO> answers) {
        this.answers = answers;
    }

    public Map<String, List<EvidenceDTO>> getEvidence() {
        return evidence;
    }

    public void setEvidence(Map<String, List<EvidenceDTO>> evidence) {
        this.evidence = evidence;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
