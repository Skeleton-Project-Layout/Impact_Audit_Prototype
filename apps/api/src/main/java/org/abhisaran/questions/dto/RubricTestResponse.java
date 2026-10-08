package org.abhisaran.questions.dto;

public class RubricTestResponse {
    private double rawEarned;
    private double rawMax;
    private int severityWeight;
    private double earnedWeighted;
    private double maxWeighted;
    private double pointsLost;
    private double percentage;
    private String alertBand;
    private String alertLabel;
    private String alertColorHex;
    private boolean redFlagTriggered;
    private String redFlagReason;
    private String suggestedIntervention;
    private String ruleWorkingText;
    private boolean assessed;
    private String unassessedReason;

    public RubricTestResponse() {
    }

    public RubricTestResponse(
            double rawEarned,
            double rawMax,
            int severityWeight,
            double earnedWeighted,
            double maxWeighted,
            double pointsLost,
            double percentage,
            String alertBand,
            String alertLabel,
            String alertColorHex,
            boolean redFlagTriggered,
            String redFlagReason,
            String suggestedIntervention,
            String ruleWorkingText,
            boolean assessed,
            String unassessedReason
    ) {
        this.rawEarned = rawEarned;
        this.rawMax = rawMax;
        this.severityWeight = severityWeight;
        this.earnedWeighted = earnedWeighted;
        this.maxWeighted = maxWeighted;
        this.pointsLost = pointsLost;
        this.percentage = percentage;
        this.alertBand = alertBand;
        this.alertLabel = alertLabel;
        this.alertColorHex = alertColorHex;
        this.redFlagTriggered = redFlagTriggered;
        this.redFlagReason = redFlagReason;
        this.suggestedIntervention = suggestedIntervention;
        this.ruleWorkingText = ruleWorkingText;
        this.assessed = assessed;
        this.unassessedReason = unassessedReason;
    }

    public double getRawEarned() {
        return rawEarned;
    }

    public void setRawEarned(double rawEarned) {
        this.rawEarned = rawEarned;
    }

    public double getRawMax() {
        return rawMax;
    }

    public void setRawMax(double rawMax) {
        this.rawMax = rawMax;
    }

    public int getSeverityWeight() {
        return severityWeight;
    }

    public void setSeverityWeight(int severityWeight) {
        this.severityWeight = severityWeight;
    }

    public double getEarnedWeighted() {
        return earnedWeighted;
    }

    public void setEarnedWeighted(double earnedWeighted) {
        this.earnedWeighted = earnedWeighted;
    }

    public double getMaxWeighted() {
        return maxWeighted;
    }

    public void setMaxWeighted(double maxWeighted) {
        this.maxWeighted = maxWeighted;
    }

    public double getPointsLost() {
        return pointsLost;
    }

    public void setPointsLost(double pointsLost) {
        this.pointsLost = pointsLost;
    }

    public double getPercentage() {
        return percentage;
    }

    public void setPercentage(double percentage) {
        this.percentage = percentage;
    }

    public String getAlertBand() {
        return alertBand;
    }

    public void setAlertBand(String alertBand) {
        this.alertBand = alertBand;
    }

    public String getAlertLabel() {
        return alertLabel;
    }

    public void setAlertLabel(String alertLabel) {
        this.alertLabel = alertLabel;
    }

    public String getColorHex() {
        return alertColorHex;
    }

    public void setColorHex(String alertColorHex) {
        this.alertColorHex = alertColorHex;
    }

    public boolean isRedFlagTriggered() {
        return redFlagTriggered;
    }

    public void setRedFlagTriggered(boolean redFlagTriggered) {
        this.redFlagTriggered = redFlagTriggered;
    }

    public String getRedFlagReason() {
        return redFlagReason;
    }

    public void setRedFlagReason(String redFlagReason) {
        this.redFlagReason = redFlagReason;
    }

    public String getSuggestedIntervention() {
        return suggestedIntervention;
    }

    public void setSuggestedIntervention(String suggestedIntervention) {
        this.suggestedIntervention = suggestedIntervention;
    }

    public String getRuleWorkingText() {
        return ruleWorkingText;
    }

    public void setRuleWorkingText(String ruleWorkingText) {
        this.ruleWorkingText = ruleWorkingText;
    }

    public boolean isAssessed() {
        return assessed;
    }

    public void setAssessed(boolean assessed) {
        this.assessed = assessed;
    }

    public String getUnassessedReason() {
        return unassessedReason;
    }

    public void setUnassessedReason(String unassessedReason) {
        this.unassessedReason = unassessedReason;
    }
}
