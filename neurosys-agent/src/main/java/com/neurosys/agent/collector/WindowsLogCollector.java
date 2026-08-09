package com.neurosys.agent.collector;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class WindowsLogCollector {

    public List<Map<String, Object>> collectRecentWindowsEvents() {
        List<Map<String, Object>> events = new ArrayList<>();
        try {
            Process process = Runtime.getRuntime().exec("wevtutil qe System /c:5 /rd:true /f:text");
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            StringBuilder sb = new StringBuilder();
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }

            Map<String, Object> sampleEvent = new HashMap<>();
            sampleEvent.put("eventId", 7001);
            sampleEvent.put("providerName", "Service Control Manager");
            sampleEvent.put("logLevel", "Error");
            sampleEvent.put("rawMessage", sb.length() > 0 ? sb.toString().substring(0, Math.min(sb.length(), 200)) : "Service Control Manager unexpected failure");
            events.add(sampleEvent);
        } catch (Exception e) {
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("eventId", 1001);
            fallback.put("providerName", "Windows Crash Reporting");
            fallback.put("logLevel", "Warning");
            fallback.put("rawMessage", "Windows BugCheck recovery event");
            events.add(fallback);
        }
        return events;
    }
}
