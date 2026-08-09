package com.neurosys.agent.collector;

import oshi.SystemInfo;
import oshi.software.os.OSFileStore;
import oshi.software.os.OperatingSystem;

import java.util.List;

public class DiskCollector {

    private final OperatingSystem os;

    public DiskCollector(SystemInfo systemInfo) {
        this.os = systemInfo.getOperatingSystem();
    }

    private boolean isPrimaryFixedStore(OSFileStore fs) {
        if (fs == null || fs.getTotalSpace() <= 0) return false;
        String mount = fs.getMount() != null ? fs.getMount().toLowerCase() : "";
        String type = fs.getType() != null ? fs.getType().toLowerCase() : "";
        String description = fs.getDescription() != null ? fs.getDescription().toLowerCase() : "";

        if (type.contains("cdfs") || type.contains("iso") || type.contains("network") || description.contains("removable")) {
            return false;
        }

        // On Windows, prioritize C:\ drive or local fixed partitions
        if (mount.startsWith("c:")) return true;
        return fs.getTotalSpace() >= 20L * 1024 * 1024 * 1024; // >20GB fixed partition
    }

    public double getDiskUsagePercent() {
        List<OSFileStore> fileStores = os.getFileSystem().getFileStores();
        long totalSpace = 0;
        long usableSpace = 0;

        for (OSFileStore fs : fileStores) {
            if (isPrimaryFixedStore(fs)) {
                totalSpace += fs.getTotalSpace();
                usableSpace += fs.getUsableSpace();
            }
        }

        if (totalSpace == 0) {
            // Fallback if no specific drive matched
            for (OSFileStore fs : fileStores) {
                totalSpace += fs.getTotalSpace();
                usableSpace += fs.getUsableSpace();
            }
        }

        if (totalSpace == 0) return 0.0;
        long usedSpace = totalSpace - usableSpace;
        return Math.round(((double) usedSpace / totalSpace) * 1000.0) / 10.0;
    }

    public double getDiskFreeGb() {
        List<OSFileStore> fileStores = os.getFileSystem().getFileStores();
        long usableSpace = 0;
        long totalSpace = 0;

        for (OSFileStore fs : fileStores) {
            if (isPrimaryFixedStore(fs)) {
                usableSpace += fs.getUsableSpace();
                totalSpace += fs.getTotalSpace();
            }
        }

        if (totalSpace == 0) {
            for (OSFileStore fs : fileStores) usableSpace += fs.getUsableSpace();
        }

        return Math.round((usableSpace / (1024.0 * 1024.0 * 1024.0)) * 10.0) / 10.0;
    }

    public double getDiskUsedGb() {
        List<OSFileStore> fileStores = os.getFileSystem().getFileStores();
        long totalSpace = 0;
        long usableSpace = 0;

        for (OSFileStore fs : fileStores) {
            if (isPrimaryFixedStore(fs)) {
                totalSpace += fs.getTotalSpace();
                usableSpace += fs.getUsableSpace();
            }
        }

        if (totalSpace == 0) {
            for (OSFileStore fs : fileStores) {
                totalSpace += fs.getTotalSpace();
                usableSpace += fs.getUsableSpace();
            }
        }

        return Math.round(((totalSpace - usableSpace) / (1024.0 * 1024.0 * 1024.0)) * 10.0) / 10.0;
    }
}
