package org.abhisaran.audit;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.abhisaran.audit.dto.*;
import org.abhisaran.audit.evidence.EvidenceService;
import org.abhisaran.audit.pii.PiiDetector;
import org.abhisaran.auditlog.AuditLogService;
import org.abhisaran.facilities.PilotLocation;
import org.abhisaran.facilities.PilotLocationRepository;
import org.abhisaran.questions.QuestionBank;
import org.abhisaran.questions.QuestionBankRepository;
import org.abhisaran.questions.QuestionVersion;
import org.abhisaran.questions.QuestionVersionRepository;
import org.abhisaran.users.User;
import org.abhisaran.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditPageRepository pageRepository;
    private final AuditAnswerRepository answerRepository;
    private final EvidenceAttachmentRepository evidenceRepository;
    private final AuditSubmissionRepository submissionRepository;
    private final PilotLocationRepository locationRepository;
    private final QuestionBankRepository questionBankRepository;
    private final QuestionVersionRepository questionVersionRepository;
    private final UserRepository userRepository;
    private final EvidenceService evidenceService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public AuditService(
            AuditPageRepository pageRepository,
            AuditAnswerRepository answerRepository,
            EvidenceAttachmentRepository evidenceRepository,
            AuditSubmissionRepository submissionRepository,
            PilotLocationRepository locationRepository,
            QuestionBankRepository questionBankRepository,
            QuestionVersionRepository questionVersionRepository,
            UserRepository userRepository,
            EvidenceService evidenceService,
            AuditLogService auditLogService,
            ObjectMapper objectMapper
    ) {
        this.pageRepository = pageRepository;
        this.answerRepository = answerRepository;
        this.evidenceRepository = evidenceRepository;
        this.submissionRepository = submissionRepository;
        this.locationRepository = locationRepository;
        this.questionBankRepository = questionBankRepository;
        this.questionVersionRepository = questionVersionRepository;
        this.userRepository = userRepository;
        this.evidenceService = evidenceService;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public LocationAuditOverviewDTO getLocationAuditOverview(UUID locationId, UUID actorId, String clientIp) {
        PilotLocation location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Pilot location not found: " + locationId));

        List<AuditPage> pages = pageRepository.findByPilotLocationIdOrderByPageNumberAsc(locationId);

        // Ensure at least Page 1 exists
        if (pages.isEmpty()) {
            AuditPage page1 = createPageInternal(location, 1, actorId, clientIp);
            pages = List.of(page1);
        }

        List<AuditPageDTO> pageDTOs = pages.stream().map(this::mapPageToDTO).toList();
        boolean canSubmit = !"SUBMITTED".equalsIgnoreCase(location.getStatus()) &&
                !"READY_FOR_ANALYSIS".equalsIgnoreCase(location.getStatus());

        return new LocationAuditOverviewDTO(
                location.getId(),
                location.getCode(),
                location.getStatus(),
                pageDTOs,
                canSubmit
        );
    }

    @Transactional
    public AuditPageDTO createPage(UUID locationId, UUID actorId, String clientIp) {
        PilotLocation location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Pilot location not found: " + locationId));

        if ("READY_FOR_ANALYSIS".equalsIgnoreCase(location.getStatus()) || "ANALYSED".equalsIgnoreCase(location.getStatus())) {
            throw new IllegalStateException("Cannot add pages to a location that is locked for analysis");
        }

        int nextPageNum = pageRepository.findMaxPageNumberByLocationId(locationId) + 1;
        AuditPage newPage = createPageInternal(location, nextPageNum, actorId, clientIp);
        return mapPageToDTO(newPage);
    }

    private AuditPage createPageInternal(PilotLocation location, int pageNum, UUID actorId, String clientIp) {
        User actor = actorId != null ? userRepository.findById(actorId).orElse(null) : null;
        AuditPage page = new AuditPage(UUID.randomUUID(), location, pageNum, "DRAFT", actor);
        pageRepository.save(page);

        if ("REGISTERED".equalsIgnoreCase(location.getStatus())) {
            location.setStatus("DRAFT");
            locationRepository.save(location);
        }

        auditLogService.log(
                actorId,
                actor != null ? actor.getRole().name() : "ADMIN",
                "AUDIT_PAGE_CREATED",
                "AUDIT_PAGE",
                page.getId().toString(),
                null,
                "{\"pageNumber\":" + pageNum + ",\"locationCode\":\"" + location.getCode() + "\"}",
                "Created audit page " + pageNum + " for location " + location.getCode(),
                clientIp
        );

        return page;
    }

    @Transactional(readOnly = true)
    public AuditPageDTO getPage(UUID pageId) {
        AuditPage page = pageRepository.findById(pageId)
                .orElseThrow(() -> new IllegalArgumentException("Audit page not found: " + pageId));
        return mapPageToDTO(page);
    }

    @Transactional
    public void saveAnswers(UUID pageId, AnswerBatchSaveRequest request, UUID actorId, String clientIp) {
        AuditPage page = pageRepository.findById(pageId)
                .orElseThrow(() -> new IllegalArgumentException("Audit page not found: " + pageId));

        if (!"DRAFT".equalsIgnoreCase(page.getStatus())) {
            throw new IllegalStateException("Audit page is submitted and cannot be modified.");
        }

        if (request.getAnswers() == null || request.getAnswers().isEmpty()) {
            return;
        }

        for (AnswerSaveDTO dto : request.getAnswers()) {
            // Server Guard: scan for prohibited PII in free-text fields and reason strings
            PiiDetector.validateNoPii(dto.getValue());
            PiiDetector.validateString(dto.getNaReason());
            PiiDetector.validateString(dto.getNotAssessedReason());

            QuestionBank question = questionBankRepository.findById(dto.getQuestionId())
                    .orElseThrow(() -> new IllegalArgumentException("Question not found: " + dto.getQuestionId()));

            QuestionVersion version;
            if (dto.getQuestionVersionId() != null) {
                version = questionVersionRepository.findById(dto.getQuestionVersionId())
                        .orElseGet(() -> questionVersionRepository.findTopByQuestionIdOrderByVersionNumberDesc(question.getId())
                                .orElseThrow(() -> new IllegalStateException("No active version found for question: " + question.getId())));
            } else {
                version = questionVersionRepository.findTopByQuestionIdOrderByVersionNumberDesc(question.getId())
                        .orElseThrow(() -> new IllegalStateException("No active version found for question: " + question.getId()));
            }

            String answerJson = toJson(dto.getValue() != null ? dto.getValue() : Map.of());

            Optional<AuditAnswer> existingOpt = answerRepository.findByAuditPageIdAndQuestionId(pageId, question.getId());
            if (existingOpt.isPresent()) {
                AuditAnswer existing = existingOpt.get();
                existing.setQuestionVersion(version);
                existing.setAnswerValue(answerJson);
                existing.setNa(dto.isNa());
                existing.setNaReason(dto.getNaReason());
                existing.setNotAssessed(dto.isNotAssessed());
                existing.setNotAssessedReason(dto.getNotAssessedReason());
                answerRepository.save(existing);
            } else {
                AuditAnswer newAns = new AuditAnswer(
                        UUID.randomUUID(),
                        page,
                        question,
                        version,
                        answerJson,
                        dto.isNa(),
                        dto.getNaReason(),
                        dto.isNotAssessed(),
                        dto.getNotAssessedReason()
                );
                answerRepository.save(newAns);
            }
        }

        page.setUpdatedAt(Instant.now());
        pageRepository.save(page);
    }

    @Transactional
    public AuditPageDTO duplicatePage(UUID pageId, UUID actorId, String clientIp) {
        AuditPage sourcePage = pageRepository.findById(pageId)
                .orElseThrow(() -> new IllegalArgumentException("Audit page not found: " + pageId));

        PilotLocation location = sourcePage.getPilotLocation();
        int nextPageNum = pageRepository.findMaxPageNumberByLocationId(location.getId()) + 1;

        User actor = actorId != null ? userRepository.findById(actorId).orElse(null) : null;
        AuditPage targetPage = new AuditPage(UUID.randomUUID(), location, nextPageNum, "DRAFT", actor);
        pageRepository.save(targetPage);

        // Copy all answers from source page (evidence attachments are NOT copied per Section 7)
        List<AuditAnswer> sourceAnswers = answerRepository.findByAuditPageId(pageId);
        List<AuditAnswer> newAnswers = new ArrayList<>();
        for (AuditAnswer sa : sourceAnswers) {
            AuditAnswer copy = new AuditAnswer(
                    UUID.randomUUID(),
                    targetPage,
                    sa.getQuestion(),
                    sa.getQuestionVersion(),
                    sa.getAnswerValue(),
                    sa.isNa(),
                    sa.getNaReason(),
                    sa.isNotAssessed(),
                    sa.getNotAssessedReason()
            );
            newAnswers.add(copy);
        }
        answerRepository.saveAll(newAnswers);

        auditLogService.log(
                actorId,
                actor != null ? actor.getRole().name() : "ADMIN",
                "AUDIT_PAGE_DUPLICATED",
                "AUDIT_PAGE",
                targetPage.getId().toString(),
                null,
                "{\"sourcePageId\":\"" + sourcePage.getId() + "\",\"newPageNumber\":" + nextPageNum + "}",
                "Duplicated page " + sourcePage.getPageNumber() + " to new page " + nextPageNum,
                clientIp
        );

        return mapPageToDTO(targetPage);
    }

    @Transactional
    public void deletePage(UUID pageId, UUID actorId, String clientIp) {
        AuditPage page = pageRepository.findById(pageId)
                .orElseThrow(() -> new IllegalArgumentException("Audit page not found: " + pageId));

        if (!"DRAFT".equalsIgnoreCase(page.getStatus())) {
            throw new IllegalStateException("Only pages in DRAFT status can be deleted.");
        }

        long pageCount = pageRepository.countByPilotLocationId(page.getPilotLocation().getId());
        if (pageCount <= 1) {
            throw new IllegalStateException("Cannot delete the only remaining audit page for a location. Use Clear Page instead.");
        }

        // Delete associated evidence and answers
        evidenceRepository.deleteByAuditPageId(pageId);
        answerRepository.deleteByAuditPageId(pageId);
        pageRepository.delete(page);

        User actor = actorId != null ? userRepository.findById(actorId).orElse(null) : null;
        auditLogService.log(
                actorId,
                actor != null ? actor.getRole().name() : "ADMIN",
                "AUDIT_PAGE_DELETED",
                "AUDIT_PAGE",
                pageId.toString(),
                "{\"pageNumber\":" + page.getPageNumber() + "}",
                null,
                "Deleted audit page " + page.getPageNumber() + " of location " + page.getPilotLocation().getCode(),
                clientIp
        );
    }

    @Transactional
    public void clearPage(UUID pageId, UUID actorId, String clientIp) {
        AuditPage page = pageRepository.findById(pageId)
                .orElseThrow(() -> new IllegalArgumentException("Audit page not found: " + pageId));

        if (!"DRAFT".equalsIgnoreCase(page.getStatus())) {
            throw new IllegalStateException("Only pages in DRAFT status can be cleared.");
        }

        evidenceRepository.deleteByAuditPageId(pageId);
        answerRepository.deleteByAuditPageId(pageId);

        page.setUpdatedAt(Instant.now());
        pageRepository.save(page);

        User actor = actorId != null ? userRepository.findById(actorId).orElse(null) : null;
        auditLogService.log(
                actorId,
                actor != null ? actor.getRole().name() : "ADMIN",
                "AUDIT_PAGE_CLEARED",
                "AUDIT_PAGE",
                pageId.toString(),
                null,
                "{\"pageNumber\":" + page.getPageNumber() + "}",
                "Cleared all answers and evidence for page " + page.getPageNumber(),
                clientIp
        );
    }

    @Transactional(readOnly = true)
    public CompletenessReportDTO validateCompleteness(UUID locationId) {
        PilotLocation location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Pilot location not found: " + locationId));

        List<AuditPage> pages = pageRepository.findByPilotLocationIdOrderByPageNumberAsc(locationId);
        if (pages.isEmpty()) {
            return new CompletenessReportDTO(false, 0, Map.of(), "No audit pages found for location.");
        }

        // Find applicable scored questions
        List<QuestionBank> scoredQuestions = questionBankRepository.findAll().stream()
                .filter(QuestionBank::isScoredDefault)
                .filter(QuestionBank::isActive)
                .toList();

        Map<Integer, List<String>> missingByPage = new HashMap<>();
        int totalMissing = 0;

        for (AuditPage page : pages) {
            List<AuditAnswer> answers = answerRepository.findByAuditPageId(page.getId());
            Map<String, AuditAnswer> answerMap = answers.stream()
                    .collect(Collectors.toMap(a -> a.getQuestion().getId(), a -> a, (k1, k2) -> k1));

            List<String> missingForPage = new ArrayList<>();
            for (QuestionBank sq : scoredQuestions) {
                AuditAnswer ans = answerMap.get(sq.getId());
                if (ans == null) {
                    missingForPage.add(sq.getId());
                } else if (!ans.isNa() && !ans.isNotAssessed()) {
                    // Check if answer value is effectively empty
                    if (ans.getAnswerValue() == null || ans.getAnswerValue().isBlank() || "{}".equals(ans.getAnswerValue().trim())) {
                        missingForPage.add(sq.getId());
                    }
                }
            }

            if (!missingForPage.isEmpty()) {
                missingByPage.put(page.getPageNumber(), missingForPage);
                totalMissing += missingForPage.size();
            }
        }

        boolean complete = totalMissing == 0;
        String message = complete
                ? "All scored questions are fully answered across all " + pages.size() + " pages."
                : "Found " + totalMissing + " unanswered scored question instances across pages.";

        return new CompletenessReportDTO(complete, totalMissing, missingByPage, message);
    }

    @Transactional
    public void submitLocation(UUID locationId, UUID actorId, String clientIp) {
        PilotLocation location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Pilot location not found: " + locationId));

        CompletenessReportDTO report = validateCompleteness(locationId);
        if (!report.isComplete()) {
            throw new IllegalStateException("Audit submission blocked: Unanswered scored questions remain. " + report.getMessage());
        }

        List<AuditPage> pages = pageRepository.findByPilotLocationIdOrderByPageNumberAsc(locationId);
        for (AuditPage p : pages) {
            p.setStatus("SUBMITTED");
        }
        pageRepository.saveAll(pages);

        location.setStatus("READY_FOR_ANALYSIS");
        locationRepository.save(location);

        // Snapshot question versions and page IDs
        List<UUID> pageIdList = pages.stream().map(AuditPage::getId).toList();
        Map<String, UUID> versionSnapshot = new HashMap<>();
        for (AuditPage p : pages) {
            List<AuditAnswer> ansList = answerRepository.findByAuditPageId(p.getId());
            for (AuditAnswer a : ansList) {
                versionSnapshot.put(a.getQuestion().getId(), a.getQuestionVersion().getId());
            }
        }

        User actor = actorId != null ? userRepository.findById(actorId).orElse(null) : null;
        AuditSubmission submission = new AuditSubmission(
                UUID.randomUUID(),
                location,
                actor,
                toJson(pageIdList),
                toJson(versionSnapshot)
        );
        submissionRepository.save(submission);

        auditLogService.log(
                actorId,
                actor != null ? actor.getRole().name() : "ADMIN",
                "AUDIT_LOCATION_SUBMITTED",
                "PILOT_LOCATION",
                locationId.toString(),
                "{\"status\":\"DRAFT\"}",
                "{\"status\":\"READY_FOR_ANALYSIS\",\"pageCount\":" + pages.size() + "}",
                "Submitted all " + pages.size() + " audit pages for location " + location.getCode(),
                clientIp
        );
    }

    @Transactional
    public void reopenLocation(UUID locationId, String reason, UUID actorId, String clientIp) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Reopen reason is mandatory.");
        }

        PilotLocation location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Pilot location not found: " + locationId));

        List<AuditPage> pages = pageRepository.findByPilotLocationIdOrderByPageNumberAsc(locationId);
        for (AuditPage p : pages) {
            p.setStatus("DRAFT");
        }
        pageRepository.saveAll(pages);

        String previousStatus = location.getStatus();
        location.setStatus("REOPENED");
        locationRepository.save(location);

        User actor = actorId != null ? userRepository.findById(actorId).orElse(null) : null;
        Optional<AuditSubmission> latestSub = submissionRepository.findTopByPilotLocationIdOrderBySubmittedAtDesc(locationId);
        if (latestSub.isPresent()) {
            AuditSubmission sub = latestSub.get();
            sub.setReopenedBy(actor);
            sub.setReopenedAt(Instant.now());
            sub.setReopenReason(reason);
            submissionRepository.save(sub);
        }

        auditLogService.log(
                actorId,
                actor != null ? actor.getRole().name() : "ADMIN",
                "AUDIT_LOCATION_REOPENED",
                "PILOT_LOCATION",
                locationId.toString(),
                "{\"status\":\"" + previousStatus + "\"}",
                "{\"status\":\"REOPENED\",\"reason\":\"" + reason + "\"}",
                "Reopened audit for location " + location.getCode() + ": " + reason,
                clientIp
        );
    }

    private AuditPageDTO mapPageToDTO(AuditPage page) {
        List<AuditAnswer> answers = answerRepository.findByAuditPageId(page.getId());
        Map<String, AuditAnswerDTO> answerMap = new HashMap<>();
        for (AuditAnswer a : answers) {
            Map<String, Object> valMap = parseJsonMap(a.getAnswerValue());
            AuditAnswerDTO dto = new AuditAnswerDTO(
                    a.getId(),
                    a.getQuestion().getId(),
                    a.getQuestionVersion().getId(),
                    a.getQuestionVersion().getVersionNumber(),
                    valMap,
                    a.isNa(),
                    a.getNaReason(),
                    a.isNotAssessed(),
                    a.getNotAssessedReason(),
                    a.getUpdatedAt()
            );
            answerMap.put(a.getQuestion().getId(), dto);
        }

        List<EvidenceAttachment> evidenceList = evidenceRepository.findByAuditPageId(page.getId());
        Map<String, List<EvidenceDTO>> evidenceMap = new HashMap<>();
        for (EvidenceAttachment e : evidenceList) {
            evidenceMap.computeIfAbsent(e.getQuestion().getId(), k -> new ArrayList<>())
                    .add(evidenceService.mapToDTO(e));
        }

        return new AuditPageDTO(
                page.getId(),
                page.getPilotLocation().getId(),
                page.getPageNumber(),
                page.getStatus(),
                answerMap,
                evidenceMap,
                page.getCreatedAt(),
                page.getUpdatedAt()
        );
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.error("Failed to serialize object to JSON", e);
            return "{}";
        }
    }

    private Map<String, Object> parseJsonMap(String json) {
        if (json == null || json.isBlank()) return new HashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }
}
