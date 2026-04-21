package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.LoginRequest;
import com.ucocs.worksphere.dto.LoginResponse;
import com.ucocs.worksphere.dto.ForgotPasswordRequest;
import com.ucocs.worksphere.dto.ResetPasswordRequest;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.PasswordResetToken;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.exception.ServiceOperationException;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.PasswordResetTokenRepository;
import com.ucocs.worksphere.service.EmailService;
import com.ucocs.worksphere.util.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
public class AuthController {

        private final JwtUtil jwtUtil;
        private final AuthenticationManager authenticationManager;
        private final EmployeeRepository employeeRepository;
        private final PasswordResetTokenRepository tokenRepository;
        private final EmailService emailService;
        private final PasswordEncoder passwordEncoder;

        public AuthController(JwtUtil jwtUtil,
                        AuthenticationManager authenticationManager,
                        EmployeeRepository employeeRepository,
                        PasswordResetTokenRepository tokenRepository,
                        EmailService emailService,
                        PasswordEncoder passwordEncoder) {
                this.jwtUtil = jwtUtil;
                this.authenticationManager = authenticationManager;
                this.employeeRepository = employeeRepository;
                this.tokenRepository = tokenRepository;
                this.emailService = emailService;
                this.passwordEncoder = passwordEncoder;
        }

        private String hashToken(String token) {
                try {
                        MessageDigest digest = MessageDigest.getInstance("SHA-256");
                        byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
                        StringBuilder hexString = new StringBuilder(2 * hash.length);
                        for (byte b : hash) {
                                String hex = Integer.toHexString(0xff & b);
                                if (hex.length() == 1) {
                                        hexString.append('0');
                                }
                                hexString.append(hex);
                        }
                        return hexString.toString();
                } catch (NoSuchAlgorithmException e) {
                        throw new ServiceOperationException("Could not hash token", e);
                }
        }

        @PostMapping("/login")
        public LoginResponse authenticateUser(@RequestBody LoginRequest loginRequest) {
                Authentication authentication = authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                loginRequest.getUserName(),
                                                loginRequest.getPassword()));

                UserDetails userDetails = (UserDetails) authentication.getPrincipal();

                // FIX: Collect ALL roles into a List<String>
                List<String> roles = userDetails.getAuthorities().stream()
                                .map(GrantedAuthority::getAuthority)
                                .collect(Collectors.toList());

                // Pass the list to the generator
                String token = jwtUtil.generateToken(userDetails.getUsername(), roles);

                Employee employee = employeeRepository.findByUserName(userDetails.getUsername())
                                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

                return new LoginResponse(token, employee.getId(), employee.getEmployeeStatus());
        }

        @PostMapping("/forgot-password")
        @Transactional
        public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
                Optional<Employee> employeeOpt = employeeRepository.findByEmail(request.email());

                if (employeeOpt.isPresent()) {
                        Employee employee = employeeOpt.get();

                        // Delete any existing tokens to ensure only 1 active at a time
                        tokenRepository.deleteByEmployee(employee);

                        // Generate raw UUID token and hash it
                        String rawToken = UUID.randomUUID().toString();
                        String hashedToken = hashToken(rawToken);

                        PasswordResetToken resetToken = new PasswordResetToken();
                        resetToken.setTokenHash(hashedToken);
                        resetToken.setEmployee(employee);
                        resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(15));
                        tokenRepository.save(resetToken);

                        // Send raw token over email
                        emailService.sendPasswordResetEmail(employee.getEmail(), rawToken);
                }

                // Security: Always return generic response to prevent email enumeration
                return ResponseEntity
                                .ok("If this email is registered, you will receive a password reset link shortly.");
        }

        @PostMapping("/reset-password")
        @Transactional
        public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
                String hashedToken = hashToken(request.token());

                Optional<PasswordResetToken> tokenOpt = tokenRepository.findByTokenHash(hashedToken);

                if (tokenOpt.isEmpty()) {
                        throw new IllegalArgumentException("Invalid or expired password reset token.");
                }

                PasswordResetToken resetToken = tokenOpt.get();
                if (resetToken.isExpired()) {
                        tokenRepository.delete(resetToken);
                        throw new IllegalArgumentException("Invalid or expired password reset token.");
                }

                Employee employee = resetToken.getEmployee();
                employee.setPassword(passwordEncoder.encode(request.newPassword()));
                employeeRepository.save(employee);

                // Cleanup token
                tokenRepository.delete(resetToken);

                return ResponseEntity.ok("Password has been successfully reset. You can now login.");
        }
}
