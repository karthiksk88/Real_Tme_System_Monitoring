package com.neurosys.agent.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStream;
import java.util.Properties;
import java.util.UUID;

public class AgentConfig {

    private static final Logger log = LoggerFactory.getLogger(AgentConfig.class);
    private static final Properties properties = new Properties();
    private static String agentId;

    static {
        try (InputStream input = AgentConfig.class.getClassLoader().getResourceAsStream("agent.properties")) {
            if (input != null) {
                properties.load(input);
            }
        } catch (Exception e) {
            log.error("Failed to load agent.properties", e);
        }

        // Generate persistent Agent UUID based on MAC/Machine properties
        agentId = properties.getProperty("agent.id");
        if (agentId == null || agentId.isEmpty()) {
            agentId = "AGENT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }

    public static String getServerUrl() {
        String url = System.getenv("NEUROSYS_SERVER_URL");
        if (url == null || url.trim().isEmpty()) {
            url = System.getProperty("server.url");
        }
        if (url == null || url.trim().isEmpty()) {
            url = properties.getProperty("server.url", "https://zestful-energy-production-5cb8.up.railway.app/api/v1");
        }
        url = url.trim();
        while (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        if (!url.endsWith("/api/v1") && !url.endsWith("/api")) {
            url = url + "/api/v1";
        }
        return url;
    }

    public static String getLabName() {
        String envLab = System.getenv("NEUROSYS_LAB_NAME");
        if (envLab != null && !envLab.trim().isEmpty()) {
            return envLab.trim();
        }
        String sysLab = System.getProperty("agent.lab.name");
        if (sysLab != null && !sysLab.trim().isEmpty()) {
            return sysLab.trim();
        }
        return properties.getProperty("agent.lab.name", "General Lab");
    }

    public static int getIntervalSeconds() {
        return Integer.parseInt(properties.getProperty("agent.collection.interval.seconds", "5"));
    }

    public static String getAgentId() {
        return agentId;
    }
}
