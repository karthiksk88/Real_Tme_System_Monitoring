-- NeuroSys MySQL 8.0 Initial Migration Schema Script

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_reset_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS computers (
    id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(100) NOT NULL UNIQUE,
    hostname VARCHAR(150) NOT NULL,
    computer_name VARCHAR(150),
    ip_address VARCHAR(45) NOT NULL,
    mac_address VARCHAR(50) NOT NULL UNIQUE,
    os_name VARCHAR(100) NOT NULL,
    os_version VARCHAR(100),
    lab_name VARCHAR(100),
    cpu_model VARCHAR(150),
    total_ram_mb DOUBLE,
    agent_version VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'ONLINE',
    internet_connected BOOLEAN DEFAULT TRUE,
    uptime_seconds BIGINT DEFAULT 0,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    INDEX idx_computer_status (status),
    INDEX idx_computer_mac (mac_address),
    INDEX idx_computer_lab (lab_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    computer_id VARCHAR(36) NOT NULL,
    cpu_usage_percent DOUBLE NOT NULL,
    memory_usage_percent DOUBLE NOT NULL,
    memory_used_mb DOUBLE,
    memory_free_mb DOUBLE,
    disk_usage_percent DOUBLE NOT NULL,
    disk_used_gb DOUBLE,
    disk_free_gb DOUBLE,
    disk_read_bytes_sec DOUBLE,
    disk_write_bytes_sec DOUBLE,
    network_rx_bytes_sec DOUBLE,
    network_tx_bytes_sec DOUBLE,
    cpu_temperature DOUBLE,
    active_process_count INT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_metrics_computer FOREIGN KEY (computer_id) REFERENCES computers(id) ON DELETE CASCADE,
    INDEX idx_metrics_comp_time (computer_id, recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(36) PRIMARY KEY,
    computer_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    triggered_value DOUBLE,
    threshold_value DOUBLE,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_alerts_computer FOREIGN KEY (computer_id) REFERENCES computers(id) ON DELETE CASCADE,
    INDEX idx_alert_comp_status (computer_id, status),
    INDEX idx_alert_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS health_scores (
    id VARCHAR(36) PRIMARY KEY,
    computer_id VARCHAR(36) NOT NULL,
    overall_score DOUBLE NOT NULL,
    cpu_health DOUBLE,
    memory_health DOUBLE,
    disk_health DOUBLE,
    network_health DOUBLE,
    category VARCHAR(50) NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_health_computer FOREIGN KEY (computer_id) REFERENCES computers(id) ON DELETE CASCADE,
    INDEX idx_health_comp_time (computer_id, calculated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS predictions (
    id VARCHAR(36) PRIMARY KEY,
    computer_id VARCHAR(36) NOT NULL,
    prediction_type VARCHAR(50) NOT NULL,
    horizon_minutes INT,
    predicted_cpu DOUBLE,
    predicted_ram DOUBLE,
    predicted_disk DOUBLE,
    crash_probability DOUBLE,
    confidence_score DOUBLE,
    reasons_json TEXT,
    recommended_action TEXT,
    predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_predictions_computer FOREIGN KEY (computer_id) REFERENCES computers(id) ON DELETE CASCADE,
    INDEX idx_pred_comp_type (computer_id, prediction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS logs (
    id VARCHAR(36) PRIMARY KEY,
    computer_id VARCHAR(36) NOT NULL,
    event_id INT,
    provider_name VARCHAR(150),
    log_level VARCHAR(50) NOT NULL,
    source_component VARCHAR(100),
    raw_message TEXT,
    simplified_english TEXT,
    suggested_solution TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_logs_computer FOREIGN KEY (computer_id) REFERENCES computers(id) ON DELETE CASCADE,
    INDEX idx_logs_comp_level (computer_id, log_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Software Inventory Table
CREATE TABLE IF NOT EXISTS software_inventory (
    id VARCHAR(36) PRIMARY KEY,
    computer_id VARCHAR(36) NOT NULL,
    name VARCHAR(200) NOT NULL,
    version VARCHAR(100),
    publisher VARCHAR(150),
    install_date VARCHAR(50),
    last_scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_software_computer FOREIGN KEY (computer_id) REFERENCES computers(id) ON DELETE CASCADE,
    INDEX idx_sw_comp_name (computer_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Required Software Table
CREATE TABLE IF NOT EXISTS required_software (
    id VARCHAR(36) PRIMARY KEY,
    lab_name VARCHAR(100) NOT NULL,
    software_name VARCHAR(200) NOT NULL,
    required_version VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    INDEX idx_req_sw_lab (lab_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Seed Admin Account (Password: Admin@123)
INSERT INTO users (id, username, email, password_hash, role, active)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'admin',
    'admin@neurosys.com',
    '$2a$12$K8Zl3Zc5D9w9O8a7b6c5d4e3f2g1h0i9j8k7l6m5n4o3p2q1r0s9',
    'ROLE_ADMIN',
    TRUE
) ON DUPLICATE KEY UPDATE username=username;
