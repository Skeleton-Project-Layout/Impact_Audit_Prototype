package org.abhisaran.delivery;

import org.abhisaran.auditlog.AuditLogService;
import org.abhisaran.delivery.dto.AcknowledgeDeliveryRequest;
import org.abhisaran.delivery.dto.DeliveryInboxDTO;
import org.abhisaran.delivery.dto.DistrictSummaryDTO;
import org.abhisaran.delivery.dto.InboxSummaryDTO;
import org.abhisaran.delivery.persistence.Delivery;
import org.abhisaran.delivery.persistence.DeliveryRepository;
import org.abhisaran.facilities.PilotLocation;
import org.abhisaran.officers.persistence.OfficerDistrict;
import org.abhisaran.officers.persistence.OfficerDistrictRepository;
import org.abhisaran.scoring.AnalysisService;
import org.abhisaran.scoring.dto.AnalysisRunDTO;
import org.abhisaran.scoring.persistence.AnalysisRun;
import org.abhisaran.scoring.persistence.AnalysisRunRepository;
import org.abhisaran.users.User;
import org.abhisaran.users.UserRepository;
import org.abhisaran.users.UserRole;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final OfficerDistrictRepository officerDistrictRepository;
    private final AnalysisRunRepository runRepository;
    private final UserRepository userRepository;
    private final AnalysisService analysisService;
    private final AuditLogService auditLogService;

    public DeliveryService(DeliveryRepository deliveryRepository,
                           OfficerDistrictRepository officerDistrictRepository,
                           AnalysisRunRepository runRepository,
                           UserRepository userRepository,
                           AnalysisService analysisService,
                           AuditLogService auditLogService) {
        this.deliveryRepository = deliveryRepository;
        this.officerDistrictRepository = officerDistrictRepository;
        this.runRepository = runRepository;
        this.userRepository = userRepository;
        this.analysisService = analysisService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public InboxSummaryDTO getOfficerInbox(UUID officerId, Integer districtIdFilter, boolean unreadOnly) {
        User officer = userRepository.findById(officerId)
                .filter(u -> u.getRole() == UserRole.OFFICER)
                .orElseThrow(() -> new IllegalArgumentException("Officer not found."));

        List<OfficerDistrict> assignments = officerDistrictRepository.findByOfficerId(officerId);
        List<DistrictSummaryDTO> assignedDistricts = assignments.stream()
                .map(od -> new DistrictSummaryDTO(
                        od.getDistrict().getId(),
                        od.getDistrict().getCode3(),
                        od.getDistrict().getName()
                ))
                .sorted(Comparator.comparing(DistrictSummaryDTO::getName))
                .collect(Collectors.toList());

        List<Delivery> rawDeliveries;
        if (districtIdFilter != null) {
            // Verify district is in officer's scope
            boolean inScope = assignments.stream().anyMatch(a -> a.getDistrict().getId().equals(districtIdFilter));
            if (!inScope) {
                throw new AccessDeniedException("District ID " + districtIdFilter + " is outside your assigned jurisdiction.");
            }
            if (unreadOnly) {
                rawDeliveries = deliveryRepository.findByOfficerIdAndDistrictIdAndReadAtIsNullOrderByDeliveredAtDesc(officerId, districtIdFilter);
            } else {
                rawDeliveries = deliveryRepository.findByOfficerIdAndDistrictIdOrderByDeliveredAtDesc(officerId, districtIdFilter);
            }
        } else {
            if (unreadOnly) {
                rawDeliveries = deliveryRepository.findByOfficerIdAndReadAtIsNullOrderByDeliveredAtDesc(officerId);
            } else {
                rawDeliveries = deliveryRepository.findByOfficerIdOrderByDeliveredAtDesc(officerId);
            }
        }

        List<DeliveryInboxDTO> deliveryDTOs = rawDeliveries.stream()
                .map(this::toInboxDTO)
                .collect(Collectors.toList());

        long total = deliveryRepository.countByOfficerId(officerId);
        long unread = deliveryRepository.countByOfficerIdAndReadAtIsNull(officerId);
        long ack = deliveryRepository.countByOfficerIdAndAcknowledgedAtIsNotNull(officerId);

        InboxSummaryDTO summary = new InboxSummaryDTO();
        summary.setTotalDeliveries(total);
        summary.setUnreadCount(unread);
        summary.setAcknowledgedCount(ack);
        summary.setAssignedDistricts(assignedDistricts);
        summary.setDeliveries(deliveryDTOs);

        return summary;
    }

    @Transactional
    public DeliveryInboxDTO markAsRead(UUID deliveryId, UUID officerId) {
        Delivery delivery = deliveryRepository.findByIdAndOfficerId(deliveryId, officerId)
                .orElseThrow(() -> new IllegalArgumentException("Delivery not found or not assigned to officer."));

        if (delivery.getReadAt() == null) {
            delivery.setReadAt(OffsetDateTime.now());
            delivery = deliveryRepository.save(delivery);
        }

        return toInboxDTO(delivery);
    }

    @Transactional
    public DeliveryInboxDTO acknowledgeDelivery(UUID deliveryId, UUID officerId, AcknowledgeDeliveryRequest request, String clientIp) {
        Delivery delivery = deliveryRepository.findByIdAndOfficerId(deliveryId, officerId)
                .orElseThrow(() -> new IllegalArgumentException("Delivery not found or not assigned to officer."));

        OffsetDateTime now = OffsetDateTime.now();
        if (delivery.getReadAt() == null) {
            delivery.setReadAt(now);
        }
        delivery.setAcknowledgedAt(now);
        if (request != null && request.getNotes() != null) {
            delivery.setAcknowledgmentNotes(request.getNotes().trim());
        }

        Delivery saved = deliveryRepository.save(delivery);

        auditLogService.log(
                officerId,
                "OFFICER",
                "DELIVERY_ACKNOWLEDGED",
                "DELIVERY",
                saved.getId().toString(),
                null,
                "{\"runId\":\"" + saved.getAnalysisRun().getId() + "\",\"locationCode\":\"" + saved.getPilotLocation().getCode() + "\"}",
                "Officer acknowledged receipt of ACS audit for " + saved.getPilotLocation().getCode(),
                clientIp
        );

        return toInboxDTO(saved);
    }

    @Transactional(readOnly = true)
    public AnalysisRunDTO getScopedAnalysisForOfficer(UUID runId, UUID officerId) {
        AnalysisRun run = runRepository.findById(runId)
                .orElseThrow(() -> new IllegalArgumentException("Analysis run not found."));

        PilotLocation location = run.getPilotLocation();
        if (location.getDistrict() == null) {
            throw new AccessDeniedException("Location has no associated district.");
        }

        Integer districtId = location.getDistrict().getId();

        // Check if officer has jurisdiction over this district
        boolean hasAccess = officerDistrictRepository.existsByOfficerIdAndDistrictId(officerId, districtId);
        if (!hasAccess) {
            throw new AccessDeniedException("Access denied: Facility is outside your assigned district jurisdiction.");
        }

        // Also if a delivery exists for this officer and run, mark it as read automatically
        Optional<Delivery> deliveryOpt = deliveryRepository.findByOfficerIdAndAnalysisRunId(officerId, runId);
        deliveryOpt.ifPresent(d -> {
            if (d.getReadAt() == null) {
                d.setReadAt(OffsetDateTime.now());
                deliveryRepository.save(d);
            }
        });

        // Fetch analysis details
        return analysisService.getAnalysisRunById(runId)
                .orElseThrow(() -> new IllegalArgumentException("Analysis run details not found."));
    }

    private DeliveryInboxDTO toInboxDTO(Delivery d) {
        AnalysisRun run = d.getAnalysisRun();
        PilotLocation loc = d.getPilotLocation();

        DeliveryInboxDTO dto = new DeliveryInboxDTO();
        dto.setId(d.getId());
        dto.setRunId(run.getId());
        dto.setLocationId(loc.getId());
        dto.setLocationCode(loc.getCode());
        dto.setFacilityType(loc.getType() != null ? loc.getType().getLabel() : "Facility");
        dto.setDistrictId(d.getDistrict().getId());
        dto.setDistrictName(d.getDistrict().getName());
        dto.setBlockName(loc.getBlock() != null ? loc.getBlock().getName() : null);
        dto.setPanchayatName(loc.getPanchayat() != null ? loc.getPanchayat().getName() : null);
        dto.setAcsScore(run.getAcsScore() != null ? run.getAcsScore().doubleValue() : null);
        dto.setAlertBand(run.getAlertBand());
        dto.setCoveragePct(run.getCoveragePct() != null ? run.getCoveragePct().doubleValue() : 0.0);
        dto.setProvisional(run.isProvisional());
        dto.setTriggeredRedFlagsCount(run.getTriggeredRedFlagsCount());
        dto.setDeliveredAt(d.getDeliveredAt());
        dto.setReadAt(d.getReadAt());
        dto.setAcknowledgedAt(d.getAcknowledgedAt());
        dto.setAcknowledgmentNotes(d.getAcknowledgmentNotes());
        dto.setRead(d.getReadAt() != null);
        dto.setAcknowledged(d.getAcknowledgedAt() != null);

        return dto;
    }
}
