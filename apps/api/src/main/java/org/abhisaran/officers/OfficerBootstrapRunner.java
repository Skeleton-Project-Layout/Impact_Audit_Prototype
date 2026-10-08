package org.abhisaran.officers;

import org.abhisaran.geography.District;
import org.abhisaran.geography.DistrictRepository;
import org.abhisaran.officers.persistence.OfficerDistrict;
import org.abhisaran.officers.persistence.OfficerDistrictRepository;
import org.abhisaran.users.User;
import org.abhisaran.users.UserRepository;
import org.abhisaran.users.UserRole;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Order(20)
public class OfficerBootstrapRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(OfficerBootstrapRunner.class);

    private final UserRepository userRepository;
    private final DistrictRepository districtRepository;
    private final OfficerDistrictRepository officerDistrictRepository;
    private final OfficerScopingService scopingService;
    private final PasswordEncoder passwordEncoder;

    public OfficerBootstrapRunner(UserRepository userRepository,
                                  DistrictRepository districtRepository,
                                  OfficerDistrictRepository officerDistrictRepository,
                                  OfficerScopingService scopingService,
                                  PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.districtRepository = districtRepository;
        this.officerDistrictRepository = officerDistrictRepository;
        this.scopingService = scopingService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.existsByRole(UserRole.OFFICER)) {
            log.info("Government officers already exist. Officer bootstrap skipped.");
            return;
        }

        log.info("Bootstrapping initial government officers for pilot districts...");

        String tempPass = passwordEncoder.encode("Officer#Pass2026!");

        // 1. Officer Ranchi (District 1)
        User officerRanchi = new User(
                UUID.randomUUID(),
                "officer_ranchi",
                UserRole.OFFICER,
                "District Officer Ranchi",
                "District Collectorate Ranchi",
                tempPass,
                true,
                true
        );
        userRepository.save(officerRanchi);
        assignDistrict(officerRanchi, 1);
        scopingService.backfillDeliveriesForOfficer(officerRanchi, List.of(1));

        // 2. Officer Dhanbad (District 2)
        User officerDhanbad = new User(
                UUID.randomUUID(),
                "officer_dhanbad",
                UserRole.OFFICER,
                "District Officer Dhanbad",
                "District Collectorate Dhanbad",
                tempPass,
                true,
                true
        );
        userRepository.save(officerDhanbad);
        assignDistrict(officerDhanbad, 2);
        scopingService.backfillDeliveriesForOfficer(officerDhanbad, List.of(2));

        // 3. Officer Multi (Ranchi ID 1 + Bokaro ID 3)
        User officerMulti = new User(
                UUID.randomUUID(),
                "officer_multi",
                UserRole.OFFICER,
                "Regional Divisional Officer",
                "Divisional Commissionerate",
                tempPass,
                true,
                true
        );
        userRepository.save(officerMulti);
        assignDistrict(officerMulti, 1);
        assignDistrict(officerMulti, 3);
        scopingService.backfillDeliveriesForOfficer(officerMulti, List.of(1, 3));

        log.info("Officer bootstrap completed: officer_ranchi, officer_dhanbad, officer_multi created.");
    }

    private void assignDistrict(User officer, Integer districtId) {
        Optional<District> dOpt = districtRepository.findById(districtId);
        if (dOpt.isPresent()) {
            OfficerDistrict od = new OfficerDistrict(officer, dOpt.get(), null);
            officerDistrictRepository.save(od);
        } else {
            log.warn("District ID {} not found during officer bootstrap.", districtId);
        }
    }
}
