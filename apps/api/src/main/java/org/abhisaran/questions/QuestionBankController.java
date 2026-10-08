package org.abhisaran.questions;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.abhisaran.questions.dto.*;
import org.abhisaran.users.User;
import org.abhisaran.users.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/questions")
@PreAuthorize("hasRole('ADMIN')")
public class QuestionBankController {

    private final QuestionBankService questionBankService;
    private final UserRepository userRepository;

    public QuestionBankController(QuestionBankService questionBankService, UserRepository userRepository) {
        this.questionBankService = questionBankService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<QuestionSummaryDTO>> listQuestions(
            @RequestParam(required = false) String domain,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean scored,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search
    ) {
        List<QuestionSummaryDTO> list = questionBankService.getQuestions(
                domain, section, severity, status, scored, active, search
        );
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuestionDetailDTO> getQuestion(@PathVariable String id) {
        return ResponseEntity.ok(questionBankService.getQuestion(id));
    }

    @GetMapping("/{id}/versions")
    public ResponseEntity<List<QuestionVersionSummaryDTO>> getVersionHistory(@PathVariable String id) {
        return ResponseEntity.ok(questionBankService.getVersionHistory(id));
    }

    @GetMapping("/{id}/versions/{versionNumber}")
    public ResponseEntity<QuestionDetailDTO> getVersion(
            @PathVariable String id,
            @PathVariable int versionNumber
    ) {
        return ResponseEntity.ok(questionBankService.getVersionDetails(id, versionNumber));
    }

    @PostMapping
    public ResponseEntity<QuestionDetailDTO> createQuestion(
            @Valid @RequestBody QuestionCreateRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        QuestionDetailDTO created = questionBankService.createQuestion(request, actorId, clientIp);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuestionDetailDTO> updateQuestion(
            @PathVariable String id,
            @Valid @RequestBody QuestionUpdateRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        QuestionDetailDTO updated = questionBankService.updateQuestion(id, request, actorId, clientIp);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> toggleStatus(
            @PathVariable String id,
            @RequestBody Map<String, Boolean> body,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        boolean active = body.getOrDefault("active", true);
        UUID actorId = resolveUserId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        questionBankService.toggleActive(id, active, actorId, clientIp);
        return ResponseEntity.ok(Map.of("id", id, "active", active, "message", "Status updated successfully"));
    }

    @PostMapping("/{id}/approve-rubric")
    public ResponseEntity<Map<String, Object>> approveRubric(
            @PathVariable String id,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        questionBankService.approveRubric(id, actorId, clientIp);
        return ResponseEntity.ok(Map.of("id", id, "status", "ACTIVE", "message", "Rubric approved successfully"));
    }

    @PostMapping("/bulk-approve-rubrics")
    public ResponseEntity<Map<String, Object>> bulkApproveRubrics(
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UUID actorId = resolveUserId(authentication);
        String clientIp = httpRequest.getRemoteAddr();
        int count = questionBankService.bulkApproveRubrics(actorId, clientIp);
        return ResponseEntity.ok(Map.of("approvedCount", count, "message", "Successfully approved " + count + " rubrics"));
    }

    @PostMapping("/{id}/test-rubric")
    public ResponseEntity<RubricTestResponse> testRubric(
            @PathVariable String id,
            @RequestBody RubricTestRequest request
    ) {
        RubricTestResponse response = questionBankService.testRubric(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/test-rubric-ad-hoc")
    public ResponseEntity<RubricTestResponse> testRubricAdHoc(
            @RequestBody RubricTestRequest request
    ) {
        RubricTestResponse response = questionBankService.testRubricAdHoc(request);
        return ResponseEntity.ok(response);
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
