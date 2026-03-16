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
import com.ucocs.worksphere.repository.WorkScheduleRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

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

import com.ucocs.worksphere.entity.Candidate;
import com.ucocs.worksphere.entity.OfferLetter;
import com.ucocs.worksphere.entity.JobOpening;

@Service
public class EmployeeService {
    private final PasswordEncoder passwordEncoder;
    private final EmployeeRepository employeeRepository;
    // Add these repositories:
    private final DepartmentRepository departmentRepository;
    private final JobPositionRepository jobPositionRepository;
    private final RoleRepository roleRepository;
    private final WorkScheduleRepository workScheduleRepository;
    private final EmailService emailService;

    public EmployeeService(
            PasswordEncoder passwordEncoder,
            EmployeeRepository employeeRepository,
            DepartmentRepository departmentRepository,
            JobPositionRepository jobPositionRepository,
            RoleRepository roleRepository,
            WorkScheduleRepository workScheduleRepository,
            EmailService emailService) {
        this.passwordEncoder = passwordEncoder;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.jobPositionRepository = jobPositionRepository;
        this.roleRepository = roleRepository;
        this.workScheduleRepository = workScheduleRepository;
        this.emailService = emailService;
    }

    // Helper to validate and fetch roles, enforcing singularity constraints
    private Set<Role> validateAndFetchRoles(Set<UUID> roleIds) {
        Set<Role> roleEntities = new HashSet<>(roleRepository.findAllById(roleIds));

        boolean hasExclusiveRole = roleEntities.stream().anyMatch(Role::isExclusive);

        if (hasExclusiveRole) {
            roleEntities.removeIf(r -> !r.isExclusive());
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            boolean isHr = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_HR"));
            boolean isSuperAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

            if (isHr && !isSuperAdmin && hasExclusiveRole) {
                throw new SecurityException("HR users are not authorized to assign the SUPER_ADMIN role.");
            }
        }

        return roleEntities;
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

        // 2. Encode Password and Default Status
        employee.setPassword(passwordEncoder.encode(request.password()));
        employee.setEmployeeStatus(EmployeeStatus.PENDING);

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
            Set<UUID> roleIds = new HashSet<>(request.roles());
            employee.setRoles(validateAndFetchRoles(roleIds));
        }

        // 6. Fetch and Set Manager
        if (request.managerId() != null) {
            employee.setManager(employeeRepository.findById(request.managerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found")));
        }

        // 7. Fetch and Set Work Schedule
        if (request.workScheduleId() != null) {
            employee.setWorkSchedule(workScheduleRepository.findById(request.workScheduleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Work Schedule not found")));
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

        // 3. Update Department (Note: DTO field 'Id' maps to Department per your save
        // logic)
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
            Set<UUID> roleIds = new HashSet<>(request.roles());
            employee.setRoles(validateAndFetchRoles(roleIds));
        }

        // 6. Update Manager
        if (request.managerId() != null) {
            employee.setManager(employeeRepository.findById(request.managerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found")));
        } else {
            employee.setManager(null);
        }

        // 7. Update Work Schedule
        if (request.workScheduleId() != null) {
            employee.setWorkSchedule(workScheduleRepository.findById(request.workScheduleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Work Schedule not found")));
        } else {
            employee.setWorkSchedule(null);
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

    @Transactional
    public void updateEmployeeRoles(UUID employeeId, List<UUID> roleIds) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (roleIds != null) {
            employee.setRoles(validateAndFetchRoles(new HashSet<>(roleIds)));
        } else {
            employee.getRoles().clear();
        }
        
        employeeRepository.save(employee);
    }

    @Transactional
    public Employee finalizeHire(com.ucocs.worksphere.dto.hiring.FinalizeHireRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (employee.getEmployeeStatus() != EmployeeStatus.PENDING) {
            throw new IllegalStateException("Employee is not in PENDING state.");
        }

        // 1. Roles
        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            employee.setRoles(validateAndFetchRoles(request.getRoleIds()));
        }

        // 2. Manager
        if (request.getManagerId() != null) {
            employee.setManager(employeeRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found")));
        }

        // 3. Work Schedule
        if (request.getWorkScheduleId() != null) {
            employee.setWorkSchedule(workScheduleRepository.findById(request.getWorkScheduleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Work Schedule not found")));
        }

        Employee savedEmployee = employeeRepository.save(employee);

        // NOTE: The temporary password 'Welcome123!' was set during convertCandidateToEmployee
        // Send the invite email
        emailService.sendOnboardingInviteEmail(
                savedEmployee.getEmail(),
                savedEmployee.getUserName(),
                "Welcome123!"
        );

        return savedEmployee;
    }

    // In worksphere/service/EmployeeService.java

    // Inside EmployeeService.java
    public EmployeeResponseDTO getEmployeeById(UUID id) {
        Employee employee = employeeRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        return EmployeeResponseDTO.fromEntity(employee);
    }

    @Transactional
    public Employee convertCandidateToEmployee(Candidate candidate, OfferLetter offer) {
        Employee employee = new Employee();

        String[] nameParts = candidate.getFullName().split(" ", 2);
        employee.setFirstName(nameParts[0]);
        employee.setLastName(nameParts.length > 1 ? nameParts[1] : "");
        employee.setUserName(candidate.getEmail());
        employee.setEmail(candidate.getEmail());

        if (candidate.getPhone() != null && !candidate.getPhone().isEmpty()) {
            employee.setPhoneNumber(candidate.getPhone());
        }

        if (offer.getProposedSalary() != null) {
            employee.setSalary(offer.getProposedSalary().doubleValue());
        }

        employee.setPassword(passwordEncoder.encode("Welcome123!"));

        JobOpening job = offer.getJobOpening();
        if (job != null) {
            employee.setDepartment(job.getDepartment());
            employee.setJobPosition(job.getJobPosition());
        }

        roleRepository.findByRoleName("EMPLOYEE").ifPresent(role -> {
            employee.setRoles(Set.of(role));
        });

        employee.setEmployeeStatus(EmployeeStatus.PENDING);
        return employeeRepository.save(employee);
    }

    public Employee updateRoles(UUID employeeId, List<UUID> roleIds) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        List<Role> roles = roleRepository.findAllById(roleIds);
        employee.setRoles(new HashSet<>(roles));

        return employeeRepository.save(employee);
    }
}
