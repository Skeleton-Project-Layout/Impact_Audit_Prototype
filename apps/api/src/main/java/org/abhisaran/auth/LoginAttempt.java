package org.abhisaran.auth;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "login_attempts")
public class LoginAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "login_id", nullable = false, length = 64)
    private String loginId;

    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    @Column(nullable = false)
    private boolean success;

    @Column(name = "attempted_at", nullable = false, updatable = false)
    private OffsetDateTime attemptedAt;

    public LoginAttempt() {
    }

    public LoginAttempt(String loginId, String ipAddress, boolean success) {
        this.loginId = loginId;
        this.ipAddress = ipAddress;
        this.success = success;
        this.attemptedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getLoginId() {
        return loginId;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public boolean isSuccess() {
        return success;
    }

    public OffsetDateTime getAttemptedAt() {
        return attemptedAt;
    }
}
