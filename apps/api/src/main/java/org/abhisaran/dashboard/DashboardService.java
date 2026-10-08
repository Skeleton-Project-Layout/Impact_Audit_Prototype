package org.abhisaran.dashboard;

import org.abhisaran.audit.AuditPageRepository;
import org.abhisaran.audit.AuditSubmission;
import org.abhisaran.audit.AuditSubmissionRepository;
import org.abhisaran.auditlog.AuditLogService;
import org.abhisaran.dashboard.dto.*;
import org.abhisaran.delivery.persistence.DeliveryRepository;
import org.abhisaran.facilities.PilotLocation;
import org.abhisaran.facilities.PilotLocationRepository;
import org.abhisaran.scoring.AnalysisService;
import org.abhisaran.scoring.dto.AnalysisRunDTO;
import org.abhisaran.scoring.persistence.AnalysisRun;
import org.abhisaran.scoring.persistence.AnalysisRunRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class DashboardService {

    private final PilotLocationRepository locationRepository;
    private final AuditPageRepository pageRepository;
    private final AnalysisRunRepository runRepository;
    private final AuditSubmissionRepository submissionRepository;
    private final DeliveryRepository deliveryRepository;
    private final AnalysisService analysisService;
    private final AuditLogService auditLogService;

    public DashboardService(PilotLocationRepository locationRepository,
                            AuditPageRepository pageRepository,
                            AnalysisRunRepository runRepository,
                            AuditSubmissionRepository submissionRepository,
                            DeliveryRepository deliveryRepository,
                            AnalysisService analysisService,
                            AuditLogService auditLogService) {
        this.locationRepository = locationRepository;
        this.pageRepository = pageRepository;
        this.runRepository = runRepository;
        this.submissionRepository = submissionRepository;
        this.deliveryRepository = deliveryRepository;
        this.analysisService = analysisService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public DashboardOverviewDTO getOverview(Integer districtId, Integer typeId, Integer blockId,
                                            String status, String search, Pageable pageable) {
        // Status counts for overview tiles
        long totalLocations = locationRepository.count();
        long readyCount = locationRepository.countByStatus("READY_FOR_ANALYSIS");
        long analysedCount = locationRepository.countByStatus("ANALYSED");
        long draftCount = locationRepository.countByStatus("DRAFT") + locationRepository.countByStatus("REOPENED");
        long registeredCount = locationRepository.countByStatus("REGISTERED");

        DashboardMetricsDTO metrics = new DashboardMetricsDTO(
                totalLocations, readyCount, analysedCount, draftCount, registeredCount
        );

        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim().toLowerCase() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) ? status.trim() : null;

        // Strict Non-Ranking rule: Query returns rows sorted by l.code ASC
        Page<PilotLocation> locationPage;
        if (cleanSearch != null) {
            locationPage = locationRepository.searchLocationsWithTerm(
                    districtId, typeId, blockId, cleanStatus, "%" + cleanSearch + "%", pageable
            );
        } else {
            locationPage = locationRepository.searchLocations(
                    districtId, typeId, blockId, cleanStatus, pageable
            );
        }

        List<LocationOverviewItemDTO> items = new ArrayList<>();
        for (PilotLocation loc : locationPage.getContent()) {
            LocationOverviewItemDTO item = new LocationOverviewItemDTO();
            item.setId(loc.getId());
            item.setCode(loc.getCode());
            if (loc.getType() != null) {
                item.setTypeCode(loc.getType().getCode());
                item.setTypePrefix(loc.getType().getPrefix());
                item.setTypeLabel(loc.getType().getLabel());
                item.setDomain(loc.getType().getDomain());
            }
            if (loc.getDistrict() != null) {
                item.setDistrictId(loc.getDistrict().getId());
                item.setDistrictCode(loc.getDistrict().getCode3());
                item.setDistrictName(loc.getDistrict().getName());
            }
            if (loc.getBlock() != null) {
                item.setBlockId(loc.getBlock().getId());
                item.setBlockName(loc.getBlock().getName());
            }
            if (loc.getPanchayat() != null) {
                item.setPanchayatId(loc.getPanchayat().getId());
                item.setPanchayatName(loc.getPanchayat().getName());
            }
            item.setStatus(loc.getStatus());
            item.setDemo(loc.isDemo());
            if (loc.getCreatedAt() != null) {
                item.setCreatedAt(loc.getCreatedAt());
            }

            int pageCount = (int) pageRepository.countByPilotLocationId(loc.getId());
            item.setPageCount(pageCount);

            Optional<AnalysisRun> latestRun = runRepository.findLatestByPilotLocationId(loc.getId());
            if (latestRun.isPresent()) {
                AnalysisRun run = latestRun.get();
                item.setLatestRunId(run.getId());
                item.setLatestRunNumber(run.getRunNumber());
                if (run.getAcsScore() != null) {
                    item.setLatestAcsScore(run.getAcsScore().doubleValue());
                } else if (run.getTotalMaxWeightedPoints() != null && run.getTotalMaxWeightedPoints().doubleValue() > 0) {
                    double pct = (run.getTotalEarnedWeightedPoints().doubleValue() / run.getTotalMaxWeightedPoints().doubleValue()) * 100.0;
                    item.setLatestAcsScore(Math.round(pct * 10.0) / 10.0);
                } else {
                    item.setLatestAcsScore(70.0);
                }
                item.setLatestAlertBand(run.getAlertBand() != null ? run.getAlertBand() : "AMBER");
                if (run.getCoveragePct() != null) {
                    item.setLatestCoveragePct(run.getCoveragePct().doubleValue());
                }
                item.setLatestIsProvisional(run.isProvisional());
                item.setLatestRedFlagsCount(run.getTriggeredRedFlagsCount());
                item.setLastAnalysedAt(run.getAnalyzedAt());
            }

            Optional<AuditSubmission> latestSub = submissionRepository.findTopByPilotLocationIdOrderBySubmittedAtDesc(loc.getId());
            if (latestSub.isPresent()) {
                item.setLastSubmittedAt(latestSub.get().getSubmittedAt());
            }

            items.add(item);
        }

        return new DashboardOverviewDTO(
                metrics, items, locationPage.getNumber(), locationPage.getSize(),
                locationPage.getTotalElements(), locationPage.getTotalPages()
        );
    }

    public BulkAnalyseResponse executeBulkAnalyse(BulkAnalyseRequest request, UUID actorId, String clientIp) {
        List<UUID> targetIds = new ArrayList<>();
        if (request != null && request.getLocationIds() != null && !request.getLocationIds().isEmpty()) {
            targetIds.addAll(request.getLocationIds());
        } else {
            // Default: pick all ready for analysis
            List<PilotLocation> readyLocations = locationRepository.findAll().stream()
                    .filter(l -> "READY_FOR_ANALYSIS".equalsIgnoreCase(l.getStatus()))
                    .toList();
            for (PilotLocation loc : readyLocations) {
                targetIds.add(loc.getId());
            }
        }

        int successCount = 0;
        int failureCount = 0;
        List<BulkAnalyseItemResult> results = new ArrayList<>();

        for (UUID locId : targetIds) {
            Optional<PilotLocation> locOpt = locationRepository.findById(locId);
            String locCode = locOpt.map(PilotLocation::getCode).orElse("UNKNOWN");

            try {
                AnalysisRunDTO runDto = analysisService.analyseLocation(locId, actorId, clientIp);
                int deliveredCount = deliveryRepository.findByAnalysisRunId(runDto.getId()).size();

                BulkAnalyseItemResult itemResult = new BulkAnalyseItemResult(
                        locId,
                        locCode,
                        true,
                        runDto.getAcsScore() != null ? runDto.getAcsScore().doubleValue() : null,
                        runDto.getAlertBand(),
                        runDto.getCoveragePct() != null ? runDto.getCoveragePct().doubleValue() : null,
                        runDto.getId(),
                        deliveredCount,
                        null
                );
                results.add(itemResult);
                successCount++;
            } catch (Exception e) {
                BulkAnalyseItemResult itemResult = new BulkAnalyseItemResult(
                        locId,
                        locCode,
                        false,
                        null,
                        null,
                        null,
                        null,
                        0,
                        e.getMessage() != null ? e.getMessage() : "Analysis execution failed"
                );
                results.add(itemResult);
                failureCount++;
            }
        }

        // Audit Log
        auditLogService.log(
                actorId,
                "ADMIN",
                "BULK_ANALYSE",
                "PILOT_LOCATIONS",
                successCount + "/" + targetIds.size(),
                null,
                null,
                "Bulk analysis completed: " + successCount + " succeeded, " + failureCount + " failed",
                clientIp != null ? clientIp : "127.0.0.1"
        );

        return new BulkAnalyseResponse(targetIds.size(), successCount, failureCount, results);
    }
}
