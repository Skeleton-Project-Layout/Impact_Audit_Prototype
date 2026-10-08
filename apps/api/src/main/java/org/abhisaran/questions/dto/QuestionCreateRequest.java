package org.abhisaran.questions.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;

public class QuestionCreateRequest {

    private String id; // Optional custom ID; if omitted, generated

    @NotBlank(message = "Domain is required")
    private String domain; // 'SCHOOL', 'ANGANWADI', 'HEALTH', 'ALL'

    @NotBlank(message = "Section is required")
    private String section;

    @NotBlank(message = "Canonical question text is required")
    private String text;

    private String hint;
    private String responseType = "Mixed";
    private String severity = "MEDIUM";
    private boolean scored = false;
    private String rubricType = "NONE";
    private Map<String, Object> rubricConfig;
    private List<Map<String, Object>> fieldsSchema;
    private boolean evidenceEnabled = false;
    private String evidenceHint;
    private String redFlagLogic;
    private String suggestedIntervention;
    private String notes;

    public QuestionCreateRequest() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDomain() {
        return domain;
    }

    public void setDomain(String domain) {
        this.domain = domain;
    }

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
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

    public String getResponseType() {
        return responseType;
    }

    public void setResponseType(String responseType) {
        this.responseType = responseType;
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

    public boolean isEvidenceEnabled() {
        return evidenceEnabled;
    }

    public void setEvidenceEnabled(boolean evidenceEnabled) {
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
