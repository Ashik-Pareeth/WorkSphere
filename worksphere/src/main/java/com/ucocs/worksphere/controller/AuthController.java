package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.LoginRequest;
import com.ucocs.worksphere.dto.LoginResponse;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.util.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
public class AuthController {

    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final EmployeeRepository employeeRepository;

    public AuthController(JwtUtil jwtUtil, AuthenticationManager authenticationManager, EmployeeRepository employeeRepository) {
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.employeeRepository = employeeRepository;
    }

    @PostMapping("/login")
    public LoginResponse authenticateUser(@RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUserName(),
                        loginRequest.getPassword()
                )
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // FIX: Collect ALL roles into a List<String>
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        // Pass the list to the generator
        String token = jwtUtil.generateToken(userDetails.getUsername(), roles);

        Employee employee = employeeRepository.findByUserName(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        return new LoginResponse(token, employee.getId(), employee.getEmployeeStatus());
    }
}