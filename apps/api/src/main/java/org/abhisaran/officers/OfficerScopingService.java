package org.abhisaran.officers;

import org.abhisaran.auditlog.AuditLogService;
import org.abhisaran.delivery.dto.DistrictSummaryDTO;
import org.abhisaran.delivery.persistence.Delivery;
import org.abhisaran.delivery.persistence.DeliveryRepository;
import org.abhisaran.geography.District;
import org.abhisaran.geography.DistrictRepository;
import org.abhisaran.officers.dto.CreateOfficerRequest;
import org.abhisaran.officers.dto.OfficerDTO;
import org.abhisaran.officers.persistence.OfficerDistrict;
import org.abhisaran.officers.persistence.OfficerDistrictRepository;
import org.abhisaran.scoring.persistence.AnalysisRun;
import org.abhisaran.scoring.persistence.AnalysisRunRepository;
import org.abhisaran.users.User;
import org.abhisaran.users.UserRepository;
import org.abhisaran.users.UserRole;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class OfficerScopingService {

    private static final Logger log = LoggerFactory.getLogger(OfficerScopingService.class);

    private final UserRepository userRepository;
    private final OfficerDistrictRepository officerDistrictRepository;
    private final DistrictRepository districtRepository;
    private final DeliveryRepository deliveryRepository;
    private final AnalysisRunRepository runRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public OfficerScopingService(UserRepository userRepository,
                                 OfficerDistrictRepository officerDistrictRepository,
                                 DistrictRepository districtRepository,
                                 DeliveryRepository deliveryRepository,
                                 AnalysisRunRepository runRepository,
                                 PasswordEncoder passwordEncoder,
                                 AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.officerDistrictRepository = officerDistrictRepository;
        this.districtRepository = districtRepository;
        this.deliveryRepository = deliveryRepository;
        this.runRepository = runRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<OfficerDTO> getAllOfficers() {
        List<User> officers = userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.OFFICER)
                .sorted(Comparator.comparing(User::getDisplayName))
                .toList();

        return officers.stream().map(this::toOfficerDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<OfficerDTO> getOfficerById(UUID officerId) {
        return userRepository.findById(officerId)
                .filter(u -> u.getRole() == UserRole.OFFICER)
                .map(this::toOfficerDTO);
    }

    @Transactional
    public OfficerDTO createOfficer(CreateOfficerRequest request, UUID actorId, String clientIp) {
        String cleanLoginId = request.getLoginId().trim().toLowerCase();
        if (userRepository.findByLoginId(cleanLoginId).isPresent()) {
            throw new IllegalArgumentException("User with login ID '" + cleanLoginId + "' already exists.");
        }

        User actor = actorId != null ? userRepository.findById(actorId).orElse(null) : null;

        User officer = new User(
                UUID.randomUUID(),
                cleanLoginId,
                UserRole.OFFICER,
                request.getDisplayName().trim(),
                request.getDesignation() != null ? request.getDesignation().trim() : null,
                passwordEncoder.encode(request.getPassword()),
                true, // must change password upon first login
                true
        );

        User savedOfficer = userRepository.save(officer);

        List<Integer> districtIds = request.getDistrictIds() != null ? request.getDistrictIds() : Collections.emptyList();
        for (Integer dId : districtIds) {
            District district = districtRepository.findById(dId)
                    .orElseThrow(() -> new IllegalArgumentException("District with ID " + dId + " does not exist."));
            OfficerDistrict od = new OfficerDistrict(savedOfficer, district, actor);
            officerDistrictRepository.save(od);
        }

        // Backfill deliveries for existing completed runs
        int backfilledCount = backfillDeliveriesForOfficer(savedOfficer, districtIds);

        auditLogService.log(
                actorId,
                actor != null ? actor.getRole().name() : "ADMIN",
                "OFFICER_CREATED",
                "USER",
                savedOfficer.getId().toString(),
                null,
                "{\"loginId\":\"" + savedOfficer.getLoginId() + "\",\"districts\":" + districtIds + ",\"backfilled\":" + backfilledCount + "}",
                "Created officer " + savedOfficer.getDisplayName() + " with " + districtIds.size() + " district scope(s)",
                clientIp
        );

        log.info("Officer {} ({}) created with {} districts. Backfilled {} deliveries.",
                savedOfficer.getLoginId(), savedOfficer.getId(), districtIds.size(), backfilledCount);

        return toOfficerDTO(savedOfficer);
    }

    @Transactional
    public OfficerDTO updateOfficerDistricts(UUID officerId, List<Integer> districtIds, UUID actorId, String clientIp) {
        User officer = userRepository.findById(officerId)
                .filter(u -> u.getRole() == UserRole.OFFICER)
                .orElseThrow(() -> new IllegalArgumentException("Officer with ID " + officerId + " does not exist."));

        User actor = actorId != null ? userRepository.findById(actorId).orElse(null) : null;

        // Existing scopes
        List<OfficerDistrict> existing = officerDistrictRepository.findByOfficerId(officerId);
        Set<Integer> existingIds = existing.stream().map(od -> od.getDistrict().getId()).collect(Collectors.toSet());
        Set<Integer> newIds = new HashSet<>(districtIds != null ? districtIds : Collections.emptyList());

        // Remove unassigned
        for (OfficerDistrict od : existing) {
            if (!newIds.contains(od.getDistrict().getId())) {
                officerDistrictRepository.delete(od);
            }
        }

        // Add newly assigned
        List<Integer> newlyAdded = new ArrayList<>();
        for (Integer dId : newIds) {
            if (!existingIds.contains(dId)) {
                District district = districtRepository.findById(dId)
                        .orElseThrow(() -> new IllegalArgumentException("District with ID " + dId + " does not exist."));
                OfficerDistrict od = new OfficerDistrict(officer, district, actor);
                officerDistrictRepository.save(od);
                newlyAdded.add(dId);
            }
        }

        int backfilledCount = 0;
        if (!newlyAdded.isEmpty()) {
            backfilledCount = backfillDeliveriesForOfficer(officer, newlyAdded);
        }

        auditLogService.log(
                actorId,
                actor != null ? actor.getRole().name() : "ADMIN",
                "OFFICER_DISTRICTS_UPDATED",
                "USER",
                officer.getId().toString(),
                "{\"districts\":" + existingIds + "}",
                "{\"districts\":" + newIds + ",\"backfilled\":" + backfilledCount + "}",
                "Updated district scoping for officer " + officer.getDisplayName(),
                clientIp
        );

        return toOfficerDTO(officer);
    }

    @Transactional
    public int backfillDeliveriesForOfficer(User officer, List<Integer> districtIds) {
        if (districtIds == null || districtIds.isEmpty()) {
            return 0;
        }

        List<AnalysisRun> runs = runRepository.findCompletedRunsByDistrictIds(districtIds);
        int createdCount = 0;

        for (AnalysisRun run : runs) {
            if (!deliveryRepository.existsByOfficerIdAndAnalysisRunId(officer.getId(), run.getId())) {
                Delivery delivery = new Delivery(
                        UUID.randomUUID(),
                        officer,
                        run,
                        run.getPilotLocation(),
                        run.getPilotLocation().getDistrict()
                );
                deliveryRepository.save(delivery);
                createdCount++;
            }
        }

        return createdCount;
    }

    private OfficerDTO toOfficerDTO(User officer) {
        List<OfficerDistrict> assignments = officerDistrictRepository.findByOfficerId(officer.getId());
        List<DistrictSummaryDTO> districtDTOs = assignments.stream()
                .map(od -> new DistrictSummaryDTO(
                        od.getDistrict().getId(),
                        od.getDistrict().getCode3(),
                        od.getDistrict().getName()
                ))
                .sorted(Comparator.comparing(DistrictSummaryDTO::getName))
                .collect(Collectors.toList());

        long total = deliveryRepository.countByOfficerId(officer.getId());
        long unread = deliveryRepository.countByOfficerIdAndReadAtIsNull(officer.getId());

        OfficerDTO dto = new OfficerDTO();
        dto.setId(officer.getId());
        dto.setLoginId(officer.getLoginId());
        dto.setDisplayName(officer.getDisplayName());
        dto.setDesignation(officer.getDesignation());
        dto.setActive(officer.isActive());
        dto.setMustChangePassword(officer.isMustChangePassword());
        dto.setAssignedDistricts(districtDTOs);
        dto.setTotalDeliveries(total);
        dto.setUnreadDeliveries(unread);
        dto.setCreatedAt(officer.getCreatedAt());

        return dto;
    }
}
