package org.abhisaran.scoring;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ScoringEngineUnitTest {

    @Test
    @DisplayName("GRID_AFU: Water available but not functional yields exactly 1 of 2 points")
    void testGridAfuWaterAvailableNotFunctional() {
        // Section 9.1 example: Drinking water — available but not functional => 1 of 2
        Map<String, Object> rubricConfig = Map.of(
                "type", "GRID_AFU",
                "score_used", false,
                "rows", List.of("Drinking Water")
        );
        Map<String, Object> answer = Map.of(
                "rows", List.of(
                        Map.of("name", "Drinking Water", "available", true, "functional", false, "used", false)
                )
        );

        RubricEvaluationResult result = ScoringEngine.evaluateQuestion(
                "S11", "CRITICAL", rubricConfig, answer, "Any critical facility absent", "Immediate repair"
        );

        assertTrue(result.isAssessed());
        assertEquals(1.0, result.getRawEarned(), 0.001);
        assertEquals(2.0, result.getRawMax(), 0.001);
        assertEquals(3, result.getSeverityWeight()); // CRITICAL weight = 3
        assertEquals(3.0, result.getEarnedWeighted(), 0.001);
        assertEquals(6.0, result.getMaxWeighted(), 0.001);
        assertEquals(3.0, result.getPointsLost(), 0.001);
        assertEquals(50.0, result.getPercentage(), 0.001);
        assertTrue(result.isRedFlagTriggered());
    }

    @Test
    @DisplayName("CHECKLIST_YNP: 1 Yes, 1 Partial, 1 No, 1 NA yields 1.5 of 3 points (NA excluded)")
    void testChecklistYnpWithNaExclusion() {
        Map<String, Object> rubricConfig = Map.of(
                "type", "CHECKLIST_YNP"
        );
        Map<String, Object> answer = Map.of(
                "items", List.of(
                        Map.of("item", "Item 1", "status", "YES"),
                        Map.of("item", "Item 2", "status", "PARTIAL"),
                        Map.of("item", "Item 3", "status", "NO"),
                        Map.of("item", "Item 4", "status", "NA")
                )
        );

        RubricEvaluationResult result = ScoringEngine.evaluateQuestion(
                "S12", "HIGH", rubricConfig, answer, "Safety gap", "Fix safety"
        );

        assertTrue(result.isAssessed());
        assertEquals(1.5, result.getRawEarned(), 0.001); // 1.0 + 0.5 + 0.0
        assertEquals(3.0, result.getRawMax(), 0.001);    // NA excluded from max
        assertEquals(2, result.getSeverityWeight());     // HIGH weight = 2
        assertEquals(3.0, result.getEarnedWeighted(), 0.001);
        assertEquals(6.0, result.getMaxWeighted(), 0.001);
        assertEquals(50.0, result.getPercentage(), 0.001);
        assertTrue(result.isRedFlagTriggered());
    }

    @Test
    @DisplayName("CHECKLIST_YNP: All items NA marked unassessed")
    void testChecklistAllNa() {
        Map<String, Object> rubricConfig = Map.of("type", "CHECKLIST_YNP");
        Map<String, Object> answer = Map.of(
                "items", List.of(
                        Map.of("item", "Item 1", "status", "NA"),
                        Map.of("item", "Item 2", "status", "NA")
                )
        );

        RubricEvaluationResult result = ScoringEngine.evaluateQuestion(
                "S12", "HIGH", rubricConfig, answer, null, null
        );

        assertFalse(result.isAssessed());
        assertEquals("All checklist items marked Not Applicable", result.getUnassessedReason());
    }

    @Test
    @DisplayName("YESNO_WITH_COUNT: Yes with zero uptake gives 50% points and triggers red flag")
    void testYesNoWithCountZeroUptake() {
        Map<String, Object> rubricConfig = Map.of("type", "YESNO_WITH_COUNT");
        Map<String, Object> answer = Map.of("available", true, "count", 0);

        RubricEvaluationResult result = ScoringEngine.evaluateQuestion(
                "S09", "HIGH", rubricConfig, answer, "No service or zero uptake", "Linkage"
        );

        assertTrue(result.isAssessed());
        assertEquals(5.0, result.getRawEarned(), 0.001);
        assertEquals(10.0, result.getRawMax(), 0.001);
        assertTrue(result.isRedFlagTriggered());
    }

    @Test
    @DisplayName("RATING_1_5: Rating 2 out of 5 produces 2.5 of 10 points and triggers red flag")
    void testRating1To5() {
        Map<String, Object> rubricConfig = Map.of("type", "RATING_1_5");
        Map<String, Object> answer = Map.of("rating", 2);

        RubricEvaluationResult result = ScoringEngine.evaluateQuestion(
                "S08", "MEDIUM", rubricConfig, answer, "<=2 flag", "Mentoring"
        );

        assertTrue(result.isAssessed());
        assertEquals(2.5, result.getRawEarned(), 0.001); // (2 - 1) / 4 * 10 = 2.5
        assertEquals(10.0, result.getRawMax(), 0.001);
        assertEquals(25.0, result.getPercentage(), 0.001);
        assertTrue(result.isRedFlagTriggered());
        assertEquals(AlertBandType.RED, result.getAlertBand());
    }

    @Test
    @DisplayName("PERCENT_THRESHOLD: >= 75% earns full points, 68% earns partial (50%), < 65% earns 0")
    void testPercentThreshold() {
        Map<String, Object> rubricConfig = Map.of(
                "type", "PERCENT_THRESHOLD",
                "threshold", 75.0,
                "partial_margin", 10.0,
                "inverted", false
        );

        // Case 1: 80% >= 75% -> 10/10
        RubricEvaluationResult r1 = ScoringEngine.evaluateQuestion(
                "S04", "HIGH", rubricConfig, Map.of("attendance_pct", 80.0), "<75%", "Plan"
        );
        assertEquals(10.0, r1.getRawEarned(), 0.001);
        assertFalse(r1.isRedFlagTriggered());
        assertEquals(AlertBandType.DARK_GREEN, r1.getAlertBand());

        // Case 2: 68% in [65, 75) -> 5/10 partial points
        RubricEvaluationResult r2 = ScoringEngine.evaluateQuestion(
                "S04", "HIGH", rubricConfig, Map.of("attendance_pct", 68.0), "<75%", "Plan"
        );
        assertEquals(5.0, r2.getRawEarned(), 0.001);
        assertTrue(r2.isRedFlagTriggered());
        assertEquals(AlertBandType.ORANGE, r2.getAlertBand());

        // Case 3: 60% < 65% -> 0/10
        RubricEvaluationResult r3 = ScoringEngine.evaluateQuestion(
                "S04", "HIGH", rubricConfig, Map.of("attendance_pct", 60.0), "<75%", "Plan"
        );
        assertEquals(0.0, r3.getRawEarned(), 0.001);
        assertTrue(r3.isRedFlagTriggered());
        assertEquals(AlertBandType.RED, r3.getAlertBand());
    }

    @Test
    @DisplayName("PERCENT_THRESHOLD Inverted: Mismatch <= 10% full, 15% partial, > 20% zero")
    void testPercentThresholdInverted() {
        Map<String, Object> rubricConfig = Map.of(
                "type", "PERCENT_THRESHOLD",
                "threshold", 10.0,
                "partial_margin", 10.0,
                "inverted", true
        );

        // Case 1: 8% <= 10% mismatch -> 10/10
        RubricEvaluationResult r1 = ScoringEngine.evaluateQuestion(
                "P13", "CRITICAL", rubricConfig, Map.of("mismatch_pct", 8.0), "Mismatch >10%", "Audit"
        );
        assertEquals(10.0, r1.getRawEarned(), 0.001);
        assertFalse(r1.isRedFlagTriggered());

        // Case 2: 15% in (10, 20] -> 5/10
        RubricEvaluationResult r2 = ScoringEngine.evaluateQuestion(
                "P13", "CRITICAL", rubricConfig, Map.of("mismatch_pct", 15.0), "Mismatch >10%", "Audit"
        );
        assertEquals(5.0, r2.getRawEarned(), 0.001);
        assertTrue(r2.isRedFlagTriggered());

        // Case 3: 25% > 20% -> 0/10
        RubricEvaluationResult r3 = ScoringEngine.evaluateQuestion(
                "P13", "CRITICAL", rubricConfig, Map.of("mismatch_pct", 25.0), "Mismatch >10%", "Audit"
        );
        assertEquals(0.0, r3.getRawEarned(), 0.001);
        assertTrue(r3.isRedFlagTriggered());
    }

    @Test
    @DisplayName("RATIO: 8 of 10 sanctioned staff working gives 80% (8 pts); Denominator 0 is unassessed")
    void testRatioRubric() {
        Map<String, Object> rubricConfig = Map.of(
                "type", "RATIO",
                "numerator_field", "working",
                "denominator_field", "sanctioned"
        );

        RubricEvaluationResult r1 = ScoringEngine.evaluateQuestion(
                "S03", "HIGH", rubricConfig, Map.of("working", 8, "sanctioned", 10), "Vacancy", "Staff action"
        );
        assertTrue(r1.isAssessed());
        assertEquals(8.0, r1.getRawEarned(), 0.001);
        assertEquals(10.0, r1.getRawMax(), 0.001);

        // Denominator 0
        RubricEvaluationResult r2 = ScoringEngine.evaluateQuestion(
                "S03", "HIGH", rubricConfig, Map.of("working", 0, "sanctioned", 0), "Vacancy", "Staff action"
        );
        assertFalse(r2.isAssessed());
        assertTrue(r2.getUnassessedReason().contains("zero"));
    }

    @Test
    @DisplayName("Critical Severity Clamp: 45% score on CRITICAL question clamped to RED")
    void testCriticalClampToRed() {
        // Normally 45% would be ORANGE (40.0 - 54.99). But Critical < 50% must be RED (Section 9.5).
        Map<String, Object> rubricConfig = Map.of(
                "type", "RATIO",
                "numerator_field", "working",
                "denominator_field", "sanctioned"
        );
        RubricEvaluationResult result = ScoringEngine.evaluateQuestion(
                "P02", "CRITICAL", rubricConfig, Map.of("working", 9, "sanctioned", 20), "Critical vacancy", "Staffing action"
        );

        assertEquals(45.0, result.getPercentage(), 0.001);
        assertEquals(AlertBandType.RED, result.getAlertBand(), "Critical question with < 50% must be clamped to RED band");
    }
}
