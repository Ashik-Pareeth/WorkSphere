package com.ucocs.worksphere.dto;

import com.ucocs.worksphere.enums.EmployeeStatus;

import java.util.UUID;

public class LoginResponse {
    private String token;
    private UUID employeeId;
    private EmployeeStatus employeeStatus;

    public LoginResponse(String token, UUID employeeId, EmployeeStatus employeeStatus) {
        this.token = token;
        this.employeeId = employeeId;
        this.employeeStatus = employeeStatus;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public UUID getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(UUID employeeId) {
        this.employeeId = employeeId;
    }

    public EmployeeStatus getEmployeeStatus() {
        return employeeStatus;
    }

    public void setEmployeeStatus(EmployeeStatus employeeStatus) {
        this.employeeStatus = employeeStatus;
    }
}
