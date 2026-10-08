package org.abhisaran.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.abhisaran.ai.dto.*;
import org.abhisaran.ai.persistence.AiDraft;
import org.abhisaran.auditlog.AuditLogService;
import org.abhisaran.users.User;
import org.abhisaran.users.UserRepository;
import org.abhisaran.scoring.persistence.AnalysisLedgerEntry;
import org.abhisaran.scoring.persistence.AnalysisRun;
import org.abhisaran.scoring.persistence.AnalysisLedgerRepository;
import org.abhisaran.scoring.persistence.AnalysisRunRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class AiDraftService {

    private static final Logger log = LoggerFactory.getLogger(AiDraftService.class);

    private final AiDraftRepository draftRepository;
    private final AnalysisRunRepository runRepository;
    private final AnalysisLedgerRepository ledgerRepository;
    private final UserRepository userRepository;
    private final AiServiceClient aiServiceClient;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public AiDraftService(
            AiDraftRepository draftRepository,
            AnalysisRunRepository runRepository,
            AnalysisLedgerRepository ledgerRepository,
            UserRepository userRepository,
            AiServiceClient aiServiceClient,
            AuditLogService auditLogService,
            ObjectMapper objectMapper
    ) {
        this.draftRepository = draftRepository;
        this.runRepository = runRepository;
        this.ledgerRepository = ledgerRepository;
        this.userRepository = userRepository;
        this.aiServiceClient = aiServiceClient;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public AiDraftDTO generateRunSummary(UUID runId, UUID actorId, String clientIp) {
        AnalysisRun run = runRepository.findById(runId)
                .orElseThrow(() -> new IllegalArgumentException("Analysis run not found: " + runId));

        List<AnalysisLedgerEntry> ledgers = ledgerRepository.findByAnalysisRunIdOrderByLostWeightedPointsDesc(runId);

        AiSummariseRunPayload payload = new AiSummariseRunPayload();
        payload.setFacilityCode(run.getPilotLocation().getCode());
        payload.setRunNumber(run.getRunNumber());
        payload.setAcsScore(run.getAcsScore() != null ? run.getAcsScore().doubleValue() : null);
        payload.setAlertBand(run.getAlertBand());
        payload.setProvisional(run.isProvisional());
        payload.setCoveragePct(run.getCoveragePct() != null ? run.getCoveragePct().doubleValue() : 0.0);
        payload.setTotalApplicableQuestions(run.getTotalApplicableQuestions());
        payload.setTotalAssessedQuestions(run.getTotalAssessedQuestions());
        payload.setTriggeredRedFlagsCount(run.getTriggeredRedFlagsCount());

        List<AiSummariseRunPayload.LedgerItemPayload> ledgerItems = new ArrayList<>();
        for (AnalysisLedgerEntry itm : ledgers) {
            ledgerItems.add(new AiSummariseRunPayload.LedgerItemPayload(
                    itm.getQuestionId(),
                    itm.getPageNumber(),
                    itm.getQuestionText(),
                    itm.getSeverity(),
                    itm.getWeight().doubleValue(),
                    itm.getLostWeightedPoints().doubleValue(),
                    itm.getDeductionPercentage().doubleValue(),
                    itm.getLossExplanation(),
                    itm.getSuggestedIntervention()
            ));
        }
        payload.setLedger(ledgerItems);

        // Call isolated AI microservice
        AiSummariseRunResponse response = aiServiceClient.summariseRun(payload);

        // Serialize input refs and quality metadata
        String inputRefsJson = "{\"runId\": \"" + runId + "\", \"ledgerCount\": " + ledgers.size() + "}";
        String qualityMetaJson = "{}";
        try {
            if (response.getQualityMetadata() != null) {
                qualityMetaJson = objectMapper.writeValueAsString(response.getQualityMetadata());
            }
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize quality metadata: {}", e.getMessage());
        }

        AiDraft draft = new AiDraft();
        draft.setTargetType("ANALYSIS_RUN");
        draft.setTargetId(runId);
        draft.setServiceId(response.getServiceId());
        draft.setInputRefs(inputRefsJson);
        draft.setOutputText(response.getSummaryNarrative());
        draft.setQualityMetadata(qualityMetaJson);
        draft.setStatus("DRAFT");
        draft.setCreatedAt(Instant.now());

        AiDraft savedDraft = draftRepository.save(draft);

        // Audit Log
        auditLogService.log(
                actorId,
                "ADMIN",
                "AI_DRAFT_GENERATE",
                "ANALYSIS_RUN",
                runId.toString(),
                null,
                "{\"draftId\": \"" + savedDraft.getId() + "\", \"service\": \"" + response.getServiceId() + "\"}",
                "Generated narrative summary draft",
                clientIp != null ? clientIp : "127.0.0.1"
        );

        return toDTO(savedDraft);
    }

    @Transactional(readOnly = true)
    public List<AiDraftDTO> getDrafts(String targetType, UUID targetId) {
        return draftRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public AiDraftDTO acceptDraft(UUID draftId, UUID actorId, String clientIp) {
        AiDraft draft = draftRepository.findById(draftId)
                .orElseThrow(() -> new IllegalArgumentException("AI Draft not found: " + draftId));

        User actor = actorId != null ? userRepository.findById(actorId).orElse(null) : null;
        draft.setStatus("ACCEPTED");
        draft.setAcceptedBy(actor);
        draft.setAcceptedAt(Instant.now());

        AiDraft saved = draftRepository.save(draft);

        auditLogService.log(
                actorId,
                "ADMIN",
                "AI_DRAFT_ACCEPT",
                draft.getTargetType(),
                draft.getTargetId().toString(),
                "{\"status\": \"DRAFT\"}",
                "{\"status\": \"ACCEPTED\"}",
                "Accepted AI draft " + draft.getId(),
                clientIp != null ? clientIp : "127.0.0.1"
        );

        return toDTO(saved);
    }

    @Transactional
    public AiDraftDTO rejectDraft(UUID draftId, UUID actorId, String clientIp) {
        AiDraft draft = draftRepository.findById(draftId)
                .orElseThrow(() -> new IllegalArgumentException("AI Draft not found: " + draftId));

        User actor = actorId != null ? userRepository.findById(actorId).orElse(null) : null;
        draft.setStatus("REJECTED");
        draft.setAcceptedBy(actor);
        draft.setAcceptedAt(Instant.now());

        AiDraft saved = draftRepository.save(draft);

        auditLogService.log(
                actorId,
                "ADMIN",
                "AI_DRAFT_REJECT",
                draft.getTargetType(),
                draft.getTargetId().toString(),
                "{\"status\": \"DRAFT\"}",
                "{\"status\": \"REJECTED\"}",
                "Rejected AI draft " + draft.getId(),
                clientIp != null ? clientIp : "127.0.0.1"
        );

        return toDTO(saved);
    }

    @Transactional
    public AiDraftDTO extractEvidenceText(UUID evidenceId, String fileName, String base64Content, UUID actorId, String clientIp) {
        AiExtractTextPayload payload = new AiExtractTextPayload(evidenceId.toString(), fileName, base64Content);
        AiExtractTextResponse response = aiServiceClient.extractText(payload);

        String metaJson = String.format(Locale.ROOT, "{\"confidence\": %.2f, \"blocksCount\": %d}",
                response.getConfidence(), response.getBlocksCount());

        AiDraft draft = new AiDraft();
        draft.setTargetType("EVIDENCE_OCR");
        draft.setTargetId(evidenceId);
        draft.setServiceId("abhisaran-ocr-v1");
        draft.setInputRefs("{\"evidenceId\": \"" + evidenceId + "\"}");
        draft.setOutputText(response.getExtractedText());
        draft.setQualityMetadata(metaJson);
        draft.setStatus("DRAFT");
        draft.setCreatedAt(Instant.now());

        AiDraft saved = draftRepository.save(draft);

        auditLogService.log(
                actorId,
                "ADMIN",
                "AI_OCR_EXTRACT",
                "EVIDENCE",
                evidenceId.toString(),
                null,
                "{\"draftId\": \"" + saved.getId() + "\"}",
                "Extracted text via AI OCR service",
                clientIp != null ? clientIp : "127.0.0.1"
        );

        return toDTO(saved);
    }

    public AiStatusDTO getStatus() {
        boolean enabled = aiServiceClient.isAiEnabled();
        boolean liveness = aiServiceClient.checkLiveness();
        return new AiStatusDTO(
                enabled,
                liveness ? "UP" : (enabled ? "UNREACHABLE_FALLBACK_ACTIVE" : "DISABLED"),
                aiServiceClient.getServiceUrl(),
                "abhisaran-ai-service"
        );
    }

    private AiDraftDTO toDTO(AiDraft draft) {
        return new AiDraftDTO(
                draft.getId(),
                draft.getTargetType(),
                draft.getTargetId(),
                draft.getServiceId(),
                draft.getOutputText(),
                draft.getQualityMetadata(),
                draft.getStatus(),
                draft.getAcceptedBy() != null ? draft.getAcceptedBy().getId() : null,
                draft.getAcceptedBy() != null ? draft.getAcceptedBy().getLoginId() : null,
                draft.getAcceptedAt(),
                draft.getCreatedAt()
        );
    }
}
