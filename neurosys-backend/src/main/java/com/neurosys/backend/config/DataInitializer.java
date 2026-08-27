package com.neurosys.backend.config;

import com.neurosys.backend.entity.Computer;
import com.neurosys.backend.entity.SystemMetric;
import com.neurosys.backend.entity.User;
import com.neurosys.backend.enums.ComputerStatus;
import com.neurosys.backend.enums.Role;
import com.neurosys.backend.repository.ComputerRepository;
import com.neurosys.backend.repository.SystemMetricRepository;
import com.neurosys.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ComputerRepository computerRepository;
    private final SystemMetricRepository systemMetricRepository;
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

        // 2. Seed Initial Active Computer Endpoints if database is empty
        if (computerRepository.count() == 0) {
            log.info("Seeding initial lab computer endpoints into database...");

            List<Computer> sampleComputers = Arrays.asList(
                Computer.builder()
                    .agentId("AGENT-9EA49A31")
                    .hostname("LAPTOP-PALBUQS2")
                    .computerName("Admin Primary Workstation (Your Laptop)")
                    .ipAddress("10.33.199.161")
                    .macAddress("FA:54:F6:B4:98:23")
                    .osName("Windows 11 Pro 64-bit")
                    .osVersion("10.0.22631")
                    .labName("Lab Alpha")
                    .cpuModel("11th Gen Intel(R) Core(TM) i5-11260H @ 2.60GHz")
                    .totalRamMb(8192.0)
                    .agentVersion("1.0.0")
                    .status(ComputerStatus.ONLINE)
                    .lastSeenAt(Instant.now())
                    .build(),

                Computer.builder()
                    .agentId("AGENT-ALPHA-01")
                    .hostname("LAB-ALPHA-01")
                    .computerName("Student Station A01")
                    .ipAddress("192.168.1.101")
                    .macAddress("D8-BB-C1-8E-4A-02")
                    .osName("Windows 11 Education")
                    .osVersion("10.0.22631")
                    .labName("Lab Alpha")
                    .cpuModel("12th Gen Intel(R) Core(TM) i5-12400 @ 2.50GHz")
                    .totalRamMb(16384.0)
                    .agentVersion("1.0.0")
                    .status(ComputerStatus.ONLINE)
                    .lastSeenAt(Instant.now())
                    .build(),

                Computer.builder()
                    .agentId("AGENT-ALPHA-02")
                    .hostname("LAB-ALPHA-02")
                    .computerName("Student Station A02")
                    .ipAddress("192.168.1.102")
                    .macAddress("D8-BB-C1-8E-4A-03")
                    .osName("Windows 11 Education")
                    .osVersion("10.0.22631")
                    .labName("Lab Alpha")
                    .cpuModel("12th Gen Intel(R) Core(TM) i5-12400 @ 2.50GHz")
                    .totalRamMb(16384.0)
                    .agentVersion("1.0.0")
                    .status(ComputerStatus.ONLINE)
                    .lastSeenAt(Instant.now())
                    .build(),

                Computer.builder()
                    .agentId("AGENT-BETA-01")
                    .hostname("LAB-BETA-01")
                    .computerName("Research Station B01")
                    .ipAddress("192.168.1.103")
                    .macAddress("D8-BB-C1-8E-4A-04")
                    .osName("Windows 11 Pro 64-bit")
                    .osVersion("10.0.22631")
                    .labName("Lab Beta")
                    .cpuModel("AMD Ryzen 7 5800X 8-Core Processor")
                    .totalRamMb(32768.0)
                    .agentVersion("1.0.0")
                    .status(ComputerStatus.ONLINE)
                    .lastSeenAt(Instant.now())
                    .build(),

                Computer.builder()
                    .agentId("AGENT-BETA-02")
                    .hostname("LAB-BETA-02")
                    .computerName("Research Station B02")
                    .ipAddress("192.168.1.104")
                    .macAddress("D8-BB-C1-8E-4A-05")
                    .osName("Windows 11 Pro 64-bit")
                    .osVersion("10.0.22631")
                    .labName("Lab Beta")
                    .cpuModel("AMD Ryzen 7 5800X 8-Core Processor")
                    .totalRamMb(32768.0)
                    .agentVersion("1.0.0")
                    .status(ComputerStatus.ONLINE)
                    .lastSeenAt(Instant.now())
                    .build()
            );

            List<Computer> saved = computerRepository.saveAll(sampleComputers);
            log.info("Saved {} computer endpoints to database.", saved.size());

            // Seed initial telemetry metrics for saved computers
            for (Computer c : saved) {
                SystemMetric metric = SystemMetric.builder()
                        .computer(c)
                        .cpuUsagePercent(22.5)
                        .memoryUsagePercent(58.0)
                        .memoryUsedMb(4750.0)
                        .memoryFreeMb(3442.0)
                        .diskUsagePercent(45.0)
                        .diskUsedGb(230.0)
                        .diskFreeGb(280.0)
                        .cpuTemperature(48.0)
                        .activeProcessCount(165)
                        .recordedAt(Instant.now())
                        .build();
                systemMetricRepository.save(metric);
            }
            log.info("Initial system metrics seeded successfully.");
        }
    }
}
