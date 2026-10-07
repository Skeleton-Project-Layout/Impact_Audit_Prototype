package org.abhisaran.geography;

import jakarta.validation.Valid;
import org.abhisaran.geography.dto.CreateBlockRequest;
import org.abhisaran.geography.dto.CreatePanchayatRequest;
import org.abhisaran.geography.dto.GeographyDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/geography")
public class GeographyController {

    private final GeographyService geographyService;

    public GeographyController(GeographyService geographyService) {
        this.geographyService = geographyService;
    }

    @GetMapping("/states")
    public ResponseEntity<List<GeographyDto.StateResponse>> getStates() {
        return ResponseEntity.ok(geographyService.getAllStates());
    }

    @GetMapping("/districts")
    public ResponseEntity<List<GeographyDto.DistrictResponse>> getDistricts(
            @RequestParam(name = "stateId", required = false) Integer stateId) {
        if (stateId != null) {
            return ResponseEntity.ok(geographyService.getDistrictsByState(stateId));
        }
        return ResponseEntity.ok(geographyService.getAllDistricts());
    }

    @GetMapping("/districts/{districtId}/blocks")
    public ResponseEntity<List<GeographyDto.BlockResponse>> getBlocks(@PathVariable("districtId") Integer districtId) {
        return ResponseEntity.ok(geographyService.getBlocksByDistrict(districtId));
    }

    @GetMapping("/blocks/{blockId}/panchayats")
    public ResponseEntity<List<GeographyDto.PanchayatResponse>> getPanchayats(@PathVariable("blockId") Integer blockId) {
        return ResponseEntity.ok(geographyService.getPanchayatsByBlock(blockId));
    }

    @PostMapping("/blocks")
    public ResponseEntity<GeographyDto.BlockResponse> createBlock(@Valid @RequestBody CreateBlockRequest request) {
        GeographyDto.BlockResponse created = geographyService.createBlock(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/panchayats")
    public ResponseEntity<GeographyDto.PanchayatResponse> createPanchayat(@Valid @RequestBody CreatePanchayatRequest request) {
        GeographyDto.PanchayatResponse created = geographyService.createPanchayat(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
