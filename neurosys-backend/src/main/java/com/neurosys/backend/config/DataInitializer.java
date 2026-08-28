package com.neurosys.backend.config;

import com.neurosys.backend.entity.Computer;
import com.neurosys.backend.entity.User;
import com.neurosys.backend.enums.ComputerStatus;
import com.neurosys.backend.enums.Role;
import com.neurosys.backend.repository.ComputerRepository;
import com.neurosys.backend.repository.SoftwareInventoryRepository;
import com.neurosys.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ComputerRepository computerRepository;
    private final SoftwareInventoryRepository softwareInventoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Default Administrator User
        if (userRepository.findByUsername("admin").isEmpty()) {
            log.info("Seeding default Administrator user: admin / admin123");
            User admin = User.builder()
                    .username("admin")
                    .email("admin@neurosys.com")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .role(Role.ROLE_ADMIN)
                    .active(true)
                    .build();
            userRepository.save(admin);
            log.info("Default Administrator user created successfully.");
        }

        // 2. Clean up old mock sample computers (LAB-ALPHA-01, LAB-ALPHA-02, LAB-BETA-01, LAB-BETA-02)
        computerRepository.findAll().stream()
                .filter(c -> c.getHostname().startsWith("LAB-ALPHA") || c.getHostname().startsWith("LAB-BETA"))
                .forEach(c -> {
                    log.info("Cleaning up legacy sample computer {} and its inventory...", c.getHostname());
                    softwareInventoryRepository.deleteByComputerId(c.getId());
                    computerRepository.delete(c);
                });

        // 3. Ensure Primary Admin Computer (LAPTOP-PALBUQS2) exists in DB
        if (computerRepository.findByHostnameIgnoreCase("LAPTOP-PALBUQS2").isEmpty() && 
            computerRepository.findByAgentId("AGENT-9EA49A31").isEmpty()) {
            log.info("Seeding primary admin workstation endpoint (LAPTOP-PALBUQS2)...");

            Computer primary = Computer.builder()
                    .agentId("AGENT-9EA49A31")
                    .hostname("LAPTOP-PALBUQS2")
                    .computerName("Admin Workstation (LAPTOP-PALBUQS2)")
                    .ipAddress("10.33.199.161")
                    .macAddress("FA:54:F6:B4:98:23")
                    .osName("Windows 11 Pro 64-bit")
                    .osVersion("10.0.22631")
                    .labName("Computer Lab")
                    .cpuModel("11th Gen Intel(R) Core(TM) i5-11260H @ 2.60GHz")
                    .totalRamMb(8192.0)
                    .agentVersion("1.0.0")
                    .status(ComputerStatus.ONLINE)
                    .lastSeenAt(Instant.now())
                    .build();

            computerRepository.save(primary);
            log.info("Primary admin workstation LAPTOP-PALBUQS2 seeded successfully.");
        }
    }
}
