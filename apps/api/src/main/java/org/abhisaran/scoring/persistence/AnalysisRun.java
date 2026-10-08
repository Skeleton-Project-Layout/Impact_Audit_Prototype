package org.abhisaran.scoring.persistence;

import jakarta.persistence.*;
import org.abhisaran.audit.AuditSubmission;
import org.abhisaran.facilities.PilotLocation;
import org.abhisaran.users.User;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "analysis_runs")
public class AnalysisRun {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pilot_location_id", nullable = false)
    private PilotLocation pilotLocation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id")
    private AuditSubmission submission;

    @Column(name = "run_number", nullable = false)
    private int runNumber = 1;

    @Column(name = "acs_score", precision = 5, scale = 2)
    private BigDecimal acsScore;

    @Column(name = "alert_band", length = 32)
    private String alertBand;

    @Column(name = "is_provisional", nullable = false)
    private boolean isProvisional = false;

    @Column(name = "coverage_pct", precision = 5, scale = 2, nullable = false)
    private BigDecimal coveragePct = BigDecimal.ZERO;

    @Column(name = "total_applicable_questions", nullable = false)
    private int totalApplicableQuestions = 0;

    @Column(name = "total_assessed_questions", nullable = false)
    private int totalAssessedQuestions = 0;

    @Column(name = "total_max_weighted_points", precision = 10, scale = 4, nullable = false)
    private BigDecimal totalMaxWeightedPoints = BigDecimal.ZERO;

    @Column(name = "total_earned_weighted_points", precision = 10, scale = 4, nullable = false)
    private BigDecimal totalEarnedWeightedPoints = BigDecimal.ZERO;

    @Column(name = "total_deductions_weighted_points", precision = 10, scale = 4, nullable = false)
    private BigDecimal totalDeductionsWeightedPoints = BigDecimal.ZERO;

    @Column(name = "triggered_red_flags_count", nullable = false)
    private int triggeredRedFlagsCount = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "run_by")
    private User runBy;

    @Column(name = "analyzed_at", nullable = false, updatable = false)
    private Instant analyzedAt = Instant.now();

    @Column(nullable = false, length = 32)
    private String status = "COMPLETED";

    @OneToMany(mappedBy = "analysisRun", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AnalysisItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "analysisRun", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AnalysisLedgerEntry> ledgerEntries = new ArrayList<>();

    public AnalysisRun() {
    }

    public AnalysisRun(UUID id, PilotLocation pilotLocation, AuditSubmission submission, int runNumber,
                       BigDecimal acsScore, String alertBand, boolean isProvisional, BigDecimal coveragePct,
                       int totalApplicableQuestions, int totalAssessedQuestions, BigDecimal totalMaxWeightedPoints,
                       BigDecimal totalEarnedWeightedPoints, BigDecimal totalDeductionsWeightedPoints,
                       int triggeredRedFlagsCount, User runBy, String status) {
        this.id = id != null ? id : UUID.randomUUID();
        this.pilotLocation = pilotLocation;
        this.submission = submission;
        this.runNumber = runNumber;
        this.acsScore = acsScore;
        this.alertBand = alertBand;
        this.isProvisional = isProvisional;
        this.coveragePct = coveragePct;
        this.totalApplicableQuestions = totalApplicableQuestions;
        this.totalAssessedQuestions = totalAssessedQuestions;
        this.totalMaxWeightedPoints = totalMaxWeightedPoints;
        this.totalEarnedWeightedPoints = totalEarnedWeightedPoints;
        this.totalDeductionsWeightedPoints = totalDeductionsWeightedPoints;
        this.triggeredRedFlagsCount = triggeredRedFlagsCount;
        this.runBy = runBy;
        this.status = status != null ? status : "COMPLETED";
        this.analyzedAt = Instant.now();
    }

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID();
        if (analyzedAt == null) analyzedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public PilotLocation getPilotLocation() { return pilotLocation; }
    public void setPilotLocation(PilotLocation pilotLocation) { this.pilotLocation = pilotLocation; }

    public AuditSubmission getSubmission() { return submission; }
    public void setSubmission(AuditSubmission submission) { this.submission = submission; }

    public int getRunNumber() { return runNumber; }
    public void setRunNumber(int runNumber) { this.runNumber = runNumber; }

    public BigDecimal getAcsScore() { return acsScore; }
    public void setAcsScore(BigDecimal acsScore) { this.acsScore = acsScore; }

    public String getAlertBand() { return alertBand; }
    public void setAlertBand(String alertBand) { this.alertBand = alertBand; }

    public boolean isProvisional() { return isProvisional; }
    public void setProvisional(boolean provisional) { isProvisional = provisional; }

    public BigDecimal getCoveragePct() { return coveragePct; }
    public void setCoveragePct(BigDecimal coveragePct) { this.coveragePct = coveragePct; }

    public int getTotalApplicableQuestions() { return totalApplicableQuestions; }
    public void setTotalApplicableQuestions(int totalApplicableQuestions) { this.totalApplicableQuestions = totalApplicableQuestions; }

    public int getTotalAssessedQuestions() { return totalAssessedQuestions; }
    public void setTotalAssessedQuestions(int totalAssessedQuestions) { this.totalAssessedQuestions = totalAssessedQuestions; }

    public BigDecimal getTotalMaxWeightedPoints() { return totalMaxWeightedPoints; }
    public void setTotalMaxWeightedPoints(BigDecimal totalMaxWeightedPoints) { this.totalMaxWeightedPoints = totalMaxWeightedPoints; }

    public BigDecimal getTotalEarnedWeightedPoints() { return totalEarnedWeightedPoints; }
    public void setTotalEarnedWeightedPoints(BigDecimal totalEarnedWeightedPoints) { this.totalEarnedWeightedPoints = totalEarnedWeightedPoints; }

    public BigDecimal getTotalDeductionsWeightedPoints() { return totalDeductionsWeightedPoints; }
    public void setTotalDeductionsWeightedPoints(BigDecimal totalDeductionsWeightedPoints) { this.totalDeductionsWeightedPoints = totalDeductionsWeightedPoints; }

    public int getTriggeredRedFlagsCount() { return triggeredRedFlagsCount; }
    public void setTriggeredRedFlagsCount(int triggeredRedFlagsCount) { this.triggeredRedFlagsCount = triggeredRedFlagsCount; }

    public User getRunBy() { return runBy; }
    public void setRunBy(User runBy) { this.runBy = runBy; }

    public Instant getAnalyzedAt() { return analyzedAt; }
    public void setAnalyzedAt(Instant analyzedAt) { this.analyzedAt = analyzedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<AnalysisItem> getItems() { return items; }
    public void setItems(List<AnalysisItem> items) { this.items = items; }

    public List<AnalysisLedgerEntry> getLedgerEntries() { return ledgerEntries; }
    public void setLedgerEntries(List<AnalysisLedgerEntry> ledgerEntries) { this.ledgerEntries = ledgerEntries; }
}
