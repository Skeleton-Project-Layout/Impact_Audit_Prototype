package org.abhisaran.facilities;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PilotLocationRepository extends JpaRepository<PilotLocation, UUID> {

    Optional<PilotLocation> findByCode(String code);

    boolean existsByCode(String code);

    List<PilotLocation> findByDistrictIdOrderByCodeAsc(Integer districtId);

    @Query("SELECT l FROM PilotLocation l WHERE " +
           "(:districtId IS NULL OR l.district.id = :districtId) AND " +
           "(:typeId IS NULL OR l.type.id = :typeId) AND " +
           "(:blockId IS NULL OR l.block.id = :blockId) AND " +
           "(:status IS NULL OR l.status = :status) " +
           "ORDER BY l.code ASC")
    Page<PilotLocation> searchLocations(
            @Param("districtId") Integer districtId,
            @Param("typeId") Integer typeId,
            @Param("blockId") Integer blockId,
            @Param("status") String status,
            Pageable pageable
    );
}
