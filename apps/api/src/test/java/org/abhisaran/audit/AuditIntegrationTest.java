package org.abhisaran.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.abhisaran.audit.dto.AnswerBatchSaveRequest;
import org.abhisaran.audit.dto.AnswerSaveDTO;
import org.abhisaran.audit.dto.ReopenRequestDTO;
import org.abhisaran.audit.evidence.EvidenceService;
import org.abhisaran.facilities.PilotLocation;
import org.abhisaran.facilities.PilotLocationRepository;
import org.abhisaran.facilities.PilotLocationType;
import org.abhisaran.facilities.PilotLocationTypeRepository;
import org.abhisaran.geography.District;
import org.abhisaran.geography.DistrictRepository;
import org.abhisaran.questions.QuestionBank;
import org.abhisaran.questions.QuestionBankRepository;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuditIntegrationTest {

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
    private EvidenceService evidenceService;

    private PilotLocation testLocation;
    private User testAdmin;

    @BeforeEach
    void setUp() {
        testAdmin = userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.ADMIN)
                .findFirst()
                .orElseGet(() -> userRepository.save(new User(
                        UUID.randomUUID(),
                        "audit_admin",
                        UserRole.ADMIN,
                        "Audit Admin",
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
    }

    @Test
    @WithMockUser(username = "audit_admin", roles = {"ADMIN"})
    @DisplayName("Should create and retrieve audit pages with sequential page numbers")
    void testCreateAndGetAuditPages() throws Exception {
        // First get overview -> auto-creates Page 1
        mockMvc.perform(get("/api/v1/locations/" + testLocation.getId() + "/pages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.locationCode", is(testLocation.getCode())))
                .andExpect(jsonPath("$.pages", hasSize(1)))
                .andExpect(jsonPath("$.pages[0].pageNumber", is(1)))
                .andExpect(jsonPath("$.pages[0].status", is("DRAFT")));

        // Create Page 2
        mockMvc.perform(post("/api/v1/locations/" + testLocation.getId() + "/pages"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.pageNumber", is(2)))
                .andExpect(jsonPath("$.status", is("DRAFT")));

        // Verify overview now has 2 pages
        mockMvc.perform(get("/api/v1/locations/" + testLocation.getId() + "/pages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pages", hasSize(2)))
                .andExpect(jsonPath("$.pages[1].pageNumber", is(2)));
    }

    @Test
    @WithMockUser(username = "audit_admin", roles = {"ADMIN"})
    @DisplayName("Should save valid answers and reject prohibited PII (Aadhaar, Phone, Email)")
    void testSaveAnswersAndPiiDetection() throws Exception {
        // Create page
        AuditPage page = pageRepository.save(new AuditPage(UUID.randomUUID(), testLocation, 1, "DRAFT", testAdmin));

        // 1. Valid answer batch
        AnswerBatchSaveRequest validReq = new AnswerBatchSaveRequest(List.of(
                new AnswerSaveDTO(
                        "S04",
                        null,
                        Map.of("available", true, "functional", true, "used", true),
                        false,
                        null,
                        false,
                        null
                )
        ));

        mockMvc.perform(put("/api/v1/pages/" + page.getId() + "/answers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SYNCED")));

        // Verify answer was persisted
        List<AuditAnswer> answers = answerRepository.findByAuditPageId(page.getId());
        assertEquals(1, answers.size());
        assertEquals("S04", answers.get(0).getQuestion().getId());

        // 2. Reject 12-digit Aadhaar number
        AnswerBatchSaveRequest aadhaarReq = new AnswerBatchSaveRequest(List.of(
                new AnswerSaveDTO(
                        "S04",
                        null,
                        Map.of("notes", "Inspector contacted 2345 6789 0123 for school key"),
                        false,
                        null,
                        false,
                        null
                )
        ));

        mockMvc.perform(put("/api/v1/pages/" + page.getId() + "/answers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(aadhaarReq)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error", containsString("Aadhaar")));

        // 3. Reject 10-digit mobile phone
        AnswerBatchSaveRequest phoneReq = new AnswerBatchSaveRequest(List.of(
                new AnswerSaveDTO(
                        "S04",
                        null,
                        Map.of("notes", "Call principal at 9876543210"),
                        false,
                        null,
                        false,
                        null
                )
        ));

        mockMvc.perform(put("/api/v1/pages/" + page.getId() + "/answers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(phoneReq)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error", containsString("mobile number")));

        // 4. Reject email address
        AnswerBatchSaveRequest emailReq = new AnswerBatchSaveRequest(List.of(
                new AnswerSaveDTO(
                        "S04",
                        null,
                        Map.of("notes", "Forward audit report to officer@gov.in immediately"),
                        false,
                        null,
                        false,
                        null
                )
        ));

        mockMvc.perform(put("/api/v1/pages/" + page.getId() + "/answers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emailReq)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error", containsString("email address")));
    }

    @Test
    @WithMockUser(username = "audit_admin", roles = {"ADMIN"})
    @DisplayName("Should duplicate page copying answers but omitting evidence")
    void testDuplicatePage() throws Exception {
        AuditPage page1 = pageRepository.save(new AuditPage(UUID.randomUUID(), testLocation, 1, "DRAFT", testAdmin));

        // Save answer on page 1
        QuestionBank q = questionBankRepository.findById("S04").orElseThrow();
        answerRepository.save(new AuditAnswer(
                UUID.randomUUID(),
                page1,
                q,
                questionVersionRepository.findTopByQuestionIdOrderByVersionNumberDesc(q.getId()).orElseThrow(),
                "{\"rating\": 4}",
                false,
                null,
                false,
                null
        ));

        // Duplicate page 1
        mockMvc.perform(post("/api/v1/pages/" + page1.getId() + "/duplicate"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.pageNumber", is(2)))
                .andExpect(jsonPath("$.status", is("DRAFT")))
                .andExpect(jsonPath("$.answers.S04", notNullValue()));

        // Verify page 2 has copied answer in database
        AuditPage page2 = pageRepository.findByPilotLocationIdAndPageNumber(testLocation.getId(), 2).orElseThrow();
        List<AuditAnswer> p2Answers = answerRepository.findByAuditPageId(page2.getId());
        assertEquals(1, p2Answers.size());
        assertEquals("S04", p2Answers.get(0).getQuestion().getId());
    }

    @Test
    @WithMockUser(username = "audit_admin", roles = {"ADMIN"})
    @DisplayName("Should delete DRAFT page and reject deleting the only remaining page")
    void testDeletePage() throws Exception {
        AuditPage page1 = pageRepository.save(new AuditPage(UUID.randomUUID(), testLocation, 1, "DRAFT", testAdmin));
        AuditPage page2 = pageRepository.save(new AuditPage(UUID.randomUUID(), testLocation, 2, "DRAFT", testAdmin));

        // Delete page 2
        mockMvc.perform(delete("/api/v1/pages/" + page2.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted", is(true)));

        assertFalse(pageRepository.findById(page2.getId()).isPresent());

        // Attempt deleting page 1 (now the only remaining page) -> must fail
        mockMvc.perform(delete("/api/v1/pages/" + page1.getId()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "audit_admin", roles = {"ADMIN"})
    @DisplayName("Should validate completeness before submitting, and lock all pages")
    void testSubmissionAndReopenWorkflow() throws Exception {
        AuditPage page1 = pageRepository.save(new AuditPage(UUID.randomUUID(), testLocation, 1, "DRAFT", testAdmin));

        // Attempt submitting without answering scored questions -> rejected
        mockMvc.perform(post("/api/v1/locations/" + testLocation.getId() + "/submit"))
                .andExpect(status().isBadRequest());

        // Answer all scored questions (mark all scored questions as N/A with valid reason for testing)
        List<QuestionBank> scored = questionBankRepository.findAll().stream()
                .filter(QuestionBank::isScoredDefault)
                .filter(QuestionBank::isActive)
                .toList();

        List<AnswerSaveDTO> batch = scored.stream().map(q -> new AnswerSaveDTO(
                q.getId(),
                questionVersionRepository.findTopByQuestionIdOrderByVersionNumberDesc(q.getId()).orElseThrow().getId(),
                Map.of(),
                true,
                "Facility not applicable for pilot institution grade",
                false,
                null
        )).toList();

        mockMvc.perform(put("/api/v1/pages/" + page1.getId() + "/answers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AnswerBatchSaveRequest(batch))))
                .andExpect(status().isOk());

        // Verify completeness check now passes
        mockMvc.perform(get("/api/v1/locations/" + testLocation.getId() + "/completeness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.complete", is(true)));

        // Submit location
        mockMvc.perform(post("/api/v1/locations/" + testLocation.getId() + "/submit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("READY_FOR_ANALYSIS")));

        // Verify pages are now SUBMITTED
        AuditPage submittedPage = pageRepository.findById(page1.getId()).orElseThrow();
        assertEquals("SUBMITTED", submittedPage.getStatus());

        // Attempt saving answers to submitted page -> rejected
        mockMvc.perform(put("/api/v1/pages/" + page1.getId() + "/answers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AnswerBatchSaveRequest(List.of()))))
                .andExpect(status().isBadRequest());

        // Reopen location with mandatory reason
        ReopenRequestDTO reopenReq = new ReopenRequestDTO("Auditor requested additional verification of WASH facilities");
        mockMvc.perform(post("/api/v1/locations/" + testLocation.getId() + "/reopen")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reopenReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("REOPENED")));

        // Verify pages returned to DRAFT
        AuditPage reopenedPage = pageRepository.findById(page1.getId()).orElseThrow();
        assertEquals("DRAFT", reopenedPage.getStatus());
    }

    @Test
    @WithMockUser(username = "audit_admin", roles = {"ADMIN"})
    @DisplayName("Should upload evidence with valid magic bytes and attestation, and reject invalid types")
    void testEvidenceUploadAndMagicBytes() throws Exception {
        AuditPage page = pageRepository.save(new AuditPage(UUID.randomUUID(), testLocation, 1, "DRAFT", testAdmin));

        // Find a question with evidence enabled
        QuestionBank evidenceQ = questionBankRepository.findAll().stream()
                .filter(QuestionBank::isEvidenceUploadDefault)
                .findFirst()
                .orElseThrow();

        // 1. Valid PNG using BufferedImage
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        java.awt.image.BufferedImage img = new java.awt.image.BufferedImage(1, 1, java.awt.image.BufferedImage.TYPE_INT_RGB);
        javax.imageio.ImageIO.write(img, "png", baos);
        byte[] validPng = baos.toByteArray();
        MockMultipartFile pngFile = new MockMultipartFile(
                "file",
                "evidence_doc.png",
                "image/png",
                validPng
        );

        mockMvc.perform(multipart("/api/v1/pages/" + page.getId() + "/evidence")
                        .file(pngFile)
                        .param("questionId", evidenceQ.getId())
                        .param("attestation", "true"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fileName", is("evidence_doc.png")))
                .andExpect(jsonPath("$.mimeType", is("image/png")));

        // 2. Reject upload without attestation tick-box
        mockMvc.perform(multipart("/api/v1/pages/" + page.getId() + "/evidence")
                        .file(pngFile)
                        .param("questionId", evidenceQ.getId())
                        .param("attestation", "false"))
                .andExpect(status().isBadRequest());

        // 3. Reject invalid file disguised as jpg (invalid magic bytes)
        byte[] fakeJpg = "This is plain text disguised as an image".getBytes();
        MockMultipartFile fakeFile = new MockMultipartFile(
                "file",
                "fake.jpg",
                "image/jpeg",
                fakeJpg
        );

        mockMvc.perform(multipart("/api/v1/pages/" + page.getId() + "/evidence")
                        .file(fakeFile)
                        .param("questionId", evidenceQ.getId())
                        .param("attestation", "true"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "audit_admin", roles = {"ADMIN"})
    @DisplayName("Should allow submitting partial audit when at least one question is answered")
    void testPartialAuditSubmissionAndCompleteness() throws Exception {
        AuditPage page1 = pageRepository.save(new AuditPage(UUID.randomUUID(), testLocation, 1, "DRAFT", testAdmin));

        // 1. Initial empty audit cannot be submitted
        mockMvc.perform(get("/api/v1/locations/" + testLocation.getId() + "/completeness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.complete", is(false)))
                .andExpect(jsonPath("$.canSubmit", is(false)))
                .andExpect(jsonPath("$.totalAnswered", is(0)));

        mockMvc.perform(post("/api/v1/locations/" + testLocation.getId() + "/submit"))
                .andExpect(status().isBadRequest());

        // 2. Answer exactly one question (e.g. only 1 facility question evaluated)
        QuestionBank singleQ = questionBankRepository.findAll().stream()
                .filter(QuestionBank::isScoredDefault)
                .filter(QuestionBank::isActive)
                .findFirst()
                .orElseThrow();

        AnswerSaveDTO singleAnswer = new AnswerSaveDTO(
                singleQ.getId(),
                questionVersionRepository.findTopByQuestionIdOrderByVersionNumberDesc(singleQ.getId()).orElseThrow().getId(),
                Map.of("score", 2.0),
                false,
                null,
                false,
                null
        );

        mockMvc.perform(put("/api/v1/pages/" + page1.getId() + "/answers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AnswerBatchSaveRequest(List.of(singleAnswer)))))
                .andExpect(status().isOk());

        // 3. Completeness check should report incomplete but canSubmit = true
        mockMvc.perform(get("/api/v1/locations/" + testLocation.getId() + "/completeness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.complete", is(false)))
                .andExpect(jsonPath("$.canSubmit", is(true)))
                .andExpect(jsonPath("$.totalAnswered", is(1)));

        // 4. Submitting partial audit must succeed
        mockMvc.perform(post("/api/v1/locations/" + testLocation.getId() + "/submit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("READY_FOR_ANALYSIS")));

        AuditPage submittedPage = pageRepository.findById(page1.getId()).orElseThrow();
        assertEquals("SUBMITTED", submittedPage.getStatus());
    }
}
