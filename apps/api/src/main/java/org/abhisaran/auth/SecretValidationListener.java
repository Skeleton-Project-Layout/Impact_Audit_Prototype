package org.abhisaran.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
public class SecretValidationListener {

    private static final Logger log = LoggerFactory.getLogger(SecretValidationListener.class);
    private static final int MIN_SECRET_LENGTH_BYTES = 32;

    @Value("${abhisaran.security.jwt-secret:}")
    private String jwtSecret;

    @EventListener(ApplicationReadyEvent.class)
    public void validateSecrets() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalStateException("FATAL: JWT_SECRET / SESSION_SECRET is missing. Application refuses to start.");
        }

        byte[] secretBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < MIN_SECRET_LENGTH_BYTES) {
            throw new IllegalStateException(String.format(
                    "FATAL: JWT_SECRET / SESSION_SECRET is too short (%d bytes). Minimum requirement is %d bytes.",
                    secretBytes.length, MIN_SECRET_LENGTH_BYTES));
        }

        log.info("Cryptographic secret validation passed ({} bytes).", secretBytes.length);
    }
}
