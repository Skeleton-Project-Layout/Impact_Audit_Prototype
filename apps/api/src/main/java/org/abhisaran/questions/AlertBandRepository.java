package org.abhisaran.questions;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertBandRepository extends JpaRepository<AlertBand, String> {
    List<AlertBand> findAllByOrderByMinScoreAsc();
}
