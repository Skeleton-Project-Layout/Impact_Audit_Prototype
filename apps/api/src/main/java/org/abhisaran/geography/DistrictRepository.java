package org.abhisaran.geography;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DistrictRepository extends JpaRepository<District, Integer> {
    List<District> findByStateIdOrderByNameAsc(Integer stateId);
    Optional<District> findByCode3(String code3);
    Optional<District> findByStateIdAndCode3(Integer stateId, String code3);
}
