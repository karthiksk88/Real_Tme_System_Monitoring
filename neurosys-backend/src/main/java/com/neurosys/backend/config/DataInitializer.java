package com.neurosys.backend.config;

import com.neurosys.backend.entity.*;
import com.neurosys.backend.enums.ComputerStatus;
import com.neurosys.backend.enums.HealthCategory;
import com.neurosys.backend.enums.Role;
import com.neurosys.backend.repository.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ComputerRepository computerRepository;
    private final SystemMetricRepository systemMetricRepository;
    private final HealthScoreRepository healthScoreRepository;
    private final SoftwareInventoryRepository softwareInventoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Admin User
        if (userRepository.findByUsername("admin").isEmpty()) {
            log.info("Seeding default Administrator user: admin / Admin@123");
            User admin = User.builder()
                    .username("admin")
                    .email("admin@neurosys.com")
                    .passwordHash(passwordEncoder.encode("Admin@123"))
                    .role(Role.ROLE_ADMIN)
                    .active(true)
                    .build();
            userRepository.save(admin);
            log.info("Default Administrator user created successfully.");
        }

        // 2. Seed Default Monitored Lab Computers & Telemetry
        if (computerRepository.count() == 0) {
            log.info("Seeding default monitored lab computers, telemetry metrics, and software inventory...");

            List<Computer> defaultComputers = List.of(
                Computer.builder()
                    .agentId("AGENT-SIM-01")
                    .hostname("LAB-01-PC01")
                    .computerName("Workstation 1")
                    .ipAddress("192.168.1.101")
                    .macAddress("AA:BB:CC:DD:EE:01")
                    .osName("Windows 11 Pro")
                    .osVersion("23H2")
                    .labName("Lab Alpha")
                    .cpuModel("Intel Core i7-13700K")
                    .totalRamMb(32768.0)
                    .agentVersion("1.0.0")
                    .status(ComputerStatus.ONLINE)
                    .internetConnected(true)
                    .uptimeSeconds(86400L)
                    .lastSeenAt(Instant.now())
                    .build(),
                Computer.builder()
                    .agentId("AGENT-SIM-02")
                    .hostname("LAB-01-PC02")
                    .computerName("Workstation 2")
                    .ipAddress("192.168.1.102")
                    .macAddress("AA:BB:CC:DD:EE:02")
                    .osName("Windows 11 Pro")
                    .osVersion("23H2")
                    .labName("Lab Alpha")
                    .cpuModel("Intel Core i5-12400")
                    .totalRamMb(16384.0)
                    .agentVersion("1.0.0")
                    .status(ComputerStatus.WARNING)
                    .internetConnected(true)
                    .uptimeSeconds(43200L)
                    .lastSeenAt(Instant.now())
                    .build(),
                Computer.builder()
                    .agentId("AGENT-SIM-03")
                    .hostname("LAB-01-PC03")
                    .computerName("Workstation 3")
                    .ipAddress("192.168.1.103")
                    .macAddress("AA:BB:CC:DD:EE:03")
                    .osName("Windows 11 Pro")
                    .osVersion("23H2")
                    .labName("Lab Alpha")
                    .cpuModel("AMD Ryzen 7 5800X")
                    .totalRamMb(32768.0)
                    .agentVersion("1.0.0")
                    .status(ComputerStatus.ONLINE)
                    .internetConnected(true)
                    .uptimeSeconds(172800L)
                    .lastSeenAt(Instant.now())
                    .build(),
                Computer.builder()
                    .agentId("AGENT-SIM-04")
                    .hostname("LAB-02-PC04")
                    .computerName("Design Station 1")
                    .ipAddress("192.168.2.201")
                    .macAddress("AA:BB:CC:DD:EE:04")
                    .osName("Windows 10 Pro")
                    .osVersion("22H2")
                    .labName("Lab Beta")
                    .cpuModel("Intel Core i9-13900K")
                    .totalRamMb(65536.0)
                    .agentVersion("1.0.0")
                    .status(ComputerStatus.ONLINE)
                    .internetConnected(true)
                    .uptimeSeconds(259200L)
                    .lastSeenAt(Instant.now())
                    .build(),
                Computer.builder()
                    .agentId("AGENT-SIM-05")
                    .hostname("LAB-02-PC05")
                    .computerName("Design Station 2")
                    .ipAddress("192.168.2.202")
                    .macAddress("AA:BB:CC:DD:EE:05")
                    .osName("Windows 10 Pro")
                    .osVersion("22H2")
                    .labName("Lab Beta")
                    .cpuModel("AMD Ryzen 9 7950X")
                    .totalRamMb(65536.0)
                    .agentVersion("1.0.0")
                    .status(ComputerStatus.ONLINE)
                    .internetConnected(true)
                    .uptimeSeconds(129600L)
                    .lastSeenAt(Instant.now())
                    .build()
            );

            for (Computer c : defaultComputers) {
                Computer saved = computerRepository.save(c);

                // Add initial System Metric telemetry
                double cpu = saved.getHostname().contains("PC02") ? 88.5 : 32.4;
                double ram = saved.getHostname().contains("PC02") ? 92.1 : 45.0;
                SystemMetric metric = SystemMetric.builder()
                        .computer(saved)
                        .cpuUsagePercent(cpu)
                        .memoryUsagePercent(ram)
                        .memoryUsedMb(saved.getTotalRamMb() * (ram / 100.0))
                        .memoryFreeMb(saved.getTotalRamMb() * (1 - ram / 100.0))
                        .diskUsagePercent(45.0)
                        .diskUsedGb(225.0)
                        .diskFreeGb(275.0)
                        .networkRxBytesSec(150000.0)
                        .networkTxBytesSec(60000.0)
                        .cpuTemperature(52.0)
                        .activeProcessCount(110)
                        .recordedAt(Instant.now())
                        .build();
                systemMetricRepository.save(metric);

                // Add initial Health Score
                HealthScore hs = HealthScore.builder()
                        .computer(saved)
                        .overallScore(cpu > 80 ? 68.0 : 94.0)
                        .cpuHealth(cpu > 80 ? 55.0 : 95.0)
                        .memoryHealth(ram > 80 ? 50.0 : 90.0)
                        .diskHealth(90.0)
                        .networkHealth(95.0)
                        .category(cpu > 80 ? HealthCategory.Warning : HealthCategory.Healthy)
                        .calculatedAt(Instant.now())
                        .build();
                healthScoreRepository.save(hs);

                // Add Software Inventory items
                List<SoftwareInventory> swList = List.of(
                    SoftwareInventory.builder().computer(saved).name("Python").version("3.12.6").publisher("Python Software Foundation").lastScannedAt(Instant.now()).build(),
                    SoftwareInventory.builder().computer(saved).name("Visual Studio Code").version("1.93.0").publisher("Microsoft Corporation").lastScannedAt(Instant.now()).build(),
                    SoftwareInventory.builder().computer(saved).name("Git").version("2.46.0").publisher("Git for Windows").lastScannedAt(Instant.now()).build(),
                    SoftwareInventory.builder().computer(saved).name("Google Chrome").version("128.0").publisher("Google LLC").lastScannedAt(Instant.now()).build(),
                    SoftwareInventory.builder().computer(saved).name("Java").version("21.0.2").publisher("Oracle Corporation").lastScannedAt(Instant.now()).build()
                );
                softwareInventoryRepository.saveAll(swList);
            }
            log.info("Successfully seeded 5 lab computers with initial telemetry & software inventory!");
        }
    }
}
