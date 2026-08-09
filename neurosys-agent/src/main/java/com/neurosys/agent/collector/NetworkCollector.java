package com.neurosys.agent.collector;

import oshi.SystemInfo;
import oshi.hardware.NetworkIF;

import java.util.List;

public class NetworkCollector {

    private final List<NetworkIF> networkIFs;
    private long prevRxBytes = 0;
    private long prevTxBytes = 0;
    private long prevTime = System.currentTimeMillis();

    public NetworkCollector(SystemInfo systemInfo) {
        this.networkIFs = systemInfo.getHardware().getNetworkIFs();
        updateBytes();
    }

    private void updateBytes() {
        long rx = 0;
        long tx = 0;
        for (NetworkIF net : networkIFs) {
            net.updateAttributes();
            rx += net.getBytesRecv();
            tx += net.getBytesSent();
        }
        this.prevRxBytes = rx;
        this.prevTxBytes = tx;
        this.prevTime = System.currentTimeMillis();
    }

    public double getDownloadSpeedBytesSec() {
        long currentRx = 0;
        for (NetworkIF net : networkIFs) {
            net.updateAttributes();
            currentRx += net.getBytesRecv();
        }
        long currentTime = System.currentTimeMillis();
        long timeDiffSeconds = Math.max(1, (currentTime - prevTime) / 1000);
        long rxDiff = currentRx - prevRxBytes;
        this.prevRxBytes = currentRx;
        this.prevTime = currentTime;
        return Math.max(0.0, Math.round((double) rxDiff / timeDiffSeconds));
    }

    public double getUploadSpeedBytesSec() {
        long currentTx = 0;
        for (NetworkIF net : networkIFs) {
            net.updateAttributes();
            currentTx += net.getBytesSent();
        }
        long currentTime = System.currentTimeMillis();
        long timeDiffSeconds = Math.max(1, (currentTime - prevTime) / 1000);
        long txDiff = currentTx - prevTxBytes;
        this.prevTxBytes = currentTx;
        return Math.max(0.0, Math.round((double) txDiff / timeDiffSeconds));
    }

    public String getIpAddress() {
        for (NetworkIF net : networkIFs) {
            String[] ipv4 = net.getIPv4addr();
            if (ipv4.length > 0 && !ipv4[0].startsWith("127.")) {
                return ipv4[0];
            }
        }
        return "127.0.0.1";
    }

    public String getMacAddress() {
        for (NetworkIF net : networkIFs) {
            String mac = net.getMacaddr();
            if (mac != null && !mac.isEmpty() && !mac.equals("00:00:00:00:00:00")) {
                return mac.toUpperCase();
            }
        }
        return "00:11:22:33:44:55";
    }
}
