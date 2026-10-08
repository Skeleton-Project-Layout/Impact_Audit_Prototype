package org.abhisaran.scoring.model;

import org.abhisaran.scoring.AlertBandType;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Pure, deterministic evaluation result for an entire location audit across all pages.
 * Includes strictly balanced deduction ledger and section breakdowns.
 */
public class LocationScoreResult {

    private String locationId;
    private String submissionId;
    private Double acsScore; // null if zero denominator / not calculable
    private AlertBandType alertBand; // null if not calculable
    private boolean isProvisional; // true if coverage < 70%
    private double coveragePct;
    private int totalApplicableQuestions;
    private int totalAssessedQuestions;
    private double totalMaxWeightedPoints;
    private double totalEarnedWeightedPoints;
    private double totalDeductionsWeightedPoints;
    private int triggeredRedFlagsCount;
    private List<EvaluatedQuestionItem> evaluatedItems = new ArrayList<>();
    private List<DeductionLedgerItem> deductionLedger = new ArrayList<>();
    private Map<String, SectionScoreSummary> sectionScores = new LinkedHashMap<>();
    private double ledgerSum;
    private double ledgerBalanceDiff;
    private boolean isLedgerBalanced;

    public LocationScoreResult() {
    }

    public LocationScoreResult(
            String locationId,
            String submissionId,
            Double acsScore,
            AlertBandType alertBand,
            boolean isProvisional,
            double coveragePct,
            int totalApplicableQuestions,
            int totalAssessedQuestions,
            double totalMaxWeightedPoints,
            double totalEarnedWeightedPoints,
            double totalDeductionsWeightedPoints,
            int triggeredRedFlagsCount,
            List<EvaluatedQuestionItem> evaluatedItems,
            List<DeductionLedgerItem> deductionLedger,
            Map<String, SectionScoreSummary> sectionScores,
            double ledgerSum,
            double ledgerBalanceDiff,
            boolean isLedgerBalanced
    ) {
        this.locationId = locationId;
        this.submissionId = submissionId;
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
        this.evaluatedItems = evaluatedItems != null ? evaluatedItems : new ArrayList<>();
        this.deductionLedger = deductionLedger != null ? deductionLedger : new ArrayList<>();
        this.sectionScores = sectionScores != null ? sectionScores : new LinkedHashMap<>();
        this.ledgerSum = ledgerSum;
        this.ledgerBalanceDiff = ledgerBalanceDiff;
        this.isLedgerBalanced = isLedgerBalanced;
    }

    public String getLocationId() { return locationId; }
    public void setLocationId(String locationId) { this.locationId = locationId; }

    public String getSubmissionId() { return submissionId; }
    public void setSubmissionId(String submissionId) { this.submissionId = submissionId; }

    public Double getAcsScore() { return acsScore; }
    public void setAcsScore(Double acsScore) { this.acsScore = acsScore; }

    public AlertBandType getAlertBand() { return alertBand; }
    public void setAlertBand(AlertBandType alertBand) { this.alertBand = alertBand; }

    public boolean isProvisional() { return isProvisional; }
    public void setProvisional(boolean provisional) { isProvisional = provisional; }

    public double getCoveragePct() { return coveragePct; }
    public void setCoveragePct(double coveragePct) { this.coveragePct = coveragePct; }

    public int getTotalApplicableQuestions() { return totalApplicableQuestions; }
    public void setTotalApplicableQuestions(int totalApplicableQuestions) { this.totalApplicableQuestions = totalApplicableQuestions; }

    public int getTotalAssessedQuestions() { return totalAssessedQuestions; }
    public void setTotalAssessedQuestions(int totalAssessedQuestions) { this.totalAssessedQuestions = totalAssessedQuestions; }

    public double getTotalMaxWeightedPoints() { return totalMaxWeightedPoints; }
    public void setTotalMaxWeightedPoints(double totalMaxWeightedPoints) { this.totalMaxWeightedPoints = totalMaxWeightedPoints; }

    public double getTotalEarnedWeightedPoints() { return totalEarnedWeightedPoints; }
    public void setTotalEarnedWeightedPoints(double totalEarnedWeightedPoints) { this.totalEarnedWeightedPoints = totalEarnedWeightedPoints; }

    public double getTotalDeductionsWeightedPoints() { return totalDeductionsWeightedPoints; }
    public void setTotalDeductionsWeightedPoints(double totalDeductionsWeightedPoints) { this.totalDeductionsWeightedPoints = totalDeductionsWeightedPoints; }

    public int getTriggeredRedFlagsCount() { return triggeredRedFlagsCount; }
    public void setTriggeredRedFlagsCount(int triggeredRedFlagsCount) { this.triggeredRedFlagsCount = triggeredRedFlagsCount; }

    public List<EvaluatedQuestionItem> getEvaluatedItems() { return evaluatedItems; }
    public void setEvaluatedItems(List<EvaluatedQuestionItem> evaluatedItems) { this.evaluatedItems = evaluatedItems; }

    public List<DeductionLedgerItem> getDeductionLedger() { return deductionLedger; }
    public void setDeductionLedger(List<DeductionLedgerItem> deductionLedger) { this.deductionLedger = deductionLedger; }

    public Map<String, SectionScoreSummary> getSectionScores() { return sectionScores; }
    public void setSectionScores(Map<String, SectionScoreSummary> sectionScores) { this.sectionScores = sectionScores; }

    public double getLedgerSum() { return ledgerSum; }
    public void setLedgerSum(double ledgerSum) { this.ledgerSum = ledgerSum; }

    public double getLedgerBalanceDiff() { return ledgerBalanceDiff; }
    public void setLedgerBalanceDiff(double ledgerBalanceDiff) { this.ledgerBalanceDiff = ledgerBalanceDiff; }

    public boolean isLedgerBalanced() { return isLedgerBalanced; }
    public void setLedgerBalanced(boolean ledgerBalanced) { isLedgerBalanced = ledgerBalanced; }
}
