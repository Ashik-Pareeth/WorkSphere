package com.ucocs.worksphere.dto;

import com.ucocs.worksphere.enums.EmployeeStatus;

public record UpdateStatusRequest(EmployeeStatus status) {}
