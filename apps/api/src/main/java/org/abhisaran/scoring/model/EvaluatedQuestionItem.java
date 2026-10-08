package org.abhisaran.scoring.model;

import org.abhisaran.scoring.AlertBandType;

/**
 * Pure evaluation details for a single question instance within an audit.
 */
public class EvaluatedQuestionItem {

    private String pageId;
    private int pageNumber;
    private String questionId;
    private String questionVersionId;
    private String questionText;
    private String section;
    private String severity;
    private int weight;
    private double rawEarned;
    private double rawMax;
    private double weightedEarned;
    private double weightedMax;
    private double weightedLost;
    private double lossContribution; // deduction % from 100
    private boolean isNa;
    private boolean isNotAssessed;
    private boolean isScored;
    private boolean isRedFlag;
    private boolean clampedRed;
    private AlertBandType alertBand;
    private String redFlagReason;
    private String suggestedIntervention;
    private String workingNotes;

    public EvaluatedQuestionItem() {
    }

    public EvaluatedQuestionItem(
            String pageId,
            int pageNumber,
            String questionId,
            String questionVersionId,
            String questionText,
            String section,
            String severity,
            int weight,
            double rawEarned,
            double rawMax,
            double weightedEarned,
            double weightedMax,
            double weightedLost,
            double lossContribution,
            boolean isNa,
            boolean isNotAssessed,
            boolean isScored,
            boolean isRedFlag,
            boolean clampedRed,
            AlertBandType alertBand,
            String redFlagReason,
            String suggestedIntervention,
            String workingNotes
    ) {
        this.pageId = pageId;
        this.pageNumber = pageNumber;
        this.questionId = questionId;
        this.questionVersionId = questionVersionId;
        this.questionText = questionText;
        this.section = section;
        this.severity = severity;
        this.weight = weight;
        this.rawEarned = rawEarned;
        this.rawMax = rawMax;
        this.weightedEarned = weightedEarned;
        this.weightedMax = weightedMax;
        this.weightedLost = weightedLost;
        this.lossContribution = lossContribution;
        this.isNa = isNa;
        this.isNotAssessed = isNotAssessed;
        this.isScored = isScored;
        this.isRedFlag = isRedFlag;
        this.clampedRed = clampedRed;
        this.alertBand = alertBand;
        this.redFlagReason = redFlagReason;
        this.suggestedIntervention = suggestedIntervention;
        this.workingNotes = workingNotes;
    }

    public String getPageId() { return pageId; }
    public void setPageId(String pageId) { this.pageId = pageId; }

    public int getPageNumber() { return pageNumber; }
    public void setPageNumber(int pageNumber) { this.pageNumber = pageNumber; }

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }

    public String getQuestionVersionId() { return questionVersionId; }
    public void setQuestionVersionId(String questionVersionId) { this.questionVersionId = questionVersionId; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public int getWeight() { return weight; }
    public void setWeight(int weight) { this.weight = weight; }

    public double getRawEarned() { return rawEarned; }
    public void setRawEarned(double rawEarned) { this.rawEarned = rawEarned; }

    public double getRawMax() { return rawMax; }
    public void setRawMax(double rawMax) { this.rawMax = rawMax; }

    public double getWeightedEarned() { return weightedEarned; }
    public void setWeightedEarned(double weightedEarned) { this.weightedEarned = weightedEarned; }

    public double getWeightedMax() { return weightedMax; }
    public void setWeightedMax(double weightedMax) { this.weightedMax = weightedMax; }

    public double getWeightedLost() { return weightedLost; }
    public void setWeightedLost(double weightedLost) { this.weightedLost = weightedLost; }

    public double getLossContribution() { return lossContribution; }
    public void setLossContribution(double lossContribution) { this.lossContribution = lossContribution; }

    public boolean isNa() { return isNa; }
    public void setNa(boolean na) { isNa = na; }

    public boolean isNotAssessed() { return isNotAssessed; }
    public void setNotAssessed(boolean notAssessed) { isNotAssessed = notAssessed; }

    public boolean isScored() { return isScored; }
    public void setScored(boolean scored) { isScored = scored; }

    public boolean isRedFlag() { return isRedFlag; }
    public void setRedFlag(boolean redFlag) { isRedFlag = redFlag; }

    public boolean isClampedRed() { return clampedRed; }
    public void setClampedRed(boolean clampedRed) { this.clampedRed = clampedRed; }

    public AlertBandType getAlertBand() { return alertBand; }
    public void setAlertBand(AlertBandType alertBand) { this.alertBand = alertBand; }

    public String getRedFlagReason() { return redFlagReason; }
    public void setRedFlagReason(String redFlagReason) { this.redFlagReason = redFlagReason; }

    public String getSuggestedIntervention() { return suggestedIntervention; }
    public void setSuggestedIntervention(String suggestedIntervention) { this.suggestedIntervention = suggestedIntervention; }

    public String getWorkingNotes() { return workingNotes; }
    public void setWorkingNotes(String workingNotes) { this.workingNotes = workingNotes; }
}
