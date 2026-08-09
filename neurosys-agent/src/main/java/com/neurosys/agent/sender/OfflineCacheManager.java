package com.neurosys.agent.sender;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileWriter;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class OfflineCacheManager {

    private static final Logger log = LoggerFactory.getLogger(OfflineCacheManager.class);
    private final File cacheDir;
    private final ObjectMapper objectMapper;

    public OfflineCacheManager() {
        this.cacheDir = new File("./cache");
        if (!cacheDir.exists()) {
            cacheDir.mkdirs();
        }
        this.objectMapper = new ObjectMapper();
    }

    public synchronized void cacheUnsentPayload(Map<String, Object> payload) {
        try {
            File file = new File(cacheDir, "metric_" + System.currentTimeMillis() + ".json");
            try (FileWriter writer = new FileWriter(file)) {
                objectMapper.writeValue(writer, payload);
            }
            log.info("Server offline. Cached metric payload locally: {}", file.getName());
        } catch (Exception e) {
            log.error("Failed to cache unsent payload", e);
        }
    }

    public synchronized List<File> getCachedFiles() {
        List<File> list = new ArrayList<>();
        File[] files = cacheDir.listFiles((dir, name) -> name.startsWith("metric_") && name.endsWith(".json"));
        if (files != null) {
            for (File f : files) list.add(f);
        }
        return list;
    }

    public synchronized Map<String, Object> readCachedFile(File file) throws Exception {
        return objectMapper.readValue(file, Map.class);
    }

    public synchronized void deleteCachedFile(File file) {
        try {
            Files.deleteIfExists(file.toPath());
        } catch (Exception e) {
            log.error("Failed to delete cached file: {}", file.getName(), e);
        }
    }
}
