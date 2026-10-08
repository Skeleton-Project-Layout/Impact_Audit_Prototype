package org.abhisaran.scoring.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class AnalysisItemDTO {

    private UUID id;
    private String questionId;
    private UUID questionVersionId;
    private String questionText;
    private int pageNumber;
    private String severity;
    private BigDecimal weight;
    private BigDecimal rawEarnedPoints;
    private BigDecimal rawMaxPoints;
    private BigDecimal weightedEarnedPoints;
    private BigDecimal weightedMaxPoints;
    private boolean isNa;
    private boolean isNotAssessed;
    private boolean isRedFlag;
    private String alertBand;
    private boolean clampedRed;
    private String workingNotes;
    private String suggestedIntervention;

    public AnalysisItemDTO() {
    }

    public AnalysisItemDTO(UUID id, String questionId, UUID questionVersionId, String questionText,
                           int pageNumber, String severity, BigDecimal weight, BigDecimal rawEarnedPoints,
                           BigDecimal rawMaxPoints, BigDecimal weightedEarnedPoints, BigDecimal weightedMaxPoints,
                           boolean isNa, boolean isNotAssessed, boolean isRedFlag, String alertBand,
                           boolean clampedRed, String workingNotes, String suggestedIntervention) {
        this.id = id;
        this.questionId = questionId;
        this.questionVersionId = questionVersionId;
        this.questionText = questionText;
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
        this.suggestedIntervention = suggestedIntervention;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }

    public UUID getQuestionVersionId() { return questionVersionId; }
    public void setQuestionVersionId(UUID questionVersionId) { this.questionVersionId = questionVersionId; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

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

    public String getSuggestedIntervention() { return suggestedIntervention; }
    public void setSuggestedIntervention(String suggestedIntervention) { this.suggestedIntervention = suggestedIntervention; }
}
