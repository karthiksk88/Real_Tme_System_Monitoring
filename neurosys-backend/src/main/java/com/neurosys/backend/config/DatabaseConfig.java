package com.neurosys.backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Slf4j
@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource() {
        String rawUrl = System.getenv("MYSQL_PUBLIC_URL");
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            rawUrl = System.getenv("MYSQL_URL");
        }

        String host = System.getenv("MYSQLHOST");
        String port = System.getenv("MYSQLPORT");
        String db = System.getenv("MYSQLDATABASE");
        String user = System.getenv("MYSQLUSER");
        String pass = System.getenv("MYSQLPASSWORD");

        HikariConfig config = new HikariConfig();
        boolean configured = false;

        if (rawUrl != null && rawUrl.startsWith("mysql://")) {
            try {
                URI uri = new URI(rawUrl);
                String userInfo = uri.getUserInfo();
                String username = user != null ? user : "root";
                String password = pass != null ? pass : "";
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    username = parts[0];
                    password = parts[1];
                }
                String hostName = uri.getHost();
                int portNum = uri.getPort() > 0 ? uri.getPort() : 3306;
                String dbName = uri.getPath() != null && uri.getPath().length() > 1 ? uri.getPath().substring(1) : "railway";

                String jdbcUrl = String.format("jdbc:mysql://%s:%d/%s?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC",
                        hostName, portNum, dbName);
                log.info("Parsed Railway MYSQL_URL -> JDBC: {}, User: {}", jdbcUrl, username);
                config.setJdbcUrl(jdbcUrl);
                config.setUsername(username);
                config.setPassword(password);
                config.setDriverClassName("com.mysql.cj.jdbc.Driver");
                configured = true;
            } catch (Exception e) {
                log.error("Failed to parse raw MYSQL_URL: {}, falling back to host params", rawUrl, e);
            }
        }

        if (!configured && host != null && !host.trim().isEmpty()) {
            String jdbcUrl = String.format("jdbc:mysql://%s:%s/%s?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC",
                    host, port != null ? port : "3306", db != null ? db : "railway");
            log.info("Configuring Hikari DataSource with Railway Host: {}", jdbcUrl);
            config.setJdbcUrl(jdbcUrl);
            config.setUsername(user != null ? user : "root");
            config.setPassword(pass != null ? pass : "");
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
            configured = true;
        }

        if (!configured) {
            log.info("Configuring fallback H2 DataSource...");
            config.setJdbcUrl("jdbc:h2:mem:neurosys;DB_CLOSE_DELAY=-1;MODE=MySQL;DATABASE_TO_LOWER=TRUE");
            config.setDriverClassName("org.h2.Driver");
            config.setUsername("sa");
            config.setPassword("");
            return new HikariDataSource(config);
        }

        config.setInitializationFailTimeout(-1);
        config.setConnectionTimeout(10000);
        return new HikariDataSource(config);
    }
}
