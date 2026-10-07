package org.abhisaran.facilities;

import org.abhisaran.facilities.dto.CsvRowErrorDto;
import org.abhisaran.facilities.dto.CsvUploadSummaryDto;
import org.abhisaran.facilities.dto.FacilityResponse;
import org.abhisaran.users.User;
import org.abhisaran.users.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
public class CsvBulkUploadIntegrationTest {

    @Autowired
    private CsvFacilityBulkUploadService bulkUploadService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PilotLocationRepository locationRepository;

    @Test
    @DisplayName("CSV bulk upload parses 50 rows with valid and invalid rows, reporting per-row errors accurately")
    void testFiftyRowCsvBulkUploadWithValidationDiagnostics() {
        User admin = userRepository.findByLoginId("admin").orElse(null);

        // Build 50 rows (40 valid + 10 invalid)
        StringBuilder csv = new StringBuilder();
        csv.append("type_code,district_code,block_code,panchayat_code,facility_name,official_code\n");

        String[] validDistricts = {"RCH", "DHN", "BOK", "ESB"};
        String[] validTypes = {"SCHOOL", "ANGANWADI", "PHC", "HOSPITAL"};
        String[] validBlocks = {"KNK", "DHN_B", "CHS", "GCJ"};

        int validCount = 0;
        int invalidCount = 0;

        for (int i = 1; i <= 50; i++) {
            if (i % 5 == 0) {
                // Invalid rows (every 5th row: 5, 10, 15, 20, 25, 30, 35, 40, 45, 50 -> 10 total)
                invalidCount++;
                switch (invalidCount % 4) {
                    case 0:
                        // Invalid type code
                        csv.append(String.format("INVALID_TYPE,%s,%s,,Invalid Facility %d,EXT_%d\n",
                                validDistricts[0], validBlocks[0], i, i));
                        break;
                    case 1:
                        // Invalid district code
                        csv.append(String.format("SCHOOL,NON_EXISTENT_DIST,%s,,Invalid Facility %d,EXT_%d\n",
                                validBlocks[0], i, i));
                        break;
                    case 2:
                        // Empty facility name
                        csv.append(String.format("PHC,%s,%s,, ,EXT_%d\n",
                                validDistricts[1], validBlocks[1], i));
                        break;
                    case 3:
                        // Invalid block code for district
                        csv.append(String.format("HOSPITAL,%s,FAKE_BLOCK_CODE,,Invalid Facility %d,EXT_%d\n",
                                validDistricts[2], i, i));
                        break;
                }
            } else {
                // Valid rows (40 total)
                validCount++;
                int distIdx = validCount % validDistricts.length;
                int typeIdx = validCount % validTypes.length;
                String dist = validDistricts[distIdx];
                String type = validTypes[typeIdx];
                String block = validBlocks[distIdx];

                csv.append(String.format("%s,%s,%s,,Valid Pilot Facility %d,UDISE_2026_%04d\n",
                        type, dist, block, i, i));
            }
        }

        assertThat(validCount).isEqualTo(40);
        assertThat(invalidCount).isEqualTo(10);

        InputStream inputStream = new ByteArrayInputStream(csv.toString().getBytes(StandardCharsets.UTF_8));
        CsvUploadSummaryDto summary = bulkUploadService.processCsv(inputStream, admin);

        assertThat(summary).isNotNull();
        assertThat(summary.getTotalRows()).isEqualTo(50);
        assertThat(summary.getSuccessCount()).isEqualTo(40);
        assertThat(summary.getFailureCount()).isEqualTo(10);
        assertThat(summary.getErrors()).hasSize(10);

        // Verify that errors were flagged for the exact invalid row numbers (row 1 is header, data rows are 2..51)
        Set<Integer> errorRows = summary.getErrors().stream()
                .map(CsvRowErrorDto::getRowNumber)
                .collect(Collectors.toSet());

        for (int i = 5; i <= 50; i += 5) {
            int csvLineNumber = i + 1; // +1 because row 1 is header
            assertThat(errorRows).contains(csvLineNumber);
        }

        // Verify successful facilities were registered with permanent codes
        List<FacilityResponse> created = summary.getCreatedFacilities();
        assertThat(created).hasSize(40);

        Set<String> generatedCodes = created.stream()
                .map(FacilityResponse::getCode)
                .collect(Collectors.toSet());
        assertThat(generatedCodes).hasSize(40); // All 40 codes unique

        for (FacilityResponse facility : created) {
            assertThat(locationRepository.existsByCode(facility.getCode())).isTrue();
            assertThat(facility.getCode()).matches("^JH-(RCH|DHN|BOK|ESB)-(SCH|AWC|PHC|HOS)-\\d{4}$");
        }
    }
}
