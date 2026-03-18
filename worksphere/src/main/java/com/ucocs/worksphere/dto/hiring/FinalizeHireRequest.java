package com.ucocs.worksphere.dto.hiring;

import lombok.Data;
import java.util.Set;
import java.util.UUID;

@Data
public class FinalizeHireRequest {
    private UUID employeeId;
    private String username;
    private Set<UUID> roleIds;
    private UUID managerId;
    private UUID workScheduleId;
    private Double salary;
    private UUID departmentId;
    private UUID jobPositionId;
}
