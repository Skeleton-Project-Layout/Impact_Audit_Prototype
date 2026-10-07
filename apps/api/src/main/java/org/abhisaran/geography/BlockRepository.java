package org.abhisaran.geography;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlockRepository extends JpaRepository<Block, Integer> {
    List<Block> findByDistrictIdOrderByNameAsc(Integer districtId);
    Optional<Block> findByDistrictIdAndCode(Integer districtId, String code);
    Optional<Block> findByCode(String code);
}
