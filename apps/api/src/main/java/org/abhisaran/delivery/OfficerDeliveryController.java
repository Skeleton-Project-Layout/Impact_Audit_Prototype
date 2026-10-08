package org.abhisaran.delivery;

import jakarta.servlet.http.HttpServletRequest;
import org.abhisaran.delivery.dto.AcknowledgeDeliveryRequest;
import org.abhisaran.delivery.dto.DeliveryInboxDTO;
import org.abhisaran.delivery.dto.InboxSummaryDTO;
import org.abhisaran.scoring.dto.AnalysisRunDTO;
import org.abhisaran.users.User;
import org.abhisaran.users.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/me")
@PreAuthorize("hasRole('OFFICER')")
public class OfficerDeliveryController {

    private final DeliveryService deliveryService;
    private final UserRepository userRepository;

    public OfficerDeliveryController(DeliveryService deliveryService, UserRepository userRepository) {
        this.deliveryService = deliveryService;
        this.userRepository = userRepository;
    }

    @GetMapping("/inbox")
    public ResponseEntity<InboxSummaryDTO> getInbox(
            @RequestParam(required = false) Integer districtId,
            @RequestParam(required = false, defaultValue = "false") boolean unreadOnly,
            Authentication authentication
    ) {
        UUID officerId = resolveOfficerId(authentication);
        InboxSummaryDTO inbox = deliveryService.getOfficerInbox(officerId, districtId, unreadOnly);
        return ResponseEntity.ok(inbox);
    }

    @PostMapping("/deliveries/{deliveryId}/read")
    public ResponseEntity<DeliveryInboxDTO> markAsRead(
            @PathVariable UUID deliveryId,
            Authentication authentication
    ) {
        UUID officerId = resolveOfficerId(authentication);
        DeliveryInboxDTO dto = deliveryService.markAsRead(deliveryId, officerId);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/deliveries/{deliveryId}/acknowledge")
    public ResponseEntity<DeliveryInboxDTO> acknowledgeDelivery(
            @PathVariable UUID deliveryId,
            @RequestBody(required = false) AcknowledgeDeliveryRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UUID officerId = resolveOfficerId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        DeliveryInboxDTO dto = deliveryService.acknowledgeDelivery(deliveryId, officerId, request, clientIp);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/results/{runId}")
    public ResponseEntity<AnalysisRunDTO> getScopedResult(
            @PathVariable UUID runId,
            Authentication authentication
    ) {
        UUID officerId = resolveOfficerId(authentication);
        AnalysisRunDTO result = deliveryService.getScopedAnalysisForOfficer(runId, officerId);
        return ResponseEntity.ok(result);
    }

    private UUID resolveOfficerId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required.");
        }
        User user = userRepository.findByLoginId(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("User not found: " + authentication.getName()));
        return user.getId();
    }
}
