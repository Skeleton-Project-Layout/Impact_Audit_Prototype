package org.abhisaran.questions;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuestionVersionRepository extends JpaRepository<QuestionVersion, UUID> {

    List<QuestionVersion> findByQuestionIdOrderByVersionNumberDesc(String questionId);

    Optional<QuestionVersion> findByQuestionIdAndVersionNumber(String questionId, int versionNumber);

    Optional<QuestionVersion> findTopByQuestionIdOrderByVersionNumberDesc(String questionId);

    List<QuestionVersion> findByStatusOrderByQuestionIdAsc(String status);

    long countByStatus(String status);
}
