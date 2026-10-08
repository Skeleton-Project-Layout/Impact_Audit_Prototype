package org.abhisaran.delivery.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, UUID> {

    List<Delivery> findByOfficerIdOrderByDeliveredAtDesc(UUID officerId);

    List<Delivery> findByOfficerIdAndDistrictIdOrderByDeliveredAtDesc(UUID officerId, Integer districtId);

    List<Delivery> findByOfficerIdAndReadAtIsNullOrderByDeliveredAtDesc(UUID officerId);

    List<Delivery> findByOfficerIdAndDistrictIdAndReadAtIsNullOrderByDeliveredAtDesc(UUID officerId, Integer districtId);

    Optional<Delivery> findByIdAndOfficerId(UUID id, UUID officerId);

    Optional<Delivery> findByOfficerIdAndAnalysisRunId(UUID officerId, UUID runId);

    boolean existsByOfficerIdAndAnalysisRunId(UUID officerId, UUID runId);

    long countByOfficerIdAndReadAtIsNull(UUID officerId);

    long countByOfficerId(UUID officerId);

    long countByOfficerIdAndAcknowledgedAtIsNotNull(UUID officerId);

    List<Delivery> findByAnalysisRunId(UUID runId);
}
