package org.abhisaran.dashboard;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.abhisaran.audit.AuditAnswer;
import org.abhisaran.audit.AuditAnswerRepository;
import org.abhisaran.audit.AuditPage;
import org.abhisaran.audit.AuditPageRepository;
import org.abhisaran.geography.District;
import org.abhisaran.geography.DistrictRepository;
import org.abhisaran.dashboard.dto.BulkAnalyseRequest;
import org.abhisaran.delivery.persistence.DeliveryRepository;
import org.abhisaran.facilities.PilotLocation;
import org.abhisaran.facilities.PilotLocationRepository;
import org.abhisaran.facilities.PilotLocationType;
import org.abhisaran.facilities.PilotLocationTypeRepository;
import org.abhisaran.officers.OfficerScopingService;
import org.abhisaran.questions.QuestionBank;
import org.abhisaran.questions.QuestionBankRepository;
import org.abhisaran.questions.QuestionVersion;
import org.abhisaran.questions.QuestionVersionRepository;
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

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class DashboardIntegrationTest {

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
    private DeliveryRepository deliveryRepository;

    @Autowired
    private OfficerScopingService officerScopingService;

    private User testAdmin;
    private District testDistrict;
    private PilotLocationType testType;

    @BeforeEach
    void setUp() {
        testAdmin = userRepository.findByLoginId("dashboard_admin")
                .orElseGet(() -> userRepository.save(new User(
                        UUID.randomUUID(),
                        "dashboard_admin",
                        UserRole.ADMIN,
                        "Dashboard Admin",
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
    @WithMockUser(username = "dashboard_admin", roles = {"ADMIN"})
    @DisplayName("Should retrieve dashboard overview metrics and verify non-ranking sort order by code")
    void testDashboardOverviewNonRanking() throws Exception {
        // Ensure at least two locations exist
        createLocationWithCode("JH-TST-DASH-A01");
        createLocationWithCode("JH-TST-DASH-B02");

        mockMvc.perform(get("/api/v1/dashboard/overview")
                        .param("page", "0")
                        .param("size", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metrics.totalLocations", greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.items", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(result -> {
                    String json = result.getResponse().getContentAsString();
                    var root = objectMapper.readTree(json);
                    var items = root.get("items");

                    // Assert strictly non-ranking rule: rows must be sorted by code ASC
                    String previousCode = "";
                    for (int i = 0; i < items.size(); i++) {
                        String currentCode = items.get(i).get("code").asText();
                        assertTrue(currentCode.compareToIgnoreCase(previousCode) >= 0,
                                "Non-ranking violation: " + currentCode + " appeared after " + previousCode);
                        previousCode = currentCode;
                    }
                });
    }

    @Test
    @WithMockUser(username = "dashboard_admin", roles = {"ADMIN"})
    @DisplayName("Should execute bulk analysis across multiple ready locations and deliver to scoped officers")
    void testBulkAnalyseExecution() throws Exception {
        // 1. Create officer scoped to test district
        User testOfficer = userRepository.findByLoginId("dash_officer")
                .orElseGet(() -> userRepository.save(new User(
                        UUID.randomUUID(),
                        "dash_officer",
                        UserRole.OFFICER,
                        "Dash District Officer",
                        "DEO",
                        "hash",
                        false,
                        true
                )));
        officerScopingService.updateOfficerDistricts(testOfficer.getId(), List.of(testDistrict.getId()), testAdmin.getId(), "127.0.0.1");

        // 2. Setup 2 auditable locations with pages and answers
        PilotLocation loc1 = createAuditableLocation();
        PilotLocation loc2 = createAuditableLocation();

        BulkAnalyseRequest request = new BulkAnalyseRequest(List.of(loc1.getId(), loc2.getId()));

        mockMvc.perform(post("/api/v1/dashboard/bulk-analyse")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRequested", is(2)))
                .andExpect(jsonPath("$.totalSuccess", is(2)))
                .andExpect(jsonPath("$.totalFailed", is(0)))
                .andExpect(jsonPath("$.results", hasSize(2)))
                .andExpect(jsonPath("$.results[0].success", is(true)))
                .andExpect(jsonPath("$.results[0].acsScore", notNullValue()))
                .andExpect(jsonPath("$.results[0].deliveredOfficersCount", greaterThanOrEqualTo(1)));

        // Verify status flipped to ANALYSED
        PilotLocation updatedLoc1 = locationRepository.findById(loc1.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("ANALYSED", updatedLoc1.getStatus());

        // Verify deliveries created for officer
        long deliveriesCount = deliveryRepository.countByOfficerId(testOfficer.getId());
        assertTrue(deliveriesCount >= 2, "Expected at least 2 deliveries for officer");
    }

    @Test
    @WithMockUser(username = "dashboard_admin", roles = {"ADMIN"})
    @DisplayName("Should search and retrieve append-only security audit log entries as Admin")
    void testAuditLogRetrievalAsAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/audit-log")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", notNullValue()))
                .andExpect(jsonPath("$.totalElements", greaterThanOrEqualTo(1)));
    }

    @Test
    @WithMockUser(username = "dash_officer", roles = {"OFFICER"})
    @DisplayName("Should prohibit Government Officer from accessing administrative audit logs (HTTP 403)")
    void testAuditLogAccessDeniedForOfficer() throws Exception {
        mockMvc.perform(get("/api/v1/audit-log"))
                .andExpect(status().isForbidden());
    }

    private PilotLocation createLocationWithCode(String code) {
        return locationRepository.findByCode(code).orElseGet(() ->
                locationRepository.save(new PilotLocation(
                        UUID.randomUUID(),
                        code,
                        testType,
                        testDistrict,
                        null,
                        null,
                        "REGISTERED",
                        false,
                        testAdmin
                ))
        );
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
