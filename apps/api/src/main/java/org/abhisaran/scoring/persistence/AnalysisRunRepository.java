package org.abhisaran.scoring.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnalysisRunRepository extends JpaRepository<AnalysisRun, UUID> {

    @Query("SELECT r FROM AnalysisRun r WHERE r.pilotLocation.id = :locationId ORDER BY r.analyzedAt DESC")
    List<AnalysisRun> findByPilotLocationIdOrderByAnalyzedAtDesc(@Param("locationId") UUID locationId);

    default Optional<AnalysisRun> findLatestByPilotLocationId(UUID locationId) {
        List<AnalysisRun> list = findByPilotLocationIdOrderByAnalyzedAtDesc(locationId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Query("SELECT COUNT(r) FROM AnalysisRun r WHERE r.pilotLocation.id = :locationId")
    int countRunsByLocationId(@Param("locationId") UUID locationId);
}
