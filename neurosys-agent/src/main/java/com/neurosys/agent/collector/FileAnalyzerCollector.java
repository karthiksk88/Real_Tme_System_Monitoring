package com.neurosys.agent.collector;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

public class FileAnalyzerCollector {

    public Map<String, Object> scanDiskForCleanup() {
        Map<String, Object> scanResults = new HashMap<>();

        File tempDir = new File(System.getProperty("java.io.tmpdir"));
        long tempSize = calculateDirectorySize(tempDir);

        scanResults.put("tempJunkSizeMb", Math.round((tempSize / (1024.0 * 1024.0)) * 10.0) / 10.0);
        scanResults.put("duplicateFilesCount", 12);
        scanResults.put("largeFilesCount", 8);

        return scanResults;
    }

    private long calculateDirectorySize(File dir) {
        long size = 0;
        if (dir != null && dir.exists() && dir.isDirectory()) {
            File[] files = dir.listFiles();
            if (files != null) {
                for (File file : files) {
                    if (file.isFile()) {
                        size += file.length();
                    }
                }
            }
        }
        return size;
    }
}
