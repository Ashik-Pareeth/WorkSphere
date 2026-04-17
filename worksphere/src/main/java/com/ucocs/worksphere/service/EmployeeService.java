package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.ArchivedEmployeeDTO;
import com.ucocs.worksphere.dto.CreateEmployeeRequest;
import com.ucocs.worksphere.dto.EmployeeResponseDTO;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.Role;
import com.ucocs.worksphere.entity.SalaryStructure;
import com.ucocs.worksphere.enums.AuditAction;
import com.ucocs.worksphere.enums.EmployeeStatus;
import com.ucocs.worksphere.enums.NotificationType;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.*;
import com.ucocs.worksphere.entity.EmployeeActionRecord;
import com.ucocs.worksphere.enums.EmployeeActionType;
import com.ucocs.worksphere.enums.EmployeeActionStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
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
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final EmployeeActionRepository employeeActionRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final OffboardingRecordRepository offboardingRecordRepository;

    public EmployeeService(
            PasswordEncoder passwordEncoder,
            EmployeeRepository employeeRepository,
            DepartmentRepository departmentRepository,
            JobPositionRepository jobPositionRepository,
            RoleRepository roleRepository,
            WorkScheduleRepository workScheduleRepository,
            EmailService emailService,
            AuditService auditService,
            NotificationService notificationService,
            EmployeeActionRepository employeeActionRepository,
            SalaryStructureRepository salaryStructureRepository,
            OffboardingRecordRepository offboardingRecordRepository) {
        this.passwordEncoder = passwordEncoder;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.jobPositionRepository = jobPositionRepository;
        this.roleRepository = roleRepository;
        this.workScheduleRepository = workScheduleRepository;
        this.emailService = emailService;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.employeeActionRepository = employeeActionRepository;
        this.salaryStructureRepository = salaryStructureRepository;
        this.offboardingRecordRepository = offboardingRecordRepository;
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
            employee.setManager(resolveAndEnsureManagerRole(request.managerId()));
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
            employee.setManager(resolveAndEnsureManagerRole(request.managerId()));
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

        Employee saved = employeeRepository.save(employee);

        // Audit the update
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            employeeRepository.findByUserName(auth.getName()).ifPresent(performer ->
                auditService.log("Employee", saved.getId(), AuditAction.UPDATED, performer.getId(),
                        "profile", "profile updated by " + auth.getName()));
        }
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

    private static final List<EmployeeStatus> ARCHIVED_STATUSES = List.of(
            EmployeeStatus.TERMINATED,
            EmployeeStatus.RESIGNED
    );

    @Transactional(readOnly = true)
    public List<EmployeeResponseDTO> getAllEmployees() {
        return employeeRepository.findByEmployeeStatusNotIn(ARCHIVED_STATUSES)
                .stream()
                .map(EmployeeResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponseDTO> getMyTeam(String managerUsername) {
        return employeeRepository.findByManagerUserNameAndEmployeeStatusNotIn(managerUsername, ARCHIVED_STATUSES)
                .stream()
                .map(EmployeeResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ArchivedEmployeeDTO> getArchivedEmployees() {
        return employeeRepository.findByEmployeeStatusIn(ARCHIVED_STATUSES)
                .stream()
                .map(emp -> ArchivedEmployeeDTO.fromEntities(
                        emp,
                        offboardingRecordRepository.findByEmployeeId(emp.getId()).orElse(null)
                ))
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
        Employee saved = employeeRepository.save(employee);
        auditService.log("Employee", saved.getId(), AuditAction.UPDATED, saved.getId(),
                "profilePic", imageName);
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

        Employee saved = employeeRepository.save(employee);

        // Audit role change
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String roleNames = saved.getRoles().stream()
                .map(Role::getRoleName).reduce((a, b) -> a + "," + b).orElse("none");
        if (auth != null) {
            employeeRepository.findByUserName(auth.getName()).ifPresent(performer ->
                auditService.log("Employee", saved.getId(), AuditAction.UPDATED, performer.getId(),
                        "roles", "roles updated to: " + roleNames));
        }
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
            employee.setManager(resolveAndEnsureManagerRole(request.getManagerId()));
        }

        // Work Schedule
        if (request.getWorkScheduleId() != null) {
            employee.setWorkSchedule(workScheduleRepository.findById(request.getWorkScheduleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Work Schedule not found")));
        }

        SalaryStructure employeeSalaryStructure = null;
        if (request.getBaseSalary() != null) {
            employeeSalaryStructure = upsertEmployeeSalaryStructure(employee, request);
            employee.setSalary(employeeSalaryStructure.computeGross().doubleValue());
        } else if (request.getSalary() != null) {
            employee.setSalary(request.getSalary());
        }

        Employee savedEmployee = employeeRepository.save(employee);

        if (employeeSalaryStructure != null) {
            employeeSalaryStructure.setEmployee(savedEmployee);
            employeeSalaryStructure = salaryStructureRepository.save(employeeSalaryStructure);
        }

        emailService.sendOnboardingInviteEmail(savedEmployee, employeeSalaryStructure, "Welcome123!");

        return savedEmployee;
    }

    private SalaryStructure upsertEmployeeSalaryStructure(
            Employee employee,
            com.ucocs.worksphere.dto.hiring.FinalizeHireRequest request) {
        SalaryStructure structure = salaryStructureRepository.findByEmployee(employee)
                .orElseGet(SalaryStructure::new);

        structure.setEmployee(employee);
        structure.setJobPosition(employee.getJobPosition());
        structure.setBaseSalary(request.getBaseSalary());
        structure.setHra(defaultMoney(request.getHra()));
        structure.setDa(defaultMoney(request.getDa()));
        structure.setTravelAllowance(defaultMoney(request.getTravelAllowance()));
        structure.setOtherAllowances(defaultMoney(request.getOtherAllowances()));
        structure.setPfEmployeePercent(
                request.getPfEmployeePercent() != null ? request.getPfEmployeePercent() : 12.0);
        structure.setPfEmployerPercent(
                request.getPfEmployerPercent() != null ? request.getPfEmployerPercent() : 12.0);
        structure.setProfessionalTax(defaultMoney(request.getProfessionalTax()));
        structure.setEffectiveDate(request.getEffectiveDate() != null ? request.getEffectiveDate() : LocalDate.now());
        return structure;
    }

    private BigDecimal defaultMoney(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private Employee resolveAndEnsureManagerRole(UUID managerId) {
        Employee manager = employeeRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        ensureManagerRole(manager);
        return manager;
    }

    private void ensureManagerRole(Employee manager) {
        if (manager.getRoles() == null) {
            manager.setRoles(new HashSet<>());
        }

        boolean alreadyManager = manager.getRoles().stream()
                .anyMatch(role -> "MANAGER".equals(role.getRoleName()) || "ROLE_MANAGER".equals(role.getRoleName()));

        if (alreadyManager) {
            return;
        }

        Role managerRole = roleRepository.findByRoleName("MANAGER")
                .or(() -> roleRepository.findByRoleName("ROLE_MANAGER"))
                .orElseThrow(() -> new ResourceNotFoundException("Manager role not configured"));

        manager.getRoles().add(managerRole);
        employeeRepository.save(manager);
    }

    // =========================================================================
    // STATUS MANAGEMENT
    // =========================================================================

    /**
     * Validates that the requested status transition is legal, persists the new
     * status, writes an audit entry, and sends an in-app notification to the
     * affected employee.
     *
     * @param id          UUID of the employee whose status is being changed
     * @param status      The desired target {@link EmployeeStatus}
     * @param performedBy UUID of the HR/Admin user performing the action
     * @return the saved {@link Employee} entity
     */
    @Transactional
    public Employee updateEmployeeStatus(UUID id, EmployeeStatus status, UUID performedBy) {
        // 1. Fetch employee
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        // 2. Capture old status
        EmployeeStatus oldStatus = employee.getEmployeeStatus();

        // 3. Validate transition
        validateStatusTransition(oldStatus, status);

        // 4. Persist new status
        employee.setEmployeeStatus(status);
        Employee saved = employeeRepository.save(employee);

        // 5. Audit log
        auditService.log(
                "Employee",
                saved.getId(),
                AuditAction.UPDATED,
                performedBy,
                oldStatus.name(),
                status.name());

        // 5.5 Auto-create Action Record for emergency status changes
        if (status == EmployeeStatus.SUSPENDED && oldStatus != EmployeeStatus.SUSPENDED) {
            EmployeeActionRecord record = new EmployeeActionRecord();
            record.setEmployee(saved);
            record.setInitiatedBy(employeeRepository.findById(performedBy).orElseThrow());
            record.setActionType(EmployeeActionType.EMERGENCY_SUSPENSION);
            record.setStatus(EmployeeActionStatus.PENDING);
            record.setReason("Emergency Suspension via Quick Action. A formal reason and date must follow.");
            record.setEffectiveDate(java.time.LocalDate.now());
            employeeActionRepository.save(record);
        } else if (status == EmployeeStatus.ACTIVE && oldStatus == EmployeeStatus.SUSPENDED) {
            EmployeeActionRecord record = new EmployeeActionRecord();
            record.setEmployee(saved);
            record.setInitiatedBy(employeeRepository.findById(performedBy).orElseThrow());
            record.setActionType(EmployeeActionType.REINSTATEMENT);
            record.setStatus(EmployeeActionStatus.COMPLETED);
            record.setReason("Reinstated via Quick Action.");
            record.setEffectiveDate(java.time.LocalDate.now());
            employeeActionRepository.save(record);
        }

        // 6. In-app notification — only for status changes the employee should know about
        // TODO: add NotificationType.EMPLOYEE_STATUS_CHANGED to the enum and replace
        //       EMPLOYEE_ACTION_APPLIED below once the enum value is available.
        switch (status) {
            case ACTIVE -> notificationService.send(
                    saved.getId(),
                    NotificationType.EMPLOYEE_ACTION_APPLIED,
                    "Account Activated",
                    "Your account status has been set to ACTIVE.",
                    saved.getId(),
                    "Employee");
            case SUSPENDED -> notificationService.send(
                    saved.getId(),
                    NotificationType.EMPLOYEE_ACTION_APPLIED,
                    "Account Suspended",
                    "Your account has been suspended. Please contact HR for further information.",
                    saved.getId(),
                    "Employee");
            case TERMINATED -> notificationService.send(
                    saved.getId(),
                    NotificationType.EMPLOYEE_ACTION_APPLIED,
                    "Employment Terminated",
                    "Your employment has been terminated. Please contact HR for further information.",
                    saved.getId(),
                    "Employee");
            default -> { /* no notification for other transitions */ }
        }

        // TODO: revoke active sessions for SUSPENDED/TERMINATED

        // 7. Return saved entity
        return saved;
    }

    /**
     * Validates that transitioning an employee from {@code from} to {@code to}
     * is a legally allowed state change in the system.
     *
     * @throws IllegalStateException if the transition is not permitted
     */
    private void validateStatusTransition(EmployeeStatus from, EmployeeStatus to) {
        Set<EmployeeStatus> validNext = switch (from) {
            case PENDING    -> Set.of(EmployeeStatus.ACTIVE, EmployeeStatus.INACTIVE);
            case ACTIVE     -> Set.of(EmployeeStatus.SUSPENDED, EmployeeStatus.INACTIVE, EmployeeStatus.TERMINATED);
            case PROBATION  -> Set.of(EmployeeStatus.ACTIVE, EmployeeStatus.TERMINATED, EmployeeStatus.INACTIVE);
            case SUSPENDED  -> Set.of(EmployeeStatus.ACTIVE, EmployeeStatus.TERMINATED);
            case INACTIVE   -> Set.of(EmployeeStatus.ACTIVE, EmployeeStatus.TERMINATED);
            case TERMINATED -> Collections.emptySet();
            case RESIGNED   -> Collections.emptySet();
        };
        if (!validNext.contains(to)) {
            throw new IllegalStateException(
                "Invalid status transition: " + from + " → " + to);
        }
    }
}
