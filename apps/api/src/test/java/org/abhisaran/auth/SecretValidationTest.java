package org.abhisaran.auth;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

public class SecretValidationTest {

    @Test
    @DisplayName("Application throws IllegalStateException if JWT/Session secret is null or empty")
    void testThrowsWhenSecretIsMissing() {
        SecretValidationListener listener = new SecretValidationListener();
        ReflectionTestUtils.setField(listener, "jwtSecret", "");

        assertThatThrownBy(listener::validateSecrets)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("missing");
    }

    @Test
    @DisplayName("Application throws IllegalStateException if secret is less than 32 bytes")
    void testThrowsWhenSecretIsTooShort() {
        SecretValidationListener listener = new SecretValidationListener();
        ReflectionTestUtils.setField(listener, "jwtSecret", "short_secret_under_32_bytes");

        assertThatThrownBy(listener::validateSecrets)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("too short");
    }

    @Test
    @DisplayName("Validation succeeds when secret is 32 bytes or greater")
    void testPassesWhenSecretIsSufficient() {
        SecretValidationListener listener = new SecretValidationListener();
        ReflectionTestUtils.setField(listener, "jwtSecret", "a_valid_cryptographic_secret_that_has_at_least_32_bytes_2026");

        assertThatCode(listener::validateSecrets).doesNotThrowAnyException();
    }
}
