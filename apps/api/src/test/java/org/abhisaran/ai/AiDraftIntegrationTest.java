package org.abhisaran.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.abhisaran.ai.dto.AiDraftDTO;
import org.abhisaran.users.User;
import org.abhisaran.users.UserRole;
import org.abhisaran.users.UserRepository;
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
import org.abhisaran.scoring.AnalysisService;
import org.abhisaran.scoring.dto.AnalysisRunDTO;
import org.abhisaran.scoring.persistence.AnalysisRun;
import org.abhisaran.scoring.persistence.AnalysisRunRepository;
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
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AiDraftIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DistrictRepository districtRepository;

    @Autowired
    private PilotLocationTypeRepository typeRepository;

    @Autowired
    private PilotLocationRepository locationRepository;

    @Autowired
    private AuditPageRepository pageRepository;

    @Autowired
    private AuditAnswerRepository answerRepository;

    @Autowired
    private QuestionBankRepository questionBankRepository;

    @Autowired
    private QuestionVersionRepository questionVersionRepository;

    @Autowired
    private AnalysisService analysisService;

    @Autowired
    private AnalysisRunRepository runRepository;

    private User testAdmin;
    private District testDistrict;
    private PilotLocationType testType;

    @BeforeEach
    void setUp() {
        testAdmin = userRepository.findByLoginId("ai_admin")
                .orElseGet(() -> userRepository.save(new User(
                        UUID.randomUUID(),
                        "ai_admin",
                        UserRole.ADMIN,
                        "AI Admin",
                        "Administrator",
                        "hash",
                        false,
                        true
                )));

        testDistrict = districtRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("District seed missing"));

        testType = typeRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Pilot location type missing"));
    }

    @Test
    @WithMockUser(username = "ai_admin", roles = {"ADMIN"})
    @DisplayName("Should return AI feature status successfully")
    void testAiStatusEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/ai/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.featureEnabled", is(true)))
                .andExpect(jsonPath("$.serviceStatus", notNullValue()));
    }

    @Test
    @WithMockUser(username = "ai_admin", roles = {"ADMIN"})
    @DisplayName("Should generate assistive AI summary draft and strictly preserve scoring immutability")
    void testGenerateRunSummaryDraftAndAssertScoringImmutability() throws Exception {
        // 1. Setup auditable facility and execute scoring engine
        PilotLocation loc = createAuditableLocation();
        AnalysisRunDTO runDto = analysisService.analyseLocation(loc.getId(), testAdmin.getId(), "127.0.0.1");

        BigDecimal baselineAcsScore = runDto.getAcsScore();
        String baselineAlertBand = runDto.getAlertBand();
        assertNotNull(baselineAcsScore, "Baseline ACS score must not be null");

        // 2. Request AI Narrative Summary
        String responseJson = mockMvc.perform(post("/api/v1/ai/summarise-run/" + runDto.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.targetType", is("ANALYSIS_RUN")))
                .andExpect(jsonPath("$.targetId", is(runDto.getId().toString())))
                .andExpect(jsonPath("$.status", is("DRAFT")))
                .andExpect(jsonPath("$.outputText", notNullValue()))
                .andExpect(jsonPath("$.outputText", containsString(loc.getCode())))
                .andReturn().getResponse().getContentAsString();

        AiDraftDTO draft = objectMapper.readValue(responseJson, AiDraftDTO.class);

        // 3. ARCHITECTURAL ASSERTION: Scoring Immutability
        // Check AnalysisRun in DB to ensure zero scoring mutation occurred
        AnalysisRun runInDb = runRepository.findById(runDto.getId()).orElseThrow();
        assertEquals(baselineAcsScore, runInDb.getAcsScore(), "ACS Score must remain strictly identical!");
        assertEquals(baselineAlertBand, runInDb.getAlertBand(), "Alert Band must remain strictly identical!");
        assertEquals("COMPLETED", runInDb.getStatus(), "AnalysisRun status must remain COMPLETED!");

        // 4. Test Accept Draft
        mockMvc.perform(post("/api/v1/ai/drafts/" + draft.getId() + "/accept"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ACCEPTED")))
                .andExpect(jsonPath("$.acceptedByUsername", is("ai_admin")))
                .andExpect(jsonPath("$.acceptedAt", notNullValue()));

        // Check scoring is STILL unchanged after accept
        AnalysisRun runAfterAccept = runRepository.findById(runDto.getId()).orElseThrow();
        assertEquals(baselineAcsScore, runAfterAccept.getAcsScore(), "ACS Score must not change when draft is accepted!");

        // 5. Test Reject Draft
        mockMvc.perform(post("/api/v1/ai/drafts/" + draft.getId() + "/reject"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("REJECTED")));
    }

    @Test
    @WithMockUser(username = "officer_user", roles = {"OFFICER"})
    @DisplayName("Should prohibit Government Officer from invoking AI endpoints (HTTP 403)")
    void testOfficerAccessForbidden() throws Exception {
        UUID fakeRunId = UUID.randomUUID();
        mockMvc.perform(post("/api/v1/ai/summarise-run/" + fakeRunId))
                .andExpect(status().isForbidden());
    }

    private PilotLocation createAuditableLocation() {
        String code = "JH-TST-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        PilotLocation loc = locationRepository.save(new PilotLocation(
                UUID.randomUUID(),
                code,
                testType,
                testDistrict,
                null,
                null,
                "READY_FOR_ANALYSIS",
                false,
                testAdmin
        ));

        AuditPage page = pageRepository.save(new AuditPage(
                UUID.randomUUID(),
                loc,
                1,
                "SUBMITTED",
                testAdmin
        ));

        QuestionBank qb = questionBankRepository.findAll().stream()
                .filter(QuestionBank::isScoredDefault)
                .findFirst()
                .orElseThrow();
        QuestionVersion qv = questionVersionRepository.findTopByQuestionIdOrderByVersionNumberDesc(qb.getId()).orElseThrow();

        answerRepository.save(new AuditAnswer(
                UUID.randomUUID(),
                page,
                qb,
                qv,
                "{\"rows\":[{\"name\":\"Tap\",\"available\":true,\"functional\":false}],\"rating\":2,\"percentage\":50,\"working\":5,\"sanctioned\":10,\"items\":[{\"item\":\"Check\",\"status\":\"NO\"}],\"selectedOption\":\"YES\"}",
                false,
                null,
                false,
                null
        ));

        return loc;
    }
}
