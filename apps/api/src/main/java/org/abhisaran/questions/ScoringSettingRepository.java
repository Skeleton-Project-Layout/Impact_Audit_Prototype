package org.abhisaran.questions;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ScoringSettingRepository extends JpaRepository<ScoringSetting, String> {
}
