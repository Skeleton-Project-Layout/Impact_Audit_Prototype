package org.abhisaran.audit.dto;

import java.util.List;
import java.util.Map;

public class CompletenessReportDTO {
    private boolean complete;
    private boolean canSubmit;
    private int totalAnswered;
    private int totalMissing;
    private Map<Integer, List<String>> missingQuestionsByPage;
    private String message;

    public CompletenessReportDTO() {
    }

    public CompletenessReportDTO(boolean complete, int totalMissing,
                                 Map<Integer, List<String>> missingQuestionsByPage, String message) {
        this(complete, totalMissing == 0, 0, totalMissing, missingQuestionsByPage, message);
    }

    public CompletenessReportDTO(boolean complete, boolean canSubmit, int totalAnswered, int totalMissing,
                                 Map<Integer, List<String>> missingQuestionsByPage, String message) {
        this.complete = complete;
        this.canSubmit = canSubmit;
        this.totalAnswered = totalAnswered;
        this.totalMissing = totalMissing;
        this.missingQuestionsByPage = missingQuestionsByPage;
        this.message = message;
    }

    public boolean isCanSubmit() {
        return canSubmit;
    }

    public void setCanSubmit(boolean canSubmit) {
        this.canSubmit = canSubmit;
    }

    public int getTotalAnswered() {
        return totalAnswered;
    }

    public void setTotalAnswered(int totalAnswered) {
        this.totalAnswered = totalAnswered;
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
