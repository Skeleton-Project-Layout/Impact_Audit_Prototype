package org.abhisaran.geography;

import org.abhisaran.geography.dto.CreateBlockRequest;
import org.abhisaran.geography.dto.CreatePanchayatRequest;
import org.abhisaran.geography.dto.GeographyDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class GeographyService {

    private static final Logger log = LoggerFactory.getLogger(GeographyService.class);

    private final StateRepository stateRepository;
    private final DistrictRepository districtRepository;
    private final BlockRepository blockRepository;
    private final PanchayatRepository panchayatRepository;

    public GeographyService(StateRepository stateRepository,
                            DistrictRepository districtRepository,
                            BlockRepository blockRepository,
                            PanchayatRepository panchayatRepository) {
        this.stateRepository = stateRepository;
        this.districtRepository = districtRepository;
        this.blockRepository = blockRepository;
        this.panchayatRepository = panchayatRepository;
    }

    @Transactional(readOnly = true)
    public List<GeographyDto.StateResponse> getAllStates() {
        return stateRepository.findAll().stream()
                .map(s -> GeographyDto.StateResponse.builder()
                        .id(s.getId())
                        .code2(s.getCode2())
                        .name(s.getName())
                        .active(s.isActive())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GeographyDto.DistrictResponse> getAllDistricts() {
        return districtRepository.findAll().stream()
                .map(this::toDistrictDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GeographyDto.DistrictResponse> getDistrictsByState(Integer stateId) {
        return districtRepository.findByStateIdOrderByNameAsc(stateId).stream()
                .map(this::toDistrictDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GeographyDto.BlockResponse> getBlocksByDistrict(Integer districtId) {
        return blockRepository.findByDistrictIdOrderByNameAsc(districtId).stream()
                .map(b -> GeographyDto.BlockResponse.builder()
                        .id(b.getId())
                        .districtId(b.getDistrict().getId())
                        .districtCode(b.getDistrict().getCode3())
                        .code(b.getCode())
                        .name(b.getName())
                        .active(b.isActive())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GeographyDto.PanchayatResponse> getPanchayatsByBlock(Integer blockId) {
        return panchayatRepository.findByBlockIdOrderByNameAsc(blockId).stream()
                .map(p -> GeographyDto.PanchayatResponse.builder()
                        .id(p.getId())
                        .blockId(p.getBlock().getId())
                        .blockCode(p.getBlock().getCode())
                        .code(p.getCode())
                        .name(p.getName())
                        .active(p.isActive())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public GeographyDto.BlockResponse createBlock(CreateBlockRequest request) {
        District district = districtRepository.findById(request.getDistrictId())
                .orElseThrow(() -> new IllegalArgumentException("District not found with ID: " + request.getDistrictId()));

        String normalizedCode = request.getCode().trim().toUpperCase();
        if (blockRepository.findByDistrictIdAndCode(district.getId(), normalizedCode).isPresent()) {
            throw new IllegalArgumentException("Block with code " + normalizedCode + " already exists in district " + district.getName());
        }

        Block block = new Block(null, district, normalizedCode, request.getName().trim(), true);
        Block saved = blockRepository.save(block);
        log.info("Created block {} ({}) in district {}", saved.getName(), saved.getCode(), district.getName());

        return GeographyDto.BlockResponse.builder()
                .id(saved.getId())
                .districtId(district.getId())
                .districtCode(district.getCode3())
                .code(saved.getCode())
                .name(saved.getName())
                .active(saved.isActive())
                .build();
    }

    @Transactional
    public GeographyDto.PanchayatResponse createPanchayat(CreatePanchayatRequest request) {
        Block block = blockRepository.findById(request.getBlockId())
                .orElseThrow(() -> new IllegalArgumentException("Block not found with ID: " + request.getBlockId()));

        String normalizedCode = request.getCode().trim().toUpperCase();
        if (panchayatRepository.findByBlockIdAndCode(block.getId(), normalizedCode).isPresent()) {
            throw new IllegalArgumentException("Panchayat with code " + normalizedCode + " already exists in block " + block.getName());
        }

        Panchayat panchayat = new Panchayat(null, block, normalizedCode, request.getName().trim(), true);
        Panchayat saved = panchayatRepository.save(panchayat);
        log.info("Created panchayat {} ({}) in block {}", saved.getName(), saved.getCode(), block.getName());

        return GeographyDto.PanchayatResponse.builder()
                .id(saved.getId())
                .blockId(block.getId())
                .blockCode(block.getCode())
                .code(saved.getCode())
                .name(saved.getName())
                .active(saved.isActive())
                .build();
    }

    private GeographyDto.DistrictResponse toDistrictDto(District d) {
        return GeographyDto.DistrictResponse.builder()
                .id(d.getId())
                .stateId(d.getState() != null ? d.getState().getId() : null)
                .stateCode(d.getState() != null ? d.getState().getCode2() : null)
                .code3(d.getCode3())
                .name(d.getName())
                .active(d.isActive())
                .build();
    }
}
