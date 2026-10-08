package org.abhisaran.scoring.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class AnalysisRunDTO {

    private UUID id;
    private UUID pilotLocationId;
    private String facilityCode;
    private UUID submissionId;
    private int runNumber;
    private BigDecimal acsScore;
    private String alertBand;
    private boolean isProvisional;
    private BigDecimal coveragePct;
    private int totalApplicableQuestions;
    private int totalAssessedQuestions;
    private BigDecimal totalMaxWeightedPoints;
    private BigDecimal totalEarnedWeightedPoints;
    private BigDecimal totalDeductionsWeightedPoints;
    private int triggeredRedFlagsCount;
    private UUID runByUserId;
    private String runByUsername;
    private Instant analyzedAt;
    private String status;
    private BigDecimal ledgerSum;
    private boolean isLedgerBalanced;
    private List<AnalysisItemDTO> items = new ArrayList<>();
    private List<DeductionLedgerDTO> ledger = new ArrayList<>();
    private List<SectionScoreDTO> sections = new ArrayList<>();

    public AnalysisRunDTO() {
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getPilotLocationId() { return pilotLocationId; }
    public void setPilotLocationId(UUID pilotLocationId) { this.pilotLocationId = pilotLocationId; }

    public String getFacilityCode() { return facilityCode; }
    public void setFacilityCode(String facilityCode) { this.facilityCode = facilityCode; }

    public UUID getSubmissionId() { return submissionId; }
    public void setSubmissionId(UUID submissionId) { this.submissionId = submissionId; }

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

    public UUID getRunByUserId() { return runByUserId; }
    public void setRunByUserId(UUID runByUserId) { this.runByUserId = runByUserId; }

    public String getRunByUsername() { return runByUsername; }
    public void setRunByUsername(String runByUsername) { this.runByUsername = runByUsername; }

    public Instant getAnalyzedAt() { return analyzedAt; }
    public void setAnalyzedAt(Instant analyzedAt) { this.analyzedAt = analyzedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getLedgerSum() { return ledgerSum; }
    public void setLedgerSum(BigDecimal ledgerSum) { this.ledgerSum = ledgerSum; }

    public boolean isLedgerBalanced() { return isLedgerBalanced; }
    public void setLedgerBalanced(boolean ledgerBalanced) { isLedgerBalanced = ledgerBalanced; }

    public List<AnalysisItemDTO> getItems() { return items; }
    public void setItems(List<AnalysisItemDTO> items) { this.items = items; }

    public List<DeductionLedgerDTO> getLedger() { return ledger; }
    public void setLedger(List<DeductionLedgerDTO> ledger) { this.ledger = ledger; }

    public List<SectionScoreDTO> getSections() { return sections; }
    public void setSections(List<SectionScoreDTO> sections) { this.sections = sections; }
}
