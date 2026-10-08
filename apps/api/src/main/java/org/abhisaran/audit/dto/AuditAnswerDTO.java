package org.abhisaran.audit.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public class AuditAnswerDTO {
    private UUID id;
    private String questionId;
    private UUID questionVersionId;
    private int questionVersionNumber;
    private Map<String, Object> value;
    private boolean isNa;
    private String naReason;
    private boolean isNotAssessed;
    private String notAssessedReason;
    private Instant updatedAt;

    public AuditAnswerDTO() {
    }

    public AuditAnswerDTO(UUID id, String questionId, UUID questionVersionId, int questionVersionNumber,
                          Map<String, Object> value, boolean isNa, String naReason,
                          boolean isNotAssessed, String notAssessedReason, Instant updatedAt) {
        this.id = id;
        this.questionId = questionId;
        this.questionVersionId = questionVersionId;
        this.questionVersionNumber = questionVersionNumber;
        this.value = value;
        this.isNa = isNa;
        this.naReason = naReason;
        this.isNotAssessed = isNotAssessed;
        this.notAssessedReason = notAssessedReason;
        this.updatedAt = updatedAt;
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

    public UUID getQuestionVersionId() {
        return questionVersionId;
    }

    public void setQuestionVersionId(UUID questionVersionId) {
        this.questionVersionId = questionVersionId;
    }

    public int getQuestionVersionNumber() {
        return questionVersionNumber;
    }

    public void setQuestionVersionNumber(int questionVersionNumber) {
        this.questionVersionNumber = questionVersionNumber;
    }

    public Map<String, Object> getValue() {
        return value;
    }

    public void setValue(Map<String, Object> value) {
        this.value = value;
    }

    public boolean isNa() {
        return isNa;
    }

    public void setNa(boolean na) {
        isNa = na;
    }

    public String getNaReason() {
        return naReason;
    }

    public void setNaReason(String naReason) {
        this.naReason = naReason;
    }

    public boolean isNotAssessed() {
        return isNotAssessed;
    }

    public void setNotAssessed(boolean notAssessed) {
        isNotAssessed = notAssessed;
    }

    public String getNotAssessedReason() {
        return notAssessedReason;
    }

    public void setNotAssessedReason(String notAssessedReason) {
        this.notAssessedReason = notAssessedReason;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
