package org.abhisaran.scoring;

/**
 * Immutable evaluation result produced by the deterministic ScoringEngine.
 * Contains exact raw points, weighted deductions, spectrum alert band, and red-flag trigger state.
 */
public class RubricEvaluationResult {

    private final double rawEarned;
    private final double rawMax;
    private final int severityWeight;
    private final double earnedWeighted;
    private final double maxWeighted;
    private final double pointsLost;
    private final double percentage;
    private final AlertBandType alertBand;
    private final boolean redFlagTriggered;
    private final String redFlagReason;
    private final String suggestedIntervention;
    private final String ruleWorkingText;
    private final boolean assessed;
    private final String unassessedReason;

    public RubricEvaluationResult(
            double rawEarned,
            double rawMax,
            int severityWeight,
            double earnedWeighted,
            double maxWeighted,
            double pointsLost,
            double percentage,
            AlertBandType alertBand,
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
        this.redFlagTriggered = redFlagTriggered;
        this.redFlagReason = redFlagReason;
        this.suggestedIntervention = suggestedIntervention;
        this.ruleWorkingText = ruleWorkingText;
        this.assessed = assessed;
        this.unassessedReason = unassessedReason;
    }

    public static RubricEvaluationResult unassessed(String questionId, int severityWeight, String reason, String intervention) {
        return new RubricEvaluationResult(
                0.0,
                0.0,
                severityWeight,
                0.0,
                0.0,
                0.0,
                0.0,
                null,
                false,
                null,
                intervention,
                "Question not assessed: " + reason,
                false,
                reason
        );
    }

    public static RubricEvaluationResult unscored(String questionId, int severityWeight, String ruleText, String intervention) {
        return new RubricEvaluationResult(
                0.0,
                0.0,
                severityWeight,
                0.0,
                0.0,
                0.0,
                0.0,
                null,
                false,
                null,
                intervention,
                ruleText != null ? ruleText : "Informational question — not scored.",
                true,
                null
        );
    }

    public double getRawEarned() {
        return rawEarned;
    }

    public double getRawMax() {
        return rawMax;
    }

    public int getSeverityWeight() {
        return severityWeight;
    }

    public double getEarnedWeighted() {
        return earnedWeighted;
    }

    public double getMaxWeighted() {
        return maxWeighted;
    }

    public double getPointsLost() {
        return pointsLost;
    }

    public double getPercentage() {
        return percentage;
    }

    public AlertBandType getAlertBand() {
        return alertBand;
    }

    public boolean isRedFlagTriggered() {
        return redFlagTriggered;
    }

    public String getRedFlagReason() {
        return redFlagReason;
    }

    public String getSuggestedIntervention() {
        return suggestedIntervention;
    }

    public String getRuleWorkingText() {
        return ruleWorkingText;
    }

    public boolean isAssessed() {
        return assessed;
    }

    public String getUnassessedReason() {
        return unassessedReason;
    }
}
