package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.CreateEmployeeRequest;
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
import java.util.Random;
import java.util.Set;
import java.util.UUID;

import com.ucocs.worksphere.entity.Candidate;
import com.ucocs.worksphere.entity.OfferLetter;
import com.ucocs.worksphere.entity.JobOpening;

@Service
public class EmployeeService {

    // -------------------------------------------------------------------------
    // Username generation word banks
    // -------------------------------------------------------------------------
    private static final List<String> ADJECTIVES = List.of(
            "swift", "bright", "calm", "bold", "cool", "sharp", "keen", "wise",
            "brave", "clever", "nimble", "steady", "quick", "smart", "fair",
            "crisp", "alert", "eager", "exact", "grand"
    );

    private static final List<String> NOUNS = List.of(
            "eagle", "falcon", "hawk", "wolf", "tiger", "lynx", "bear", "fox",
            "raven", "cobra", "shark", "panda", "lion", "crane", "otter",
            "bison", "heron", "viper", "moose", "finch"
    );

    private final Random random = new Random();

    // -------------------------------------------------------------------------
    // Dependencies
    // -------------------------------------------------------------------------
    private final PasswordEncoder passwordEncoder;
    private final EmployeeRepository employeeRepository;
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

    // =========================================================================
    // USERNAME GENERATION
    // =========================================================================

    /**
     * Generates a unique username using the following priority:
     *  1. firstname.lastname          → e.g. john.doe
     *  2. firstname.lastname + N      → e.g. john.doe2 … john.doe99
     *  3. adjective.noun              → e.g. swift.eagle
     *  4. adjective.noun + NNN        → e.g. swift.eagle347  (guaranteed unique)
     */
    private String generateUsername(String firstName, String lastName) {
        //  lowercase, remove anything that isn't a letter, digit, or dot
        String safeLast  = lastName  == null || lastName.isBlank()  ? "user" : lastName;
        String base = (firstName + "." + safeLast)
                .toLowerCase()
                .replaceAll("[^a-z0-9.]", "");

        // Strategy 1: plain firstname.lastname
        if (!employeeRepository.existsByUserName(base)) {
            return base;
        }

        // Strategy 2: firstname.lastname + incrementing number
        for (int i = 2; i <= 99; i++) {
            String candidate = base + i;
            if (!employeeRepository.existsByUserName(candidate)) {
                return candidate;
            }
        }

        // Strategy 3: adjective.noun (creative fallback)
        String adj   = ADJECTIVES.get(random.nextInt(ADJECTIVES.size()));
        String noun  = NOUNS.get(random.nextInt(NOUNS.size()));
        String creative = adj + "." + noun;

        if (!employeeRepository.existsByUserName(creative)) {
            return creative;
        }

        // Strategy 4: adjective.noun + random 3-digit number (guaranteed unique)
        String finalCandidate;
        do {
            finalCandidate = creative + (random.nextInt(900) + 100); // 100–999
        } while (employeeRepository.existsByUserName(finalCandidate));

        return finalCandidate;
    }

    // =========================================================================
    // ROLE VALIDATION
    // =========================================================================

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

    // =========================================================================
    // CRUD OPERATIONS
    // =========================================================================

    /**
     * Manually create an employee (HR form).
     * If HR provides a username it is used (after uniqueness check).
     * If not, a username is auto-generated from first + last name.
     */
    public void saveEmployee(CreateEmployeeRequest request) {
        Employee employee = new Employee();

        // 1. Basic fields
        employee.setFirstName(request.firstName());
        employee.setLastName(request.lastName());
        employee.setEmail(request.email());
        employee.setSalary(request.salary());

        // 2. Username — HR-supplied or auto-generated
        String username = (request.username() != null && !request.username().isBlank())
                ? request.username()
                : generateUsername(request.firstName(), request.lastName());

        // CORRECT — check uniqueness only when HR supplied the username manually
        if (username.equals(request.username()) // HR provided it, not auto-generated
                && employeeRepository.existsByUserName(username)) {
            throw new IllegalArgumentException("Username '" + username + "' is already taken.");

        }
        employee.setUserName(username);

        // 3. Password & default status
        employee.setPassword(passwordEncoder.encode(request.password()));
        employee.setEmployeeStatus(EmployeeStatus.PENDING);

        // 4. Department
        if (request.Id() != null) {
            employee.setDepartment(departmentRepository.findById(request.Id())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found")));
        }

        // 5. Job Position
        if (request.jobPositionId() != null) {
            employee.setJobPosition(jobPositionRepository.findById(request.jobPositionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Job Position not found")));
        }

        // 6. Roles
        if (request.roles() != null && !request.roles().isEmpty()) {
            employee.setRoles(validateAndFetchRoles(new HashSet<>(request.roles())));
        }

        // 7. Manager
        if (request.managerId() != null) {
            employee.setManager(employeeRepository.findById(request.managerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found")));
        }

        // 8. Work Schedule
        if (request.workScheduleId() != null) {
            employee.setWorkSchedule(workScheduleRepository.findById(request.workScheduleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Work Schedule not found")));
        }

        employeeRepository.save(employee);
    }

    public void updateEmployee(UUID id, CreateEmployeeRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        // 1. Basic fields
        employee.setFirstName(request.firstName());
        employee.setLastName(request.lastName());
        employee.setEmail(request.email());
        employee.setSalary(request.salary());

        // 2. Username — only update if HR explicitly provides one
        if (request.username() != null && !request.username().isBlank()) {
            // Allow keeping the same username; only reject if taken by ANOTHER employee
            boolean takenByOther = employeeRepository.existsByUserNameAndIdNot(request.username(), id);
            if (takenByOther) {
                throw new IllegalArgumentException("Username '" + request.username() + "' is already taken.");
            }
            employee.setUserName(request.username());
        }

        // 3. Password — only update if provided
        if (request.password() != null && !request.password().isEmpty()) {
            employee.setPassword(passwordEncoder.encode(request.password()));
        }

        // 4. Department
        if (request.Id() != null) {
            employee.setDepartment(departmentRepository.findById(request.Id())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found")));
        }

        // 5. Job Position
        if (request.jobPositionId() != null) {
            employee.setJobPosition(jobPositionRepository.findById(request.jobPositionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Job Position not found")));
        }

        // 6. Roles
        if (request.roles() != null && !request.roles().isEmpty()) {
            employee.setRoles(validateAndFetchRoles(new HashSet<>(request.roles())));
        }

        // 7. Manager
        if (request.managerId() != null) {
            employee.setManager(employeeRepository.findById(request.managerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found")));
        } else {
            employee.setManager(null);
        }

        // 8. Work Schedule
        if (request.workScheduleId() != null) {
            employee.setWorkSchedule(workScheduleRepository.findById(request.workScheduleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Work Schedule not found")));
        } else {
            employee.setWorkSchedule(null);
        }

        employeeRepository.save(employee);
    }

    public void deleteEmployee(UUID id) {
        if (!employeeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Employee not found with id: " + id);
        }
        employeeRepository.deleteById(id);
    }

    // =========================================================================
    // READ OPERATIONS
    // =========================================================================

    @Transactional(readOnly = true)
    public List<EmployeeResponseDTO> getAllEmployees() {
        return employeeRepository.findAll()
                .stream()
                .map(EmployeeResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponseDTO> getMyTeam(String managerUsername) {
        return employeeRepository.findByManagerUserName(managerUsername)
                .stream()
                .map(EmployeeResponseDTO::fromEntity)
                .toList();
    }

    public EmployeeResponseDTO getEmployeeById(UUID id) {
        Employee employee = employeeRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        return EmployeeResponseDTO.fromEntity(employee);
    }

    @Transactional(readOnly = true)
    public EmployeeResponseDTO getCurrentEmployee(String userName) {
        Employee employee = employeeRepository.findByUserName(userName)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Employee not found with username: " + userName));
        return EmployeeResponseDTO.fromEntity(employee);
    }

    // =========================================================================
    // ACTIVATION & PROFILE
    // =========================================================================

    public void activateEmployee(String userName, String newPassword, String phoneNumber) {
        Employee employee = employeeRepository.findByUserName(userName)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Employee not found with name " + userName));
        employee.setPassword(passwordEncoder.encode(newPassword));
        employee.setPhoneNumber(phoneNumber);
        employee.setJoiningDate(LocalDateTime.now());
        employee.setEmployeeStatus(EmployeeStatus.ACTIVE);
        employeeRepository.save(employee);
    }

    public void uploadProfilePic(String userName, MultipartFile image) {
        Employee employee = employeeRepository.findByUserName(userName)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User Not Found with name " + userName));

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

        employee.setProfilePic(imageName);
        employeeRepository.save(employee);
    }

    // =========================================================================
    // BONUS
    // =========================================================================

    public double calculateBonus(double salary) {
        return salary > 50000 ? salary * 0.10 : salary * 0.05;
    }

    // =========================================================================
    // ROLE MANAGEMENT
    // =========================================================================

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

    // =========================================================================
    // HIRING PIPELINE
    // =========================================================================

    /**
     * Stage 1 — Called when a candidate accepts an offer letter.
     * Creates a PENDING employee with an auto-generated username.
     */
    @Transactional
    public Employee convertCandidateToEmployee(Candidate candidate, OfferLetter offer) {
        Employee employee = new Employee();

        // Name
        String[] nameParts = candidate.getFullName().split(" ", 2);
        String firstName = nameParts[0];
        String lastName  = nameParts.length > 1 ? nameParts[1] : "";
        employee.setFirstName(firstName);
        employee.setLastName(lastName);

        // Auto-generate username from candidate's real name
        employee.setUserName(generateUsername(firstName, lastName));

        // Email (stays as email — separate from username now)
        employee.setEmail(candidate.getEmail());

        // Phone
        if (candidate.getPhone() != null && !candidate.getPhone().isEmpty()) {
            employee.setPhoneNumber(candidate.getPhone());
        }

        // Salary from offer
        if (offer.getProposedSalary() != null) {
            employee.setSalary(offer.getProposedSalary().doubleValue());
        }

        // Default password (employee will change on first login)
        employee.setPassword(passwordEncoder.encode("Welcome123!"));

        // Department & Job Position from job opening
        JobOpening job = offer.getJobOpening();
        if (job != null) {
            employee.setDepartment(job.getDepartment());
            employee.setJobPosition(job.getJobPosition());
        }

        // Default role
        roleRepository.findByRoleName("EMPLOYEE").ifPresent(role ->
                employee.setRoles(Set.of(role)));

        employee.setEmployeeStatus(EmployeeStatus.PENDING);
        return employeeRepository.save(employee);
    }

    /**
     * Stage 2 — Called by HR to verify details and trigger the onboarding email.
     * HR may optionally override the auto-generated username here.
     */
    @Transactional
    public Employee finalizeHire(com.ucocs.worksphere.dto.hiring.FinalizeHireRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (employee.getEmployeeStatus() != EmployeeStatus.PENDING) {
            throw new IllegalStateException("Employee is not in PENDING state.");
        }

        // --- Optional: HR manually sets or overrides the username ---
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            boolean takenByOther = employeeRepository
                    .existsByUserNameAndIdNot(request.getUsername(), employee.getId());
            if (takenByOther) {
                throw new IllegalArgumentException(
                        "Username '" + request.getUsername() + "' is already taken.");
            }
            employee.setUserName(request.getUsername());
        }
        // If HR leaves username blank → keep the auto-generated one from Stage 1

        // Salary override
        if (request.getSalary() != null) {
            employee.setSalary(request.getSalary());
        }

        // Department override
        if (request.getDepartmentId() != null) {
            employee.setDepartment(departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found")));
        }

        // Job Position override
        if (request.getJobPositionId() != null) {
            employee.setJobPosition(jobPositionRepository.findById(request.getJobPositionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Job Position not found")));
        }

        // Roles
        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            employee.setRoles(validateAndFetchRoles(request.getRoleIds()));
        }

        // Manager
        if (request.getManagerId() != null) {
            employee.setManager(employeeRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found")));
        }

        // Work Schedule
        if (request.getWorkScheduleId() != null) {
            employee.setWorkSchedule(workScheduleRepository.findById(request.getWorkScheduleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Work Schedule not found")));
        }

        Employee savedEmployee = employeeRepository.save(employee);

        // Send onboarding email with the final (possibly HR-overridden) username
        emailService.sendOnboardingInviteEmail(
                savedEmployee.getEmail(),
                savedEmployee.getUserName(),
                "Welcome123!"
        );

        return savedEmployee;
    }

    public void updateEmployeeStatus(UUID id, EmployeeStatus status) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        employee.setEmployeeStatus(status);
        employeeRepository.save(employee);
    }
}