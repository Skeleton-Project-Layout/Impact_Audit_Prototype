package org.abhisaran.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class AiSummariseRunPayload {

    @JsonProperty("facility_code")
    private String facilityCode;

    @JsonProperty("run_number")
    private int runNumber;

    @JsonProperty("acs_score")
    private Double acsScore;

    @JsonProperty("alert_band")
    private String alertBand;

    @JsonProperty("is_provisional")
    private boolean isProvisional;

    @JsonProperty("coverage_pct")
    private double coveragePct;

    @JsonProperty("total_applicable_questions")
    private int totalApplicableQuestions;

    @JsonProperty("total_assessed_questions")
    private int totalAssessedQuestions;

    @JsonProperty("triggered_red_flags_count")
    private int triggeredRedFlagsCount;

    @JsonProperty("ledger")
    private List<LedgerItemPayload> ledger;

    @JsonProperty("sections")
    private List<Map<String, Object>> sections;

    public AiSummariseRunPayload() {}

    public static class LedgerItemPayload {
        @JsonProperty("question_id")
        private String questionId;

        @JsonProperty("page_number")
        private int pageNumber;

        @JsonProperty("question_text")
        private String questionText;

        @JsonProperty("severity")
        private String severity;

        @JsonProperty("weight")
        private double weight;

        @JsonProperty("lost_weighted_points")
        private double lostWeightedPoints;

        @JsonProperty("deduction_percentage")
        private double deductionPercentage;

        @JsonProperty("loss_explanation")
        private String lossExplanation;

        @JsonProperty("suggested_intervention")
        private String suggestedIntervention;

        public LedgerItemPayload() {}

        public LedgerItemPayload(String questionId, int pageNumber, String questionText,
                                 String severity, double weight, double lostWeightedPoints,
                                 double deductionPercentage, String lossExplanation,
                                 String suggestedIntervention) {
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

        public double getWeight() { return weight; }
        public void setWeight(double weight) { this.weight = weight; }

        public double getLostWeightedPoints() { return lostWeightedPoints; }
        public void setLostWeightedPoints(double lostWeightedPoints) { this.lostWeightedPoints = lostWeightedPoints; }

        public double getDeductionPercentage() { return deductionPercentage; }
        public void setDeductionPercentage(double deductionPercentage) { this.deductionPercentage = deductionPercentage; }

        public String getLossExplanation() { return lossExplanation; }
        public void setLossExplanation(String lossExplanation) { this.lossExplanation = lossExplanation; }

        public String getSuggestedIntervention() { return suggestedIntervention; }
        public void setSuggestedIntervention(String suggestedIntervention) { this.suggestedIntervention = suggestedIntervention; }
    }

    public String getFacilityCode() { return facilityCode; }
    public void setFacilityCode(String facilityCode) { this.facilityCode = facilityCode; }

    public int getRunNumber() { return runNumber; }
    public void setRunNumber(int runNumber) { this.runNumber = runNumber; }

    public Double getAcsScore() { return acsScore; }
    public void setAcsScore(Double acsScore) { this.acsScore = acsScore; }

    public String getAlertBand() { return alertBand; }
    public void setAlertBand(String alertBand) { this.alertBand = alertBand; }

    public boolean isProvisional() { return isProvisional; }
    public void setProvisional(boolean provisional) { isProvisional = provisional; }

    public double getCoveragePct() { return coveragePct; }
    public void setCoveragePct(double coveragePct) { this.coveragePct = coveragePct; }

    public int getTotalApplicableQuestions() { return totalApplicableQuestions; }
    public void setTotalApplicableQuestions(int totalApplicableQuestions) { this.totalApplicableQuestions = totalApplicableQuestions; }

    public int getTotalAssessedQuestions() { return totalAssessedQuestions; }
    public void setTotalAssessedQuestions(int totalAssessedQuestions) { this.totalAssessedQuestions = totalAssessedQuestions; }

    public int getTriggeredRedFlagsCount() { return triggeredRedFlagsCount; }
    public void setTriggeredRedFlagsCount(int triggeredRedFlagsCount) { this.triggeredRedFlagsCount = triggeredRedFlagsCount; }

    public List<LedgerItemPayload> getLedger() { return ledger; }
    public void setLedger(List<LedgerItemPayload> ledger) { this.ledger = ledger; }

    public List<Map<String, Object>> getSections() { return sections; }
    public void setSections(List<Map<String, Object>> sections) { this.sections = sections; }
}
