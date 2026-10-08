package org.abhisaran.audit;

import jakarta.persistence.*;
import org.abhisaran.questions.QuestionBank;
import org.abhisaran.questions.QuestionVersion;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_answers", uniqueConstraints = {
        @UniqueConstraint(name = "uq_audit_answers_page_question", columnNames = {"audit_page_id", "question_id"})
})
public class AuditAnswer {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_page_id", nullable = false)
    private AuditPage auditPage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private QuestionBank question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_version_id", nullable = false)
    private QuestionVersion questionVersion;

    @Column(name = "answer_value", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String answerValue = "{}";

    @Column(name = "is_na", nullable = false)
    private boolean isNa = false;

    @Column(name = "na_reason")
    private String naReason;

    @Column(name = "is_not_assessed", nullable = false)
    private boolean isNotAssessed = false;

    @Column(name = "not_assessed_reason")
    private String notAssessedReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public AuditAnswer() {
    }

    public AuditAnswer(UUID id, AuditPage auditPage, QuestionBank question, QuestionVersion questionVersion,
                       String answerValue, boolean isNa, String naReason, boolean isNotAssessed, String notAssessedReason) {
        this.id = id != null ? id : UUID.randomUUID();
        this.auditPage = auditPage;
        this.question = question;
        this.questionVersion = questionVersion;
        this.answerValue = answerValue != null ? answerValue : "{}";
        this.isNa = isNa;
        this.naReason = naReason;
        this.isNotAssessed = isNotAssessed;
        this.notAssessedReason = notAssessedReason;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public AuditPage getAuditPage() {
        return auditPage;
    }

    public void setAuditPage(AuditPage auditPage) {
        this.auditPage = auditPage;
    }

    public QuestionBank getQuestion() {
        return question;
    }

    public void setQuestion(QuestionBank question) {
        this.question = question;
    }

    public QuestionVersion getQuestionVersion() {
        return questionVersion;
    }

    public void setQuestionVersion(QuestionVersion questionVersion) {
        this.questionVersion = questionVersion;
    }

    public String getAnswerValue() {
        return answerValue;
    }

    public void setAnswerValue(String answerValue) {
        this.answerValue = answerValue;
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
