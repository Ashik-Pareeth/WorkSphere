package com.ucocs.worksphere.enums;

public enum EmployeeActionStatus {
    PENDING,     // Manager reports waiting for HR review
    APPROVED,    // HR approved a manager report
    REJECTED,    // HR rejected a manager report
    COMPLETED    // HR-initiated actions (no approval needed — already done)
}