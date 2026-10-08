package org.abhisaran.questions.dto;

public class QuestionSummaryDTO {
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
    private boolean active;
    private int latestVersionNumber;
    private String status;
    private int totalVersions;
    private int displayOrder;

    public QuestionSummaryDTO() {
    }

    public QuestionSummaryDTO(
            String id,
            String domain,
            String section,
            String canonicalText,
            String responseType,
            String severity,
            boolean scored,
            String rubricType,
            boolean evidenceEnabled,
            String evidenceHint,
            boolean active,
            int latestVersionNumber,
            String status,
            int totalVersions,
            int displayOrder
    ) {
        this.id = id;
        this.domain = domain;
        this.section = section;
        this.canonicalText = canonicalText;
        this.responseType = responseType;
        this.severity = severity;
        this.scored = scored;
        this.rubricType = rubricType;
        this.evidenceEnabled = evidenceEnabled;
        this.evidenceHint = evidenceHint;
        this.active = active;
        this.latestVersionNumber = latestVersionNumber;
        this.status = status;
        this.totalVersions = totalVersions;
        this.displayOrder = displayOrder;
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

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public int getLatestVersionNumber() {
        return latestVersionNumber;
    }

    public void setLatestVersionNumber(int latestVersionNumber) {
        this.latestVersionNumber = latestVersionNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getTotalVersions() {
        return totalVersions;
    }

    public void setTotalVersions(int totalVersions) {
        this.totalVersions = totalVersions;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(int displayOrder) {
        this.displayOrder = displayOrder;
    }
}
