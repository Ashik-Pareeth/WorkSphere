package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.ActivateAccountRequest;
import com.ucocs.worksphere.dto.EmployeeResponseDTO;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/employees")
@RestController
public class EmployeeController {
    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService myService) {
        this.employeeService = myService;
    }

    @GetMapping("/bonus")
    public double getBonus(@RequestParam double salary) {

        return employeeService.calculateBonus(salary);
    }

    @PostMapping
    public void createEmployee(@RequestBody com.ucocs.worksphere.dto.EmployeeRequestDTO employeeRequest) {

        employeeService.saveEmployee(employeeRequest);
    }

    @PostMapping("/activate")
    public ResponseEntity<?> activateAccount(Principal principal,
            @Valid @RequestBody ActivateAccountRequest accountRequest) {
        String password = accountRequest.password();
        String phoneNumber = accountRequest.phoneNumber();
        employeeService.activateEmployee(principal.getName(), password, phoneNumber);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/photo")
    public ResponseEntity<?> uploadProfilePic(
            Principal principal, @RequestParam("profilePic") MultipartFile multipartFile) {
        employeeService.uploadProfilePic(principal.getName(), multipartFile);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public List<EmployeeResponseDTO> getAllEmployee() {
        return employeeService.getAllEmployees();
    }

}
