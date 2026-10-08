package org.abhisaran.audit;

import jakarta.persistence.*;
import org.abhisaran.questions.QuestionBank;
import org.abhisaran.users.User;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "evidence_attachments")
public class EvidenceAttachment {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_page_id", nullable = false)
    private AuditPage auditPage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private QuestionBank question;

    @Column(name = "storage_path", nullable = false, length = 512)
    private String storagePath;

    @Column(name = "file_name", nullable = false, length = 256)
    private String fileName;

    @Column(name = "file_size_bytes", nullable = false)
    private long fileSizeBytes;

    @Column(name = "mime_type", nullable = false, length = 64)
    private String mimeType;

    @Column(name = "sha256_hash", nullable = false, length = 64)
    private String sha256Hash;

    @Column(name = "attestation_confirmed", nullable = false)
    private boolean attestationConfirmed = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public EvidenceAttachment() {
    }

    public EvidenceAttachment(UUID id, AuditPage auditPage, QuestionBank question, String storagePath,
                              String fileName, long fileSizeBytes, String mimeType, String sha256Hash,
                              boolean attestationConfirmed, User createdBy) {
        this.id = id != null ? id : UUID.randomUUID();
        this.auditPage = auditPage;
        this.question = question;
        this.storagePath = storagePath;
        this.fileName = fileName;
        this.fileSizeBytes = fileSizeBytes;
        this.mimeType = mimeType;
        this.sha256Hash = sha256Hash;
        this.attestationConfirmed = attestationConfirmed;
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
    }

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public AuditPage getAuditPage() {
        return auditPage;
    }

    public void setAuditPage(AuditPage auditPage) {
        this.auditPage = auditPage;
    }

    public QuestionBank getQuestion() {
        return question;
    }

    public void setQuestion(QuestionBank question) {
        this.question = question;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public void setFileSizeBytes(long fileSizeBytes) {
        this.fileSizeBytes = fileSizeBytes;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public String getSha256Hash() {
        return sha256Hash;
    }

    public void setSha256Hash(String sha256Hash) {
        this.sha256Hash = sha256Hash;
    }

    public boolean isAttestationConfirmed() {
        return attestationConfirmed;
    }

    public void setAttestationConfirmed(boolean attestationConfirmed) {
        this.attestationConfirmed = attestationConfirmed;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
