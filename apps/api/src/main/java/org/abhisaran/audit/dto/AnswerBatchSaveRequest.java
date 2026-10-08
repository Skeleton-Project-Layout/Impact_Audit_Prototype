package org.abhisaran.audit.dto;

import java.util.List;

public class AnswerBatchSaveRequest {
    private List<AnswerSaveDTO> answers;

    public AnswerBatchSaveRequest() {
    }

    public AnswerBatchSaveRequest(List<AnswerSaveDTO> answers) {
        this.answers = answers;
    }

    public List<AnswerSaveDTO> getAnswers() {
        return answers;
    }

    public void setAnswers(List<AnswerSaveDTO> answers) {
        this.answers = answers;
    }
}
