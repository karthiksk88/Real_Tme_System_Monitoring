package com.neurosys.agent.collector;

import oshi.SystemInfo;
import oshi.software.os.OperatingSystem;

import java.net.InetAddress;

public class SystemInfoCollector {

    private final SystemInfo systemInfo;
    private final OperatingSystem os;

    public SystemInfoCollector(SystemInfo systemInfo) {
        this.systemInfo = systemInfo;
        this.os = systemInfo.getOperatingSystem();
    }

    public String getHostname() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return os.getNetworkParams().getHostName();
        }
    }

    public String getOsName() {
        return os.getFamily();
    }

    public String getOsVersion() {
        return os.getVersionInfo().getVersion();
    }

    public long getUptimeSeconds() {
        return os.getSystemUptime();
    }
}
