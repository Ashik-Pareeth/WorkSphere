package com.ucocs.worksphere.dto;

public class LoginResponse {
    private String token;
    private Long employeeId;
    private boolean isEnabled;

    public LoginResponse(String token, Long employeeId, boolean isEnabled) {
        this.token = token;
        this.employeeId = employeeId;
        this.isEnabled = isEnabled;
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

    public boolean isEnabled() {
        return isEnabled;
    }

    public void setEnabled(boolean enabled) {
        isEnabled = enabled;
    }
}
