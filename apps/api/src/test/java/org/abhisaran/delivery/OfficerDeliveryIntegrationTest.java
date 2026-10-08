package org.abhisaran.delivery;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.abhisaran.audit.AuditAnswer;
import org.abhisaran.audit.AuditAnswerRepository;
import org.abhisaran.audit.AuditPage;
import org.abhisaran.audit.AuditPageRepository;
import org.abhisaran.delivery.dto.AcknowledgeDeliveryRequest;
import org.abhisaran.delivery.persistence.Delivery;
import org.abhisaran.delivery.persistence.DeliveryRepository;
import org.abhisaran.facilities.PilotLocation;
import org.abhisaran.facilities.PilotLocationRepository;
import org.abhisaran.facilities.PilotLocationType;
import org.abhisaran.facilities.PilotLocationTypeRepository;
import org.abhisaran.geography.District;
import org.abhisaran.geography.DistrictRepository;
import org.abhisaran.officers.OfficerScopingService;
import org.abhisaran.officers.dto.CreateOfficerRequest;
import org.abhisaran.officers.persistence.OfficerDistrict;
import org.abhisaran.officers.persistence.OfficerDistrictRepository;
import org.abhisaran.questions.QuestionBank;
import org.abhisaran.questions.QuestionBankRepository;
import org.abhisaran.questions.QuestionVersion;
import org.abhisaran.questions.QuestionVersionRepository;
import org.abhisaran.scoring.AnalysisService;
import org.abhisaran.scoring.dto.AnalysisRunDTO;
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
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OfficerDeliveryIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DistrictRepository districtRepository;

    @Autowired
    private PilotLocationRepository locationRepository;

    @Autowired
    private PilotLocationTypeRepository typeRepository;

    @Autowired
    private QuestionBankRepository questionBankRepository;

    @Autowired
    private QuestionVersionRepository questionVersionRepository;

    @Autowired
    private AuditPageRepository pageRepository;

    @Autowired
    private AuditAnswerRepository answerRepository;

    @Autowired
    private OfficerDistrictRepository officerDistrictRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private AnalysisService analysisService;

    @Autowired
    private OfficerScopingService scopingService;

    private User adminUser;
    private User officerRanchi;
    private User officerDhanbad;
    private District ranchiDistrict;
    private District dhanbadDistrict;
    private PilotLocation ranchiLocation;

    @BeforeEach
    void setUp() {
        adminUser = userRepository.findByLoginId("delivery_test_admin").orElseGet(() ->
                userRepository.save(new User(UUID.randomUUID(), "delivery_test_admin", UserRole.ADMIN, "Admin", "Admin", "hash", false, true))
        );

        ranchiDistrict = districtRepository.findById(1).orElseThrow();
        dhanbadDistrict = districtRepository.findById(2).orElseThrow();

        officerRanchi = userRepository.findByLoginId("test_officer_ranchi").orElseGet(() -> {
            User u = userRepository.save(new User(UUID.randomUUID(), "test_officer_ranchi", UserRole.OFFICER, "Officer Ranchi", "District Officer", "hash", false, true));
            officerDistrictRepository.save(new OfficerDistrict(u, ranchiDistrict, adminUser));
            return u;
        });

        officerDhanbad = userRepository.findByLoginId("test_officer_dhanbad").orElseGet(() -> {
            User u = userRepository.save(new User(UUID.randomUUID(), "test_officer_dhanbad", UserRole.OFFICER, "Officer Dhanbad", "District Officer", "hash", false, true));
            officerDistrictRepository.save(new OfficerDistrict(u, dhanbadDistrict, adminUser));
            return u;
        });

        PilotLocationType schoolType = typeRepository.findAll().stream().findFirst().orElseThrow();
        ranchiLocation = locationRepository.save(new PilotLocation(
                UUID.randomUUID(),
                "JH-TST-RCH-" + (int)(Math.random() * 9000 + 1000),
                schoolType,
                ranchiDistrict,
                null,
                null,
                "REGISTERED",
                false,
                adminUser
        ));

        // Seed audit page and answers for ranchiLocation
        AuditPage page = pageRepository.save(new AuditPage(
                UUID.randomUUID(),
                ranchiLocation,
                1,
                "SUBMITTED",
                adminUser
        ));

        QuestionBank qbS11 = questionBankRepository.findAll().stream()
                .filter(QuestionBank::isScoredDefault)
                .findFirst()
                .orElseThrow();
        QuestionVersion qvS11 = questionVersionRepository.findTopByQuestionIdOrderByVersionNumberDesc(qbS11.getId()).orElseThrow();

        answerRepository.save(new AuditAnswer(
                UUID.randomUUID(),
                page,
                qbS11,
                qvS11,
                "{\"rows\":[{\"name\":\"Tap\",\"available\":true,\"functional\":true}],\"rating\":4,\"percentage\":80,\"working\":8,\"sanctioned\":10,\"items\":[{\"item\":\"Check\",\"status\":\"YES\"}]}",
                false,
                null,
                false,
                null
        ));
    }

    @Test
    @DisplayName("Analysis execution creates atomic deliveries for all officers in the location district")
    void testAtomicDeliveryOnAnalysis() {
        AnalysisRunDTO run = analysisService.analyseLocation(ranchiLocation.getId(), adminUser.getId(), "127.0.0.1");
        assertNotNull(run);

        // Verify Delivery table has entry for officerRanchi
        boolean deliveredToRanchi = deliveryRepository.existsByOfficerIdAndAnalysisRunId(officerRanchi.getId(), run.getId());
        assertTrue(deliveredToRanchi, "Delivery must be created for officer assigned to Ranchi");

        // Verify delivery was NOT created for officerDhanbad
        boolean deliveredToDhanbad = deliveryRepository.existsByOfficerIdAndAnalysisRunId(officerDhanbad.getId(), run.getId());
        assertFalse(deliveredToDhanbad, "Delivery must NOT be created for officer assigned exclusively to Dhanbad");
    }

    @Test
    @WithMockUser(username = "test_officer_ranchi", roles = {"OFFICER"})
    @DisplayName("Officer Inbox returns district deliveries and blocks out-of-jurisdiction access")
    void testOfficerInboxAndScopedAccess() throws Exception {
        AnalysisRunDTO run = analysisService.analyseLocation(ranchiLocation.getId(), adminUser.getId(), "127.0.0.1");

        // Officer Ranchi can see delivery in inbox
        mockMvc.perform(get("/api/v1/me/inbox"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDeliveries", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.deliveries[0].locationCode", is(ranchiLocation.getCode())))
                .andExpect(jsonPath("$.deliveries[0].districtName", is("Ranchi")));

        // Officer Ranchi can access scoped analysis details
        mockMvc.perform(get("/api/v1/me/results/" + run.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.facilityCode", is(ranchiLocation.getCode())))
                .andExpect(jsonPath("$.acsScore", notNullValue()));
    }

    @Test
    @WithMockUser(username = "test_officer_dhanbad", roles = {"OFFICER"})
    @DisplayName("Officer outside district cannot access result (strict isolation check)")
    void testStrictDistrictIsolation() throws Exception {
        AnalysisRunDTO run = analysisService.analyseLocation(ranchiLocation.getId(), adminUser.getId(), "127.0.0.1");

        // Officer Dhanbad attempts to access Ranchi analysis run
        mockMvc.perform(get("/api/v1/me/results/" + run.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test_officer_ranchi", roles = {"OFFICER"})
    @DisplayName("Delivery read and acknowledgment flow updates timestamps and notes")
    void testReadAndAcknowledgeFlow() throws Exception {
        AnalysisRunDTO run = analysisService.analyseLocation(ranchiLocation.getId(), adminUser.getId(), "127.0.0.1");

        Delivery delivery = deliveryRepository.findByOfficerIdAndAnalysisRunId(officerRanchi.getId(), run.getId()).orElseThrow();
        assertNull(delivery.getReadAt());
        assertNull(delivery.getAcknowledgedAt());

        // Mark as read
        mockMvc.perform(post("/api/v1/me/deliveries/" + delivery.getId() + "/read"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read", is(true)));

        // Acknowledge with notes
        AcknowledgeDeliveryRequest req = new AcknowledgeDeliveryRequest("Noted. Forwarded to Sub-Divisional Officer for compliance review.");
        mockMvc.perform(post("/api/v1/me/deliveries/" + delivery.getId() + "/acknowledge")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.acknowledged", is(true)))
                .andExpect(jsonPath("$.acknowledgmentNotes", containsString("Sub-Divisional Officer")));

        Delivery updated = deliveryRepository.findById(delivery.getId()).orElseThrow();
        assertNotNull(updated.getReadAt());
        assertNotNull(updated.getAcknowledgedAt());
        assertEquals("Noted. Forwarded to Sub-Divisional Officer for compliance review.", updated.getAcknowledgmentNotes());
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    @DisplayName("Admin can create new officer and backfill past deliveries")
    void testAdminCreateOfficerAndBackfill() throws Exception {
        // First ensure an analysis run exists for Ranchi
        AnalysisRunDTO run = analysisService.analyseLocation(ranchiLocation.getId(), adminUser.getId(), "127.0.0.1");

        String uniqueLogin = "officer_" + UUID.randomUUID().toString().substring(0, 8);
        CreateOfficerRequest req = new CreateOfficerRequest();
        req.setLoginId(uniqueLogin);
        req.setDisplayName("New Pilot Officer");
        req.setDesignation("Assistant Collector");
        req.setPassword("Officer#Secret2026!");
        req.setDistrictIds(List.of(1)); // Ranchi

        mockMvc.perform(post("/api/v1/officers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.loginId", is(uniqueLogin)))
                .andExpect(jsonPath("$.totalDeliveries", greaterThanOrEqualTo(1)));

        User created = userRepository.findByLoginId(uniqueLogin).orElseThrow();
        assertTrue(deliveryRepository.existsByOfficerIdAndAnalysisRunId(created.getId(), run.getId()),
                "Historical analysis runs must be back-filled upon district scope assignment");
    }
}
