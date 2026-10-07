package org.abhisaran.facilities;

import jakarta.validation.Valid;
import org.abhisaran.facilities.dto.CsvUploadSummaryDto;
import org.abhisaran.facilities.dto.FacilityResponse;
import org.abhisaran.facilities.dto.RegisterFacilityRequest;
import org.abhisaran.users.User;
import org.abhisaran.users.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/facilities")
public class FacilityController {

    private final FacilityService facilityService;
    private final CsvFacilityBulkUploadService bulkUploadService;
    private final UserRepository userRepository;

    public FacilityController(FacilityService facilityService,
                              CsvFacilityBulkUploadService bulkUploadService,
                              UserRepository userRepository) {
        this.facilityService = facilityService;
        this.bulkUploadService = bulkUploadService;
        this.userRepository = userRepository;
    }

    @GetMapping("/types")
    public ResponseEntity<List<PilotLocationType>> getLocationTypes() {
        return ResponseEntity.ok(facilityService.getAllLocationTypes());
    }

    @PostMapping
    public ResponseEntity<FacilityResponse> registerFacility(
            @Valid @RequestBody RegisterFacilityRequest request,
            Authentication authentication) {
        User currentUser = resolveUser(authentication);
        FacilityResponse response = facilityService.registerFacility(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<Page<FacilityResponse>> searchFacilities(
            @RequestParam(name = "districtId", required = false) Integer districtId,
            @RequestParam(name = "typeId", required = false) Integer typeId,
            @RequestParam(name = "blockId", required = false) Integer blockId,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        Page<FacilityResponse> result = facilityService.searchFacilities(
                districtId, typeId, blockId, status, PageRequest.of(page, size));
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{code}")
    public ResponseEntity<FacilityResponse> getFacilityByCode(@PathVariable("code") String code) {
        return facilityService.getFacilityByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping(value = "/bulk-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CsvUploadSummaryDto> bulkUploadFacilities(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {
        User currentUser = resolveUser(authentication);
        CsvUploadSummaryDto summary = bulkUploadService.processCsv(file.getInputStream(), currentUser);
        return ResponseEntity.ok(summary);
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return userRepository.findByLoginId(authentication.getName()).orElse(null);
    }
}
