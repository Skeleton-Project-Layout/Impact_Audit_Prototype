package org.abhisaran.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuditPageRepository extends JpaRepository<AuditPage, UUID> {

    List<AuditPage> findByPilotLocationIdOrderByPageNumberAsc(UUID pilotLocationId);

    Optional<AuditPage> findByPilotLocationIdAndPageNumber(UUID pilotLocationId, int pageNumber);

    @Query("SELECT COALESCE(MAX(p.pageNumber), 0) FROM AuditPage p WHERE p.pilotLocation.id = :locationId")
    int findMaxPageNumberByLocationId(@Param("locationId") UUID locationId);

    long countByPilotLocationId(UUID pilotLocationId);
}
