package org.abhisaran.facilities;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FacilityCodeSequenceRepository extends JpaRepository<FacilityCodeSequence, FacilityCodeSequenceId> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM FacilityCodeSequence s WHERE s.id = :id")
    Optional<FacilityCodeSequence> findByIdWithLock(@Param("id") FacilityCodeSequenceId id);
}
