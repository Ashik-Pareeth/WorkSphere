package com.ucocs.worksphere.config;

import com.ucocs.worksphere.entity.*;
import com.ucocs.worksphere.enums.EmployeeStatus;
import com.ucocs.worksphere.enums.TaskPriority;
import com.ucocs.worksphere.repository.*;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Set;

@Component
public class DataSeeder implements CommandLineRunner {

    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final JobPositionRepository jobPositionRepository;
    private final WorkScheduleRepository workScheduleRepository;
    private final TaxSlabConfigRepository taxSlabConfigRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final LeavePolicyRepository leavePolicyRepository;
    private final PublicHolidayRepository publicHolidayRepository;
    private final TaskRepository taskRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(EmployeeRepository employeeRepository,
                      RoleRepository roleRepository,
                      DepartmentRepository departmentRepository,
                      JobPositionRepository jobPositionRepository,
                      WorkScheduleRepository workScheduleRepository,
                      TaxSlabConfigRepository taxSlabConfigRepository,
                      SalaryStructureRepository salaryStructureRepository,
                      LeavePolicyRepository leavePolicyRepository,
                      PublicHolidayRepository publicHolidayRepository,
                      TaskRepository taskRepository,
                      PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.roleRepository = roleRepository;
        this.departmentRepository = departmentRepository;
        this.jobPositionRepository = jobPositionRepository;
        this.workScheduleRepository = workScheduleRepository;
        this.taxSlabConfigRepository = taxSlabConfigRepository;
        this.salaryStructureRepository = salaryStructureRepository;
        this.leavePolicyRepository = leavePolicyRepository;
        this.publicHolidayRepository = publicHolidayRepository;
        this.taskRepository = taskRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String @NonNull... args) throws Exception {
        if (employeeRepository.count() == 0) {

            // 1. Seed Work Schedule (Required for Attendance Clock-In)
            WorkSchedule standardShift = new WorkSchedule();
            standardShift.setScheduleName("Standard 9-to-5");
            standardShift.setTimezone("Asia/Kolkata");
            standardShift.setExpectedStart(LocalTime.of(9, 0));
            standardShift.setExpectedEnd(LocalTime.of(17, 0));
            standardShift.setGracePeriodMin(15);
            standardShift.setBreakDurationMin(60);
            standardShift.setWorkingDays(31); // 31 in binary = Mon-Fri
            standardShift.setCreatedBy("SYSTEM");
            standardShift = workScheduleRepository.save(standardShift);

            // 2. Seed Departments
            Department engDept = new Department();
            engDept.setName("Engineering");
            engDept.setCreatedBy("SYSTEM");
            engDept = departmentRepository.save(engDept);

            Department hrDept = new Department();
            hrDept.setName("Human Resources");
            hrDept.setCreatedBy("SYSTEM");
            hrDept = departmentRepository.save(hrDept);

            // 3. Seed Job Positions
            JobPosition managerPos = new JobPosition();
            managerPos.setPositionName("Engineering Manager");
            managerPos.setCreatedBy("SYSTEM");
            managerPos = jobPositionRepository.save(managerPos);

            JobPosition devPos = new JobPosition();
            devPos.setPositionName("Software Engineer");
            devPos.setCreatedBy("SYSTEM");
            devPos = jobPositionRepository.save(devPos);

            JobPosition hrPos = new JobPosition();
            hrPos.setPositionName("HR Specialist");
            hrPos.setCreatedBy("SYSTEM");
            hrPos = jobPositionRepository.save(hrPos);

            // 4. Seed Roles
            Role superAdminRole = createRoleIfNotFound("SUPER_ADMIN", true);
            Role hrRole = createRoleIfNotFound("HR", false);
            Role managerRole = createRoleIfNotFound("MANAGER", false);
            Role employeeRole = createRoleIfNotFound("EMPLOYEE", false);
            Role auditorRole = createRoleIfNotFound("AUDITOR", false);

            // 5. Seed Employees

            // System Admin (No Dept)
            createEmployee("Super", "Admin", "admin", "admin@worksphere.com", "admin123",
                    null, null, superAdminRole, standardShift);

            // Auditor (No Dept)
            createEmployee("Audit", "User", "auditor", "auditor@worksphere.com", "password",
                    null, null, auditorRole, standardShift);

            // HR Admin
            createEmployee("Sarah", "Smith", "hr_admin", "hr@worksphere.com", "password",
                    hrDept, hrPos, hrRole, standardShift);

            // Engineering Manager
            Employee managerEmp = createEmployee("Mike", "Johnson", "manager", "manager@worksphere.com", "password",
                    engDept, managerPos, managerRole, standardShift);

            // Normal Employee 1
            Employee ashikEmp = createEmployee("Ashik", "Dev", "ashik", "ashik@worksphere.com", "password",
                    engDept, devPos, employeeRole, standardShift);

            // Normal Employee 2
            Employee johnEmp = createEmployee("John", "Doe", "johndoe", "john@worksphere.com", "password",
                    engDept, devPos, employeeRole, standardShift);

            // Link employees to their managers
            ashikEmp.setManager(managerEmp);
            johnEmp.setManager(managerEmp);
            employeeRepository.save(ashikEmp);
            employeeRepository.save(johnEmp);

            seedTasks(managerEmp, ashikEmp, johnEmp);

            // 6. Seed Tax Slabs (India New Regime FY 2025-26)
            seedTaxSlabs();

            // 7. Seed sample Salary Structures
            seedSalaryStructures(managerPos, devPos);

            // 8. Seed Leave Policies
            seedLeavePolicies();

            // 9. Seed Public Holidays
            seedPublicHolidays();

            System.out.println("---------------------------------------------");
            System.out.println("DATA SEEDER: Mock Environment Generated");
            System.out.println("---------------------------------------------");
            System.out.println("Accounts created with password 'password' (except admin123):");
            System.out.println("- admin");
            System.out.println("- hr_admin");
            System.out.println("- manager");
            System.out.println("- ashik");
            System.out.println("- johndoe");
            System.out.println("Tax slabs, Salary structures, Leave Policies, and Holidays seeded.");
            System.out.println("---------------------------------------------");
        }
    }

    private void seedTasks(Employee manager, Employee ashik, Employee john) {
        if (taskRepository.count() > 0) return;

        // Ashik's tasks — spread across all statuses to populate every Kanban column
        Task t1 = new Task("TASK-001", "Set up CI/CD pipeline",
                "Configure GitHub Actions for automated build and test on every PR.",
                manager, ashik,
                LocalDateTime.now().plusDays(7),
                TaskPriority.HIGH);

        Task t2 = new Task("TASK-002", "Refactor authentication module",
                "Extract JWT logic into a dedicated service class.",
                manager, ashik,
                LocalDateTime.now().plusDays(3),
                TaskPriority.HIGH);
        t2.startProgress();

        Task t3 = new Task("TASK-003", "Write unit tests for LeaveService",
                "Achieve 80% coverage on LeaveRequestService methods.",
                manager, ashik,
                LocalDateTime.now().plusDays(5),
                TaskPriority.MEDIUM);
        t3.startProgress();
        t3.submitForReview();

        Task t4 = new Task("TASK-004", "Update API documentation",
                "Document all new endpoints added in the current sprint.",
                manager, ashik,
                LocalDateTime.now().minusDays(2),
                TaskPriority.LOW);
        t4.startProgress();
        t4.submitForReview();
        t4.markAsCompleted();

        // John's tasks
        Task t5 = new Task("TASK-005", "Fix pagination bug on EmployeeList",
                "The table does not reset to page 1 after applying a filter.",
                manager, john,
                LocalDateTime.now().plusDays(2),
                TaskPriority.HIGH);

        Task t6 = new Task("TASK-006", "Implement payslip download endpoint",
                "Return PDF blob from GET /api/payroll/{id}/payslip.",
                manager, john,
                LocalDateTime.now().plusDays(6),
                TaskPriority.MEDIUM);
        t6.startProgress();

        Task t7 = new Task("TASK-007", "Add department filter to roster board",
                "Allow managers to filter the daily roster by department.",
                manager, john,
                LocalDateTime.now().plusDays(4),
                TaskPriority.MEDIUM);
        t7.startProgress();
        t7.submitForReview();

        Task t8 = new Task("TASK-008", "Database index optimisation",
                "Add composite indexes on attendance and task tables for query performance.",
                manager, john,
                LocalDateTime.now().minusDays(5),
                TaskPriority.LOW);
        t8.startProgress();
        t8.submitForReview();
        t8.markAsCompleted();

        taskRepository.saveAll(java.util.List.of(t1, t2, t3, t4, t5, t6, t7, t8));

        System.out.println("Tasks seeded: 8 tasks across all Kanban statuses and priorities.");
    }

    // Helper method to keep code clean
    private Role createRoleIfNotFound(String name, boolean isExclusive) {
        return roleRepository.findByRoleName(name).orElseGet(() -> {
            Role role = new Role();
            role.setRoleName(name);
            role.setExclusive(isExclusive);
            role.setCreatedBy("SYSTEM");
            return roleRepository.save(role);
        });
    }

    // Helper method to easily spin up users
    private Employee createEmployee(String fName, String lName, String uName, String email, String pass,
                                    Department dept, JobPosition pos, Role role, WorkSchedule schedule) {
        Employee emp = new Employee();
        emp.setFirstName(fName);
        emp.setLastName(lName);
        emp.setUserName(uName);
        emp.setEmail(email);

        // Generating a fake, unique phone number to satisfy the DB constraint
        emp.setPhoneNumber("555" + String.format("%07d", Math.abs(uName.hashCode() % 10000000)));

        emp.setSalary(60000.0);
        emp.setPassword(passwordEncoder.encode(pass));
        emp.setEmployeeStatus(EmployeeStatus.ACTIVE);
        emp.setDepartment(dept);
        emp.setJobPosition(pos);
        emp.setRoles(Set.of(role));

        // Linking the schedule for attendance tracking
        emp.setWorkSchedule(schedule);
        emp.setCreatedBy("SYSTEM");

        return employeeRepository.save(emp);
    }

    private void seedTaxSlabs() {
        if (taxSlabConfigRepository.count() > 0)
            return;
        String fy = "2025-26";

        createSlab(BigDecimal.ZERO, new BigDecimal("300000"), BigDecimal.ZERO, fy, "0% - Exempt");
        createSlab(new BigDecimal("300000"), new BigDecimal("700000"), new BigDecimal("5"), fy, "5% slab");
        createSlab(new BigDecimal("700000"), new BigDecimal("1000000"), new BigDecimal("10"), fy, "10% slab");
        createSlab(new BigDecimal("1000000"), new BigDecimal("1200000"), new BigDecimal("15"), fy, "15% slab");
        createSlab(new BigDecimal("1200000"), new BigDecimal("1500000"), new BigDecimal("20"), fy, "20% slab");
        createSlab(new BigDecimal("1500000"), null, new BigDecimal("30"), fy, "30% slab + 4% cess");
    }

    private void createSlab(BigDecimal min, BigDecimal max, BigDecimal rate, String fy, String desc) {
        TaxSlabConfig slab = new TaxSlabConfig();
        slab.setMinIncome(min);
        slab.setMaxIncome(max);
        slab.setTaxRate(rate);
        slab.setFinancialYear(fy);
        slab.setDescription(desc);
        slab.setCreatedBy("SYSTEM");
        taxSlabConfigRepository.save(slab);
    }

    private void seedSalaryStructures(JobPosition managerPos, JobPosition devPos) {
        // Manager position default
        SalaryStructure mgrStructure = new SalaryStructure();
        mgrStructure.setBaseSalary(new BigDecimal("80000"));
        mgrStructure.setHra(new BigDecimal("32000"));
        mgrStructure.setDa(new BigDecimal("8000"));
        mgrStructure.setTravelAllowance(new BigDecimal("5000"));
        mgrStructure.setOtherAllowances(new BigDecimal("5000"));
        mgrStructure.setPfEmployeePercent(12.0);
        mgrStructure.setPfEmployerPercent(12.0);
        mgrStructure.setProfessionalTax(new BigDecimal("200"));
        mgrStructure.setEffectiveDate(LocalDate.of(2025, 4, 1));
        mgrStructure.setJobPosition(managerPos);
        mgrStructure.setCreatedBy("SYSTEM");
        salaryStructureRepository.save(mgrStructure);

        // Developer position default
        SalaryStructure devStructure = new SalaryStructure();
        devStructure.setBaseSalary(new BigDecimal("50000"));
        devStructure.setHra(new BigDecimal("20000"));
        devStructure.setDa(new BigDecimal("5000"));
        devStructure.setTravelAllowance(new BigDecimal("3000"));
        devStructure.setOtherAllowances(new BigDecimal("2000"));
        devStructure.setPfEmployeePercent(12.0);
        devStructure.setPfEmployerPercent(12.0);
        devStructure.setProfessionalTax(new BigDecimal("200"));
        devStructure.setEffectiveDate(LocalDate.of(2025, 4, 1));
        devStructure.setJobPosition(devPos);
        devStructure.setCreatedBy("SYSTEM");
        salaryStructureRepository.save(devStructure);
    }

    private void seedLeavePolicies() {
        if (leavePolicyRepository.count() > 0) return;

        createLeavePolicy("Annual PTO 2026", 15.0, true, 5.0, false);
        createLeavePolicy("Sick Leave 2026", 10.0, false, 0.0, false);
        createLeavePolicy("Maternity Leave", 180.0, false, 0.0, false);
        createLeavePolicy("Unpaid Leave", 0.0, false, 0.0, true);
    }

    private void createLeavePolicy(String name, Double allowance, Boolean carryForward, Double maxCarry, Boolean unpaid) {
        LeavePolicy policy = new LeavePolicy();
        policy.setName(name);
        policy.setDefaultAnnualAllowance(allowance);
        policy.setAllowsCarryForward(carryForward);
        policy.setMaxCarryForwardDays(maxCarry);
        policy.setIsUnpaid(unpaid);
        policy.setCreatedBy("SYSTEM");
        leavePolicyRepository.save(policy);
    }

    private void seedPublicHolidays() {
        if (publicHolidayRepository.count() > 0) return;

        createHoliday(LocalDate.of(2026, 1, 1), "New Year's Day", "Global");
        createHoliday(LocalDate.of(2026, 1, 26), "Republic Day", "India");
        createHoliday(LocalDate.of(2026, 5, 1), "May Day", "Global");
        createHoliday(LocalDate.of(2026, 8, 15), "Independence Day", "India");
        createHoliday(LocalDate.of(2026, 8, 27), "Onam", "Kerala");
        createHoliday(LocalDate.of(2026, 10, 2), "Gandhi Jayanti", "India");
        createHoliday(LocalDate.of(2026, 12, 25), "Christmas Day", "Global");
    }

    private void createHoliday(LocalDate date, String name, String region) {
        PublicHoliday holiday = new PublicHoliday();
        holiday.setDate(date);
        holiday.setName(name);
        holiday.setApplicableRegion(region);
        holiday.setCreatedBy("SYSTEM");
        publicHolidayRepository.save(holiday);
    }
}