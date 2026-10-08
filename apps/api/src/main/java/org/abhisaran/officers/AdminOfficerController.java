package org.abhisaran.officers;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.abhisaran.officers.dto.CreateOfficerRequest;
import org.abhisaran.officers.dto.OfficerDTO;
import org.abhisaran.officers.dto.UpdateOfficerDistrictsRequest;
import org.abhisaran.users.User;
import org.abhisaran.users.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/officers")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOfficerController {

    private final OfficerScopingService officerScopingService;
    private final UserRepository userRepository;

    public AdminOfficerController(OfficerScopingService officerScopingService, UserRepository userRepository) {
        this.officerScopingService = officerScopingService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<OfficerDTO>> getAllOfficers() {
        return ResponseEntity.ok(officerScopingService.getAllOfficers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OfficerDTO> getOfficerById(@PathVariable UUID id) {
        return officerScopingService.getOfficerById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<OfficerDTO> createOfficer(
            @Valid @RequestBody CreateOfficerRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        OfficerDTO officer = officerScopingService.createOfficer(request, actorId, clientIp);
        return ResponseEntity.status(HttpStatus.CREATED).body(officer);
    }

    @PutMapping("/{id}/districts")
    public ResponseEntity<OfficerDTO> updateOfficerDistricts(
            @PathVariable UUID id,
            @RequestBody UpdateOfficerDistrictsRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        OfficerDTO officer = officerScopingService.updateOfficerDistricts(
                id,
                request.getDistrictIds(),
                actorId,
                clientIp
        );
        return ResponseEntity.ok(officer);
    }

    private UUID resolveUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required.");
        }
        User user = userRepository.findByLoginId(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("User not found: " + authentication.getName()));
        return user.getId();
    }
}
