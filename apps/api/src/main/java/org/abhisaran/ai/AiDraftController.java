package org.abhisaran.ai;

import jakarta.servlet.http.HttpServletRequest;
import org.abhisaran.ai.dto.AiDraftDTO;
import org.abhisaran.ai.dto.AiStatusDTO;
import org.abhisaran.users.User;
import org.abhisaran.users.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai")
@PreAuthorize("hasRole('ADMIN')")
public class AiDraftController {

    private final AiDraftService aiDraftService;
    private final UserRepository userRepository;

    public AiDraftController(AiDraftService aiDraftService, UserRepository userRepository) {
        this.aiDraftService = aiDraftService;
        this.userRepository = userRepository;
    }

    @GetMapping("/status")
    public ResponseEntity<AiStatusDTO> getStatus() {
        return ResponseEntity.ok(aiDraftService.getStatus());
    }

    @PostMapping("/summarise-run/{runId}")
    public ResponseEntity<AiDraftDTO> summariseRun(
            @PathVariable UUID runId,
            Authentication authentication,
            HttpServletRequest request
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = request.getRemoteAddr();
        AiDraftDTO draft = aiDraftService.generateRunSummary(runId, actorId, clientIp);
        return ResponseEntity.ok(draft);
    }

    @GetMapping("/drafts/{targetType}/{targetId}")
    public ResponseEntity<List<AiDraftDTO>> getDrafts(
            @PathVariable String targetType,
            @PathVariable UUID targetId
    ) {
        List<AiDraftDTO> drafts = aiDraftService.getDrafts(targetType, targetId);
        return ResponseEntity.ok(drafts);
    }

    @PostMapping("/drafts/{id}/accept")
    public ResponseEntity<AiDraftDTO> acceptDraft(
            @PathVariable UUID id,
            Authentication authentication,
            HttpServletRequest request
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = request.getRemoteAddr();
        AiDraftDTO updated = aiDraftService.acceptDraft(id, actorId, clientIp);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/drafts/{id}/reject")
    public ResponseEntity<AiDraftDTO> rejectDraft(
            @PathVariable UUID id,
            Authentication authentication,
            HttpServletRequest request
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = request.getRemoteAddr();
        AiDraftDTO updated = aiDraftService.rejectDraft(id, actorId, clientIp);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/extract-text/{evidenceId}")
    public ResponseEntity<AiDraftDTO> extractText(
            @PathVariable UUID evidenceId,
            @RequestParam(required = false) String fileName,
            @RequestBody(required = false) String base64Content,
            Authentication authentication,
            HttpServletRequest request
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = request.getRemoteAddr();
        AiDraftDTO draft = aiDraftService.extractEvidenceText(evidenceId, fileName, base64Content, actorId, clientIp);
        return ResponseEntity.ok(draft);
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
