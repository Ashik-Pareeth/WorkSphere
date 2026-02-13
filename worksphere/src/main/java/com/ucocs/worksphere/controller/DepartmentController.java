package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.entity.Department;
import com.ucocs.worksphere.repository.DepartmentRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/departments")
@RestController
public class DepartmentController {
    private final DepartmentRepository departmentRepository;

    public DepartmentController(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public void createDepartment(@RequestBody Department department) {
        departmentRepository.save(department);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Department> getAllDepartment() {
        return departmentRepository.findAll();
    }
}
