package org.abhisaran.auth;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
public class LoginAttemptService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCKOUT_MINUTES = 15;

    private final LoginAttemptRepository loginAttemptRepository;

    public LoginAttemptService(LoginAttemptRepository loginAttemptRepository) {
        this.loginAttemptRepository = loginAttemptRepository;
    }

    @Transactional(readOnly = true)
    public boolean isBlocked(String loginId, String ipAddress) {
        OffsetDateTime since = OffsetDateTime.now().minusMinutes(LOCKOUT_MINUTES);
        long failedCount = loginAttemptRepository.countFailedAttemptsSince(loginId, ipAddress, since);
        return failedCount >= MAX_FAILED_ATTEMPTS;
    }

    @Transactional
    public void recordSuccess(String loginId, String ipAddress) {
        loginAttemptRepository.save(new LoginAttempt(loginId, ipAddress, true));
    }

    @Transactional
    public void recordFailure(String loginId, String ipAddress) {
        loginAttemptRepository.save(new LoginAttempt(loginId, ipAddress, false));
    }
}
