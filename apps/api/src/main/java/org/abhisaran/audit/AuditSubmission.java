package org.abhisaran.audit;

import jakarta.persistence.*;
import org.abhisaran.facilities.PilotLocation;
import org.abhisaran.users.User;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_submissions")
public class AuditSubmission {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pilot_location_id", nullable = false)
    private PilotLocation pilotLocation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by")
    private User submittedBy;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private Instant submittedAt = Instant.now();

    @Column(name = "page_ids", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String pageIds = "[]";

    @Column(name = "question_version_snapshot", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String questionVersionSnapshot = "{}";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reopened_by")
    private User reopenedBy;

    @Column(name = "reopened_at")
    private Instant reopenedAt;

    @Column(name = "reopen_reason")
    private String reopenReason;

    public AuditSubmission() {
    }

    public AuditSubmission(UUID id, PilotLocation pilotLocation, User submittedBy, String pageIds, String questionVersionSnapshot) {
        this.id = id != null ? id : UUID.randomUUID();
        this.pilotLocation = pilotLocation;
        this.submittedBy = submittedBy;
        this.pageIds = pageIds != null ? pageIds : "[]";
        this.questionVersionSnapshot = questionVersionSnapshot != null ? questionVersionSnapshot : "{}";
        this.submittedAt = Instant.now();
    }

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (submittedAt == null) {
            submittedAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public PilotLocation getPilotLocation() {
        return pilotLocation;
    }

    public void setPilotLocation(PilotLocation pilotLocation) {
        this.pilotLocation = pilotLocation;
    }

    public User getSubmittedBy() {
        return submittedBy;
    }

    public void setSubmittedBy(User submittedBy) {
        this.submittedBy = submittedBy;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }

    public String getPageIds() {
        return pageIds;
    }

    public void setPageIds(String pageIds) {
        this.pageIds = pageIds;
    }

    public String getQuestionVersionSnapshot() {
        return questionVersionSnapshot;
    }

    public void setQuestionVersionSnapshot(String questionVersionSnapshot) {
        this.questionVersionSnapshot = questionVersionSnapshot;
    }

    public User getReopenedBy() {
        return reopenedBy;
    }

    public void setReopenedBy(User reopenedBy) {
        this.reopenedBy = reopenedBy;
    }

    public Instant getReopenedAt() {
        return reopenedAt;
    }

    public void setReopenedAt(Instant reopenedAt) {
        this.reopenedAt = reopenedAt;
    }

    public String getReopenReason() {
        return reopenReason;
    }

    public void setReopenReason(String reopenReason) {
        this.reopenReason = reopenReason;
    }
}
