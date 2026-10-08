package org.abhisaran.scoring;

/**
 * 5-tier alert spectrum (Red -> Green) specified in Section 9.5.
 */
public enum AlertBandType {
    RED(0.00, 39.99, "Needs immediate attention", "#dc2626"),
    ORANGE(40.00, 54.99, "Critical gaps", "#f97316"),
    AMBER(55.00, 69.99, "Needs improvement", "#f59e0b"),
    LIGHT_GREEN(70.00, 89.99, "Good — a few things are off", "#84cc16"),
    DARK_GREEN(90.00, 100.00, "All good", "#10b981");

    private final double minScore;
    private final double maxScore;
    private final String label;
    private final String colorHex;

    AlertBandType(double minScore, double maxScore, String label, String colorHex) {
        this.minScore = minScore;
        this.maxScore = maxScore;
        this.label = label;
        this.colorHex = colorHex;
    }

    public double getMinScore() {
        return minScore;
    }

    public double getMaxScore() {
        return maxScore;
    }

    public String getLabel() {
        return label;
    }

    public String getColorHex() {
        return colorHex;
    }

    public static AlertBandType fromPercentage(double percentage, boolean isCritical) {
        // Section 9.5: A Critical-severity question with earned / max < 50% is ALWAYS RED.
        if (isCritical && percentage < 50.0) {
            return RED;
        }

        if (percentage < 40.0) {
            return RED;
        } else if (percentage < 55.0) {
            return ORANGE;
        } else if (percentage < 70.0) {
            return AMBER;
        } else if (percentage < 90.0) {
            return LIGHT_GREEN;
        } else {
            return DARK_GREEN;
        }
    }
}
