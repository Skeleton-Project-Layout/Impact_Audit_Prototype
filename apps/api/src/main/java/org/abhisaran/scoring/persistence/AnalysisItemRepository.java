package org.abhisaran.scoring.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnalysisItemRepository extends JpaRepository<AnalysisItem, UUID> {

    List<AnalysisItem> findByAnalysisRunIdOrderByPageNumberAsc(UUID analysisRunId);
}
