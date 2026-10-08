package org.abhisaran.questions;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.abhisaran.auditlog.AuditLogService;
import org.abhisaran.questions.dto.*;
import org.abhisaran.scoring.AlertBandType;
import org.abhisaran.scoring.RubricEvaluationResult;
import org.abhisaran.scoring.ScoringEngine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class QuestionBankService {

    private static final Logger log = LoggerFactory.getLogger(QuestionBankService.class);

    private final QuestionBankRepository questionBankRepository;
    private final QuestionVersionRepository questionVersionRepository;
    private final SeverityWeightRepository severityWeightRepository;
    private final AlertBandRepository alertBandRepository;
    private final ScoringSettingRepository scoringSettingRepository;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public QuestionBankService(
            QuestionBankRepository questionBankRepository,
            QuestionVersionRepository questionVersionRepository,
            SeverityWeightRepository severityWeightRepository,
            AlertBandRepository alertBandRepository,
            ScoringSettingRepository scoringSettingRepository,
            AuditLogService auditLogService,
            ObjectMapper objectMapper
    ) {
        this.questionBankRepository = questionBankRepository;
        this.questionVersionRepository = questionVersionRepository;
        this.severityWeightRepository = severityWeightRepository;
        this.alertBandRepository = alertBandRepository;
        this.scoringSettingRepository = scoringSettingRepository;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<QuestionSummaryDTO> getQuestions(
            String domain,
            String section,
            String severity,
            String status,
            Boolean scored,
            Boolean active,
            String search
    ) {
        String cleanDomain = (domain != null && !domain.isBlank() && !"ALL".equalsIgnoreCase(domain)) ? domain.trim().toUpperCase() : null;
        String cleanSection = (section != null && !section.isBlank() && !"ALL".equalsIgnoreCase(section)) ? section.trim().toUpperCase() : null;
        String cleanSeverity = (severity != null && !severity.isBlank() && !"ALL".equalsIgnoreCase(severity)) ? severity.trim().toUpperCase() : null;
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim().toLowerCase() : null;

        List<QuestionBank> all = questionBankRepository.findAllByOrderByDisplayOrderAsc();

        List<QuestionSummaryDTO> result = new ArrayList<>();
        for (QuestionBank q : all) {
            if (active != null && q.isActive() != active) {
                continue;
            }
            if (cleanDomain != null && !cleanDomain.equals(q.getDomain()) && !"ALL".equals(q.getDomain())) {
                continue;
            }
            if (cleanSection != null && !cleanSection.equals(q.getSection())) {
                continue;
            }
            if (cleanSearch != null) {
                boolean matchText = q.getCanonicalText() != null && q.getCanonicalText().toLowerCase().contains(cleanSearch);
                boolean matchId = q.getId() != null && q.getId().toLowerCase().contains(cleanSearch);
                if (!matchText && !matchId) {
                    continue;
                }
            }

            Optional<QuestionVersion> latestOpt = questionVersionRepository.findTopByQuestionIdOrderByVersionNumberDesc(q.getId());
            if (latestOpt.isPresent()) {
                QuestionVersion latest = latestOpt.get();
                if (status != null && !status.isBlank() && !status.equalsIgnoreCase(latest.getStatus())) {
                    continue;
                }
                if (cleanSeverity != null && !cleanSeverity.equalsIgnoreCase(latest.getSeverity())) {
                    continue;
                }
                if (scored != null && latest.isScored() != scored) {
                    continue;
                }

                List<QuestionVersion> allVersions = questionVersionRepository.findByQuestionIdOrderByVersionNumberDesc(q.getId());
                result.add(new QuestionSummaryDTO(
                        q.getId(),
                        q.getDomain(),
                        q.getSection(),
                        q.getCanonicalText(),
                        q.getResponseType(),
                        latest.getSeverity(),
                        latest.isScored(),
                        q.getRubricTypeDefault(),
                        latest.isEvidenceEnabled(),
                        latest.getEvidenceHint(),
                        q.isActive(),
                        latest.getVersionNumber(),
                        latest.getStatus(),
                        allVersions.size(),
                        q.getDisplayOrder()
                ));
            }
        }
        return result;
    }

    @Transactional(readOnly = true)
    public QuestionDetailDTO getQuestion(String id) {
        QuestionBank q = questionBankRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Question not found with ID: " + id));

        QuestionVersion latest = questionVersionRepository.findTopByQuestionIdOrderByVersionNumberDesc(id)
                .orElseThrow(() -> new IllegalStateException("No version records found for question: " + id));

        List<QuestionVersion> versions = questionVersionRepository.findByQuestionIdOrderByVersionNumberDesc(id);
        List<QuestionVersionSummaryDTO> history = versions.stream()
                .map(v -> new QuestionVersionSummaryDTO(
                        v.getId(),
                        v.getVersionNumber(),
                        v.getText(),
                        v.getSeverity(),
                        v.isScored(),
                        v.getStatus(),
                        v.getCreatedBy(),
                        v.getCreatedAt()
                ))
                .collect(Collectors.toList());

        QuestionDetailDTO dto = new QuestionDetailDTO();
        dto.setId(q.getId());
        dto.setDomain(q.getDomain());
        dto.setSection(q.getSection());
        dto.setCanonicalText(q.getCanonicalText());
        dto.setResponseType(q.getResponseType());
        dto.setSeverity(latest.getSeverity());
        dto.setScored(latest.isScored());
        dto.setRubricType(q.getRubricTypeDefault());
        dto.setEvidenceEnabled(latest.isEvidenceEnabled());
        dto.setEvidenceHint(latest.getEvidenceHint());
        dto.setRedFlagLogic(latest.getRedFlagLogic());
        dto.setSuggestedIntervention(latest.getSuggestedIntervention());
        dto.setActive(q.isActive());
        dto.setDisplayOrder(q.getDisplayOrder());

        dto.setVersionId(latest.getId());
        dto.setVersionNumber(latest.getVersionNumber());
        dto.setText(latest.getText());
        dto.setHint(latest.getHint());
        dto.setStatus(latest.getStatus());
        dto.setFieldsSchema(parseJsonList(latest.getFieldsSchema()));
        dto.setRubricConfig(parseJsonMap(latest.getRubricConfig()));
        dto.setAlertOverrides(parseJsonMap(latest.getAlertOverrides()));
        dto.setVersionHistory(history);

        return dto;
    }

    @Transactional(readOnly = true)
    public List<QuestionVersionSummaryDTO> getVersionHistory(String questionId) {
        return questionVersionRepository.findByQuestionIdOrderByVersionNumberDesc(questionId).stream()
                .map(v -> new QuestionVersionSummaryDTO(
                        v.getId(),
                        v.getVersionNumber(),
                        v.getText(),
                        v.getSeverity(),
                        v.isScored(),
                        v.getStatus(),
                        v.getCreatedBy(),
                        v.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QuestionDetailDTO getVersionDetails(String questionId, int versionNumber) {
        QuestionBank q = questionBankRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("Question not found with ID: " + questionId));

        QuestionVersion ver = questionVersionRepository.findByQuestionIdAndVersionNumber(questionId, versionNumber)
                .orElseThrow(() -> new IllegalArgumentException("Version " + versionNumber + " not found for question " + questionId));

        QuestionDetailDTO dto = new QuestionDetailDTO();
        dto.setId(q.getId());
        dto.setDomain(q.getDomain());
        dto.setSection(q.getSection());
        dto.setCanonicalText(q.getCanonicalText());
        dto.setResponseType(q.getResponseType());
        dto.setSeverity(ver.getSeverity());
        dto.setScored(ver.isScored());
        dto.setRubricType(q.getRubricTypeDefault());
        dto.setEvidenceEnabled(ver.isEvidenceEnabled());
        dto.setEvidenceHint(ver.getEvidenceHint());
        dto.setRedFlagLogic(ver.getRedFlagLogic());
        dto.setSuggestedIntervention(ver.getSuggestedIntervention());
        dto.setActive(q.isActive());
        dto.setDisplayOrder(q.getDisplayOrder());

        dto.setVersionId(ver.getId());
        dto.setVersionNumber(ver.getVersionNumber());
        dto.setText(ver.getText());
        dto.setHint(ver.getHint());
        dto.setStatus(ver.getStatus());
        dto.setFieldsSchema(parseJsonList(ver.getFieldsSchema()));
        dto.setRubricConfig(parseJsonMap(ver.getRubricConfig()));
        dto.setAlertOverrides(parseJsonMap(ver.getAlertOverrides()));

        return dto;
    }

    @Transactional
    public QuestionDetailDTO createQuestion(QuestionCreateRequest req, UUID actorId, String clientIp) {
        String qId = req.getId();
        if (qId == null || qId.isBlank()) {
            qId = "Q" + (questionBankRepository.count() + 1);
        }
        qId = qId.trim().toUpperCase();

        if (questionBankRepository.existsById(qId)) {
            throw new IllegalArgumentException("Question ID " + qId + " already exists.");
        }

        int maxOrder = questionBankRepository.findAll().stream()
                .mapToInt(QuestionBank::getDisplayOrder)
                .max().orElse(0);

        QuestionBank bank = new QuestionBank(
                qId,
                req.getDomain().trim().toUpperCase(),
                req.getSection().trim().toUpperCase(),
                req.getText().trim(),
                req.getResponseType(),
                req.getSeverity().trim().toUpperCase(),
                req.isScored(),
                req.getRubricType(),
                req.isEvidenceEnabled(),
                req.getEvidenceHint(),
                req.getRedFlagLogic(),
                req.getSuggestedIntervention(),
                null,
                null,
                "USER_CREATED",
                req.getNotes(),
                true,
                maxOrder + 1
        );
        questionBankRepository.save(bank);

        String fieldsJson = toJson(req.getFieldsSchema() != null ? req.getFieldsSchema() : List.of());
        String rubricJson = toJson(req.getRubricConfig() != null ? req.getRubricConfig() : Map.of("type", req.getRubricType(), "scored", req.isScored()));

        QuestionVersion v1 = new QuestionVersion(
                UUID.randomUUID(),
                qId,
                1,
                req.getText().trim(),
                req.getHint(),
                fieldsJson,
                rubricJson,
                req.getSeverity().trim().toUpperCase(),
                req.isScored(),
                req.isEvidenceEnabled(),
                req.getEvidenceHint(),
                req.getRedFlagLogic(),
                req.getSuggestedIntervention(),
                null,
                "ACTIVE",
                actorId
        );
        questionVersionRepository.save(v1);

        auditLogService.log(
                actorId,
                "ADMIN",
                "QUESTION_CREATED",
                "QUESTION",
                qId,
                null,
                toJson(Map.of("message", "Created question " + qId, "version", 1)),
                "User initiated question creation",
                clientIp
        );

        return getQuestion(qId);
    }

    /**
     * Bumps question version to N + 1 while leaving version N strictly immutable.
     */
    @Transactional
    public QuestionDetailDTO updateQuestion(String id, QuestionUpdateRequest req, UUID actorId, String clientIp) {
        QuestionBank bank = questionBankRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Question not found with ID: " + id));

        QuestionVersion latest = questionVersionRepository.findTopByQuestionIdOrderByVersionNumberDesc(id)
                .orElseThrow(() -> new IllegalStateException("No previous version found for question: " + id));

        int newVersionNumber = latest.getVersionNumber() + 1;

        // Prepare new version payload
        String text = (req.getText() != null && !req.getText().isBlank()) ? req.getText().trim() : latest.getText();
        String hint = (req.getHint() != null) ? req.getHint() : latest.getHint();
        String severity = (req.getSeverity() != null && !req.getSeverity().isBlank()) ? req.getSeverity().trim().toUpperCase() : latest.getSeverity();
        boolean scored = (req.getScored() != null) ? req.getScored() : latest.isScored();
        boolean evidenceEnabled = (req.getEvidenceEnabled() != null) ? req.getEvidenceEnabled() : latest.isEvidenceEnabled();
        String evidenceHint = (req.getEvidenceHint() != null) ? req.getEvidenceHint() : latest.getEvidenceHint();
        String redFlagLogic = (req.getRedFlagLogic() != null) ? req.getRedFlagLogic() : latest.getRedFlagLogic();
        String suggestedIntervention = (req.getSuggestedIntervention() != null) ? req.getSuggestedIntervention() : latest.getSuggestedIntervention();

        String fieldsJson = (req.getFieldsSchema() != null) ? toJson(req.getFieldsSchema()) : latest.getFieldsSchema();
        String rubricJson = (req.getRubricConfig() != null) ? toJson(req.getRubricConfig()) : latest.getRubricConfig();
        String alertOverridesJson = (req.getAlertOverrides() != null) ? toJson(req.getAlertOverrides()) : latest.getAlertOverrides();

        QuestionVersion newVersion = new QuestionVersion(
                UUID.randomUUID(),
                id,
                newVersionNumber,
                text,
                hint,
                fieldsJson,
                rubricJson,
                severity,
                scored,
                evidenceEnabled,
                evidenceHint,
                redFlagLogic,
                suggestedIntervention,
                alertOverridesJson,
                "ACTIVE",
                actorId
        );

        questionVersionRepository.save(newVersion);

        // Update QuestionBank master metadata to reflect latest state
        bank.setCanonicalText(text);
        bank.setSeverity(severity);
        bank.setScoredDefault(scored);
        if (req.getRubricType() != null && !req.getRubricType().isBlank()) {
            bank.setRubricTypeDefault(req.getRubricType());
        }
        bank.setEvidenceUploadDefault(evidenceEnabled);
        bank.setEvidenceHint(evidenceHint);
        bank.setRedFlagLogic(redFlagLogic);
        bank.setSuggestedIntervention(suggestedIntervention);
        bank.setUpdatedAt(Instant.now());
        questionBankRepository.save(bank);

        auditLogService.log(
                actorId,
                "ADMIN",
                "QUESTION_VERSION_BUMP",
                "QUESTION",
                id,
                toJson(Map.of("version", latest.getVersionNumber())),
                toJson(Map.of("version", newVersionNumber, "reason", req.getChangeReason() != null ? req.getChangeReason() : "Question updated")),
                req.getChangeReason(),
                clientIp
        );

        log.info("Question {} bumped from version {} to version {}", id, latest.getVersionNumber(), newVersionNumber);

        return getQuestion(id);
    }

    @Transactional
    public void toggleActive(String id, boolean active, UUID actorId, String clientIp) {
        QuestionBank bank = questionBankRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Question not found with ID: " + id));

        boolean old = bank.isActive();
        bank.setActive(active);
        bank.setUpdatedAt(Instant.now());
        questionBankRepository.save(bank);

        auditLogService.log(
                actorId,
                "ADMIN",
                active ? "QUESTION_ACTIVATED" : "QUESTION_DEACTIVATED",
                "QUESTION",
                id,
                toJson(Map.of("active", old)),
                toJson(Map.of("active", active)),
                "Admin status toggle",
                clientIp
        );
    }

    @Transactional
    public void approveRubric(String questionId, UUID actorId, String clientIp) {
        QuestionVersion latest = questionVersionRepository.findTopByQuestionIdOrderByVersionNumberDesc(questionId)
                .orElseThrow(() -> new IllegalArgumentException("Question version not found: " + questionId));

        String oldStatus = latest.getStatus();
        latest.setStatus("ACTIVE");
        questionVersionRepository.save(latest);

        auditLogService.log(
                actorId,
                "ADMIN",
                "RUBRIC_APPROVED",
                "QUESTION_VERSION",
                latest.getId().toString(),
                toJson(Map.of("status", oldStatus)),
                toJson(Map.of("status", "ACTIVE")),
                "Owner rubric review approved",
                clientIp
        );
    }

    @Transactional
    public int bulkApproveRubrics(UUID actorId, String clientIp) {
        List<QuestionVersion> pending = questionVersionRepository.findByStatusOrderByQuestionIdAsc("DEFAULT_PENDING_OWNER_REVIEW");
        for (QuestionVersion v : pending) {
            v.setStatus("ACTIVE");
        }
        questionVersionRepository.saveAll(pending);

        auditLogService.log(
                actorId,
                "ADMIN",
                "RUBRIC_BULK_APPROVED",
                "QUESTION_VERSION",
                "ALL_PENDING",
                toJson(Map.of("status", "DEFAULT_PENDING_OWNER_REVIEW")),
                toJson(Map.of("status", "ACTIVE", "approvedCount", pending.size())),
                "Approved " + pending.size() + " pending rubrics in bulk",
                clientIp
        );
        return pending.size();
    }

    @Transactional(readOnly = true)
    public RubricTestResponse testRubric(String questionId, RubricTestRequest req) {
        QuestionBank bank = questionBankRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("Question not found: " + questionId));

        QuestionVersion latest = questionVersionRepository.findTopByQuestionIdOrderByVersionNumberDesc(questionId)
                .orElseThrow(() -> new IllegalStateException("No version found for question: " + questionId));

        Map<String, Object> rubricConfig = (req.getRubricConfig() != null && !req.getRubricConfig().isEmpty())
                ? req.getRubricConfig()
                : parseJsonMap(latest.getRubricConfig());

        String severity = (req.getSeverity() != null && !req.getSeverity().isBlank())
                ? req.getSeverity()
                : latest.getSeverity();

        String redFlagLogic = (req.getRedFlagLogic() != null) ? req.getRedFlagLogic() : latest.getRedFlagLogic();
        String intervention = (req.getSuggestedIntervention() != null) ? req.getSuggestedIntervention() : latest.getSuggestedIntervention();

        RubricEvaluationResult result = ScoringEngine.evaluateQuestion(
                questionId,
                severity,
                rubricConfig,
                req.getAnswer(),
                redFlagLogic,
                intervention
        );

        return mapToTestResponse(result);
    }

    public RubricTestResponse testRubricAdHoc(RubricTestRequest req) {
        String severity = (req.getSeverity() != null && !req.getSeverity().isBlank()) ? req.getSeverity() : "HIGH";
        RubricEvaluationResult result = ScoringEngine.evaluateQuestion(
                "AD_HOC",
                severity,
                req.getRubricConfig(),
                req.getAnswer(),
                req.getRedFlagLogic(),
                req.getSuggestedIntervention()
        );
        return mapToTestResponse(result);
    }

    private RubricTestResponse mapToTestResponse(RubricEvaluationResult r) {
        String bandName = r.getAlertBand() != null ? r.getAlertBand().name() : null;
        String bandLabel = r.getAlertBand() != null ? r.getAlertBand().getLabel() : "Not calculated";
        String colorHex = r.getAlertBand() != null ? r.getAlertBand().getColorHex() : "#9ca3af";

        return new RubricTestResponse(
                r.getRawEarned(),
                r.getRawMax(),
                r.getSeverityWeight(),
                r.getEarnedWeighted(),
                r.getMaxWeighted(),
                r.getPointsLost(),
                r.getPercentage(),
                bandName,
                bandLabel,
                colorHex,
                r.isRedFlagTriggered(),
                r.getRedFlagReason(),
                r.getSuggestedIntervention(),
                r.getRuleWorkingText(),
                r.isAssessed(),
                r.getUnassessedReason()
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
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.warn("Failed to parse JSON map: {}", json);
            return new HashMap<>();
        }
    }

    private List<Map<String, Object>> parseJsonList(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            log.warn("Failed to parse JSON list: {}", json);
            return new ArrayList<>();
        }
    }
}
