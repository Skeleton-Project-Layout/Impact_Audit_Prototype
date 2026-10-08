package org.abhisaran.audit.dto;

import java.util.List;
import java.util.Map;

public class CompletenessReportDTO {
    private boolean complete;
    private int totalMissing;
    private Map<Integer, List<String>> missingQuestionsByPage;
    private String message;

    public CompletenessReportDTO() {
    }

    public CompletenessReportDTO(boolean complete, int totalMissing,
                                 Map<Integer, List<String>> missingQuestionsByPage, String message) {
        this.complete = complete;
        this.totalMissing = totalMissing;
        this.missingQuestionsByPage = missingQuestionsByPage;
        this.message = message;
    }

    public boolean isComplete() {
        return complete;
    }

    public void setComplete(boolean complete) {
        this.complete = complete;
    }

    public int getTotalMissing() {
        return totalMissing;
    }

    public void setTotalMissing(int totalMissing) {
        this.totalMissing = totalMissing;
    }

    public Map<Integer, List<String>> getMissingQuestionsByPage() {
        return missingQuestionsByPage;
    }

    public void setMissingQuestionsByPage(Map<Integer, List<String>> missingQuestionsByPage) {
        this.missingQuestionsByPage = missingQuestionsByPage;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
