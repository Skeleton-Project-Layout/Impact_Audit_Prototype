package org.abhisaran.scoring.model;

/**
 * Pure POJO for a line in the Deduction Ledger.
 * Each entry explains an exact deduction from 100.00 ACS.
 */
public class DeductionLedgerItem {

    private String questionId;
    private int pageNumber;
    private String questionText;
    private String severity;
    private int weight;
    private double lostWeightedPoints;
    private double deductionPercentage; // exactly: (lostWeightedPoints / sum(maxWeighted)) * 100
    private String lossExplanation;
    private String suggestedIntervention;

    public DeductionLedgerItem() {
    }

    public DeductionLedgerItem(
            String questionId,
            int pageNumber,
            String questionText,
            String severity,
            int weight,
            double lostWeightedPoints,
            double deductionPercentage,
            String lossExplanation,
            String suggestedIntervention
    ) {
        this.questionId = questionId;
        this.pageNumber = pageNumber;
        this.questionText = questionText;
        this.severity = severity;
        this.weight = weight;
        this.lostWeightedPoints = lostWeightedPoints;
        this.deductionPercentage = deductionPercentage;
        this.lossExplanation = lossExplanation;
        this.suggestedIntervention = suggestedIntervention;
    }

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }

    public int getPageNumber() { return pageNumber; }
    public void setPageNumber(int pageNumber) { this.pageNumber = pageNumber; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public int getWeight() { return weight; }
    public void setWeight(int weight) { this.weight = weight; }

    public double getLostWeightedPoints() { return lostWeightedPoints; }
    public void setLostWeightedPoints(double lostWeightedPoints) { this.lostWeightedPoints = lostWeightedPoints; }

    public double getDeductionPercentage() { return deductionPercentage; }
    public void setDeductionPercentage(double deductionPercentage) { this.deductionPercentage = deductionPercentage; }

    public String getLossExplanation() { return lossExplanation; }
    public void setLossExplanation(String lossExplanation) { this.lossExplanation = lossExplanation; }

    public String getSuggestedIntervention() { return suggestedIntervention; }
    public void setSuggestedIntervention(String suggestedIntervention) { this.suggestedIntervention = suggestedIntervention; }
}
