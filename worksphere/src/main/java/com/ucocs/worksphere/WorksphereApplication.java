package com.ucocs.worksphere;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

@SpringBootApplication
@EnableJpaAuditing(auditorAwareRef = "auditorAware") // <--- 1. ENABLE AUDITING HERE
public class WorksphereApplication {

    public static void main(String[] args) {
        SpringApplication.run(WorksphereApplication.class, args);
    }

    // 2. DEFINE THE AUDITOR BEAN HERE
    @Bean
    public AuditorAware<String> auditorAware() {
        return () -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            // If there is no logged-in user (e.g., during startup/seeding), use "SYSTEM"
            if (authentication == null || !authentication.isAuthenticated() ||
                    "anonymousUser".equals(authentication.getPrincipal())) {
                return Optional.of("SYSTEM");
            }

            // Otherwise, use the username of the logged-in user
            return Optional.of(authentication.getName());
        };
    }
}