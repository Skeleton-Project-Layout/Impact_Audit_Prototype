package org.abhisaran.facilities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PilotLocationTypeRepository extends JpaRepository<PilotLocationType, Integer> {
    Optional<PilotLocationType> findByCode(String code);
    Optional<PilotLocationType> findByPrefix(String prefix);
}
