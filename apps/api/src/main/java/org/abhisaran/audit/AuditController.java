package org.abhisaran.audit;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.abhisaran.audit.dto.*;
import org.abhisaran.audit.evidence.EvidenceService;
import org.abhisaran.audit.pii.PiiDetectedException;
import org.abhisaran.users.User;
import org.abhisaran.users.UserRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class AuditController {

    private final AuditService auditService;
    private final EvidenceService evidenceService;
    private final UserRepository userRepository;

    public AuditController(AuditService auditService, EvidenceService evidenceService, UserRepository userRepository) {
        this.auditService = auditService;
        this.evidenceService = evidenceService;
        this.userRepository = userRepository;
    }

    @ExceptionHandler(PiiDetectedException.class)
    public ResponseEntity<Map<String, String>> handlePiiDetected(PiiDetectedException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", ex.getMessage()));
    }

    @GetMapping("/locations/{locationId}/pages")
    public ResponseEntity<LocationAuditOverviewDTO> getLocationPages(
            @PathVariable UUID locationId,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        LocationAuditOverviewDTO overview = auditService.getLocationAuditOverview(locationId, actorId, clientIp);
        return ResponseEntity.ok(overview);
    }

    @PostMapping("/locations/{locationId}/pages")
    public ResponseEntity<AuditPageDTO> createPage(
            @PathVariable UUID locationId,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        AuditPageDTO newPage = auditService.createPage(locationId, actorId, clientIp);
        return ResponseEntity.status(HttpStatus.CREATED).body(newPage);
    }

    @GetMapping("/pages/{pageId}")
    public ResponseEntity<AuditPageDTO> getPage(@PathVariable UUID pageId) {
        AuditPageDTO page = auditService.getPage(pageId);
        return ResponseEntity.ok(page);
    }

    @PutMapping("/pages/{pageId}/answers")
    public ResponseEntity<Map<String, Object>> saveAnswers(
            @PathVariable UUID pageId,
            @RequestBody AnswerBatchSaveRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        auditService.saveAnswers(pageId, request, actorId, clientIp);
        return ResponseEntity.ok(Map.of(
                "status", "SYNCED",
                "pageId", pageId,
                "message", "Answers successfully saved"
        ));
    }

    @PostMapping("/pages/{pageId}/duplicate")
    public ResponseEntity<AuditPageDTO> duplicatePage(
            @PathVariable UUID pageId,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        AuditPageDTO duplicated = auditService.duplicatePage(pageId, actorId, clientIp);
        return ResponseEntity.status(HttpStatus.CREATED).body(duplicated);
    }

    @DeleteMapping("/pages/{pageId}")
    public ResponseEntity<Map<String, Object>> deletePage(
            @PathVariable UUID pageId,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        auditService.deletePage(pageId, actorId, clientIp);
        return ResponseEntity.ok(Map.of(
                "pageId", pageId,
                "deleted", true,
                "message", "Audit page deleted successfully"
        ));
    }

    @PostMapping("/pages/{pageId}/clear")
    public ResponseEntity<Map<String, Object>> clearPage(
            @PathVariable UUID pageId,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        auditService.clearPage(pageId, actorId, clientIp);
        return ResponseEntity.ok(Map.of(
                "pageId", pageId,
                "cleared", true,
                "message", "Audit page cleared successfully"
        ));
    }

    @PostMapping(value = "/pages/{pageId}/evidence", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EvidenceDTO> uploadEvidence(
            @PathVariable UUID pageId,
            @RequestParam("questionId") String questionId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "attestation", defaultValue = "false") boolean attestation,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        EvidenceDTO dto = evidenceService.uploadEvidence(pageId, questionId, file, attestation, actorId, clientIp);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping("/evidence/{evidenceId}/file")
    public ResponseEntity<byte[]> getEvidenceFile(
            @PathVariable UUID evidenceId,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        Map<String, Object> fileData = evidenceService.getEvidenceFile(evidenceId, actorId, clientIp);

        byte[] content = (byte[]) fileData.get("content");
        String mimeType = (String) fileData.get("mimeType");
        String fileName = (String) fileData.get("fileName");

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mimeType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(content);
    }

    @DeleteMapping("/evidence/{evidenceId}")
    public ResponseEntity<Map<String, Object>> deleteEvidence(
            @PathVariable UUID evidenceId,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        evidenceService.deleteEvidence(evidenceId, actorId, clientIp);
        return ResponseEntity.ok(Map.of(
                "evidenceId", evidenceId,
                "deleted", true,
                "message", "Evidence attachment removed"
        ));
    }

    @GetMapping("/locations/{locationId}/completeness")
    public ResponseEntity<CompletenessReportDTO> checkCompleteness(@PathVariable UUID locationId) {
        CompletenessReportDTO report = auditService.validateCompleteness(locationId);
        return ResponseEntity.ok(report);
    }

    @PostMapping("/locations/{locationId}/submit")
    public ResponseEntity<Map<String, Object>> submitLocation(
            @PathVariable UUID locationId,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        auditService.submitLocation(locationId, actorId, clientIp);
        return ResponseEntity.ok(Map.of(
                "locationId", locationId,
                "status", "READY_FOR_ANALYSIS",
                "message", "All audit pages submitted successfully. Location is ready for scoring analysis."
        ));
    }

    @PostMapping("/locations/{locationId}/reopen")
    public ResponseEntity<Map<String, Object>> reopenLocation(
            @PathVariable UUID locationId,
            @Valid @RequestBody ReopenRequestDTO request,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        auditService.reopenLocation(locationId, request.getReason(), actorId, clientIp);
        return ResponseEntity.ok(Map.of(
                "locationId", locationId,
                "status", "REOPENED",
                "message", "Audit pages reopened for editing."
        ));
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
