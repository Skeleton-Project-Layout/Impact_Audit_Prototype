package org.abhisaran.auth;

import org.abhisaran.auth.dto.LoginRequest;
import org.abhisaran.auth.dto.LoginResponse;
import org.abhisaran.users.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class AuthSecurityIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private LoginAttemptRepository loginAttemptRepository;

    @BeforeEach
    void setUp() {
        restTemplate.getRestTemplate().setRequestFactory(new HttpComponentsClientHttpRequestFactory());
        loginAttemptRepository.deleteAll();
    }

    @Test
    @DisplayName("Initial admin is bootstrapped with must_change_password=true and can authenticate successfully")
    void testBootstrapAdminLoginSucceeds() {
        LoginRequest request = new LoginRequest("admin", "Admin#Bootstrap2026!", UserRole.ADMIN);
        ResponseEntity<LoginResponse> response = restTemplate.postForEntity(
                "/api/v1/auth/login", request, LoginResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getLoginId()).isEqualTo("admin");
        assertThat(response.getBody().getRole()).isEqualTo(UserRole.ADMIN);
        assertThat(response.getBody().isMustChangePassword()).isTrue();
    }

    @Test
    @DisplayName("Invalid password yields generic 401 error message without enumeration")
    void testInvalidPasswordReturnsGenericError() {
        LoginRequest request = new LoginRequest("admin", "WrongPassword#123", UserRole.ADMIN);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "/api/v1/auth/login", request, Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("error")).isEqualTo("Invalid ID or password.");
    }

    @Test
    @DisplayName("Unknown login ID yields identical generic 401 error")
    void testUnknownLoginIdReturnsGenericError() {
        LoginRequest request = new LoginRequest("non_existent_officer", "SomePassword#123", UserRole.OFFICER);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "/api/v1/auth/login", request, Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("error")).isEqualTo("Invalid ID or password.");
    }

    @Test
    @DisplayName("Role mismatch tab login returns identical generic 401 error")
    void testRoleMismatchReturnsGenericError() {
        LoginRequest request = new LoginRequest("admin", "Admin#Bootstrap2026!", UserRole.OFFICER);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "/api/v1/auth/login", request, Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("error")).isEqualTo("Invalid ID or password.");
    }

    @Test
    @DisplayName("Public health endpoint is accessible without authentication")
    void testHealthEndpointIsPublic() {
        ResponseEntity<Map> response = restTemplate.getForEntity("/health", Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("status")).isEqualTo("UP");
    }

    @Test
    @DisplayName("Repeated authentication failures trigger 5-strike lockout (HTTP 429)")
    void testLockoutAfterRepeatedFailures() {
        String testUser = "lockout_target_user";
        for (int i = 0; i < 5; i++) {
            LoginRequest req = new LoginRequest(testUser, "bad_pass", UserRole.ADMIN);
            restTemplate.postForEntity("/api/v1/auth/login", req, Map.class);
        }

        LoginRequest finalAttempt = new LoginRequest(testUser, "bad_pass", UserRole.ADMIN);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "/api/v1/auth/login", finalAttempt, Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("error").toString()).contains("Too many failed login attempts");
    }
}
