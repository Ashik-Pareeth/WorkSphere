package com.ucocs.worksphere.dto;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.OffboardingRecord;

public record ArchivedEmployeeDTO(
        EmployeeResponseDTO employee,
        OffboardingRecordDTO offboardingRecord
) {
    public static ArchivedEmployeeDTO fromEntities(Employee employee, OffboardingRecord ob) {
        return new ArchivedEmployeeDTO(
                EmployeeResponseDTO.fromEntity(employee),
                OffboardingRecordDTO.fromEntity(ob)
        );
    }
}