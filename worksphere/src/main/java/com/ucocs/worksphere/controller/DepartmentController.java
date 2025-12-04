package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.entity.Department;
import com.ucocs.worksphere.repository.DepartmentRepository;
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
    public void createDepartment(@RequestBody Department department) {
        departmentRepository.save(department);
    }

    @GetMapping
    public List<Department> getAllDepartment() {
        return departmentRepository.findAll();
    }
}
