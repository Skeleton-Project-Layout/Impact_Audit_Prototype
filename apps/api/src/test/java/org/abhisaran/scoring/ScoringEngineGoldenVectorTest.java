package org.abhisaran.scoring;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.abhisaran.scoring.model.LocationAssessmentInput;
import org.abhisaran.scoring.model.LocationScoreResult;
import org.abhisaran.scoring.model.QuestionAssessmentInput;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ScoringEngineGoldenVectorTest {

    private final ObjectMapper mapper = new ObjectMapper();

    private File locateGoldenVector(String fileName) {
        File file = new File("../../shared/golden-vectors", fileName);
        if (file.exists()) return file;
        file = new File("shared/golden-vectors", fileName);
        if (file.exists()) return file;
        file = new File("../shared/golden-vectors", fileName);
        if (file.exists()) return file;
        throw new IllegalStateException("Could not find golden vector file: " + fileName);
    }

    @SuppressWarnings("unchecked")
    private LocationAssessmentInput parseGoldenVector(String fileName) throws IOException {
        File file = locateGoldenVector(fileName);
        Map<String, Object> root = mapper.readValue(file, new TypeReference<>() {});

        String locationId = (String) root.get("location_id");
        List<Map<String, Object>> qList = (List<Map<String, Object>>) root.get("questions");

        List<QuestionAssessmentInput> questions = new ArrayList<>();
        if (qList != null) {
            for (Map<String, Object> qMap : qList) {
                QuestionAssessmentInput q = new QuestionAssessmentInput();
                q.setPageId((String) qMap.get("page_id"));
                q.setPageNumber(qMap.get("page_number") != null ? ((Number) qMap.get("page_number")).intValue() : 1);
                q.setQuestionId((String) qMap.get("question_id"));
                q.setQuestionText((String) qMap.get("question_text"));
                q.setSection((String) qMap.get("section"));
                q.setSeverity((String) qMap.get("severity"));
                if (qMap.get("weight_override") != null) {
                    q.setWeightOverride(((Number) qMap.get("weight_override")).intValue());
                }
                q.setRubricConfig((Map<String, Object>) qMap.get("rubric_config"));
                q.setAnswerValue((Map<String, Object>) qMap.get("answer_value"));
                q.setNa(Boolean.TRUE.equals(qMap.get("is_na")));
                q.setNaReason((String) qMap.get("na_reason"));
                q.setNotAssessed(Boolean.TRUE.equals(qMap.get("is_not_assessed")));
                q.setNotAssessedReason((String) qMap.get("not_assessed_reason"));
                q.setRedFlagLogic((String) qMap.get("red_flag_logic"));
                q.setSuggestedIntervention((String) qMap.get("suggested_intervention"));
                questions.add(q);
            }
        }

        return new LocationAssessmentInput(locationId, "test-sub-001", questions);
    }

    @Test
    @DisplayName("Golden Vector 1: Canonical 4-Page Pooled Audit strictly matches Section 7 worked example")
    void testCanonical4PageAudit() throws IOException {
        LocationAssessmentInput input = parseGoldenVector("canonical_4page_audit.json");
        LocationScoreResult result = ScoringEngine.evaluateLocationAudit(input);

        assertNotNull(result);
        assertEquals(90.00, result.getAcsScore(), 0.001);
        assertEquals(AlertBandType.DARK_GREEN, result.getAlertBand());
        assertFalse(result.isProvisional());
        assertEquals(100.00, result.getCoveragePct(), 0.001);
        assertEquals(8, result.getTotalApplicableQuestions());
        assertEquals(8, result.getTotalAssessedQuestions());
        assertEquals(100.00, result.getTotalMaxWeightedPoints(), 0.001);
        assertEquals(90.00, result.getTotalEarnedWeightedPoints(), 0.001);
        assertEquals(10.00, result.getTotalDeductionsWeightedPoints(), 0.001);

        // Strict mathematical balance assertion
        assertTrue(result.isLedgerBalanced(), "Deduction ledger must strictly balance to 100 - ACS");
        assertEquals(0.0, result.getLedgerBalanceDiff(), 0.001);
        assertEquals(10.00, result.getLedgerSum(), 0.001);
        assertEquals(4, result.getDeductionLedger().size());

        // Verify ordering: top deduction first (-3.00)
        assertEquals(3.00, result.getDeductionLedger().get(0).getDeductionPercentage(), 0.001);
        assertEquals(1.00, result.getDeductionLedger().get(3).getDeductionPercentage(), 0.001);
    }

    @Test
    @DisplayName("Golden Vector 2: Perfect score audit yields 100.00 ACS and zero ledger deductions")
    void testPerfectScoreAudit() throws IOException {
        LocationAssessmentInput input = parseGoldenVector("perfect_score_audit.json");
        LocationScoreResult result = ScoringEngine.evaluateLocationAudit(input);

        assertNotNull(result);
        assertEquals(100.00, result.getAcsScore(), 0.001);
        assertEquals(AlertBandType.DARK_GREEN, result.getAlertBand());
        assertFalse(result.isProvisional());
        assertEquals(100.00, result.getCoveragePct(), 0.001);
        assertEquals(0.00, result.getLedgerSum(), 0.001);
        assertTrue(result.getDeductionLedger().isEmpty());
        assertTrue(result.isLedgerBalanced());
    }

    @Test
    @DisplayName("Golden Vector 3: Severe critical gaps trigger Section 9.5 clamp and RED alert band")
    void testSevereCriticalGapsAudit() throws IOException {
        LocationAssessmentInput input = parseGoldenVector("severe_critical_gaps_audit.json");
        LocationScoreResult result = ScoringEngine.evaluateLocationAudit(input);

        assertNotNull(result);
        assertEquals(36.00, result.getAcsScore(), 0.001);
        assertEquals(AlertBandType.RED, result.getAlertBand());
        assertFalse(result.isProvisional());

        // Assert 2 critical questions clamped to RED
        long clampedRedCount = result.getEvaluatedItems().stream()
                .filter(it -> it.isClampedRed() || ("CRITICAL".equalsIgnoreCase(it.getSeverity()) && it.getAlertBand() == AlertBandType.RED))
                .count();
        assertEquals(2, clampedRedCount);

        // Assert strictly balanced ledger
        assertTrue(result.isLedgerBalanced());
        assertEquals(64.00, result.getLedgerSum(), 0.001);
        assertEquals(64.00, 100.00 - result.getAcsScore(), 0.001);
    }

    @Test
    @DisplayName("Golden Vector 4: Low coverage (< 70%) generates PROVISIONAL badge")
    void testProvisionalLowCoverageAudit() throws IOException {
        LocationAssessmentInput input = parseGoldenVector("provisional_low_coverage_audit.json");
        LocationScoreResult result = ScoringEngine.evaluateLocationAudit(input);

        assertNotNull(result);
        assertEquals(60.00, result.getCoveragePct(), 0.001);
        assertTrue(result.isProvisional(), "Must be flagged PROVISIONAL when coverage < 70%");
        assertEquals(90.00, result.getAcsScore(), 0.001);
        assertTrue(result.isLedgerBalanced());
        assertEquals(10.00, result.getLedgerSum(), 0.001);
    }

    @Test
    @DisplayName("Golden Vector 5: Zero scored questions assessed yields null ACS and 0% coverage")
    void testZeroDenominatorUnassessedAudit() throws IOException {
        LocationAssessmentInput input = parseGoldenVector("zero_denominator_unassessed_audit.json");
        LocationScoreResult result = ScoringEngine.evaluateLocationAudit(input);

        assertNotNull(result);
        assertNull(result.getAcsScore(), "ACS must be null ('Not calculable'), never a synthetic 0");
        assertNull(result.getAlertBand());
        assertEquals(0.00, result.getCoveragePct(), 0.001);
        assertTrue(result.isProvisional());
        assertEquals(1, result.getTotalApplicableQuestions());
        assertEquals(0, result.getTotalAssessedQuestions());
        assertTrue(result.getDeductionLedger().isEmpty());
    }
}
