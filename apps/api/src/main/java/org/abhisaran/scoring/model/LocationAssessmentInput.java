package org.abhisaran.scoring.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Pure POJO input representing a full multi-page audit for a location.
 */
public class LocationAssessmentInput {

    private String locationId;
    private String submissionId;
    private List<QuestionAssessmentInput> questions = new ArrayList<>();

    public LocationAssessmentInput() {
    }

    public LocationAssessmentInput(String locationId, String submissionId, List<QuestionAssessmentInput> questions) {
        this.locationId = locationId;
        this.submissionId = submissionId;
        this.questions = questions != null ? questions : new ArrayList<>();
    }

    public String getLocationId() { return locationId; }
    public void setLocationId(String locationId) { this.locationId = locationId; }

    public String getSubmissionId() { return submissionId; }
    public void setSubmissionId(String submissionId) { this.submissionId = submissionId; }

    public List<QuestionAssessmentInput> getQuestions() { return questions; }
    public void setQuestions(List<QuestionAssessmentInput> questions) {
        this.questions = questions != null ? questions : new ArrayList<>();
    }
}
