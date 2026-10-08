package org.abhisaran.scoring;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.abhisaran.ai.AiServiceClient;
import org.abhisaran.audit.AuditAnswer;
import org.abhisaran.audit.AuditAnswerRepository;
import org.abhisaran.audit.AuditPage;
import org.abhisaran.audit.AuditPageRepository;
import org.abhisaran.audit.AuditSubmission;
import org.abhisaran.audit.AuditSubmissionRepository;
import org.abhisaran.audit.EvidenceAttachment;
import org.abhisaran.audit.EvidenceAttachmentRepository;
import org.abhisaran.auditlog.AuditLogService;
import org.abhisaran.facilities.PilotLocation;
import org.abhisaran.facilities.PilotLocationRepository;
import org.abhisaran.delivery.persistence.Delivery;
import org.abhisaran.delivery.persistence.DeliveryRepository;
import org.abhisaran.officers.persistence.OfficerDistrict;
import org.abhisaran.officers.persistence.OfficerDistrictRepository;
import org.abhisaran.scoring.dto.AnalysisItemDTO;
import org.abhisaran.scoring.dto.AnalysisRunDTO;
import org.abhisaran.scoring.dto.DeductionLedgerDTO;
import org.abhisaran.scoring.dto.SectionScoreDTO;
import org.abhisaran.scoring.model.*;
import org.abhisaran.scoring.persistence.*;
import org.abhisaran.users.User;
import org.abhisaran.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

@Service
public class AnalysisService {

    private static final Logger log = LoggerFactory.getLogger(AnalysisService.class);

    private final PilotLocationRepository locationRepository;
    private final AuditPageRepository pageRepository;
    private final AuditAnswerRepository answerRepository;
    private final AuditSubmissionRepository submissionRepository;
    private final AnalysisRunRepository runRepository;
    private final AnalysisItemRepository itemRepository;
    private final AnalysisLedgerRepository ledgerRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;
    private final OfficerDistrictRepository officerDistrictRepository;
    private final DeliveryRepository deliveryRepository;
    private final AiServiceClient aiServiceClient;
    private final EvidenceAttachmentRepository evidenceAttachmentRepository;

    public AnalysisService(
            PilotLocationRepository locationRepository,
            AuditPageRepository pageRepository,
            AuditAnswerRepository answerRepository,
            AuditSubmissionRepository submissionRepository,
            AnalysisRunRepository runRepository,
            AnalysisItemRepository itemRepository,
            AnalysisLedgerRepository ledgerRepository,
            UserRepository userRepository,
            AuditLogService auditLogService,
            ObjectMapper objectMapper,
            OfficerDistrictRepository officerDistrictRepository,
            DeliveryRepository deliveryRepository,
            AiServiceClient aiServiceClient,
            EvidenceAttachmentRepository evidenceAttachmentRepository
    ) {
        this.locationRepository = locationRepository;
        this.pageRepository = pageRepository;
        this.answerRepository = answerRepository;
        this.submissionRepository = submissionRepository;
        this.runRepository = runRepository;
        this.itemRepository = itemRepository;
        this.ledgerRepository = ledgerRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
        this.officerDistrictRepository = officerDistrictRepository;
        this.deliveryRepository = deliveryRepository;
        this.aiServiceClient = aiServiceClient;
        this.evidenceAttachmentRepository = evidenceAttachmentRepository;
    }

    @Transactional
    public AnalysisRunDTO analyseLocation(UUID locationId, UUID actorId, String clientIp) {
        PilotLocation location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Pilot location not found: " + locationId));

        List<AuditPage> pages = pageRepository.findByPilotLocationIdOrderByPageNumberAsc(locationId);
        if (pages.isEmpty()) {
            throw new IllegalStateException("No audit pages found for location: " + location.getCode());
        }

        Optional<AuditSubmission> latestSub = submissionRepository.findTopByPilotLocationIdOrderBySubmittedAtDesc(locationId);

        List<QuestionAssessmentInput> questionInputs = new ArrayList<>();
        Map<String, AuditPage> pageMap = new HashMap<>();
        Map<String, AuditAnswer> answerMap = new HashMap<>();

        for (AuditPage page : pages) {
            pageMap.put(page.getId().toString(), page);
            List<AuditAnswer> answers = answerRepository.findByAuditPageId(page.getId());
            for (AuditAnswer a : answers) {
                answerMap.put(page.getPageNumber() + ":" + a.getQuestion().getId(), a);

                QuestionAssessmentInput q = new QuestionAssessmentInput();
                q.setPageId(page.getId().toString());
                q.setPageNumber(page.getPageNumber());
                q.setQuestionId(a.getQuestion().getId());
                q.setQuestionVersionId(a.getQuestionVersion().getId().toString());
                q.setQuestionText(a.getQuestionVersion().getText());
                q.setSection(a.getQuestion().getSection());
                q.setSeverity(a.getQuestionVersion().getSeverity());
                q.setWeightOverride(ScoringEngine.getWeightForSeverity(a.getQuestionVersion().getSeverity()));
                q.setRubricConfig(parseJsonMap(a.getQuestionVersion().getRubricConfig()));
                q.setAnswerValue(parseJsonMap(a.getAnswerValue()));
                q.setNa(a.isNa());
                q.setNaReason(a.getNaReason());
                q.setNotAssessed(a.isNotAssessed());
                q.setNotAssessedReason(a.getNotAssessedReason());
                q.setRedFlagLogic(a.getQuestionVersion().getRedFlagLogic());
                q.setSuggestedIntervention(a.getQuestionVersion().getSuggestedIntervention());
                questionInputs.add(q);
            }
        }

        LocationAssessmentInput assessmentInput = new LocationAssessmentInput(
                locationId.toString(),
                latestSub.map(s -> s.getId().toString()).orElse(null),
                questionInputs
        );

        // Pure Deterministic Evaluation
        LocationScoreResult result = ScoringEngine.evaluateLocationAudit(assessmentInput);

        User actor = actorId != null ? userRepository.findById(actorId).orElse(null) : null;
        int nextRunNumber = runRepository.countRunsByLocationId(locationId) + 1;

        AnalysisRun run = new AnalysisRun();
        run.setPilotLocation(location);
        run.setSubmission(latestSub.orElse(null));
        run.setRunNumber(nextRunNumber);
        BigDecimal computedAcs = result.getAcsScore() != null
                ? BigDecimal.valueOf(result.getAcsScore()).setScale(2, RoundingMode.HALF_UP)
                : (result.getTotalMaxWeightedPoints() > 0
                        ? BigDecimal.valueOf((result.getTotalEarnedWeightedPoints() / result.getTotalMaxWeightedPoints()) * 100.0).setScale(2, RoundingMode.HALF_UP)
                        : BigDecimal.valueOf(70.0).setScale(2, RoundingMode.HALF_UP));
        String computedBand = result.getAlertBand() != null ? result.getAlertBand().name() : "AMBER";
        run.setAcsScore(computedAcs);
        run.setAlertBand(computedBand);
        run.setProvisional(result.isProvisional());
        run.setCoveragePct(BigDecimal.valueOf(result.getCoveragePct()).setScale(2, RoundingMode.HALF_UP));
        run.setTotalApplicableQuestions(result.getTotalApplicableQuestions());
        run.setTotalAssessedQuestions(result.getTotalAssessedQuestions());
        run.setTotalMaxWeightedPoints(BigDecimal.valueOf(result.getTotalMaxWeightedPoints()).setScale(4, RoundingMode.HALF_UP));
        run.setTotalEarnedWeightedPoints(BigDecimal.valueOf(result.getTotalEarnedWeightedPoints()).setScale(4, RoundingMode.HALF_UP));
        run.setTotalDeductionsWeightedPoints(BigDecimal.valueOf(result.getTotalDeductionsWeightedPoints()).setScale(4, RoundingMode.HALF_UP));
        run.setTriggeredRedFlagsCount(result.getTriggeredRedFlagsCount());
        run.setRunBy(actor);
        run.setAnalyzedAt(Instant.now());
        run.setStatus("COMPLETED");

        AnalysisRun savedRun = runRepository.save(run);

        // Persist Analysis Items
        Map<String, AnalysisItem> savedItemMap = new HashMap<>();
        for (EvaluatedQuestionItem itm : result.getEvaluatedItems()) {
            AuditAnswer ans = answerMap.get(itm.getPageNumber() + ":" + itm.getQuestionId());
            if (ans == null) continue;

            AnalysisItem entity = new AnalysisItem();
            entity.setAnalysisRun(savedRun);
            entity.setAuditPage(ans.getAuditPage());
            entity.setQuestion(ans.getQuestion());
            entity.setQuestionVersion(ans.getQuestionVersion());
            entity.setPageNumber(itm.getPageNumber());
            entity.setSeverity(itm.getSeverity());
            entity.setWeight(BigDecimal.valueOf(itm.getWeight()));
            entity.setRawEarnedPoints(BigDecimal.valueOf(itm.getRawEarned()).setScale(3, RoundingMode.HALF_UP));
            entity.setRawMaxPoints(BigDecimal.valueOf(itm.getRawMax()).setScale(3, RoundingMode.HALF_UP));
            entity.setWeightedEarnedPoints(BigDecimal.valueOf(itm.getWeightedEarned()).setScale(4, RoundingMode.HALF_UP));
            entity.setWeightedMaxPoints(BigDecimal.valueOf(itm.getWeightedMax()).setScale(4, RoundingMode.HALF_UP));
            entity.setNa(itm.isNa());
            entity.setNotAssessed(itm.isNotAssessed());
            entity.setRedFlag(itm.isRedFlag());
            entity.setAlertBand(itm.getAlertBand() != null ? itm.getAlertBand().name() : null);
            entity.setClampedRed(itm.isClampedRed());
            entity.setWorkingNotes(itm.getWorkingNotes());

            AnalysisItem savedItem = itemRepository.save(entity);
            savedItemMap.put(itm.getPageNumber() + ":" + itm.getQuestionId(), savedItem);
        }

        // Persist Deduction Ledger Entries
        for (DeductionLedgerItem d : result.getDeductionLedger()) {
            AnalysisItem relatedItem = savedItemMap.get(d.getPageNumber() + ":" + d.getQuestionId());

            AnalysisLedgerEntry ledgerEntry = new AnalysisLedgerEntry();
            ledgerEntry.setAnalysisRun(savedRun);
            ledgerEntry.setAnalysisItem(relatedItem);
            ledgerEntry.setQuestionId(d.getQuestionId());
            ledgerEntry.setPageNumber(d.getPageNumber());
            ledgerEntry.setQuestionText(d.getQuestionText());
            ledgerEntry.setSeverity(d.getSeverity());
            ledgerEntry.setWeight(BigDecimal.valueOf(d.getWeight()));
            ledgerEntry.setLostWeightedPoints(BigDecimal.valueOf(d.getLostWeightedPoints()).setScale(4, RoundingMode.HALF_UP));
            ledgerEntry.setDeductionPercentage(BigDecimal.valueOf(d.getDeductionPercentage()).setScale(2, RoundingMode.HALF_UP));
            ledgerEntry.setLossExplanation(d.getLossExplanation());
            ledgerEntry.setSuggestedIntervention(d.getSuggestedIntervention());

            ledgerRepository.save(ledgerEntry);
        }

        // Update Location Status
        String prevStatus = location.getStatus();
        location.setStatus("ANALYSED");
        locationRepository.save(location);

        // Atomic Delivery to in-scope District Officers (DEC-007)
        if (location.getDistrict() != null) {
            List<OfficerDistrict> assignments = officerDistrictRepository.findByDistrictId(location.getDistrict().getId());
            for (OfficerDistrict assignment : assignments) {
                User officer = assignment.getOfficer();
                if (officer != null && officer.isActive()) {
                    if (!deliveryRepository.existsByOfficerIdAndAnalysisRunId(officer.getId(), savedRun.getId())) {
                        Delivery delivery = new Delivery(
                                UUID.randomUUID(),
                                officer,
                                savedRun,
                                location,
                                location.getDistrict()
                        );
                        deliveryRepository.save(delivery);
                    }
                }
            }
        }

        // Audit Log
        auditLogService.log(
                actorId,
                actor != null ? actor.getRole().name() : "ADMIN",
                "AUDIT_ANALYSED",
                "PILOT_LOCATION",
                locationId.toString(),
                "{\"status\":\"" + prevStatus + "\"}",
                "{\"status\":\"ANALYSED\",\"acsScore\":" + (result.getAcsScore() != null ? result.getAcsScore() : "null") +
                        ",\"alertBand\":\"" + (result.getAlertBand() != null ? result.getAlertBand().name() : "null") +
                        "\",\"runNumber\":" + nextRunNumber + "}",
                "Deterministic analysis run #" + nextRunNumber + " completed for location " + location.getCode() +
                        ": ACS=" + (result.getAcsScore() != null ? result.getAcsScore() : "N/A") +
                        ", Ledger balanced: " + result.isLedgerBalanced(),
                clientIp
        );

        log.info("Analysis completed for location {}: ACS={}, Band={}, Ledger balanced={}",
                location.getCode(), result.getAcsScore(), result.getAlertBand(), result.isLedgerBalanced());

        return mapRunToDTO(savedRun);
    }

    @Transactional(readOnly = true)
    public Optional<AnalysisRunDTO> getLatestAnalysisForLocation(UUID locationId) {
        return runRepository.findLatestByPilotLocationId(locationId).map(this::mapRunToDTO);
    }

    @Transactional(readOnly = true)
    public Optional<AnalysisRunDTO> getAnalysisRunById(UUID runId) {
        return runRepository.findById(runId).map(this::mapRunToDTO);
    }

    private AnalysisRunDTO mapRunToDTO(AnalysisRun run) {
        AnalysisRunDTO dto = new AnalysisRunDTO();
        dto.setId(run.getId());
        dto.setPilotLocationId(run.getPilotLocation().getId());
        dto.setFacilityCode(run.getPilotLocation().getCode());
        dto.setSubmissionId(run.getSubmission() != null ? run.getSubmission().getId() : null);
        dto.setRunNumber(run.getRunNumber());
        dto.setAcsScore(run.getAcsScore());
        dto.setAlertBand(run.getAlertBand());
        dto.setProvisional(run.isProvisional());
        dto.setCoveragePct(run.getCoveragePct());
        dto.setTotalApplicableQuestions(run.getTotalApplicableQuestions());
        dto.setTotalAssessedQuestions(run.getTotalAssessedQuestions());
        dto.setTotalMaxWeightedPoints(run.getTotalMaxWeightedPoints());
        dto.setTotalEarnedWeightedPoints(run.getTotalEarnedWeightedPoints());
        dto.setTotalDeductionsWeightedPoints(run.getTotalDeductionsWeightedPoints());
        dto.setTriggeredRedFlagsCount(run.getTriggeredRedFlagsCount());
        dto.setRunByUserId(run.getRunBy() != null ? run.getRunBy().getId() : null);
        dto.setRunByUsername(run.getRunBy() != null ? run.getRunBy().getLoginId() : null);
        dto.setAnalyzedAt(run.getAnalyzedAt());
        dto.setStatus(run.getStatus());

        List<AnalysisItem> items = itemRepository.findByAnalysisRunIdOrderByPageNumberAsc(run.getId());
        List<AnalysisItemDTO> itemDTOs = new ArrayList<>();
        Map<String, double[]> sectionTotals = new LinkedHashMap<>();

        for (AnalysisItem item : items) {
            String qText = item.getQuestionVersion() != null ? item.getQuestionVersion().getText() : item.getQuestion().getId();
            String intervention = item.getQuestionVersion() != null ? item.getQuestionVersion().getSuggestedIntervention() : null;

            itemDTOs.add(new AnalysisItemDTO(
                    item.getId(),
                    item.getQuestion().getId(),
                    item.getQuestionVersion() != null ? item.getQuestionVersion().getId() : null,
                    qText,
                    item.getPageNumber(),
                    item.getSeverity(),
                    item.getWeight(),
                    item.getRawEarnedPoints(),
                    item.getRawMaxPoints(),
                    item.getWeightedEarnedPoints(),
                    item.getWeightedMaxPoints(),
                    item.isNa(),
                    item.isNotAssessed(),
                    item.isRedFlag(),
                    item.getAlertBand(),
                    item.isClampedRed(),
                    item.getWorkingNotes(),
                    intervention
            ));

            if (!item.isNa() && !item.isNotAssessed() && item.getWeightedMaxPoints() != null) {
                String sec = item.getQuestion() != null && item.getQuestion().getSection() != null
                        ? item.getQuestion().getSection().trim().toUpperCase() : "GENERAL";
                double[] acc = sectionTotals.computeIfAbsent(sec, k -> new double[3]);
                acc[0] += item.getWeightedEarnedPoints().doubleValue();
                acc[1] += item.getWeightedMaxPoints().doubleValue();
                acc[2] += 1.0;
            }
        }
        dto.setItems(itemDTOs);

        List<AnalysisLedgerEntry> ledgerEntries = ledgerRepository.findByAnalysisRunIdOrderByLostWeightedPointsDesc(run.getId());
        List<DeductionLedgerDTO> ledgerDTOs = new ArrayList<>();
        BigDecimal ledgerSum = BigDecimal.ZERO;

        for (AnalysisLedgerEntry le : ledgerEntries) {
            ledgerDTOs.add(new DeductionLedgerDTO(
                    le.getId(),
                    le.getQuestionId(),
                    le.getPageNumber(),
                    le.getQuestionText(),
                    le.getSeverity(),
                    le.getWeight(),
                    le.getLostWeightedPoints(),
                    le.getDeductionPercentage(),
                    le.getLossExplanation(),
                    le.getSuggestedIntervention()
            ));
            ledgerSum = ledgerSum.add(le.getDeductionPercentage());
        }
        dto.setLedger(ledgerDTOs);
        dto.setLedgerSum(ledgerSum);

        boolean balanced = true;
        if (run.getAcsScore() != null) {
            BigDecimal expectedLoss = BigDecimal.valueOf(100).subtract(run.getAcsScore());
            balanced = expectedLoss.subtract(ledgerSum).abs().compareTo(new BigDecimal("0.01")) <= 0;
        }
        dto.setLedgerBalanced(balanced);

        List<SectionScoreDTO> sectionDTOs = new ArrayList<>();
        for (Map.Entry<String, double[]> entry : sectionTotals.entrySet()) {
            double earned = entry.getValue()[0];
            double max = entry.getValue()[1];
            double pct = max > 0.0 ? (earned / max) * 100.0 : 0.0;
            AlertBandType band = AlertBandType.fromPercentage(pct, false);
            sectionDTOs.add(new SectionScoreDTO(
                    entry.getKey(),
                    BigDecimal.valueOf(earned).setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.valueOf(max).setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.valueOf(pct).setScale(2, RoundingMode.HALF_UP),
                    band.name(),
                    (int) entry.getValue()[2]
            ));
        }
        dto.setSections(sectionDTOs);

        return dto;
    }

    public Map<String, Object> getSmartClassification(UUID locationId) {
        PilotLocation location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Pilot location not found: " + locationId));

        List<AuditPage> pages = pageRepository.findByPilotLocationIdOrderByPageNumberAsc(locationId);
        Optional<AnalysisRun> latestRun = runRepository.findLatestByPilotLocationId(locationId);

        Map<String, Object> answersMap = new HashMap<>();
        List<Map<String, Object>> evidenceItems = new ArrayList<>();

        for (AuditPage page : pages) {
            List<AuditAnswer> answers = answerRepository.findByAuditPageId(page.getId());
            for (AuditAnswer a : answers) {
                try {
                    Map<String, Object> val = objectMapper.readValue(a.getAnswerValue(), new TypeReference<Map<String, Object>>() {});
                    answersMap.put(a.getQuestion().getId(), val);
                } catch (Exception ignored) {
                    answersMap.put(a.getQuestion().getId(), a.getAnswerValue());
                }
            }

            List<EvidenceAttachment> evidences = evidenceAttachmentRepository.findByAuditPageId(page.getId());
            for (EvidenceAttachment ev : evidences) {
                Map<String, Object> evMap = new HashMap<>();
                evMap.put("id", ev.getId().toString());
                evMap.put("fileName", ev.getFileName());
                evMap.put("fileSizeBytes", ev.getFileSizeBytes());
                evMap.put("mimeType", ev.getMimeType());
                evMap.put("questionId", ev.getQuestion() != null ? ev.getQuestion().getId() : null);
                evMap.put("downloadUrl", "/api/v1/evidence/" + ev.getId() + "/file");
                evidenceItems.add(evMap);
            }
        }

        Map<String, Object> req = new HashMap<>();
        req.put("facility_code", location.getCode());
        req.put("facility_type", location.getType() != null ? location.getType().getCode() : "PILOT");
        req.put("domain", location.getType() != null ? (location.getType().getLabel() != null ? location.getType().getLabel() : location.getType().getCode()) : "ALL");
        req.put("answers", answersMap);
        req.put("evidence_items", evidenceItems);

        Map<String, Object> classification = aiServiceClient.classifyReport(req);

        // Ground with latest deterministic analysis run ACS score and alert band if exists
        if (latestRun.isPresent()) {
            AnalysisRun run = latestRun.get();
            if (run.getAcsScore() != null) {
                classification.put("acsScore", run.getAcsScore().doubleValue());
            }
            if (run.getAlertBand() != null) {
                classification.put("alertBand", run.getAlertBand());
            }
        }

        if (classification.get("acsScore") == null) {
            classification.put("acsScore", 70.0);
            classification.put("alertBand", "AMBER");
        }

        return classification;
    }

    private Map<String, Object> parseJsonMap(String json) {
        if (json == null || json.isBlank()) return Collections.emptyMap();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }
}
