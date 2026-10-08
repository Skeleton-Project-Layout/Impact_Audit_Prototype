package org.abhisaran.scoring;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.abhisaran.audit.AuditAnswer;
import org.abhisaran.audit.AuditAnswerRepository;
import org.abhisaran.audit.AuditPage;
import org.abhisaran.audit.AuditPageRepository;
import org.abhisaran.facilities.PilotLocation;
import org.abhisaran.facilities.PilotLocationRepository;
import org.abhisaran.facilities.PilotLocationType;
import org.abhisaran.facilities.PilotLocationTypeRepository;
import org.abhisaran.geography.District;
import org.abhisaran.geography.DistrictRepository;
import org.abhisaran.questions.QuestionBank;
import org.abhisaran.questions.QuestionBankRepository;
import org.abhisaran.questions.QuestionVersion;
import org.abhisaran.questions.QuestionVersionRepository;
import org.abhisaran.scoring.persistence.*;
import org.abhisaran.users.User;
import org.abhisaran.users.UserRepository;
import org.abhisaran.users.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AnalysisIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PilotLocationRepository locationRepository;

    @Autowired
    private PilotLocationTypeRepository typeRepository;

    @Autowired
    private DistrictRepository districtRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuestionBankRepository questionBankRepository;

    @Autowired
    private QuestionVersionRepository questionVersionRepository;

    @Autowired
    private AuditPageRepository pageRepository;

    @Autowired
    private AuditAnswerRepository answerRepository;

    @Autowired
    private AnalysisRunRepository runRepository;

    @Autowired
    private AnalysisItemRepository itemRepository;

    @Autowired
    private AnalysisLedgerRepository ledgerRepository;

    private PilotLocation testLocation;
    private User testAdmin;
    private AuditPage testPage;
    private QuestionBank qbS11;
    private QuestionBank qbS01;
    private QuestionVersion qvS11;
    private QuestionVersion qvS01;

    @BeforeEach
    void setUp() {
        testAdmin = userRepository.findByLoginId("scoring_admin")
                .orElseGet(() -> userRepository.save(new User(
                        UUID.randomUUID(),
                        "scoring_admin",
                        UserRole.ADMIN,
                        "Scoring Admin",
                        "Administrator",
                        "hash",
                        false,
                        true
                )));

        District district = districtRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("District seed missing"));

        PilotLocationType type = typeRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Pilot location type missing"));

        String uniqueCode = "JH-TST-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        testLocation = locationRepository.save(new PilotLocation(
                UUID.randomUUID(),
                uniqueCode,
                type,
                district,
                null,
                null,
                "REGISTERED",
                false,
                testAdmin
        ));

        testPage = pageRepository.save(new AuditPage(
                UUID.randomUUID(),
                testLocation,
                1,
                "SUBMITTED",
                testAdmin
        ));

        // Use seeded questions from Flyway V3
        qbS11 = questionBankRepository.findAll().stream()
                .filter(QuestionBank::isScoredDefault)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No seeded questions in question_bank"));

        qvS11 = questionVersionRepository.findTopByQuestionIdOrderByVersionNumberDesc(qbS11.getId())
                .orElseThrow(() -> new IllegalStateException("No active version for question: " + qbS11.getId()));

        qbS01 = questionBankRepository.findAll().stream()
                .filter(q -> q.isScoredDefault() && !q.getId().equals(qbS11.getId()))
                .findFirst()
                .orElse(qbS11);

        qvS01 = questionVersionRepository.findTopByQuestionIdOrderByVersionNumberDesc(qbS01.getId())
                .orElse(qvS11);

        // Answer 1: S11 (or qbS11) loses points
        answerRepository.save(new AuditAnswer(
                UUID.randomUUID(),
                testPage,
                qbS11,
                qvS11,
                "{\"rows\":[{\"name\":\"Tap\",\"available\":true,\"functional\":false}],\"rating\":2,\"percentage\":50,\"working\":5,\"sanctioned\":10,\"items\":[{\"item\":\"Check\",\"status\":\"NO\"}]}",
                false,
                null,
                false,
                null
        ));

        // Answer 2: S01 (or qbS01) full marks
        answerRepository.save(new AuditAnswer(
                UUID.randomUUID(),
                testPage,
                qbS01,
                qvS01,
                "{\"rows\":[{\"name\":\"Tap\",\"available\":true,\"functional\":true}],\"rating\":5,\"percentage\":90,\"working\":10,\"sanctioned\":10,\"items\":[{\"item\":\"Check\",\"status\":\"YES\"}]}",
                false,
                null,
                false,
                null
        ));
    }

    @Test
    @DisplayName("POST /api/v1/locations/{id}/analyse performs deterministic scoring and persists balanced ledger")
    @WithMockUser(username = "scoring_admin", roles = {"STATE_ADMIN"})
    void testTriggerLocationAnalysis() throws Exception {
        mockMvc.perform(post("/api/v1/locations/" + testLocation.getId() + "/analyse")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pilotLocationId", is(testLocation.getId().toString())))
                .andExpect(jsonPath("$.acsScore", notNullValue()))
                .andExpect(jsonPath("$.alertBand", notNullValue()))
                .andExpect(jsonPath("$.ledgerBalanced", is(true)))
                .andExpect(jsonPath("$.items", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.ledger", notNullValue()));

        // Verify Database Persistence
        List<AnalysisRun> runs = runRepository.findByPilotLocationIdOrderByAnalyzedAtDesc(testLocation.getId());
        assertFalse(runs.isEmpty());

        AnalysisRun run = runs.get(0);
        assertNotNull(run.getAcsScore());

        PilotLocation reloadedLoc = locationRepository.findById(testLocation.getId()).orElseThrow();
        assertEquals("ANALYSED", reloadedLoc.getStatus());

        List<AnalysisItem> items = itemRepository.findByAnalysisRunIdOrderByPageNumberAsc(run.getId());
        assertFalse(items.isEmpty());

        List<AnalysisLedgerEntry> ledger = ledgerRepository.findByAnalysisRunIdOrderByLostWeightedPointsDesc(run.getId());

        // Verify Strict Mathematical Balance in PostgreSQL
        BigDecimal ledgerSum = ledger.stream()
                .map(AnalysisLedgerEntry::getDeductionPercentage)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal expectedLoss = BigDecimal.valueOf(100).subtract(run.getAcsScore());
        BigDecimal diff = expectedLoss.subtract(ledgerSum).abs();
        assertTrue(diff.compareTo(new BigDecimal("0.01")) <= 0,
                "Database ledger sum (" + ledgerSum + ") must strictly balance with 100 - ACS (" + expectedLoss + ")");
    }

    @Test
    @DisplayName("GET /api/v1/locations/{id}/analysis/latest retrieves latest analysis run")
    @WithMockUser(username = "scoring_admin", roles = {"STATE_ADMIN"})
    void testGetLatestAnalysis() throws Exception {
        // First trigger analysis
        mockMvc.perform(post("/api/v1/locations/" + testLocation.getId() + "/analyse")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Then retrieve latest
        mockMvc.perform(get("/api/v1/locations/" + testLocation.getId() + "/analysis/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.facilityCode", is(testLocation.getCode())))
                .andExpect(jsonPath("$.acsScore", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/v1/analysis/{runId} retrieves specific run by ID")
    @WithMockUser(username = "scoring_admin", roles = {"STATE_ADMIN"})
    void testGetAnalysisById() throws Exception {
        String respJson = mockMvc.perform(post("/api/v1/locations/" + testLocation.getId() + "/analyse")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String runId = objectMapper.readTree(respJson).get("id").asText();

        mockMvc.perform(get("/api/v1/analysis/" + runId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(runId)))
                .andExpect(jsonPath("$.status", is("COMPLETED")));
    }
}
