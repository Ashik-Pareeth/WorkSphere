package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.Department;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.DepartmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final com.ucocs.worksphere.repository.EmployeeRepository employeeRepository;
    private final AuditService auditService;


    public DepartmentService(DepartmentRepository departmentRepository,
                             com.ucocs.worksphere.repository.EmployeeRepository employeeRepository,
                             AuditService auditService) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
        this.auditService = auditService;
    }

    private com.ucocs.worksphere.entity.Employee getCurrentUser() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return employeeRepository.findByUserName(username)
                .orElse(null);
    }

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public Department getDepartmentById(UUID id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
    }

    public Department createDepartment(Department department) {
        if (departmentRepository.existsByName(department.getName())) {
            throw new IllegalArgumentException("Department with name " + department.getName() + " already exists.");
        }
        Department saved = departmentRepository.save(department);
        com.ucocs.worksphere.entity.Employee user = getCurrentUser();
        if (user != null) {
            auditService.log("Department", saved.getId(), com.ucocs.worksphere.enums.AuditAction.CREATED, user.getId(), null, saved.getName());
        }
        return saved;
    }

    public Department updateDepartment(UUID id, Department departmentDetails) {
        Department department = getDepartmentById(id);

        String oldName = department.getName();
        department.setName(departmentDetails.getName());
        department.setDescription(departmentDetails.getDescription());

        Department saved = departmentRepository.save(department);
        com.ucocs.worksphere.entity.Employee user = getCurrentUser();
        if (user != null) {
            auditService.log("Department", saved.getId(), com.ucocs.worksphere.enums.AuditAction.UPDATED, user.getId(), oldName, saved.getName());
        }
        return saved;
    }

    public void deleteDepartment(UUID id) {
        Department department = getDepartmentById(id);
        String oldName = department.getName();
        departmentRepository.delete(department);
        com.ucocs.worksphere.entity.Employee user = getCurrentUser();
        if (user != null) {
            auditService.log("Department", id, com.ucocs.worksphere.enums.AuditAction.DELETED, user.getId(), oldName, null);
        }
    }
}