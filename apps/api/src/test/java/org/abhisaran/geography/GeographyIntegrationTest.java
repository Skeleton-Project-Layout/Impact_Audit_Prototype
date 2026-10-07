package org.abhisaran.geography;

import org.abhisaran.geography.dto.CreateBlockRequest;
import org.abhisaran.geography.dto.CreatePanchayatRequest;
import org.abhisaran.geography.dto.GeographyDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class GeographyIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private GeographyService geographyService;

    @Autowired
    private DistrictRepository districtRepository;

    @Test
    @DisplayName("Verify 4 pilot districts are present and queryable: Ranchi, Dhanbad, Bokaro, East Singhbhum")
    void testFourPilotDistrictsPresent() {
        ResponseEntity<List<GeographyDto.DistrictResponse>> response = restTemplate.exchange(
                "/api/v1/geography/districts",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<GeographyDto.DistrictResponse> districts = response.getBody();
        assertThat(districts).isNotNull();

        Set<String> districtCodes = districts.stream()
                .map(GeographyDto.DistrictResponse::getCode3)
                .collect(Collectors.toSet());

        assertThat(districtCodes).contains("RCH", "DHN", "BOK", "ESB");

        Set<String> districtNames = districts.stream()
                .map(GeographyDto.DistrictResponse::getName)
                .collect(Collectors.toSet());

        assertThat(districtNames).contains("Ranchi", "Dhanbad", "Bokaro", "East Singhbhum");
    }

    @Test
    @DisplayName("Verify blocks and panchayats hierarchy for Ranchi district")
    void testBlocksAndPanchayatsHierarchy() {
        District ranchi = districtRepository.findByCode3("RCH").orElseThrow();

        ResponseEntity<List<GeographyDto.BlockResponse>> blockResp = restTemplate.exchange(
                "/api/v1/geography/districts/" + ranchi.getId() + "/blocks",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
        );

        assertThat(blockResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<GeographyDto.BlockResponse> blocks = blockResp.getBody();
        assertThat(blocks).isNotNull();
        assertThat(blocks.size()).isGreaterThanOrEqualTo(4);

        Set<String> blockNames = blocks.stream()
                .map(GeographyDto.BlockResponse::getName)
                .collect(Collectors.toSet());
        assertThat(blockNames).contains("Kanke", "Namkum", "Ratu", "Ormanjhi");

        // Verify panchayats in first block (Kanke)
        GeographyDto.BlockResponse kanke = blocks.stream()
                .filter(b -> b.getCode().equals("KNK"))
                .findFirst()
                .orElseThrow();

        ResponseEntity<List<GeographyDto.PanchayatResponse>> panchayatResp = restTemplate.exchange(
                "/api/v1/geography/blocks/" + kanke.getId() + "/panchayats",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
        );

        assertThat(panchayatResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<GeographyDto.PanchayatResponse> panchayats = panchayatResp.getBody();
        assertThat(panchayats).isNotNull();
        assertThat(panchayats.size()).isGreaterThanOrEqualTo(2);
    }

    @Test
    @DisplayName("Create new block and panchayat dynamically via GeographyService")
    void testCreateBlockAndPanchayat() {
        District bokaro = districtRepository.findByCode3("BOK").orElseThrow();
        String testBlockCode = "TST_BLK_" + System.currentTimeMillis() % 10000;

        CreateBlockRequest blockReq = CreateBlockRequest.builder()
                .districtId(bokaro.getId())
                .code(testBlockCode)
                .name("Test Pilot Block")
                .build();

        GeographyDto.BlockResponse createdBlock = geographyService.createBlock(blockReq);
        assertThat(createdBlock).isNotNull();
        assertThat(createdBlock.getCode()).isEqualTo(testBlockCode);

        CreatePanchayatRequest panReq = CreatePanchayatRequest.builder()
                .blockId(createdBlock.getId())
                .code("TST_PAN_" + System.currentTimeMillis() % 10000)
                .name("Test Pilot Panchayat")
                .build();

        GeographyDto.PanchayatResponse createdPan = geographyService.createPanchayat(panReq);
        assertThat(createdPan).isNotNull();
        assertThat(createdPan.getBlockId()).isEqualTo(createdBlock.getId());
    }
}
