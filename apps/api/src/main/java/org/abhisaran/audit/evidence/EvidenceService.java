package org.abhisaran.audit.evidence;

import org.abhisaran.audit.AuditPage;
import org.abhisaran.audit.AuditPageRepository;
import org.abhisaran.audit.EvidenceAttachment;
import org.abhisaran.audit.EvidenceAttachmentRepository;
import org.abhisaran.audit.dto.EvidenceDTO;
import org.abhisaran.auditlog.AuditLogService;
import org.abhisaran.questions.QuestionBank;
import org.abhisaran.questions.QuestionBankRepository;
import org.abhisaran.users.User;
import org.abhisaran.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class EvidenceService {

    private static final Logger log = LoggerFactory.getLogger(EvidenceService.class);
    private static final int MAX_FILES_PER_QUESTION = 10;

    private final EvidenceAttachmentRepository evidenceRepository;
    private final AuditPageRepository pageRepository;
    private final QuestionBankRepository questionBankRepository;
    private final UserRepository userRepository;
    private final EvidenceStorageService storageService;
    private final AuditLogService auditLogService;

    public EvidenceService(
            EvidenceAttachmentRepository evidenceRepository,
            AuditPageRepository pageRepository,
            QuestionBankRepository questionBankRepository,
            UserRepository userRepository,
            EvidenceStorageService storageService,
            AuditLogService auditLogService
    ) {
        this.evidenceRepository = evidenceRepository;
        this.pageRepository = pageRepository;
        this.questionBankRepository = questionBankRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public EvidenceDTO uploadEvidence(
            UUID pageId,
            String questionId,
            MultipartFile file,
            boolean attestationConfirmed,
            UUID actorId,
            String clientIp
    ) {
        if (!attestationConfirmed) {
            throw new IllegalArgumentException(
                    "Attestation required: You must confirm no faces, children, names, or personal information are in this file."
            );
        }

        AuditPage page = pageRepository.findById(pageId)
                .orElseThrow(() -> new IllegalArgumentException("Audit page not found: " + pageId));

        if (!"DRAFT".equalsIgnoreCase(page.getStatus())) {
            throw new IllegalStateException("Evidence can only be added to audit pages in DRAFT status");
        }

        QuestionBank question = questionBankRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("Question not found: " + questionId));

        if (!question.isEvidenceUploadDefault()) {
            throw new IllegalArgumentException("Evidence upload is disabled for question: " + questionId);
        }

        long existingCount = evidenceRepository.countByAuditPageIdAndQuestionId(pageId, questionId);
        if (existingCount >= MAX_FILES_PER_QUESTION) {
            throw new IllegalArgumentException("Maximum of " + MAX_FILES_PER_QUESTION + " evidence files reached for this question");
        }

        User actor = actorId != null ? userRepository.findById(actorId).orElse(null) : null;

        try {
            EvidenceStorageService.ProcessedFile processed = storageService.processAndStore(
                    file.getInputStream(),
                    file.getOriginalFilename()
            );

            EvidenceAttachment attachment = new EvidenceAttachment(
                    UUID.randomUUID(),
                    page,
                    question,
                    processed.storageFileName(),
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : "evidence.bin",
                    processed.sizeBytes(),
                    processed.mimeType(),
                    processed.sha256Hex(),
                    true,
                    actor
            );

            evidenceRepository.save(attachment);

            auditLogService.log(
                    actorId,
                    actor != null ? actor.getRole().name() : "ADMIN",
                    "EVIDENCE_UPLOADED",
                    "EVIDENCE",
                    attachment.getId().toString(),
                    null,
                    "{\"file\":\"" + attachment.getFileName() + "\",\"size\":" + attachment.getFileSizeBytes() + "}",
                    "Evidence uploaded for question " + questionId + " on page " + page.getPageNumber(),
                    clientIp
            );

            return mapToDTO(attachment);
        } catch (IOException e) {
            log.error("Failed to read uploaded file", e);
            throw new IllegalStateException("Failed to process uploaded evidence file: " + e.getMessage());
        }
    }

    @Transactional
    public void deleteEvidence(UUID evidenceId, UUID actorId, String clientIp) {
        EvidenceAttachment attachment = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new IllegalArgumentException("Evidence attachment not found: " + evidenceId));

        if (!"DRAFT".equalsIgnoreCase(attachment.getAuditPage().getStatus())) {
            throw new IllegalStateException("Evidence can only be deleted while the audit page is in DRAFT status");
        }

        storageService.deleteFile(attachment.getStoragePath());
        evidenceRepository.delete(attachment);

        User actor = actorId != null ? userRepository.findById(actorId).orElse(null) : null;
        auditLogService.log(
                actorId,
                actor != null ? actor.getRole().name() : "ADMIN",
                "EVIDENCE_DELETED",
                "EVIDENCE",
                evidenceId.toString(),
                "{\"file\":\"" + attachment.getFileName() + "\"}",
                null,
                "Deleted evidence file " + attachment.getFileName(),
                clientIp
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getEvidenceFile(UUID evidenceId, UUID actorId, String clientIp) {
        EvidenceAttachment attachment = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new IllegalArgumentException("Evidence attachment not found: " + evidenceId));

        try {
            byte[] content = storageService.loadFileContent(attachment.getStoragePath());

            User actor = actorId != null ? userRepository.findById(actorId).orElse(null) : null;
            auditLogService.log(
                actorId,
                actor != null ? actor.getRole().name() : "ADMIN",
                "EVIDENCE_DOWNLOADED",
                "EVIDENCE",
                evidenceId.toString(),
                null,
                null,
                "Downloaded evidence file " + attachment.getFileName(),
                clientIp
            );

            return Map.of(
                    "content", content,
                    "mimeType", attachment.getMimeType(),
                    "fileName", attachment.getFileName()
            );
        } catch (IOException e) {
            throw new IllegalStateException("Could not read evidence file from disk", e);
        }
    }

    @Transactional(readOnly = true)
    public List<EvidenceDTO> getEvidenceForPage(UUID pageId) {
        return evidenceRepository.findByAuditPageId(pageId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    public EvidenceDTO mapToDTO(EvidenceAttachment e) {
        return new EvidenceDTO(
                e.getId(),
                e.getQuestion().getId(),
                e.getFileName(),
                e.getFileSizeBytes(),
                e.getMimeType(),
                e.getCreatedAt(),
                "/api/v1/evidence/" + e.getId() + "/file"
        );
    }
}
