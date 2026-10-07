package org.abhisaran.geography;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PanchayatRepository extends JpaRepository<Panchayat, Integer> {
    List<Panchayat> findByBlockIdOrderByNameAsc(Integer blockId);
    Optional<Panchayat> findByBlockIdAndCode(Integer blockId, String code);
    Optional<Panchayat> findByCode(String code);
}
