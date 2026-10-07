package org.abhisaran.facilities;

import org.abhisaran.auditlog.AuditLogService;
import org.abhisaran.facilities.dto.FacilityResponse;
import org.abhisaran.facilities.dto.RegisterFacilityRequest;
import org.abhisaran.geography.*;
import org.abhisaran.users.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class FacilityService {

    private static final Logger log = LoggerFactory.getLogger(FacilityService.class);

    private final PilotLocationTypeRepository typeRepository;
    private final DistrictRepository districtRepository;
    private final BlockRepository blockRepository;
    private final PanchayatRepository panchayatRepository;
    private final PilotLocationRepository locationRepository;
    private final PilotLocationRegistryRepository registryRepository;
    private final FacilityCodeGenerator codeGenerator;
    private final AuditLogService auditLogService;

    public FacilityService(PilotLocationTypeRepository typeRepository,
                           DistrictRepository districtRepository,
                           BlockRepository blockRepository,
                           PanchayatRepository panchayatRepository,
                           PilotLocationRepository locationRepository,
                           PilotLocationRegistryRepository registryRepository,
                           FacilityCodeGenerator codeGenerator,
                           AuditLogService auditLogService) {
        this.typeRepository = typeRepository;
        this.districtRepository = districtRepository;
        this.blockRepository = blockRepository;
        this.panchayatRepository = panchayatRepository;
        this.locationRepository = locationRepository;
        this.registryRepository = registryRepository;
        this.codeGenerator = codeGenerator;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<PilotLocationType> getAllLocationTypes() {
        return typeRepository.findAll();
    }

    @Transactional
    public FacilityResponse registerFacility(RegisterFacilityRequest request, User currentUser) {
        PilotLocationType type = typeRepository.findByCode(request.getTypeCode().trim().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid location type: " + request.getTypeCode()));

        District district = districtRepository.findById(request.getDistrictId())
                .orElseThrow(() -> new IllegalArgumentException("District not found with ID: " + request.getDistrictId()));

        Block block = null;
        if (request.getBlockId() != null) {
            block = blockRepository.findById(request.getBlockId())
                    .orElseThrow(() -> new IllegalArgumentException("Block not found with ID: " + request.getBlockId()));
            if (!block.getDistrict().getId().equals(district.getId())) {
                throw new IllegalArgumentException("Block " + block.getName() + " does not belong to district " + district.getName());
            }
        }

        Panchayat panchayat = null;
        if (request.getPanchayatId() != null) {
            panchayat = panchayatRepository.findById(request.getPanchayatId())
                    .orElseThrow(() -> new IllegalArgumentException("Panchayat not found with ID: " + request.getPanchayatId()));
            if (block != null && !panchayat.getBlock().getId().equals(block.getId())) {
                throw new IllegalArgumentException("Panchayat " + panchayat.getName() + " does not belong to block " + block.getName());
            }
        }

        // Generate non-recyclable unique code
        String code = codeGenerator.generateNextCode(district, type);

        PilotLocation location = new PilotLocation(
                null,
                code,
                type,
                district,
                block,
                panchayat,
                "REGISTERED",
                request.isDemo(),
                currentUser
        );

        PilotLocation savedLocation = locationRepository.saveAndFlush(location);

        PilotLocationRegistry registry = new PilotLocationRegistry(
                savedLocation.getId(),
                request.getFacilityName().trim(),
                request.getOfficialCode() != null ? request.getOfficialCode().trim() : null
        );

        registryRepository.saveAndFlush(registry);

        auditLogService.logUserAction(
                currentUser,
                "REGISTER_FACILITY",
                "PILOT_LOCATION",
                savedLocation.getId().toString(),
                "Registered facility " + code + " in district " + district.getName(),
                null
        );

        log.info("Registered facility {} ({}) in district {}", code, registry.getName(), district.getName());

        return mapToResponse(savedLocation, registry);
    }

    @Transactional(readOnly = true)
    public Page<FacilityResponse> searchFacilities(
            Integer districtId, Integer typeId, Integer blockId, String status, Pageable pageable) {
        Page<PilotLocation> page = locationRepository.searchLocations(districtId, typeId, blockId, status, pageable);
        return page.map(loc -> {
            PilotLocationRegistry reg = registryRepository.findById(loc.getId()).orElse(null);
            return mapToResponse(loc, reg);
        });
    }

    @Transactional(readOnly = true)
    public Optional<FacilityResponse> getFacilityByCode(String code) {
        return locationRepository.findByCode(code)
                .map(loc -> {
                    PilotLocationRegistry reg = registryRepository.findById(loc.getId()).orElse(null);
                    return mapToResponse(loc, reg);
                });
    }

    private FacilityResponse mapToResponse(PilotLocation loc, PilotLocationRegistry reg) {
        return FacilityResponse.builder()
                .id(loc.getId())
                .code(loc.getCode())
                .typeCode(loc.getType().getCode())
                .typePrefix(loc.getType().getPrefix())
                .typeLabel(loc.getType().getLabel())
                .domain(loc.getType().getDomain())
                .districtId(loc.getDistrict().getId())
                .districtCode(loc.getDistrict().getCode3())
                .districtName(loc.getDistrict().getName())
                .blockId(loc.getBlock() != null ? loc.getBlock().getId() : null)
                .blockName(loc.getBlock() != null ? loc.getBlock().getName() : null)
                .panchayatId(loc.getPanchayat() != null ? loc.getPanchayat().getId() : null)
                .panchayatName(loc.getPanchayat() != null ? loc.getPanchayat().getName() : null)
                .status(loc.getStatus())
                .isDemo(loc.isDemo())
                .facilityName(reg != null ? reg.getName() : null)
                .officialCode(reg != null ? reg.getOfficialCode() : null)
                .createdAt(loc.getCreatedAt())
                .build();
    }
}
