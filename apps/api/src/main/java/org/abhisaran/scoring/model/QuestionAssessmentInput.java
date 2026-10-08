package org.abhisaran.scoring.model;

import java.util.Map;

/**
 * Pure POJO input representing a single question instance within an audit page.
 * Zero Spring/DB/Framework dependencies.
 */
public class QuestionAssessmentInput {

    private String pageId;
    private int pageNumber;
    private String questionId;
    private String questionVersionId;
    private String questionText;
    private String section;
    private String severity;
    private Integer weightOverride;
    private Map<String, Object> rubricConfig;
    private Map<String, Object> answerValue;
    private boolean isNa;
    private String naReason;
    private boolean isNotAssessed;
    private String notAssessedReason;
    private String redFlagLogic;
    private String suggestedIntervention;

    public QuestionAssessmentInput() {
    }

    public QuestionAssessmentInput(
            String pageId,
            int pageNumber,
            String questionId,
            String questionVersionId,
            String questionText,
            String section,
            String severity,
            Integer weightOverride,
            Map<String, Object> rubricConfig,
            Map<String, Object> answerValue,
            boolean isNa,
            String naReason,
            boolean isNotAssessed,
            String notAssessedReason,
            String redFlagLogic,
            String suggestedIntervention
    ) {
        this.pageId = pageId;
        this.pageNumber = pageNumber;
        this.questionId = questionId;
        this.questionVersionId = questionVersionId;
        this.questionText = questionText;
        this.section = section;
        this.severity = severity;
        this.weightOverride = weightOverride;
        this.rubricConfig = rubricConfig;
        this.answerValue = answerValue;
        this.isNa = isNa;
        this.naReason = naReason;
        this.isNotAssessed = isNotAssessed;
        this.notAssessedReason = notAssessedReason;
        this.redFlagLogic = redFlagLogic;
        this.suggestedIntervention = suggestedIntervention;
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

    public Integer getWeightOverride() { return weightOverride; }
    public void setWeightOverride(Integer weightOverride) { this.weightOverride = weightOverride; }

    public Map<String, Object> getRubricConfig() { return rubricConfig; }
    public void setRubricConfig(Map<String, Object> rubricConfig) { this.rubricConfig = rubricConfig; }

    public Map<String, Object> getAnswerValue() { return answerValue; }
    public void setAnswerValue(Map<String, Object> answerValue) { this.answerValue = answerValue; }

    public boolean isNa() { return isNa; }
    public void setNa(boolean na) { isNa = na; }

    public String getNaReason() { return naReason; }
    public void setNaReason(String naReason) { this.naReason = naReason; }

    public boolean isNotAssessed() { return isNotAssessed; }
    public void setNotAssessed(boolean notAssessed) { isNotAssessed = notAssessed; }

    public String getNotAssessedReason() { return notAssessedReason; }
    public void setNotAssessedReason(String notAssessedReason) { this.notAssessedReason = notAssessedReason; }

    public String getRedFlagLogic() { return redFlagLogic; }
    public void setRedFlagLogic(String redFlagLogic) { this.redFlagLogic = redFlagLogic; }

    public String getSuggestedIntervention() { return suggestedIntervention; }
    public void setSuggestedIntervention(String suggestedIntervention) { this.suggestedIntervention = suggestedIntervention; }
}
