package org.abhisaran.auth;

import org.abhisaran.auditlog.AuditLogService;
import org.abhisaran.users.User;
import org.abhisaran.users.UserRole;
import org.abhisaran.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Component
@Order(10)
public class AdminBootstrapRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @Value("${abhisaran.security.bootstrap-admin-id:admin}")
    private String bootstrapAdminId;

    @Value("${abhisaran.security.bootstrap-admin-password:Admin#Bootstrap2026!}")
    private String bootstrapAdminPassword;

    public AdminBootstrapRunner(UserRepository userRepository,
                                PasswordEncoder passwordEncoder,
                                AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Optional<User> existingAdminOpt = userRepository.findByLoginId(bootstrapAdminId);
        if (existingAdminOpt.isPresent()) {
            User admin = existingAdminOpt.get();
            admin.setPasswordHash(passwordEncoder.encode(bootstrapAdminPassword));
            userRepository.saveAndFlush(admin);
            log.info("Synchronized bootstrap admin '{}' password with configured BOOTSTRAP_ADMIN_PASSWORD.", bootstrapAdminId);
            return;
        }

        UUID adminId = UUID.randomUUID();
        User admin = new User(
                adminId,
                bootstrapAdminId,
                UserRole.ADMIN,
                "System Administrator",
                "Platform Bootstrap Admin",
                passwordEncoder.encode(bootstrapAdminPassword),
                true, // must_change_password is true for initial bootstrap
                true
        );

        userRepository.saveAndFlush(admin);
        log.warn("Bootstrapped initial admin user: '{}' (must_change_password=true).", bootstrapAdminId);

        auditLogService.log(
                null, // actor is SYSTEM during bootstrap
                "SYSTEM",
                "BOOTSTRAP_ADMIN",
                "USER",
                admin.getId().toString(),
                null,
                "{\"login_id\":\"" + bootstrapAdminId + "\",\"role\":\"ADMIN\"}",
                "Initial administrator bootstrap",
                "127.0.0.1"
        );
    }
}
