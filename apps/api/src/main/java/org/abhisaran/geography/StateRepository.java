package org.abhisaran.geography;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StateRepository extends JpaRepository<State, Integer> {
    Optional<State> findByCode2(String code2);
}
