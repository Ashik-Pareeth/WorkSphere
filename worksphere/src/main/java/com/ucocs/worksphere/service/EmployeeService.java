package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.CreateEmployeeRequest; // Import your new DTO
import com.ucocs.worksphere.dto.EmployeeResponseDTO;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.Role;
import com.ucocs.worksphere.enums.EmployeeStatus;
import com.ucocs.worksphere.repository.DepartmentRepository;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.JobPositionRepository;
import com.ucocs.worksphere.repository.RoleRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.ucocs.worksphere.exception.ResourceNotFoundException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class EmployeeService {
    private final PasswordEncoder passwordEncoder;
    private final EmployeeRepository employeeRepository;
    // Add these repositories:
    private final DepartmentRepository departmentRepository;
    private final JobPositionRepository jobPositionRepository;
    private final RoleRepository roleRepository;

    public EmployeeService(
            PasswordEncoder passwordEncoder,
            EmployeeRepository employeeRepository,
            DepartmentRepository departmentRepository,
            JobPositionRepository jobPositionRepository,
            RoleRepository roleRepository) {
        this.passwordEncoder = passwordEncoder;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.jobPositionRepository = jobPositionRepository;
        this.roleRepository = roleRepository;
    }

    // UPDATE THIS METHOD to take the DTO instead of the Entity
    public void saveEmployee(CreateEmployeeRequest request) {
        Employee employee = new Employee();

        // 1. Map simple fields
        employee.setFirstName(request.firstName());
        employee.setLastName(request.lastName());
        employee.setUserName(request.username()); // Maps 'username' to 'userName'
        employee.setEmail(request.email());
        employee.setSalary(request.salary());

        // 2. Encode Password
        employee.setPassword(passwordEncoder.encode(request.password()));

        // 3. Fetch and Set Department
        if (request.Id() != null) {
            employee.setDepartment(departmentRepository.findById(request.Id())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found")));
        }

        // 4. Fetch and Set JobPosition
        if (request.jobPositionId() != null) {
            employee.setJobPosition(jobPositionRepository.findById(request.jobPositionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Job Position not found")));
        }

        // 5. Fetch and Set Roles
        if (request.roles() != null && !request.roles().isEmpty()) {
            Set<Role> roleEntities = new HashSet<>(roleRepository.findAllById(request.roles()));
            employee.setRoles(roleEntities);
        }

        employeeRepository.save(employee);
    }
    public void activateEmployee(String userName, String newPassword, String phoneNumber) {
        Employee employee = employeeRepository.findByUserName(userName)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with name " + userName));
        employee.setPassword(passwordEncoder.encode(newPassword));
        employee.setPhoneNumber(phoneNumber);
        employee.setJoiningDate(LocalDateTime.now());
        employee.setEmployeeStatus(EmployeeStatus.ACTIVE);
        employeeRepository.save(employee);
    }

    public void uploadProfilePic(String userName, MultipartFile image) {
        Employee employee = employeeRepository.findByUserName(userName)
                .orElseThrow(() -> new ResourceNotFoundException("User Not Found with name " + userName));
        if (image.isEmpty()) {
            throw new IllegalArgumentException("The file is empty");
        }
        Path uploadPath = Paths.get("uploads/profilePhoto/");
        try {
            Files.createDirectories(uploadPath);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create directory");
        }
        String timeStamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String imageName = timeStamp + image.getOriginalFilename();
        Path filePath = uploadPath.resolve(imageName);
        try {
            Files.copy(image.getInputStream(), filePath);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store Profile picture");
        }
        ;
        employee.setProfilePic(imageName);
        employeeRepository.save(employee);
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponseDTO> getAllEmployees() {
        return employeeRepository.findAll()
                .stream()
                .map(EmployeeResponseDTO::fromEntity)
                .toList();
    }


    public double calculateBonus(double salary) {
        if (salary > 50000) {
            return salary * .10;
        } else {
            return salary * .05;
        }
    }

    public void updateEmployee(UUID id, CreateEmployeeRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        // 1. Update Basic Fields
        employee.setFirstName(request.firstName());
        employee.setLastName(request.lastName());
        employee.setUserName(request.username());
        employee.setEmail(request.email());
        employee.setSalary(request.salary());

        // 2. Update Password only if provided (not empty)
        if (request.password() != null && !request.password().isEmpty()) {
            employee.setPassword(passwordEncoder.encode(request.password()));
        }

        // 3. Update Department (Note: DTO field 'Id' maps to Department per your save logic)
        if (request.Id() != null) {
            employee.setDepartment(departmentRepository.findById(request.Id())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found")));
        }

        // 4. Update Job Position
        if (request.jobPositionId() != null) {
            employee.setJobPosition(jobPositionRepository.findById(request.jobPositionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Job Position not found")));
        }

        // 5. Update Roles
        if (request.roles() != null && !request.roles().isEmpty()) {
            Set<Role> roleEntities = new HashSet<>(roleRepository.findAllById(request.roles()));
            employee.setRoles(roleEntities);
        }

        employeeRepository.save(employee);
    }

    // ADD THIS: Delete Logic
    public void deleteEmployee(UUID id) {
        if (!employeeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Employee not found with id: " + id);
        }
        employeeRepository.deleteById(id);
    }

    // In worksphere/service/EmployeeService.java

    // Inside EmployeeService.java
    public EmployeeResponseDTO getEmployeeById(UUID id) {
        Employee employee = employeeRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        return EmployeeResponseDTO.fromEntity(employee);
    }
}



