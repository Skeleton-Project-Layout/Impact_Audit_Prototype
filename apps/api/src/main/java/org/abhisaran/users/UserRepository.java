package org.abhisaran.users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByLoginId(String loginId);

    boolean existsByRole(UserRole role);

    boolean existsByLoginId(String loginId);
}
