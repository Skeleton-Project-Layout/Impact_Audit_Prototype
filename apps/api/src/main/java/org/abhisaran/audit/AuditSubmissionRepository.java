package org.abhisaran.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuditSubmissionRepository extends JpaRepository<AuditSubmission, UUID> {

    List<AuditSubmission> findByPilotLocationIdOrderBySubmittedAtDesc(UUID pilotLocationId);

    Optional<AuditSubmission> findTopByPilotLocationIdOrderBySubmittedAtDesc(UUID pilotLocationId);
}
