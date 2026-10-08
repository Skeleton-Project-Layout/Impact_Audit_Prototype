package org.abhisaran.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EvidenceAttachmentRepository extends JpaRepository<EvidenceAttachment, UUID> {

    List<EvidenceAttachment> findByAuditPageId(UUID auditPageId);

    List<EvidenceAttachment> findByAuditPageIdAndQuestionId(UUID auditPageId, String questionId);

    long countByAuditPageIdAndQuestionId(UUID auditPageId, String questionId);

    void deleteByAuditPageId(UUID auditPageId);
}
