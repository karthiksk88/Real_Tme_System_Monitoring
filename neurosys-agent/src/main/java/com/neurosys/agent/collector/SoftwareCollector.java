package com.neurosys.agent.collector;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class SoftwareCollector {

    private static final Logger log = LoggerFactory.getLogger(SoftwareCollector.class);

    public List<Map<String, String>> collectInstalledSoftware() {
        List<Map<String, String>> softwareList = new ArrayList<>();
        Set<String> seenNames = new HashSet<>();

        String os = System.getProperty("os.name", "").toLowerCase();
        if (os.contains("win")) {
            collectWindowsSoftwareRegistry(softwareList, seenNames);
            collectWindowsAppxSoftware(softwareList, seenNames);
            collectWindowsCliSoftware(softwareList, seenNames);
        } else {
            collectGenericSoftware(softwareList, seenNames);
        }

        log.info("Scanned installed software inventory. Found {} entries.", softwareList.size());
        return softwareList;
    }

    private void collectWindowsSoftwareRegistry(List<Map<String, String>> softwareList, Set<String> seenNames) {
        try {
            String psCommand = "Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*, " +
                    "HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*, " +
                    "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* -ErrorAction SilentlyContinue | " +
                    "Where-Object { $_.DisplayName -ne $null } | " +
                    "Select-Object DisplayName, DisplayVersion, Publisher, InstallDate | " +
                    "ConvertTo-Csv -NoTypeInformation";

            ProcessBuilder pb = new ProcessBuilder("powershell.exe", "-NoProfile", "-NonInteractive", "-Command", psCommand);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                boolean headerSkipped = false;
                while ((line = reader.readLine()) != null) {
                    if (!headerSkipped) {
                        headerSkipped = true;
                        continue;
                    }
                    String[] parts = parseCsvLine(line);
                    if (parts.length >= 1 && parts[0] != null && !parts[0].trim().isEmpty()) {
                        String rawName = parts[0].trim();
                        String version = (parts.length > 1 && parts[1] != null) ? parts[1].trim() : "1.0.0";
                        String publisher = (parts.length > 2 && parts[2] != null) ? parts[2].trim() : "Unknown";
                        String installDate = (parts.length > 3 && parts[3] != null) ? parts[3].trim() : "";

                        // Add original full name entry
                        addSoftwareEntry(rawName, version, publisher, installDate, softwareList, seenNames);

                        // Add normalized standard name entry (e.g. "Python 3.13.6" -> "Python")
                        String cleanName = cleanRegistrySoftwareName(rawName);
                        if (!cleanName.equalsIgnoreCase(rawName)) {
                            addSoftwareEntry(cleanName, version, publisher, installDate, softwareList, seenNames);
                        }
                    }
                }
            }
            process.waitFor();
        } catch (Exception e) {
            log.warn("Failed to query Windows registry for installed software: {}", e.getMessage());
        }
    }

    private void addSoftwareEntry(String name, String version, String publisher, String installDate, List<Map<String, String>> list, Set<String> seen) {
        String key = name.toLowerCase();
        if (!seen.contains(key)) {
            seen.add(key);
            Map<String, String> item = new HashMap<>();
            item.put("name", name);
            item.put("version", version != null && !version.isEmpty() ? version : "1.0.0");
            item.put("publisher", publisher != null ? publisher : "Unknown");
            item.put("installDate", installDate != null ? installDate : "");
            list.add(item);
        }
    }

    private String cleanRegistrySoftwareName(String raw) {
        if (raw == null) return "";
        String lower = raw.toLowerCase();
        if (lower.contains("python")) return "Python";
        if (lower.contains("dev-c++") || lower.contains("dev c++") || lower.contains("devc++")) return "Dev-C++";
        if (lower.contains("openjdk") || lower.contains("java") || lower.contains("jdk") || lower.contains("jre")) return "Java";
        if (lower.contains("visual studio code") || lower.contains("vscode")) return "Visual Studio Code";
        if (lower.contains("mysql")) return "MySQL";
        if (lower.contains("google chrome")) return "Google Chrome";
        if (lower.contains("node.js") || lower.equals("node")) return "Node.js";
        if (lower.equals("git") || lower.startsWith("git ")) return "Git";
        if (lower.contains("whatsapp")) return "WhatsApp";
        if (lower.contains("postman")) return "Postman";
        if (lower.contains("rstudio")) return "RStudio";
        if (lower.contains("spyder")) return "Spyder";
        if (lower.contains("cursor")) return "Cursor";
        return raw;
    }

    private void collectWindowsAppxSoftware(List<Map<String, String>> softwareList, Set<String> seenNames) {
        try {
            String psCommand = "Get-AppxPackage | Where-Object { $_.NonRemovable -ne $true -and $_.IsFramework -ne $true } | Select-Object Name, Version, Publisher | ConvertTo-Csv -NoTypeInformation";

            ProcessBuilder pb = new ProcessBuilder("powershell.exe", "-NoProfile", "-NonInteractive", "-Command", psCommand);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                boolean headerSkipped = false;
                while ((line = reader.readLine()) != null) {
                    if (!headerSkipped) {
                        headerSkipped = true;
                        continue;
                    }
                    String[] parts = parseCsvLine(line);
                    if (parts.length >= 1 && parts[0] != null && !parts[0].trim().isEmpty()) {
                        String rawName = parts[0].trim();
                        String name = formatAppxName(rawName);
                        if (name == null || name.isEmpty() || isSystemPackage(rawName)) continue;

                        String version = (parts.length > 1 && parts[1] != null) ? parts[1].trim() : "1.0.0";
                        String publisher = (parts.length > 2 && parts[2] != null) ? parts[2].trim() : "Microsoft Store";

                        String key = name.toLowerCase();
                        if (!seenNames.contains(key)) {
                            seenNames.add(key);
                            Map<String, String> item = new HashMap<>();
                            item.put("name", name);
                            item.put("version", version);
                            item.put("publisher", publisher);
                            item.put("installDate", "");
                            softwareList.add(item);
                        }
                    }
                }
            }
            process.waitFor();
        } catch (Exception e) {
            log.warn("Failed to query Windows AppX packages: {}", e.getMessage());
        }
    }

    private String formatAppxName(String raw) {
        if (raw == null) return null;
        String lower = raw.toLowerCase();
        if (lower.contains("whatsapp")) return "WhatsApp";
        if (lower.contains("spotify")) return "Spotify";
        if (lower.contains("teams")) return "Microsoft Teams";
        if (lower.contains("telegram")) return "Telegram";
        if (lower.contains("slack")) return "Slack";

        String cleaned = raw.replaceAll("^[A-F0-9]{8}\\.", "");
        return cleaned;
    }

    private boolean isSystemPackage(String name) {
        if (name == null) return true;
        String lower = name.toLowerCase();
        return lower.startsWith("microsoft.windows") || 
               lower.startsWith("microsoft.ui") || 
               lower.startsWith("microsoft.net") || 
               lower.startsWith("microsoft.vclibs") ||
               lower.contains("cortana") ||
               lower.contains("sechealth");
    }

    private void collectWindowsCliSoftware(List<Map<String, String>> softwareList, Set<String> seenNames) {
        // Quick verification for specific key tools if registry missed them
        checkAndAddCliTool("Java", "java -version", softwareList, seenNames);
        checkAndAddCliTool("Python", "python --version", softwareList, seenNames);
        checkAndAddCliTool("Node.js", "node -v", softwareList, seenNames);
        checkAndAddCliTool("MySQL Server", "mysql --version", softwareList, seenNames);
        checkAndAddCliTool("VS Code", "code --version", softwareList, seenNames);
        checkAndAddCliTool("Git", "git --version", softwareList, seenNames);
    }

    private void checkAndAddCliTool(String displayName, String command, List<Map<String, String>> list, Set<String> seenNames) {
        if (seenNames.contains(displayName.toLowerCase())) {
            return;
        }
        try {
            ProcessBuilder pb = new ProcessBuilder("cmd.exe", "/c", command);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            String output = "";
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                output = reader.readLine();
            }
            if (output == null || output.isEmpty()) {
                try (BufferedReader errReader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                    output = errReader.readLine();
                }
            }
            process.waitFor();
            if (output != null && !output.trim().isEmpty()) {
                seenNames.add(displayName.toLowerCase());
                Map<String, String> item = new HashMap<>();
                item.put("name", displayName);
                item.put("version", extractVersionNumber(output));
                item.put("publisher", "CLI Utility");
                item.put("installDate", "");
                list.add(item);
            }
        } catch (Exception ignored) {
        }
    }

    private void collectGenericSoftware(List<Map<String, String>> softwareList, Set<String> seenNames) {
        checkAndAddCliTool("Java", "java -version", softwareList, seenNames);
        checkAndAddCliTool("Python", "python3 --version", softwareList, seenNames);
        checkAndAddCliTool("Node.js", "node -v", softwareList, seenNames);
        checkAndAddCliTool("Git", "git --version", softwareList, seenNames);
    }

    private String[] parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                result.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        result.add(current.toString());
        return result.toArray(new String[0]);
    }

    private String extractVersionNumber(String text) {
        if (text == null) return "1.0.0";
        String[] tokens = text.split("\\s+");
        for (String t : tokens) {
            String cleaned = t.replaceAll("[^0-9.]", "");
            if (cleaned.length() >= 3 && cleaned.contains(".")) {
                return cleaned;
            }
        }
        return text.trim();
    }
}
