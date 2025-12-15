package com.ucocs.worksphere.dto;

public class LoginResponse {
    private String token;
    private Long employeeId;

    public LoginResponse(String token, Long employeeId) {
        this.token = token;
        this.employeeId = employeeId;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }
}
