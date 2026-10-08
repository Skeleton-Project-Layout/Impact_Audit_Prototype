package org.abhisaran.scoring.model;

import org.abhisaran.scoring.AlertBandType;

/**
 * Summary scores grouped by domain/section (e.g., Section A, Section B, etc.).
 */
public class SectionScoreSummary {

    private String section;
    private double earnedWeighted;
    private double maxWeighted;
    private double percentage;
    private AlertBandType alertBand;
    private int questionCount;

    public SectionScoreSummary() {
    }

    public SectionScoreSummary(String section, double earnedWeighted, double maxWeighted, double percentage, AlertBandType alertBand, int questionCount) {
        this.section = section;
        this.earnedWeighted = earnedWeighted;
        this.maxWeighted = maxWeighted;
        this.percentage = percentage;
        this.alertBand = alertBand;
        this.questionCount = questionCount;
    }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public double getEarnedWeighted() { return earnedWeighted; }
    public void setEarnedWeighted(double earnedWeighted) { this.earnedWeighted = earnedWeighted; }

    public double getMaxWeighted() { return maxWeighted; }
    public void setMaxWeighted(double maxWeighted) { this.maxWeighted = maxWeighted; }

    public double getPercentage() { return percentage; }
    public void setPercentage(double percentage) { this.percentage = percentage; }

    public AlertBandType getAlertBand() { return alertBand; }
    public void setAlertBand(AlertBandType alertBand) { this.alertBand = alertBand; }

    public int getQuestionCount() { return questionCount; }
    public void setQuestionCount(int questionCount) { this.questionCount = questionCount; }
}
