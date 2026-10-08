package org.abhisaran.audit.dto;

import java.util.Map;
import java.util.UUID;

public class AnswerSaveDTO {
    private String questionId;
    private UUID questionVersionId;
    private Map<String, Object> value;
    private boolean isNa;
    private String naReason;
    private boolean isNotAssessed;
    private String notAssessedReason;

    public AnswerSaveDTO() {
    }

    public AnswerSaveDTO(String questionId, UUID questionVersionId, Map<String, Object> value,
                         boolean isNa, String naReason, boolean isNotAssessed, String notAssessedReason) {
        this.questionId = questionId;
        this.questionVersionId = questionVersionId;
        this.value = value;
        this.isNa = isNa;
        this.naReason = naReason;
        this.isNotAssessed = isNotAssessed;
        this.notAssessedReason = notAssessedReason;
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
}
