package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.LoginRequest;
import com.ucocs.worksphere.dto.LoginResponse;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.util.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

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
        String userName = loginRequest.getUserName();
        authenticationManager
                .authenticate(new UsernamePasswordAuthenticationToken
                        (userName, loginRequest.getPassword()));
        String token = jwtUtil.generateToken(userName);
        Employee employee = employeeRepository.findByUserName(userName).orElseThrow();
        return new LoginResponse(token, employee.getId(), employee.getEmployeeStatus());
    }
}
