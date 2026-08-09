package com.neurosys.agent;

import com.neurosys.agent.config.AgentConfig;
import com.neurosys.agent.scheduler.MetricsScheduler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AgentApplication {

    private static final Logger log = LoggerFactory.getLogger(AgentApplication.class);

    public static void main(String[] args) {
        log.info("=================================================");
        log.info("  Starting NeuroSys OSHI Monitoring Agent Daemon ");
        log.info("  Agent ID: {}", AgentConfig.getAgentId());
        log.info("  Server Endpoint: {}", AgentConfig.getServerUrl());
        log.info("=================================================");

        MetricsScheduler scheduler = new MetricsScheduler();
        scheduler.start();

        // Keep main thread alive
        try {
            Thread.currentThread().join();
        } catch (InterruptedException e) {
            log.info("NeuroSys Agent daemon interrupted. Exiting gracefully.");
            Thread.currentThread().interrupt();
        }
    }
}
