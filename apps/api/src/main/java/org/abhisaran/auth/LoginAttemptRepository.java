package org.abhisaran.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {

    @Query("SELECT COUNT(l) FROM LoginAttempt l WHERE l.loginId = :loginId AND l.ipAddress = :ipAddress AND l.success = false AND l.attemptedAt >= :since")
    long countFailedAttemptsSince(@Param("loginId") String loginId,
                                  @Param("ipAddress") String ipAddress,
                                  @Param("since") OffsetDateTime since);
}
