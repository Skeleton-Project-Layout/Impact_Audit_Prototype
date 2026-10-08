package org.abhisaran.questions;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Question Bank master catalog entity.
 * Identifies the question by its canonical ID (e.g. 'C01', 'S02', 'A02', 'P01').
 */
@Entity
@Table(name = "question_bank")
public class QuestionBank {

    @Id
    @Column(name = "id", length = 16, nullable = false)
    private String id;

    @Column(name = "domain", length = 32, nullable = false)
    private String domain; // 'SCHOOL', 'ANGANWADI', 'HEALTH', 'ALL'

    @Column(name = "section", length = 32, nullable = false)
    private String section; // 'COMMUNITY_PROFILE', 'SCHOOL', 'ANGANWADI', 'HEALTH', etc.

    @Column(name = "canonical_text", nullable = false, columnDefinition = "TEXT")
    private String canonicalText;

    @Column(name = "response_type", length = 64, nullable = false)
    private String responseType;

    @Column(name = "severity", length = 16, nullable = false)
    private String severity; // 'CRITICAL', 'HIGH', 'MEDIUM'

    @Column(name = "scored_default", nullable = false)
    private boolean scoredDefault;

    @Column(name = "rubric_type_default", length = 64, nullable = false)
    private String rubricTypeDefault;

    @Column(name = "evidence_upload_default", nullable = false)
    private boolean evidenceUploadDefault;

    @Column(name = "evidence_hint", columnDefinition = "TEXT")
    private String evidenceHint;

    @Column(name = "red_flag_logic", columnDefinition = "TEXT")
    private String redFlagLogic;

    @Column(name = "suggested_intervention", columnDefinition = "TEXT")
    private String suggestedIntervention;

    @Column(name = "source_csv_id", length = 32)
    private String sourceCsvId;

    @Column(name = "source_zip_q", length = 32)
    private String sourceZipQ;

    @Column(name = "merge_action", length = 32)
    private String mergeAction;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public QuestionBank() {
    }

    public QuestionBank(
            String id,
            String domain,
            String section,
            String canonicalText,
            String responseType,
            String severity,
            boolean scoredDefault,
            String rubricTypeDefault,
            boolean evidenceUploadDefault,
            String evidenceHint,
            String redFlagLogic,
            String suggestedIntervention,
            String sourceCsvId,
            String sourceZipQ,
            String mergeAction,
            String notes,
            boolean active,
            int displayOrder
    ) {
        this.id = id;
        this.domain = domain;
        this.section = section;
        this.canonicalText = canonicalText;
        this.responseType = responseType;
        this.severity = severity;
        this.scoredDefault = scoredDefault;
        this.rubricTypeDefault = rubricTypeDefault;
        this.evidenceUploadDefault = evidenceUploadDefault;
        this.evidenceHint = evidenceHint;
        this.redFlagLogic = redFlagLogic;
        this.suggestedIntervention = suggestedIntervention;
        this.sourceCsvId = sourceCsvId;
        this.sourceZipQ = sourceZipQ;
        this.mergeAction = mergeAction;
        this.notes = notes;
        this.active = active;
        this.displayOrder = displayOrder;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
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

    public boolean isScoredDefault() {
        return scoredDefault;
    }

    public void setScoredDefault(boolean scoredDefault) {
        this.scoredDefault = scoredDefault;
    }

    public String getRubricTypeDefault() {
        return rubricTypeDefault;
    }

    public void setRubricTypeDefault(String rubricTypeDefault) {
        this.rubricTypeDefault = rubricTypeDefault;
    }

    public boolean isEvidenceUploadDefault() {
        return evidenceUploadDefault;
    }

    public void setEvidenceUploadDefault(boolean evidenceUploadDefault) {
        this.evidenceUploadDefault = evidenceUploadDefault;
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

    public String getSourceCsvId() {
        return sourceCsvId;
    }

    public void setSourceCsvId(String sourceCsvId) {
        this.sourceCsvId = sourceCsvId;
    }

    public String getSourceZipQ() {
        return sourceZipQ;
    }

    public void setSourceZipQ(String sourceZipQ) {
        this.sourceZipQ = sourceZipQ;
    }

    public String getMergeAction() {
        return mergeAction;
    }

    public void setMergeAction(String mergeAction) {
        this.mergeAction = mergeAction;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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
