package org.abhisaran.officers.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OfficerDistrictRepository extends JpaRepository<OfficerDistrict, Integer> {

    List<OfficerDistrict> findByOfficerId(UUID officerId);

    List<OfficerDistrict> findByDistrictId(Integer districtId);

    boolean existsByOfficerIdAndDistrictId(UUID officerId, Integer districtId);

    void deleteByOfficerIdAndDistrictId(UUID officerId, Integer districtId);

    void deleteByOfficerId(UUID officerId);
}
