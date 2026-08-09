package com.neurosys.agent;

import com.neurosys.agent.collector.SoftwareCollector;
import com.neurosys.agent.sender.MetricsSender;
import com.neurosys.agent.config.AgentConfig;

import java.util.List;
import java.util.Map;

public class TestCollector {
    public static void main(String[] args) {
        System.out.println("Starting SoftwareCollector test...");
        SoftwareCollector collector = new SoftwareCollector();
        List<Map<String, String>> list = collector.collectInstalledSoftware();
        System.out.println("Collected " + list.size() + " entries:");
        for (Map<String, String> item : list) {
            System.out.println("ALL_ITEM: " + item.get("name") + " (" + item.get("version") + ")");
        }
        
        System.out.println("Sending to backend...");
        MetricsSender sender = new MetricsSender();
        sender.sendSoftwarePayload(AgentConfig.getAgentId(), list);
        System.out.println("Done!");
    }
}
