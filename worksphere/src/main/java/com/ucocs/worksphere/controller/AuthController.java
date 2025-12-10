package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.LoginRequest;
import com.ucocs.worksphere.util.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
public class AuthController {
    private JwtUtil jwtUtil;
    private AuthenticationManager authenticationManager;

    public AuthController(JwtUtil jwtUtil, AuthenticationManager authenticationManager) {
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/login")
    public String getLoginRequest(@RequestBody LoginRequest loginRequest) {
        authenticationManager
                .authenticate(new UsernamePasswordAuthenticationToken
                        (loginRequest.getUserName(), loginRequest.getPassword()));
        return jwtUtil.generateToken(loginRequest.getUserName());
    }
}
