package com.neurosys.agent.collector;

import oshi.SystemInfo;
import oshi.hardware.GlobalMemory;

public class MemoryCollector {

    private final GlobalMemory memory;

    public MemoryCollector(SystemInfo systemInfo) {
        this.memory = systemInfo.getHardware().getMemory();
    }

    public double getMemoryUsagePercent() {
        long total = memory.getTotal();
        long available = memory.getAvailable();
        long used = total - available;
        return Math.round(((double) used / total) * 1000.0) / 10.0;
    }

    public double getTotalRamMb() {
        return Math.round((memory.getTotal() / (1024.0 * 1024.0)) * 10.0) / 10.0;
    }

    public double getMemoryUsedMb() {
        long used = memory.getTotal() - memory.getAvailable();
        return Math.round((used / (1024.0 * 1024.0)) * 10.0) / 10.0;
    }

    public double getMemoryFreeMb() {
        return Math.round((memory.getAvailable() / (1024.0 * 1024.0)) * 10.0) / 10.0;
    }
}
