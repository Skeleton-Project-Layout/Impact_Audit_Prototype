package org.abhisaran.questions;

import org.abhisaran.questions.dto.*;
import org.abhisaran.scoring.AlertBandType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class QuestionBankIntegrationTest {

    @Autowired
    private QuestionBankService questionBankService;

    @Autowired
    private QuestionBankRepository questionBankRepository;

    @Autowired
    private QuestionVersionRepository questionVersionRepository;

    @Autowired
    private org.abhisaran.users.UserRepository userRepository;

    @Test
    @DisplayName("Verify exactly 72 audit questions seeded from question_merge_map.csv")
    void testMasterQuestionBankSeeded() {
        List<QuestionBank> all = questionBankRepository.findAll();
        assertEquals(72, all.size(), "Must contain exactly 72 audit questions");

        long scoredCount = all.stream().filter(QuestionBank::isScoredDefault).count();
        assertEquals(31, scoredCount, "Must have exactly 31 questions scored by default");

        long evidenceCount = all.stream().filter(QuestionBank::isEvidenceUploadDefault).count();
        assertEquals(42, evidenceCount, "Must have exactly 42 questions with evidence upload enabled by default");

        // Verify initial version 1 created for all 72 questions
        long v1Count = questionVersionRepository.findAll().stream()
                .filter(v -> v.getVersionNumber() == 1)
                .count();
        assertEquals(72, v1Count, "All 72 questions must have version 1 snapshot");

        // Verify initial status is DEFAULT_PENDING_OWNER_REVIEW
        long pendingReview = questionVersionRepository.countByStatus("DEFAULT_PENDING_OWNER_REVIEW");
        assertEquals(72, pendingReview, "All initial versions must be flagged DEFAULT_PENDING_OWNER_REVIEW");
    }

    @Test
    @DisplayName("Verify domain and section filtering")
    void testQuestionFiltering() {
        List<QuestionSummaryDTO> schoolQuestions = questionBankService.getQuestions(
                "SCHOOL", null, null, null, null, true, null
        );
        // Includes SCHOOL-specific plus ALL
        assertFalse(schoolQuestions.isEmpty());
        assertTrue(schoolQuestions.stream().allMatch(q -> "SCHOOL".equals(q.getDomain()) || "ALL".equals(q.getDomain())));

        List<QuestionSummaryDTO> scoredCritical = questionBankService.getQuestions(
                null, null, "CRITICAL", null, true, true, null
        );
        assertFalse(scoredCritical.isEmpty());
        assertTrue(scoredCritical.stream().allMatch(q -> "CRITICAL".equalsIgnoreCase(q.getSeverity()) && q.isScored()));
    }

    @Test
    @DisplayName("Question Versioning: Updating a question creates version N+1 while version N remains immutable")
    void testQuestionVersioningImmutability() {
        String qId = "S04";
        QuestionDetailDTO original = questionBankService.getQuestion(qId);
        assertEquals(1, original.getVersionNumber());
        String originalText = original.getText();

        // Update question S04
        QuestionUpdateRequest updateReq = new QuestionUpdateRequest();
        updateReq.setText(originalText + " [Updated in Audit Cycle 2026]");
        updateReq.setSeverity("CRITICAL"); // Bump severity to CRITICAL
        updateReq.setScored(true);
        updateReq.setChangeReason("Policy benchmark revision for pilot monitoring");

        UUID realAdminId = userRepository.findAll().stream().findFirst().map(org.abhisaran.users.User::getId).orElse(null);
        QuestionDetailDTO updated = questionBankService.updateQuestion(qId, updateReq, realAdminId, "127.0.0.1");

        // Verify updated detail is now version 2
        assertEquals(2, updated.getVersionNumber(), "New version must be 2");
        assertEquals("CRITICAL", updated.getSeverity());
        assertTrue(updated.getText().contains("[Updated in Audit Cycle 2026]"));

        // Verify version history has both versions
        List<QuestionVersionSummaryDTO> history = questionBankService.getVersionHistory(qId);
        assertEquals(2, history.size(), "History must contain 2 versions");
        assertEquals(2, history.get(0).getVersionNumber());
        assertEquals(1, history.get(1).getVersionNumber());

        // Verify Version 1 remains strictly unchanged and immutable in DB
        QuestionDetailDTO v1 = questionBankService.getVersionDetails(qId, 1);
        assertEquals(1, v1.getVersionNumber());
        assertEquals(originalText, v1.getText(), "Version 1 text must remain completely unchanged");
        assertEquals("HIGH", v1.getSeverity(), "Version 1 severity must remain unchanged");
    }

    @Test
    @DisplayName("Rubric Review: Bulk approve pending rubrics updates status to ACTIVE")
    void testBulkApproveRubrics() {
        long initialPending = questionVersionRepository.countByStatus("DEFAULT_PENDING_OWNER_REVIEW");
        assertTrue(initialPending > 0);

        UUID realAdminId = userRepository.findAll().stream().findFirst().map(org.abhisaran.users.User::getId).orElse(null);
        int approvedCount = questionBankService.bulkApproveRubrics(realAdminId, "127.0.0.1");
        assertEquals((int) initialPending, approvedCount);

        long remainingPending = questionVersionRepository.countByStatus("DEFAULT_PENDING_OWNER_REVIEW");
        assertEquals(0, remainingPending, "No pending rubrics should remain after bulk approval");
    }

    @Test
    @DisplayName("Live Rubric Testing: S11 Drinking water available but not functional produces 1 of 2 points and red flag")
    void testRubricTesterEndpoint() {
        RubricTestRequest req = new RubricTestRequest();
        req.setAnswer(Map.of(
                "rows", List.of(
                        Map.of("name", "Drinking Water Facility", "available", true, "functional", false),
                        Map.of("name", "Boys Toilet Facility", "available", true, "functional", true),
                        Map.of("name", "Girls Toilet Facility", "available", true, "functional", true),
                        Map.of("name", "CWSN Accessible Toilet", "available", true, "functional", true),
                        Map.of("name", "Handwashing Station with Soap", "available", true, "functional", true)
                )
        ));

        RubricTestResponse res = questionBankService.testRubric("S11", req);
        assertTrue(res.isAssessed());
        // 5 rows * 2 pts = 10 max points. Water got 1 pt; other 4 got 2 pts = 9/10 earned
        assertEquals(9.0, res.getRawEarned(), 0.001);
        assertEquals(10.0, res.getRawMax(), 0.001);
        assertEquals(3, res.getSeverityWeight()); // Critical weight 3
        assertEquals(27.0, res.getEarnedWeighted(), 0.001);
        assertEquals(30.0, res.getMaxWeighted(), 0.001);
        assertEquals(3.0, res.getPointsLost(), 0.001);
        assertEquals(90.0, res.getPercentage(), 0.001);
        assertTrue(res.isRedFlagTriggered(), "Drinking water not functional must trigger red flag");
    }

    @Test
    @DisplayName("Critical severity question with 45% score clamped to RED alert band")
    void testCriticalClampToRedIntegration() {
        RubricTestRequest req = new RubricTestRequest();
        // 9 working out of 20 sanctioned -> 45%
        req.setAnswer(Map.of("working", 9, "sanctioned", 20));

        RubricTestResponse res = questionBankService.testRubric("P02", req);
        assertTrue(res.isAssessed());
        assertEquals(45.0, res.getPercentage(), 0.001);
        assertEquals(AlertBandType.RED.name(), res.getAlertBand(), "Critical question with < 50% must be RED band");
        assertTrue(res.isRedFlagTriggered());
    }
}
