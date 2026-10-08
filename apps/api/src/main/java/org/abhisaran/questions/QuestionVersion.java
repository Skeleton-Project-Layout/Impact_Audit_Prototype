package org.abhisaran.questions;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/**
 * Immutable snapshot of a question definition.
 * 
 * Strict Invariant (Section 8 & Section 16):
 * Every edit creates version N + 1. Previous versions are strictly immutable.
 * Existing audits and historical analysis runs bound to version N remain unchanged.
 */
@Entity
@Table(
        name = "question_versions",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_question_version", columnNames = {"question_id", "version_number"})
        }
)
public class QuestionVersion {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id = UUID.randomUUID();

    @Column(name = "question_id", length = 16, nullable = false)
    private String questionId;

    @Column(name = "version_number", nullable = false)
    private int versionNumber;

    @Column(name = "text", nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(name = "hint", columnDefinition = "TEXT")
    private String hint;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "fields_schema", nullable = false, columnDefinition = "jsonb")
    private String fieldsSchema;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "rubric_config", nullable = false, columnDefinition = "jsonb")
    private String rubricConfig;

    @Column(name = "severity", length = 16, nullable = false)
    private String severity; // 'CRITICAL', 'HIGH', 'MEDIUM'

    @Column(name = "scored", nullable = false)
    private boolean scored;

    @Column(name = "evidence_enabled", nullable = false)
    private boolean evidenceEnabled;

    @Column(name = "evidence_hint", columnDefinition = "TEXT")
    private String evidenceHint;

    @Column(name = "red_flag_logic", columnDefinition = "TEXT")
    private String redFlagLogic;

    @Column(name = "suggested_intervention", columnDefinition = "TEXT")
    private String suggestedIntervention;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "alert_overrides", columnDefinition = "jsonb")
    private String alertOverrides;

    @Column(name = "status", length = 32, nullable = false)
    private String status = "DEFAULT_PENDING_OWNER_REVIEW"; // 'ACTIVE', 'DEFAULT_PENDING_OWNER_REVIEW', 'ARCHIVED'

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public QuestionVersion() {
    }

    public QuestionVersion(
            UUID id,
            String questionId,
            int versionNumber,
            String text,
            String hint,
            String fieldsSchema,
            String rubricConfig,
            String severity,
            boolean scored,
            boolean evidenceEnabled,
            String evidenceHint,
            String redFlagLogic,
            String suggestedIntervention,
            String alertOverrides,
            String status,
            UUID createdBy
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.questionId = questionId;
        this.versionNumber = versionNumber;
        this.text = text;
        this.hint = hint;
        this.fieldsSchema = fieldsSchema;
        this.rubricConfig = rubricConfig;
        this.severity = severity;
        this.scored = scored;
        this.evidenceEnabled = evidenceEnabled;
        this.evidenceHint = evidenceHint;
        this.redFlagLogic = redFlagLogic;
        this.suggestedIntervention = suggestedIntervention;
        this.alertOverrides = alertOverrides;
        this.status = status != null ? status : "DEFAULT_PENDING_OWNER_REVIEW";
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
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

    public String getFieldsSchema() {
        return fieldsSchema;
    }

    public void setFieldsSchema(String fieldsSchema) {
        this.fieldsSchema = fieldsSchema;
    }

    public String getRubricConfig() {
        return rubricConfig;
    }

    public void setRubricConfig(String rubricConfig) {
        this.rubricConfig = rubricConfig;
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

    public String getAlertOverrides() {
        return alertOverrides;
    }

    public void setAlertOverrides(String alertOverrides) {
        this.alertOverrides = alertOverrides;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
