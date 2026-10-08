package org.abhisaran.questions.dto;

import java.util.Map;

public class RubricTestRequest {
    private Map<String, Object> answer;
    private Map<String, Object> rubricConfig;
    private String severity;
    private String redFlagLogic;
    private String suggestedIntervention;

    public RubricTestRequest() {
    }

    public Map<String, Object> getAnswer() {
        return answer;
    }

    public void setAnswer(Map<String, Object> answer) {
        this.answer = answer;
    }

    public Map<String, Object> getRubricConfig() {
        return rubricConfig;
    }

    public void setRubricConfig(Map<String, Object> rubricConfig) {
        this.rubricConfig = rubricConfig;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getRedFlagLogic() {
        return redFlagLogic;
    }

    public void setRedFlagLogic(String redFlagLogic) {
        this.redFlagLogic = redFlagLogic;
    }

    public String getSuggestedIntervention() {
        return suggestedIntervention;
    }

    public void setSuggestedIntervention(String suggestedIntervention) {
        this.suggestedIntervention = suggestedIntervention;
    }
}
