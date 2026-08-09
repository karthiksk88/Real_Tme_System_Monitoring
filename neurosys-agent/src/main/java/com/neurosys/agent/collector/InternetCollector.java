package com.neurosys.agent.collector;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.InetSocketAddress;
import java.net.Socket;

public class InternetCollector {

    private static final Logger log = LoggerFactory.getLogger(InternetCollector.class);
    private static final String[] TEST_HOSTS = {"8.8.8.8", "1.1.1.1", "9.9.9.9"};
    private static final int TEST_PORT = 53;
    private static final int TIMEOUT_MS = 1500;

    public boolean isInternetReachable() {
        for (String host : TEST_HOSTS) {
            try (Socket socket = new Socket()) {
                socket.connect(new InetSocketAddress(host, TEST_PORT), TIMEOUT_MS);
                return true;
            } catch (Exception ignored) {
                // Try next DNS host
            }
        }
        log.warn("Internet connectivity test failed across all test hosts");
        return false;
    }
}
