package org.abhisaran.questions.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public class QuestionDetailDTO {
    private String id;
    private String domain;
    private String section;
    private String canonicalText;
    private String responseType;
    private String severity;
    private boolean scored;
    private String rubricType;
    private boolean evidenceEnabled;
    private String evidenceHint;
    private String redFlagLogic;
    private String suggestedIntervention;
    private boolean active;
    private int displayOrder;

    // Latest version details
    private UUID versionId;
    private int versionNumber;
    private String text;
    private String hint;
    private List<Map<String, Object>> fieldsSchema;
    private Map<String, Object> rubricConfig;
    private Map<String, Object> alertOverrides;
    private String status;

    private List<QuestionVersionSummaryDTO> versionHistory;

    public QuestionDetailDTO() {
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

    public String getCanonicalText() {
        return canonicalText;
    }

    public void setCanonicalText(String canonicalText) {
        this.canonicalText = canonicalText;
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

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(int displayOrder) {
        this.displayOrder = displayOrder;
    }

    public UUID getVersionId() {
        return versionId;
    }

    public void setVersionId(UUID versionId) {
        this.versionId = versionId;
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

    public String getHint() {
        return hint;
    }

    public void setHint(String hint) {
        this.hint = hint;
    }

    public List<Map<String, Object>> getFieldsSchema() {
        return fieldsSchema;
    }

    public void setFieldsSchema(List<Map<String, Object>> fieldsSchema) {
        this.fieldsSchema = fieldsSchema;
    }

    public Map<String, Object> getRubricConfig() {
        return rubricConfig;
    }

    public void setRubricConfig(Map<String, Object> rubricConfig) {
        this.rubricConfig = rubricConfig;
    }

    public Map<String, Object> getAlertOverrides() {
        return alertOverrides;
    }

    public void setAlertOverrides(Map<String, Object> alertOverrides) {
        this.alertOverrides = alertOverrides;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<QuestionVersionSummaryDTO> getVersionHistory() {
        return versionHistory;
    }

    public void setVersionHistory(List<QuestionVersionSummaryDTO> versionHistory) {
        this.versionHistory = versionHistory;
    }
}
