package org.abhisaran.scoring.dto;

import java.math.BigDecimal;

public class SectionScoreDTO {

    private String section;
    private BigDecimal earnedWeightedPoints;
    private BigDecimal maxWeightedPoints;
    private BigDecimal scorePercentage;
    private String alertBand;
    private int questionCount;

    public SectionScoreDTO() {
    }

    public SectionScoreDTO(String section, BigDecimal earnedWeightedPoints, BigDecimal maxWeightedPoints,
                           BigDecimal scorePercentage, String alertBand, int questionCount) {
        this.section = section;
        this.earnedWeightedPoints = earnedWeightedPoints;
        this.maxWeightedPoints = maxWeightedPoints;
        this.scorePercentage = scorePercentage;
        this.alertBand = alertBand;
        this.questionCount = questionCount;
    }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public BigDecimal getEarnedWeightedPoints() { return earnedWeightedPoints; }
    public void setEarnedWeightedPoints(BigDecimal earnedWeightedPoints) { this.earnedWeightedPoints = earnedWeightedPoints; }

    public BigDecimal getMaxWeightedPoints() { return maxWeightedPoints; }
    public void setMaxWeightedPoints(BigDecimal maxWeightedPoints) { this.maxWeightedPoints = maxWeightedPoints; }

    public BigDecimal getScorePercentage() { return scorePercentage; }
    public void setScorePercentage(BigDecimal scorePercentage) { this.scorePercentage = scorePercentage; }

    public String getAlertBand() { return alertBand; }
    public void setAlertBand(String alertBand) { this.alertBand = alertBand; }

    public int getQuestionCount() { return questionCount; }
    public void setQuestionCount(int questionCount) { this.questionCount = questionCount; }
}
