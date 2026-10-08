package org.abhisaran.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuditAnswerRepository extends JpaRepository<AuditAnswer, UUID> {

    List<AuditAnswer> findByAuditPageId(UUID auditPageId);

    Optional<AuditAnswer> findByAuditPageIdAndQuestionId(UUID auditPageId, String questionId);

    @Query("SELECT a FROM AuditAnswer a WHERE a.auditPage.id IN :pageIds")
    List<AuditAnswer> findByAuditPageIdIn(@Param("pageIds") List<UUID> pageIds);

    void deleteByAuditPageId(UUID auditPageId);
}
