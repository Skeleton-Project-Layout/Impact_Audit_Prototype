package org.abhisaran.scoring;

import jakarta.servlet.http.HttpServletRequest;
import org.abhisaran.scoring.dto.AnalysisRunDTO;
import org.abhisaran.users.User;
import org.abhisaran.users.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class AnalysisController {

    private final AnalysisService analysisService;
    private final org.abhisaran.dashboard.DashboardService dashboardService;
    private final UserRepository userRepository;

    public AnalysisController(AnalysisService analysisService,
                              org.abhisaran.dashboard.DashboardService dashboardService,
                              UserRepository userRepository) {
        this.analysisService = analysisService;
        this.dashboardService = dashboardService;
        this.userRepository = userRepository;
    }

    @PostMapping("/locations/bulk-analyse")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<org.abhisaran.dashboard.dto.BulkAnalyseResponse> bulkAnalyseLocations(
            @RequestBody(required = false) org.abhisaran.dashboard.dto.BulkAnalyseRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        return ResponseEntity.ok(dashboardService.executeBulkAnalyse(request, actorId, clientIp));
    }

    @PostMapping("/locations/{locationId}/analyse")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER', 'STATE_ADMIN', 'DISTRICT_OFFICER', 'FIELD_AUDITOR')")
    public ResponseEntity<AnalysisRunDTO> triggerLocationAnalysis(
            @PathVariable UUID locationId,
            Authentication authentication,
            HttpServletRequest request
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = request.getRemoteAddr();

        AnalysisRunDTO result = analysisService.analyseLocation(locationId, actorId, clientIp);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/locations/{locationId}/analysis/latest")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AnalysisRunDTO> getLatestAnalysisForLocation(
            @PathVariable UUID locationId
    ) {
        return analysisService.getLatestAnalysisForLocation(locationId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/analysis/{runId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AnalysisRunDTO> getAnalysisRunById(
            @PathVariable UUID runId
    ) {
        return analysisService.getAnalysisRunById(runId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private UUID resolveUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return userRepository.findByLoginId(authentication.getName())
                .map(User::getId)
                .orElse(null);
    }
}
