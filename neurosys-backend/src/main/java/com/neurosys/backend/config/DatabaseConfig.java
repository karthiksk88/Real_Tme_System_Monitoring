package com.neurosys.backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

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

        if (rawUrl != null && rawUrl.startsWith("mysql://")) {
            String jdbcUrl = rawUrl.replace("mysql://", "jdbc:mysql://");
            if (!jdbcUrl.contains("?")) {
                jdbcUrl += "?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
            }
            log.info("Configuring Hikari DataSource with Railway URL: {}", jdbcUrl);
            config.setJdbcUrl(jdbcUrl);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        } else if (host != null && !host.trim().isEmpty()) {
            String jdbcUrl = String.format("jdbc:mysql://%s:%s/%s?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC",
                    host, port != null ? port : "3306", db != null ? db : "railway");
            log.info("Configuring Hikari DataSource with Railway Host: {}", jdbcUrl);
            config.setJdbcUrl(jdbcUrl);
            config.setUsername(user != null ? user : "root");
            config.setPassword(pass != null ? pass : "");
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        } else {
            log.info("Configuring fallback H2 DataSource...");
            config.setJdbcUrl("jdbc:h2:mem:neurosys;DB_CLOSE_DELAY=-1;MODE=MySQL");
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
