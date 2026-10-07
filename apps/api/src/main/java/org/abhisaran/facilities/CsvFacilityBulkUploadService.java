package org.abhisaran.facilities;

import org.abhisaran.facilities.dto.CsvRowErrorDto;
import org.abhisaran.facilities.dto.CsvUploadSummaryDto;
import org.abhisaran.facilities.dto.FacilityResponse;
import org.abhisaran.facilities.dto.RegisterFacilityRequest;
import org.abhisaran.geography.*;
import org.abhisaran.users.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class CsvFacilityBulkUploadService {

    private static final Logger log = LoggerFactory.getLogger(CsvFacilityBulkUploadService.class);

    private final FacilityService facilityService;
    private final PilotLocationTypeRepository typeRepository;
    private final DistrictRepository districtRepository;
    private final BlockRepository blockRepository;
    private final PanchayatRepository panchayatRepository;

    public CsvFacilityBulkUploadService(FacilityService facilityService,
                                        PilotLocationTypeRepository typeRepository,
                                        DistrictRepository districtRepository,
                                        BlockRepository blockRepository,
                                        PanchayatRepository panchayatRepository) {
        this.facilityService = facilityService;
        this.typeRepository = typeRepository;
        this.districtRepository = districtRepository;
        this.blockRepository = blockRepository;
        this.panchayatRepository = panchayatRepository;
    }

    public CsvUploadSummaryDto processCsv(InputStream inputStream, User currentUser) {
        List<CsvRowErrorDto> errors = new ArrayList<>();
        List<FacilityResponse> createdFacilities = new ArrayList<>();
        int dataRowCount = 0;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null || headerLine.trim().isEmpty()) {
                errors.add(new CsvRowErrorDto(1, "file", "CSV file is empty"));
                return CsvUploadSummaryDto.builder()
                        .totalRows(0)
                        .successCount(0)
                        .failureCount(0)
                        .errors(errors)
                        .build();
            }

            // Remove UTF-8 BOM if present
            if (headerLine.startsWith("\uFEFF")) {
                headerLine = headerLine.substring(1);
            }

            Map<String, Integer> headerMap = parseHeader(headerLine);
            if (!headerMap.containsKey("type_code") || !headerMap.containsKey("district_code") || !headerMap.containsKey("facility_name")) {
                errors.add(new CsvRowErrorDto(1, "header",
                        "Missing mandatory headers. Required: type_code, district_code, facility_name. Optional: block_code, panchayat_code, official_code"));
                return CsvUploadSummaryDto.builder()
                        .totalRows(0)
                        .successCount(0)
                        .failureCount(0)
                        .errors(errors)
                        .build();
            }

            String line;
            int lineNumber = 1;

            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (line.trim().isEmpty()) {
                    continue; // Skip blank lines
                }
                dataRowCount++;

                List<String> tokens = parseCsvLine(line);
                List<CsvRowErrorDto> rowErrors = new ArrayList<>();

                String typeCode = getField(tokens, headerMap, "type_code");
                String districtCode = getField(tokens, headerMap, "district_code");
                String facilityName = getField(tokens, headerMap, "facility_name");
                String blockCode = getField(tokens, headerMap, "block_code");
                String panchayatCode = getField(tokens, headerMap, "panchayat_code");
                String officialCode = getField(tokens, headerMap, "official_code");

                // 1. Validate Type Code
                PilotLocationType type = null;
                if (typeCode == null || typeCode.trim().isEmpty()) {
                    rowErrors.add(new CsvRowErrorDto(lineNumber, "type_code", "type_code is required"));
                } else {
                    Optional<PilotLocationType> optType = typeRepository.findByCode(typeCode.trim().toUpperCase());
                    if (optType.isEmpty()) {
                        rowErrors.add(new CsvRowErrorDto(lineNumber, "type_code", "Unknown facility type: " + typeCode));
                    } else {
                        type = optType.get();
                    }
                }

                // 2. Validate District Code
                District district = null;
                if (districtCode == null || districtCode.trim().isEmpty()) {
                    rowErrors.add(new CsvRowErrorDto(lineNumber, "district_code", "district_code is required"));
                } else {
                    Optional<District> optDistrict = districtRepository.findByCode3(districtCode.trim().toUpperCase());
                    if (optDistrict.isEmpty()) {
                        rowErrors.add(new CsvRowErrorDto(lineNumber, "district_code", "Unknown district code: " + districtCode));
                    } else {
                        district = optDistrict.get();
                    }
                }

                // 3. Validate Facility Name
                if (facilityName == null || facilityName.trim().isEmpty()) {
                    rowErrors.add(new CsvRowErrorDto(lineNumber, "facility_name", "facility_name cannot be empty"));
                }

                // 4. Validate Block Code (if provided)
                Block block = null;
                if (blockCode != null && !blockCode.trim().isEmpty() && district != null) {
                    Optional<Block> optBlock = blockRepository.findByDistrictIdAndCode(district.getId(), blockCode.trim().toUpperCase());
                    if (optBlock.isEmpty()) {
                        rowErrors.add(new CsvRowErrorDto(lineNumber, "block_code", "Block code '" + blockCode + "' not found in district " + district.getCode3()));
                    } else {
                        block = optBlock.get();
                    }
                }

                // 5. Validate Panchayat Code (if provided)
                Panchayat panchayat = null;
                if (panchayatCode != null && !panchayatCode.trim().isEmpty() && block != null) {
                    Optional<Panchayat> optPanchayat = panchayatRepository.findByBlockIdAndCode(block.getId(), panchayatCode.trim().toUpperCase());
                    if (optPanchayat.isEmpty()) {
                        rowErrors.add(new CsvRowErrorDto(lineNumber, "panchayat_code", "Panchayat code '" + panchayatCode + "' not found in block " + block.getCode()));
                    } else {
                        panchayat = optPanchayat.get();
                    }
                }

                if (!rowErrors.isEmpty()) {
                    errors.addAll(rowErrors);
                    continue;
                }

                // If valid, register the facility
                try {
                    RegisterFacilityRequest req = RegisterFacilityRequest.builder()
                            .typeCode(type.getCode())
                            .districtId(district.getId())
                            .blockId(block != null ? block.getId() : null)
                            .panchayatId(panchayat != null ? panchayat.getId() : null)
                            .facilityName(facilityName.trim())
                            .officialCode(officialCode != null && !officialCode.trim().isEmpty() ? officialCode.trim() : null)
                            .isDemo(false)
                            .build();

                    FacilityResponse registered = facilityService.registerFacility(req, currentUser);
                    createdFacilities.add(registered);
                } catch (Exception e) {
                    log.error("Failed to register facility at row {}: {}", lineNumber, e.getMessage());
                    errors.add(new CsvRowErrorDto(lineNumber, "row", "Registration failed: " + e.getMessage()));
                }
            }

        } catch (Exception e) {
            log.error("CSV processing error: {}", e.getMessage(), e);
            errors.add(new CsvRowErrorDto(0, "file", "Error reading CSV stream: " + e.getMessage()));
        }

        int successCount = createdFacilities.size();
        int failureCount = dataRowCount - successCount;

        return CsvUploadSummaryDto.builder()
                .totalRows(dataRowCount)
                .successCount(successCount)
                .failureCount(failureCount)
                .createdFacilities(createdFacilities)
                .errors(errors)
                .build();
    }

    private Map<String, Integer> parseHeader(String headerLine) {
        Map<String, Integer> map = new HashMap<>();
        List<String> headers = parseCsvLine(headerLine);
        for (int i = 0; i < headers.size(); i++) {
            String col = headers.get(i).trim().toLowerCase().replaceAll("[^a-z0-9_]", "");
            map.put(col, i);
        }
        return map;
    }

    private String getField(List<String> tokens, Map<String, Integer> headerMap, String fieldName) {
        Integer index = headerMap.get(fieldName);
        if (index != null && index < tokens.size()) {
            return tokens.get(index);
        }
        return null;
    }

    private List<String> parseCsvLine(String line) {
        List<String> tokens = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '\"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                tokens.add(sb.toString().trim());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        tokens.add(sb.toString().trim());
        return tokens;
    }
}
