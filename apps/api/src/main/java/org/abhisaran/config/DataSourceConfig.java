package org.abhisaran.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${SPRING_DATASOURCE_URL:${DATABASE_URL:}}")
    private String rawUrl;

    @Value("${SPRING_DATASOURCE_USERNAME:${DATABASE_USERNAME:}}")
    private String rawUsername;

    @Value("${SPRING_DATASOURCE_PASSWORD:${DATABASE_PASSWORD:}}")
    private String rawPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setDriverClassName("org.postgresql.Driver");

        String jdbcUrl = rawUrl;
        String username = rawUsername;
        String password = rawPassword;

        // If URL starts with postgresql:// or postgres:// (standard URI format from Render/Supabase)
        if (rawUrl != null && (rawUrl.startsWith("postgresql://") || rawUrl.startsWith("postgres://"))) {
            try {
                URI uri = URI.create(rawUrl);
                String host = uri.getHost();
                int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                String path = uri.getPath(); // e.g. /postgres
                String query = uri.getQuery();

                String userInfo = uri.getUserInfo();
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    if (username == null || username.isBlank() || username.equals("abhisaran_user") || username.equals("postgres")) {
                        username = URLDecoder.decode(parts[0], StandardCharsets.UTF_8);
                    }
                    if (password == null || password.isBlank() || password.equals("abhisaran_local_password_secure_123")) {
                        password = URLDecoder.decode(parts[1], StandardCharsets.UTF_8);
                    }
                }

                StringBuilder sb = new StringBuilder("jdbc:postgresql://").append(host).append(":").append(port).append(path);
                if (query != null && !query.isBlank()) {
                    sb.append("?").append(query);
                    if (!query.contains("sslmode")) {
                        sb.append("&sslmode=require");
                    }
                } else {
                    sb.append("?sslmode=require");
                }
                jdbcUrl = sb.toString();
                log.info("Parsed postgresql:// URI into JDBC URL for host: {}", host);
            } catch (Exception e) {
                log.warn("Failed to parse postgresql URI, falling back to raw JDBC format: {}", e.getMessage());
            }
        }

        if (jdbcUrl == null || jdbcUrl.isBlank()) {
            jdbcUrl = "jdbc:postgresql://localhost:5432/abhisaran";
        }

        config.setJdbcUrl(jdbcUrl);
        if (username != null && !username.isBlank()) {
            config.setUsername(username);
        }
        if (password != null && !password.isBlank()) {
            config.setPassword(password);
        }

        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(30000);
        config.setConnectionTimeout(20000);

        log.info("Configuring HikariDataSource with user: {} and URL: {}", username, jdbcUrl.replaceAll("password=[^&]*", "password=***"));
        return new HikariDataSource(config);
    }
}
