package org.abhisaran.facilities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PilotLocationRegistryRepository extends JpaRepository<PilotLocationRegistry, UUID> {
    Optional<PilotLocationRegistry> findByOfficialCode(String officialCode);
}
