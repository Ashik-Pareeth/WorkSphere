package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.service.EmployeeService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/employees")
@RestController
public class EmployeeController {
    private final EmployeeService employeeService;
    private final EmployeeRepository employeeRepository;

    public EmployeeController(EmployeeService myService, EmployeeRepository employeeRepository) {
        this.employeeService = myService;
        this.employeeRepository = employeeRepository;
    }

    @GetMapping("/bonus")
    public double getBonus(@RequestParam double salary) {

        return employeeService.calculateBonus(salary);
    }

    @PostMapping
    public void createEmployee(@RequestBody Employee employee) {

        employeeService.saveEmployee(employee);
    }

    @GetMapping
    public List<Employee> getAllEmployee() {
        return employeeRepository.findAll();
    }
}
