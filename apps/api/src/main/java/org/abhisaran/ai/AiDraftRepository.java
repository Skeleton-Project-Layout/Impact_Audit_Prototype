package org.abhisaran.ai;

import org.abhisaran.ai.persistence.AiDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiDraftRepository extends JpaRepository<AiDraft, UUID> {

    List<AiDraft> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, UUID targetId);

    Optional<AiDraft> findTopByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, UUID targetId);

    Optional<AiDraft> findTopByTargetTypeAndTargetIdAndStatusOrderByCreatedAtDesc(String targetType, UUID targetId, String status);

    long countByTargetTypeAndTargetId(String targetType, UUID targetId);
}
