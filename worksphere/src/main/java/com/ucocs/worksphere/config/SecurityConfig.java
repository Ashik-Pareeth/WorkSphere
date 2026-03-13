package com.ucocs.worksphere.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@EnableMethodSecurity
@Configuration
public class SecurityConfig {
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public RoleHierarchy roleHierarchy() {
        return RoleHierarchyImpl
                .fromHierarchy("ROLE_SUPER_ADMIN > ROLE_HR \n ROLE_HR > ROLE_MANAGER \n ROLE_MANAGER > ROLE_EMPLOYEE");
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
        http.cors(cors -> cors.configurationSource(
                request -> {
                    CorsConfiguration config = new CorsConfiguration();
                    config.setAllowedOrigins(List.of("http://localhost:5173"));
                    config.setAllowedMethods(List.of("*"));
                    config.setAllowedHeaders(List.of("*"));
                    return config;
                })).csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(
                        auth -> auth.requestMatchers(
                                "/login", "/forgot-password", "/reset-password", "/auth/**", "/public/**", "/error",
                                "/api/candidates/public/**", "/api/jobs/public/**", "/api/offers/*/respond",
                                "/dev/**",
                                "/v3/api-docs/**", "/v3/api-docs.yaml",
                                "/swagger-ui/**", "/swagger-ui.html").permitAll()
                                .requestMatchers("/work-session/**").authenticated()
                                .anyRequest().authenticated())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();

    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
