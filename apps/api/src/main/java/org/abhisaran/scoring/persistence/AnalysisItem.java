package org.abhisaran.scoring.persistence;

import jakarta.persistence.*;
import org.abhisaran.audit.AuditPage;
import org.abhisaran.questions.QuestionBank;
import org.abhisaran.questions.QuestionVersion;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "analysis_items")
public class AnalysisItem {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_run_id", nullable = false)
    private AnalysisRun analysisRun;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_page_id")
    private AuditPage auditPage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private QuestionBank question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_version_id")
    private QuestionVersion questionVersion;

    @Column(name = "page_number", nullable = false)
    private int pageNumber = 1;

    @Column(nullable = false, length = 16)
    private String severity;

    @Column(precision = 4, scale = 2, nullable = false)
    private BigDecimal weight;

    @Column(name = "raw_earned_points", precision = 6, scale = 3)
    private BigDecimal rawEarnedPoints;

    @Column(name = "raw_max_points", precision = 6, scale = 3)
    private BigDecimal rawMaxPoints;

    @Column(name = "weighted_earned_points", precision = 8, scale = 4)
    private BigDecimal weightedEarnedPoints;

    @Column(name = "weighted_max_points", precision = 8, scale = 4)
    private BigDecimal weightedMaxPoints;

    @Column(name = "is_na", nullable = false)
    private boolean isNa = false;

    @Column(name = "is_not_assessed", nullable = false)
    private boolean isNotAssessed = false;

    @Column(name = "is_red_flag", nullable = false)
    private boolean isRedFlag = false;

    @Column(name = "alert_band", length = 32)
    private String alertBand;

    @Column(name = "clamped_red", nullable = false)
    private boolean clampedRed = false;

    @Column(name = "working_notes", columnDefinition = "text")
    private String workingNotes;

    public AnalysisItem() {
    }

    public AnalysisItem(UUID id, AnalysisRun analysisRun, AuditPage auditPage, QuestionBank question,
                        QuestionVersion questionVersion, int pageNumber, String severity, BigDecimal weight,
                        BigDecimal rawEarnedPoints, BigDecimal rawMaxPoints, BigDecimal weightedEarnedPoints,
                        BigDecimal weightedMaxPoints, boolean isNa, boolean isNotAssessed, boolean isRedFlag,
                        String alertBand, boolean clampedRed, String workingNotes) {
        this.id = id != null ? id : UUID.randomUUID();
        this.analysisRun = analysisRun;
        this.auditPage = auditPage;
        this.question = question;
        this.questionVersion = questionVersion;
        this.pageNumber = pageNumber;
        this.severity = severity;
        this.weight = weight;
        this.rawEarnedPoints = rawEarnedPoints;
        this.rawMaxPoints = rawMaxPoints;
        this.weightedEarnedPoints = weightedEarnedPoints;
        this.weightedMaxPoints = weightedMaxPoints;
        this.isNa = isNa;
        this.isNotAssessed = isNotAssessed;
        this.isRedFlag = isRedFlag;
        this.alertBand = alertBand;
        this.clampedRed = clampedRed;
        this.workingNotes = workingNotes;
    }

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public AnalysisRun getAnalysisRun() { return analysisRun; }
    public void setAnalysisRun(AnalysisRun analysisRun) { this.analysisRun = analysisRun; }

    public AuditPage getAuditPage() { return auditPage; }
    public void setAuditPage(AuditPage auditPage) { this.auditPage = auditPage; }

    public QuestionBank getQuestion() { return question; }
    public void setQuestion(QuestionBank question) { this.question = question; }

    public QuestionVersion getQuestionVersion() { return questionVersion; }
    public void setQuestionVersion(QuestionVersion questionVersion) { this.questionVersion = questionVersion; }

    public int getPageNumber() { return pageNumber; }
    public void setPageNumber(int pageNumber) { this.pageNumber = pageNumber; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public BigDecimal getWeight() { return weight; }
    public void setWeight(BigDecimal weight) { this.weight = weight; }

    public BigDecimal getRawEarnedPoints() { return rawEarnedPoints; }
    public void setRawEarnedPoints(BigDecimal rawEarnedPoints) { this.rawEarnedPoints = rawEarnedPoints; }

    public BigDecimal getRawMaxPoints() { return rawMaxPoints; }
    public void setRawMaxPoints(BigDecimal rawMaxPoints) { this.rawMaxPoints = rawMaxPoints; }

    public BigDecimal getWeightedEarnedPoints() { return weightedEarnedPoints; }
    public void setWeightedEarnedPoints(BigDecimal weightedEarnedPoints) { this.weightedEarnedPoints = weightedEarnedPoints; }

    public BigDecimal getWeightedMaxPoints() { return weightedMaxPoints; }
    public void setWeightedMaxPoints(BigDecimal weightedMaxPoints) { this.weightedMaxPoints = weightedMaxPoints; }

    public boolean isNa() { return isNa; }
    public void setNa(boolean na) { isNa = na; }

    public boolean isNotAssessed() { return isNotAssessed; }
    public void setNotAssessed(boolean notAssessed) { isNotAssessed = notAssessed; }

    public boolean isRedFlag() { return isRedFlag; }
    public void setRedFlag(boolean redFlag) { isRedFlag = redFlag; }

    public String getAlertBand() { return alertBand; }
    public void setAlertBand(String alertBand) { this.alertBand = alertBand; }

    public boolean isClampedRed() { return clampedRed; }
    public void setClampedRed(boolean clampedRed) { this.clampedRed = clampedRed; }

    public String getWorkingNotes() { return workingNotes; }
    public void setWorkingNotes(String workingNotes) { this.workingNotes = workingNotes; }
}
