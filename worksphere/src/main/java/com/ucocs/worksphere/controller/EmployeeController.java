package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.ActivateAccountRequest;
import com.ucocs.worksphere.dto.EmployeeSummary;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

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

    @PostMapping("/activate/{id}")
    public ResponseEntity<?> activateAccount(@PathVariable Long id,
                                             @Valid @RequestBody ActivateAccountRequest accountRequest) {
        String password = accountRequest.password();
        String phoneNumber = accountRequest.phoneNumber();
        employeeService.activateEmployee(id, password, phoneNumber);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/photo/{id}")
    public ResponseEntity<?> uploadProfilePic(
            @PathVariable Long id, @RequestParam("profilePic") MultipartFile multipartFile) {
        employeeService.uploadProfilePic(id, multipartFile);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public List<EmployeeSummary> getAllEmployee() {
        return employeeService.getAllEmployees();
    }


}
