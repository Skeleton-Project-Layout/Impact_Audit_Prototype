package org.abhisaran.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.abhisaran.auditlog.AuditLogService;
import org.abhisaran.auth.dto.ChangePasswordRequest;
import org.abhisaran.auth.dto.LoginRequest;
import org.abhisaran.auth.dto.LoginResponse;
import org.abhisaran.users.User;
import org.abhisaran.users.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoginAttemptService loginAttemptService;
    private final AuditLogService auditLogService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          LoginAttemptService loginAttemptService,
                          AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.loginAttemptService = loginAttemptService;
        this.auditLogService = auditLogService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request,
                                  HttpServletRequest httpRequest) {
        String clientIp = extractClientIp(httpRequest);
        String loginId = request.getLoginId().trim();

        // Check rate limiting / brute-force lockout (5 strikes / 15 min)
        if (loginAttemptService.isBlocked(loginId, clientIp)) {
            auditLogService.log(null, "ANONYMOUS", "LOGIN_BLOCKED_LOCKOUT", "USER", loginId,
                    null, null, "Account temporarily locked due to excessive failed attempts", clientIp);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many failed login attempts. Please try again in 15 minutes."));
        }

        Optional<User> userOpt = userRepository.findByLoginId(loginId);

        // Uniform error response for any authentication failure to prevent user enumeration
        if (userOpt.isEmpty() || !userOpt.get().isActive() || userOpt.get().getRole() != request.getRole()
                || !passwordEncoder.matches(request.getPassword(), userOpt.get().getPasswordHash())) {

            loginAttemptService.recordFailure(loginId, clientIp);
            auditLogService.log(
                    userOpt.map(User::getId).orElse(null),
                    request.getRole().name(),
                    "LOGIN_FAILED",
                    "USER",
                    loginId,
                    null,
                    null,
                    "Invalid credentials or role mismatch",
                    clientIp
            );
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid ID or password."));
        }

        User user = userOpt.get();
        loginAttemptService.recordSuccess(loginId, clientIp);

        // Establish authenticated session in Spring Security
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                user.getLoginId(),
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );

        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(authentication);
        SecurityContextHolder.setContext(securityContext);

        HttpSession session = httpRequest.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, securityContext);

        auditLogService.log(
                user.getId(),
                user.getRole().name(),
                "LOGIN_SUCCESS",
                "USER",
                user.getId().toString(),
                null,
                null,
                "Successful authentication via " + user.getRole().name() + " portal",
                clientIp
        );

        return ResponseEntity.ok(new LoginResponse(
                user.getId(),
                user.getLoginId(),
                user.getDisplayName(),
                user.getDesignation(),
                user.getRole(),
                user.isMustChangePassword()
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("message", "Logged out successfully."));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                           HttpServletRequest httpRequest) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required."));
        }

        String loginId = auth.getName();
        User user = userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalStateException("User not found: " + loginId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Current password does not match."));
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);

        auditLogService.log(
                user.getId(),
                user.getRole().name(),
                "PASSWORD_CHANGED",
                "USER",
                user.getId().toString(),
                null,
                null,
                "Password updated by user",
                extractClientIp(httpRequest)
        );

        return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated."));
        }

        return userRepository.findByLoginId(auth.getName())
                .map(user -> ResponseEntity.ok(new LoginResponse(
                        user.getId(),
                        user.getLoginId(),
                        user.getDisplayName(),
                        user.getDesignation(),
                        user.getRole(),
                        user.isMustChangePassword()
                )))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    private String extractClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }
}
