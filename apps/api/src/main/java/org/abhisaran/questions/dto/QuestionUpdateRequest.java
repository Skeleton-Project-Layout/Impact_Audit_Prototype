package org.abhisaran.questions.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;

public class QuestionUpdateRequest {

    @NotBlank(message = "Question text is required")
    private String text;

    private String hint;
    private String severity;
    private Boolean scored;
    private String rubricType;
    private Map<String, Object> rubricConfig;
    private List<Map<String, Object>> fieldsSchema;
    private Boolean evidenceEnabled;
    private String evidenceHint;
    private String redFlagLogic;
    private String suggestedIntervention;
    private Map<String, Object> alertOverrides;
    private String changeReason;

    public QuestionUpdateRequest() {
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getHint() {
        return hint;
    }

    public void setHint(String hint) {
        this.hint = hint;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public Boolean getScored() {
        return scored;
    }

    public void setScored(Boolean scored) {
        this.scored = scored;
    }

    public String getRubricType() {
        return rubricType;
    }

    public void setRubricType(String rubricType) {
        this.rubricType = rubricType;
    }

    public Map<String, Object> getRubricConfig() {
        return rubricConfig;
    }

    public void setRubricConfig(Map<String, Object> rubricConfig) {
        this.rubricConfig = rubricConfig;
    }

    public List<Map<String, Object>> getFieldsSchema() {
        return fieldsSchema;
    }

    public void setFieldsSchema(List<Map<String, Object>> fieldsSchema) {
        this.fieldsSchema = fieldsSchema;
    }

    public Boolean getEvidenceEnabled() {
        return evidenceEnabled;
    }

    public void setEvidenceEnabled(Boolean evidenceEnabled) {
        this.evidenceEnabled = evidenceEnabled;
    }

    public String getEvidenceHint() {
        return evidenceHint;
    }

    public void setEvidenceHint(String evidenceHint) {
        this.evidenceHint = evidenceHint;
    }

    public String getRedFlagLogic() {
        return redFlagLogic;
    }

    public void setRedFlagLogic(String redFlagLogic) {
        this.redFlagLogic = redFlagLogic;
    }

    public String getSuggestedIntervention() {
        return suggestedIntervention;
    }

    public void setSuggestedIntervention(String suggestedIntervention) {
        this.suggestedIntervention = suggestedIntervention;
    }

    public Map<String, Object> getAlertOverrides() {
        return alertOverrides;
    }

    public void setAlertOverrides(Map<String, Object> alertOverrides) {
        this.alertOverrides = alertOverrides;
    }

    public String getChangeReason() {
        return changeReason;
    }

    public void setChangeReason(String changeReason) {
        this.changeReason = changeReason;
    }
}
