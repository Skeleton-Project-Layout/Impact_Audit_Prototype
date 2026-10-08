package org.abhisaran.dashboard;

import jakarta.servlet.http.HttpServletRequest;
import org.abhisaran.dashboard.dto.BulkAnalyseRequest;
import org.abhisaran.dashboard.dto.BulkAnalyseResponse;
import org.abhisaran.dashboard.dto.DashboardOverviewDTO;
import org.abhisaran.users.User;
import org.abhisaran.users.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserRepository userRepository;

    public DashboardController(DashboardService dashboardService, UserRepository userRepository) {
        this.dashboardService = dashboardService;
        this.userRepository = userRepository;
    }

    @GetMapping("/overview")
    public ResponseEntity<DashboardOverviewDTO> getOverview(
            @RequestParam(required = false) Integer districtId,
            @RequestParam(required = false) Integer typeId,
            @RequestParam(required = false) Integer blockId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        DashboardOverviewDTO overview = dashboardService.getOverview(
                districtId, typeId, blockId, status, search, PageRequest.of(page, Math.min(size, 100))
        );
        return ResponseEntity.ok(overview);
    }

    @PostMapping("/bulk-analyse")
    public ResponseEntity<BulkAnalyseResponse> bulkAnalyse(
            @RequestBody(required = false) BulkAnalyseRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        BulkAnalyseResponse response = dashboardService.executeBulkAnalyse(request, actorId, clientIp);
        return ResponseEntity.ok(response);
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
