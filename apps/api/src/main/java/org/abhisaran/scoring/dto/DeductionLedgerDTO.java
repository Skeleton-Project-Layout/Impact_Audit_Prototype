package org.abhisaran.scoring.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class DeductionLedgerDTO {

    private UUID id;
    private String questionId;
    private int pageNumber;
    private String questionText;
    private String severity;
    private BigDecimal weight;
    private BigDecimal lostWeightedPoints;
    private BigDecimal deductionPercentage;
    private String lossExplanation;
    private String suggestedIntervention;

    public DeductionLedgerDTO() {
    }

    public DeductionLedgerDTO(UUID id, String questionId, int pageNumber, String questionText,
                              String severity, BigDecimal weight, BigDecimal lostWeightedPoints,
                              BigDecimal deductionPercentage, String lossExplanation, String suggestedIntervention) {
        this.id = id;
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

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }

    public int getPageNumber() { return pageNumber; }
    public void setPageNumber(int pageNumber) { this.pageNumber = pageNumber; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public BigDecimal getWeight() { return weight; }
    public void setWeight(BigDecimal weight) { this.weight = weight; }

    public BigDecimal getLostWeightedPoints() { return lostWeightedPoints; }
    public void setLostWeightedPoints(BigDecimal lostWeightedPoints) { this.lostWeightedPoints = lostWeightedPoints; }

    public BigDecimal getDeductionPercentage() { return deductionPercentage; }
    public void setDeductionPercentage(BigDecimal deductionPercentage) { this.deductionPercentage = deductionPercentage; }

    public String getLossExplanation() { return lossExplanation; }
    public void setLossExplanation(String lossExplanation) { this.lossExplanation = lossExplanation; }

    public String getSuggestedIntervention() { return suggestedIntervention; }
    public void setSuggestedIntervention(String suggestedIntervention) { this.suggestedIntervention = suggestedIntervention; }
}
