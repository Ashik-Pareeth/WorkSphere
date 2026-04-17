package com.ucocs.worksphere.config;

import com.ucocs.worksphere.entity.*;
import com.ucocs.worksphere.enums.*;
import com.ucocs.worksphere.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

/**
 * WorkSphere Data Seeder
 *
 * Seeds the entire system with relational consistency across all 30+ entities.
 * Execution order respects foreign key dependencies.
 *
 * Default credentials (password = "password", admin uses "admin123"):
 *   admin / hr_admin / auditor / manager / ashik / johndoe / priya_nair / ravi_qa
 */
@Component
public class DataSeeder implements CommandLineRunner {

    // ─── Repositories ────────────────────────────────────────────────────────
    private final EmployeeRepository            employeeRepository;
    private final RoleRepository                roleRepository;
    private final DepartmentRepository          departmentRepository;
    private final JobPositionRepository         jobPositionRepository;
    private final WorkScheduleRepository        workScheduleRepository;
    private final TaxSlabConfigRepository       taxSlabConfigRepository;
    private final SalaryStructureRepository     salaryStructureRepository;
    private final LeavePolicyRepository         leavePolicyRepository;
    private final LeaveBalanceRepository        leaveBalanceRepository;
    private final LeaveRequestRepository        leaveRequestRepository;
    private final LeaveTransactionRepository    leaveTransactionRepository;
    private final PublicHolidayRepository       publicHolidayRepository;
    private final AttendanceRepository          attendanceRepository;
    private final ProjectRepository             projectRepository;
    private final TaskRepository                taskRepository;
    private final TaskCommentRepository         taskCommentRepository;
    private final CompanyAssetRepository        companyAssetRepository;
    private final GrievanceTicketRepository     grievanceTicketRepository;
    private final TicketCommentRepository       ticketCommentRepository;
    private final NotificationRepository        notificationRepository;
    private final PerformanceAppraisalRepository performanceAppraisalRepository;
    private final PayrollRecordRepository       payrollRecordRepository;
    private final JobOpeningRepository          jobOpeningRepository;
    private final CandidateRepository           candidateRepository;
    private final InterviewScheduleRepository   interviewScheduleRepository;
    private final OfferLetterRepository         offerLetterRepository;
    private final PasswordEncoder               passwordEncoder;

    // ─── Constructor ─────────────────────────────────────────────────────────
    public DataSeeder(
            EmployeeRepository employeeRepository,
            RoleRepository roleRepository,
            DepartmentRepository departmentRepository,
            JobPositionRepository jobPositionRepository,
            WorkScheduleRepository workScheduleRepository,
            TaxSlabConfigRepository taxSlabConfigRepository,
            SalaryStructureRepository salaryStructureRepository,
            LeavePolicyRepository leavePolicyRepository,
            LeaveBalanceRepository leaveBalanceRepository,
            LeaveRequestRepository leaveRequestRepository,
            LeaveTransactionRepository leaveTransactionRepository,
            PublicHolidayRepository publicHolidayRepository,
            AttendanceRepository attendanceRepository,
            ProjectRepository projectRepository,
            TaskRepository taskRepository,
            TaskCommentRepository taskCommentRepository,
            CompanyAssetRepository companyAssetRepository,
            GrievanceTicketRepository grievanceTicketRepository,
            TicketCommentRepository ticketCommentRepository,
            NotificationRepository notificationRepository,
            PerformanceAppraisalRepository performanceAppraisalRepository,
            PayrollRecordRepository payrollRecordRepository,
            JobOpeningRepository jobOpeningRepository,
            CandidateRepository candidateRepository,
            InterviewScheduleRepository interviewScheduleRepository,
            OfferLetterRepository offerLetterRepository,
            PasswordEncoder passwordEncoder) {

        this.employeeRepository            = employeeRepository;
        this.roleRepository                = roleRepository;
        this.departmentRepository          = departmentRepository;
        this.jobPositionRepository         = jobPositionRepository;
        this.workScheduleRepository        = workScheduleRepository;
        this.taxSlabConfigRepository       = taxSlabConfigRepository;
        this.salaryStructureRepository     = salaryStructureRepository;
        this.leavePolicyRepository         = leavePolicyRepository;
        this.leaveBalanceRepository        = leaveBalanceRepository;
        this.leaveRequestRepository        = leaveRequestRepository;
        this.leaveTransactionRepository    = leaveTransactionRepository;
        this.publicHolidayRepository       = publicHolidayRepository;
        this.attendanceRepository          = attendanceRepository;
        this.projectRepository             = projectRepository;
        this.taskRepository                = taskRepository;
        this.taskCommentRepository         = taskCommentRepository;
        this.companyAssetRepository        = companyAssetRepository;
        this.grievanceTicketRepository     = grievanceTicketRepository;
        this.ticketCommentRepository       = ticketCommentRepository;
        this.notificationRepository        = notificationRepository;
        this.performanceAppraisalRepository = performanceAppraisalRepository;
        this.payrollRecordRepository       = payrollRecordRepository;
        this.jobOpeningRepository          = jobOpeningRepository;
        this.candidateRepository           = candidateRepository;
        this.interviewScheduleRepository   = interviewScheduleRepository;
        this.offerLetterRepository         = offerLetterRepository;
        this.passwordEncoder               = passwordEncoder;
    }

    // =========================================================================
    // MAIN ENTRY POINT
    // =========================================================================
    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (employeeRepository.count() > 0) {
            System.out.println("[DataSeeder] Database already seeded — skipping.");
            return;
        }

        // ── PHASE 1: Leaf / standalone entities (no FK dependencies) ─────────
        WorkSchedule standardShift  = seedStandardWorkSchedule();
        WorkSchedule remoteShift    = seedRemoteWorkSchedule();
        seedTaxSlabs();
        seedPublicHolidays();

        // ── PHASE 2: Roles ────────────────────────────────────────────────────
        Role superAdminRole = createRole("SUPER_ADMIN", true);
        Role hrRole         = createRole("HR",          false);
        Role managerRole    = createRole("MANAGER",     false);
        Role employeeRole   = createRole("EMPLOYEE",    false);
        Role auditorRole    = createRole("AUDITOR",     false);

        // ── PHASE 3: Job Positions ────────────────────────────────────────────
        JobPosition ctoPos       = createJobPosition("CTO",                  120000, 200000, "Leadership, Architecture, Strategy",     3);
        JobPosition managerPos   = createJobPosition("Engineering Manager",    80000, 120000, "Team Management, Architecture, Delivery", 5);
        JobPosition seniorDevPos = createJobPosition("Senior Software Engineer",60000,  95000, "Java, Spring Boot, React, PostgreSQL",    10);
        JobPosition devPos       = createJobPosition("Software Engineer",      45000,  75000, "Java, Spring Boot, React",               15);
        JobPosition hrPos        = createJobPosition("HR Specialist",          50000,  80000, "Recruitment, Payroll, Policy",            5);
        JobPosition auditorPos   = createJobPosition("Internal Auditor",       50000,  80000, "Audit, Compliance, Risk Management",      3);
        JobPosition qaPos        = createJobPosition("QA Engineer",            45000,  70000, "Selenium, JIRA, Test Automation",         8);

        // ── PHASE 4: Leave Policies ───────────────────────────────────────────
        LeavePolicy ptoPolicy       = createLeavePolicy("Annual PTO 2026",   15.0, true,  5.0,   false);
        LeavePolicy sickPolicy      = createLeavePolicy("Sick Leave 2026",   10.0, false, 0.0,   false);
        LeavePolicy maternityPolicy = createLeavePolicy("Maternity Leave",  180.0, false, 0.0,   false);
        LeavePolicy unpaidPolicy    = createLeavePolicy("Unpaid Leave",        0.0, false, 0.0,   true);

        // ── PHASE 5: Departments (without heads — circular dependency) ────────
        Department engDept = createDepartment("Engineering",      "Software engineering, architecture, and product delivery", 20);
        Department hrDept  = createDepartment("Human Resources",  "Recruitment, payroll, compliance, and employee relations", 8);
        Department qaDept  = createDepartment("Quality Assurance","Testing, automation, and compliance management",           10);

        // ── PHASE 6: Employees ────────────────────────────────────────────────
        // System / Cross-department accounts
        Employee adminEmp = createEmployee(
                "Super", "Admin", "admin", "admin@worksphere.com", "admin123",
                100000.0, null, null, superAdminRole, standardShift, null,
                LocalDateTime.of(2023, 1, 1, 9, 0));

        Employee auditorEmp = createEmployee(
                "Alex", "Audit", "auditor", "auditor@worksphere.com", "password",
                65000.0, null, auditorPos, auditorRole, standardShift, null,
                LocalDateTime.of(2023, 6, 1, 9, 0));

        // HR Department
        Employee hrEmp = createEmployee(
                "Sarah", "Smith", "hr_admin", "hr@worksphere.com", "password",
                75000.0, hrDept, hrPos, hrRole, standardShift, null,
                LocalDateTime.of(2023, 3, 15, 9, 0));

        // Engineering Department — Manager
        Employee managerEmp = createEmployee(
                "Mike", "Johnson", "manager", "manager@worksphere.com", "password",
                95000.0, engDept, managerPos, managerRole, standardShift, null,
                LocalDateTime.of(2022, 11, 1, 9, 0));

        // Engineering Department — Engineers (reporting to manager)
        Employee ashikEmp = createEmployee(
                "Ashik", "Dev", "ashik", "ashik@worksphere.com", "password",
                65000.0, engDept, devPos, employeeRole, standardShift, managerEmp,
                LocalDateTime.of(2024, 2, 1, 9, 0));

        Employee johnEmp = createEmployee(
                "John", "Doe", "johndoe", "john@worksphere.com", "password",
                62000.0, engDept, devPos, employeeRole, remoteShift, managerEmp,
                LocalDateTime.of(2024, 4, 10, 9, 0));

        Employee priyaEmp = createEmployee(
                "Priya", "Nair", "priya_nair", "priya@worksphere.com", "password",
                68000.0, engDept, seniorDevPos, employeeRole, standardShift, managerEmp,
                LocalDateTime.of(2023, 9, 1, 9, 0));

        // QA Department
        Employee qaEmp = createEmployee(
                "Ravi", "Kumar", "ravi_qa", "ravi@worksphere.com", "password",
                58000.0, qaDept, qaPos, employeeRole, standardShift, managerEmp,
                LocalDateTime.of(2024, 6, 15, 9, 0));

        // ── Set Department Heads (now that employees exist) ───────────────────
        engDept.setDepartmentHead(managerEmp);
        hrDept.setDepartmentHead(hrEmp);
        departmentRepository.save(engDept);
        departmentRepository.save(hrDept);

        // ── PHASE 7: Salary Structures ────────────────────────────────────────
        // Position-level templates (no employee link — used as defaults)
        createPositionSalaryStructure(managerPos,   80000, 32000, 8000, 5000, 5000, 200);
        createPositionSalaryStructure(devPos,        50000, 20000, 5000, 3000, 2000, 200);
        createPositionSalaryStructure(seniorDevPos,  65000, 26000, 6500, 4000, 3000, 200);
        createPositionSalaryStructure(hrPos,         55000, 22000, 5500, 3000, 2500, 200);
        createPositionSalaryStructure(qaPos,         45000, 18000, 4500, 2500, 1500, 200);

        // Employee-specific structures (linked directly — drives payroll)
        createEmployeeSalaryStructure(managerEmp, managerPos,   95000, 38000, 9500, 6000, 5500, 200);
        createEmployeeSalaryStructure(hrEmp,      hrPos,        75000, 30000, 7500, 4500, 3500, 200);
        createEmployeeSalaryStructure(ashikEmp,   devPos,       65000, 26000, 6500, 4000, 2500, 200);
        createEmployeeSalaryStructure(johnEmp,    devPos,       62000, 24800, 6200, 3800, 2200, 200);
        createEmployeeSalaryStructure(priyaEmp,   seniorDevPos, 68000, 27200, 6800, 4200, 2800, 200);
        createEmployeeSalaryStructure(qaEmp,      qaPos,        58000, 23200, 5800, 3200, 1800, 200);

        // ── PHASE 8: Leave Balances ───────────────────────────────────────────
        List<Employee> activeEmps = List.of(managerEmp, hrEmp, ashikEmp, johnEmp, priyaEmp, qaEmp);
        for (Employee emp : activeEmps) {
            // Ashik used 3 days PTO, John used 2 days sick
            double ptoUsed  = emp == ashikEmp ? 3.0 : 0.0;
            double sickUsed = emp == johnEmp  ? 2.0 : 0.0;
            createLeaveBalance(emp, ptoPolicy,  2026, 15.0, ptoUsed);
            createLeaveBalance(emp, sickPolicy, 2026, 10.0, sickUsed);
        }

        // ── PHASE 9: Leave Requests ───────────────────────────────────────────
        createLeaveRequest(ashikEmp, ptoPolicy,
                LocalDate.of(2026, 2, 10), LocalDate.of(2026, 2, 12), 3.0,
                "Annual family vacation in Goa",
                LeaveRequestStatus.APPROVED, managerEmp, "Approved. Have a great vacation!");

        createLeaveRequest(johnEmp, sickPolicy,
                LocalDate.of(2026, 3, 5), LocalDate.of(2026, 3, 6), 2.0,
                "Fever and viral infection",
                LeaveRequestStatus.APPROVED, hrEmp, "Approved. Get well soon!");

        createLeaveRequest(priyaEmp, ptoPolicy,
                LocalDate.of(2026, 4, 14), LocalDate.of(2026, 4, 18), 5.0,
                "Wedding ceremony and family functions",
                LeaveRequestStatus.PENDING, null, null);

        createLeaveRequest(qaEmp, sickPolicy,
                LocalDate.of(2026, 3, 20), LocalDate.of(2026, 3, 20), 1.0,
                "Routine doctor appointment",
                LeaveRequestStatus.REJECTED, managerEmp, "Critical sprint week — please reschedule if possible.");

        createLeaveRequest(managerEmp, ptoPolicy,
                LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 3), 3.0,
                "Personal travel",
                LeaveRequestStatus.PENDING, null, null);

        // ── PHASE 10: Leave Transactions ──────────────────────────────────────
        // Annual allocations
        for (Employee emp : activeEmps) {
            createLeaveTransaction(emp, ptoPolicy,  LeaveTransactionType.ACCRUAL, 15.0,  "Annual PTO allocation for 2026");
            createLeaveTransaction(emp, sickPolicy, LeaveTransactionType.ACCRUAL, 10.0,  "Sick Leave allocation for 2026");
        }
        // Deductions for approved leaves
        createLeaveTransaction(ashikEmp, ptoPolicy,  LeaveTransactionType.DEDUCTION, -3.0, "Approved leave: Feb 10–12, 2026");
        createLeaveTransaction(johnEmp,  sickPolicy, LeaveTransactionType.DEDUCTION, -2.0, "Approved sick leave: Mar 5–6, 2026");
        // HR manual adjustment
        createLeaveTransaction(priyaEmp, ptoPolicy, LeaveTransactionType.ADJUSTMENT, 2.0, "HR correction — carry-forward from 2025");

        // ── PHASE 11: Attendance (last 14 calendar days, Mon–Fri) ─────────────
        seedAttendanceRecords(standardShift, activeEmps);

        // ── PHASE 12: Projects ────────────────────────────────────────────────
        Project coreProject = createProject(
                "ENG-2026-001", "WorkSphere Core Platform",
                "Full-stack development of the WorkSphere HR management platform",
                engDept, managerEmp, ProjectStatus.ACTIVE,
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31), 750000.0);

        Project qaProject = createProject(
                "QA-2026-001", "Automated QA Suite",
                "Build end-to-end automated test coverage for all platform modules",
                qaDept, managerEmp, ProjectStatus.ACTIVE,
                LocalDate.of(2026, 2, 1), LocalDate.of(2026, 8, 31), 180000.0);

        // ── PHASE 13: Tasks ───────────────────────────────────────────────────
        seedTasks(managerEmp, ashikEmp, johnEmp, priyaEmp, qaEmp, coreProject, qaProject);

        // ── PHASE 14: Company Assets ──────────────────────────────────────────
        seedCompanyAssets(managerEmp, ashikEmp, johnEmp, priyaEmp, qaEmp, hrEmp);

        // ── PHASE 15: Grievance Tickets ───────────────────────────────────────
        seedGrievanceTickets(ashikEmp, qaEmp, hrEmp, managerEmp);

        // ── PHASE 16: Notifications ───────────────────────────────────────────
        seedNotifications(ashikEmp, johnEmp, priyaEmp, qaEmp, hrEmp);

        // ── PHASE 17: Performance Appraisals ──────────────────────────────────
        seedPerformanceAppraisals(ashikEmp, johnEmp, priyaEmp, qaEmp, managerEmp);

        // ── PHASE 18: Payroll Records ─────────────────────────────────────────
        seedPayrollRecords(activeEmps, managerEmp.getId());

        // ── PHASE 19: Hiring Pipeline (JobOpenings → Candidates → Interviews → Offers) ──
        seedHiringPipeline(hrEmp, engDept, qaDept, devPos, qaPos, managerEmp);

        printSeedSummary();
    }

    // =========================================================================
    // PHASE HELPERS
    // =========================================================================

    // ─── Work Schedules ───────────────────────────────────────────────────────

    private WorkSchedule seedStandardWorkSchedule() {
        WorkSchedule ws = new WorkSchedule();
        ws.setScheduleName("Standard 9-to-5");
        ws.setTimezone("Asia/Kolkata");
        ws.setExpectedStart(LocalTime.of(9, 0));
        ws.setExpectedEnd(LocalTime.of(17, 0));
        ws.setGracePeriodMin(15);
        ws.setBreakDurationMin(60);
        ws.setWorkingDays(31); // bitmask: Mon=1,Tue=2,Wed=4,Thu=8,Fri=16 → 31
        ws.setCreatedBy("SYSTEM");
        return workScheduleRepository.save(ws);
    }

    private WorkSchedule seedRemoteWorkSchedule() {
        WorkSchedule ws = new WorkSchedule();
        ws.setScheduleName("Remote Flex 10-to-6");
        ws.setTimezone("Asia/Kolkata");
        ws.setExpectedStart(LocalTime.of(10, 0));
        ws.setExpectedEnd(LocalTime.of(18, 0));
        ws.setGracePeriodMin(30);
        ws.setBreakDurationMin(60);
        ws.setWorkingDays(31);
        ws.setCreatedBy("SYSTEM");
        return workScheduleRepository.save(ws);
    }

    // ─── Roles ────────────────────────────────────────────────────────────────

    private Role createRole(String name, boolean exclusive) {
        return roleRepository.findByRoleName(name).orElseGet(() -> {
            Role r = new Role();
            r.setRoleName(name);
            r.setExclusive(exclusive);
            r.setCreatedBy("SYSTEM");
            return roleRepository.save(r);
        });
    }

    // ─── Job Positions ────────────────────────────────────────────────────────

    private JobPosition createJobPosition(String name, double min, double max, String skills, int slots) {
        JobPosition jp = new JobPosition();
        jp.setPositionName(name);
        jp.setSalaryMin(min);
        jp.setSalaryMax(max);
        jp.setRequiredSkills(skills);
        jp.setApprovedSlots(slots);
        jp.setCreatedBy("SYSTEM");
        return jobPositionRepository.save(jp);
    }

    // ─── Departments ──────────────────────────────────────────────────────────

    private Department createDepartment(String name, String desc, int headcount) {
        Department d = new Department();
        d.setName(name);
        d.setDescription(desc);
        d.setBudgetedHeadcount(headcount);
        d.setCreatedBy("SYSTEM");
        return departmentRepository.save(d);
    }

    // ─── Employees ────────────────────────────────────────────────────────────

    private Employee createEmployee(String fName, String lName, String uName, String email, String pass,
                                    double salary, Department dept, JobPosition pos, Role role,
                                    WorkSchedule schedule, Employee manager, LocalDateTime joiningDate) {
        Employee emp = new Employee();
        emp.setFirstName(fName);
        emp.setLastName(lName);
        emp.setUserName(uName);
        emp.setEmail(email);
        emp.setPassword(passwordEncoder.encode(pass));
        emp.setSalary(salary);
        emp.setPhoneNumber("91" + String.format("%09d", Math.abs((uName + email).hashCode() % 1_000_000_000)));
        emp.setEmployeeStatus(EmployeeStatus.ACTIVE);
        emp.setDepartment(dept);
        emp.setJobPosition(pos);
        emp.setRoles(Set.of(role));
        emp.setWorkSchedule(schedule);
        emp.setManager(manager);
        emp.setJoiningDate(joiningDate);
        emp.setCreatedBy("SYSTEM");
        return employeeRepository.save(emp);
    }

    // ─── Salary Structures ────────────────────────────────────────────────────

    private void createPositionSalaryStructure(JobPosition pos,
                                               long base, long hra, long da, long travel, long other, long profTax) {
        // Only create if this position doesn't already have one
        if (!salaryStructureRepository.findByJobPosition(pos).isEmpty()) return;

        SalaryStructure ss = new SalaryStructure();
        ss.setBaseSalary(BigDecimal.valueOf(base));
        ss.setHra(BigDecimal.valueOf(hra));
        ss.setDa(BigDecimal.valueOf(da));
        ss.setTravelAllowance(BigDecimal.valueOf(travel));
        ss.setOtherAllowances(BigDecimal.valueOf(other));
        ss.setPfEmployeePercent(12.0);
        ss.setPfEmployerPercent(12.0);
        ss.setProfessionalTax(BigDecimal.valueOf(profTax));
        ss.setEffectiveDate(LocalDate.of(2025, 4, 1));
        ss.setJobPosition(pos);
        ss.setCreatedBy("SYSTEM");
        salaryStructureRepository.save(ss);
    }

    private void createEmployeeSalaryStructure(Employee emp, JobPosition pos,
                                               long base, long hra, long da, long travel, long other, long profTax) {
        if (salaryStructureRepository.findByEmployee(emp).isPresent()) return;

        SalaryStructure ss = new SalaryStructure();
        ss.setBaseSalary(BigDecimal.valueOf(base));
        ss.setHra(BigDecimal.valueOf(hra));
        ss.setDa(BigDecimal.valueOf(da));
        ss.setTravelAllowance(BigDecimal.valueOf(travel));
        ss.setOtherAllowances(BigDecimal.valueOf(other));
        ss.setPfEmployeePercent(12.0);
        ss.setPfEmployerPercent(12.0);
        ss.setProfessionalTax(BigDecimal.valueOf(profTax));
        ss.setEffectiveDate(LocalDate.of(2025, 4, 1));
        ss.setEmployee(emp);
        ss.setJobPosition(pos);
        ss.setCreatedBy("SYSTEM");
        salaryStructureRepository.save(ss);
    }

    // ─── Tax Slabs ────────────────────────────────────────────────────────────

    private void seedTaxSlabs() {
        if (taxSlabConfigRepository.count() > 0) return;
        String fy = "2025-26";
        createTaxSlab(BigDecimal.ZERO,                new BigDecimal("300000"),  BigDecimal.ZERO,         fy, "0% — Exempt");
        createTaxSlab(new BigDecimal("300000"),        new BigDecimal("700000"),  new BigDecimal("5"),     fy, "5% slab");
        createTaxSlab(new BigDecimal("700000"),        new BigDecimal("1000000"), new BigDecimal("10"),    fy, "10% slab");
        createTaxSlab(new BigDecimal("1000000"),       new BigDecimal("1200000"), new BigDecimal("15"),    fy, "15% slab");
        createTaxSlab(new BigDecimal("1200000"),       new BigDecimal("1500000"), new BigDecimal("20"),    fy, "20% slab");
        createTaxSlab(new BigDecimal("1500000"),       null,                      new BigDecimal("30"),    fy, "30% slab + 4% cess");
    }

    private void createTaxSlab(BigDecimal min, BigDecimal max, BigDecimal rate, String fy, String desc) {
        TaxSlabConfig s = new TaxSlabConfig();
        s.setMinIncome(min);
        s.setMaxIncome(max);
        s.setTaxRate(rate);
        s.setFinancialYear(fy);
        s.setDescription(desc);
        s.setCreatedBy("SYSTEM");
        taxSlabConfigRepository.save(s);
    }

    // ─── Leave Policies ───────────────────────────────────────────────────────

    private LeavePolicy createLeavePolicy(String name, double allowance, boolean carryFwd,
                                          double maxCarry, boolean unpaid) {
        return leavePolicyRepository.findByName(name).orElseGet(() -> {
            LeavePolicy p = new LeavePolicy();
            p.setName(name);
            p.setDefaultAnnualAllowance(allowance);
            p.setAllowsCarryForward(carryFwd);
            p.setMaxCarryForwardDays(maxCarry);
            p.setIsUnpaid(unpaid);
            p.setCreatedBy("SYSTEM");
            return leavePolicyRepository.save(p);
        });
    }

    // ─── Leave Balances ───────────────────────────────────────────────────────

    private void createLeaveBalance(Employee emp, LeavePolicy policy, int year,
                                    double allocated, double used) {
        LeaveBalance lb = new LeaveBalance();
        lb.setEmployee(emp);
        lb.setLeavePolicy(policy);
        lb.setValidForYear(year);
        lb.setDaysAllocated(allocated);
        lb.setDaysUsed(used);
        lb.setDaysAvailable(allocated - used);
        lb.setCreatedBy("SYSTEM");
        leaveBalanceRepository.save(lb);
    }

    // ─── Leave Requests ───────────────────────────────────────────────────────

    private void createLeaveRequest(Employee emp, LeavePolicy policy,
                                    LocalDate start, LocalDate end, double days, String reason,
                                    LeaveRequestStatus status, Employee reviewer, String reviewerComment) {
        LeaveRequest lr = new LeaveRequest();
        lr.setEmployee(emp);
        lr.setLeavePolicy(policy);
        lr.setStartDate(start);
        lr.setEndDate(end);
        lr.setRequestedDays(days);
        lr.setReason(reason);
        lr.setStatus(status);
        lr.setReviewer(reviewer);
        lr.setReviewerComment(reviewerComment);
        lr.setCreatedBy("SYSTEM");
        leaveRequestRepository.save(lr);
    }

    // ─── Leave Transactions ───────────────────────────────────────────────────

    private void createLeaveTransaction(Employee emp, LeavePolicy policy,
                                        LeaveTransactionType type, double days, String reason) {
        LeaveTransaction lt = new LeaveTransaction();
        lt.setEmployee(emp);
        lt.setLeavePolicy(policy);
        lt.setTransactionType(type);
        lt.setDaysChanged(days);
        lt.setReason(reason);
        lt.setCreatedBy("SYSTEM");
        leaveTransactionRepository.save(lt);
    }

    // ─── Public Holidays ──────────────────────────────────────────────────────

    private void seedPublicHolidays() {
        if (publicHolidayRepository.count() > 0) return;

        createHoliday(LocalDate.of(2026, 1,  1),  "New Year's Day",        "Global");
        createHoliday(LocalDate.of(2026, 1, 14),  "Makar Sankranti",       "India");
        createHoliday(LocalDate.of(2026, 1, 26),  "Republic Day",          "India");
        createHoliday(LocalDate.of(2026, 3, 20),  "Holi",                  "India");
        createHoliday(LocalDate.of(2026, 4, 14),  "Dr. Ambedkar Jayanti",  "India");
        createHoliday(LocalDate.of(2026, 5,  1),  "May Day / Labour Day",  "Global");
        createHoliday(LocalDate.of(2026, 8, 15),  "Independence Day",      "India");
        createHoliday(LocalDate.of(2026, 8, 27),  "Onam",                  "Kerala");
        createHoliday(LocalDate.of(2026, 10, 2),  "Gandhi Jayanti",        "India");
        createHoliday(LocalDate.of(2026, 10, 23), "Diwali",                "India");
        createHoliday(LocalDate.of(2026, 11,  1), "Kerala Piravi",         "Kerala");
        createHoliday(LocalDate.of(2026, 12, 25), "Christmas Day",         "Global");
    }

    private void createHoliday(LocalDate date, String name, String region) {
        PublicHoliday h = new PublicHoliday();
        h.setDate(date);
        h.setName(name);
        h.setApplicableRegion(region);
        h.setCreatedBy("SYSTEM");
        publicHolidayRepository.save(h);
    }

    // ─── Attendance ───────────────────────────────────────────────────────────

    private void seedAttendanceRecords(WorkSchedule schedule, List<Employee> employees) {
        if (attendanceRepository.count() > 0) return;

        LocalDate today   = LocalDate.now();
        LocalDate from    = today.minusDays(21);

        // Collect holiday dates for quick lookup
        Set<LocalDate> holidays = new HashSet<>();
        publicHolidayRepository.findAll().forEach(h -> holidays.add(h.getDate()));

        for (LocalDate date = from; !date.isAfter(today.minusDays(1)); date = date.plusDays(1)) {
            DayOfWeek dow = date.getDayOfWeek();
            if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) continue;
            if (holidays.contains(date)) {
                // Mark everyone as PUBLIC_HOLIDAY
                for (Employee emp : employees) {
                    createAttendance(emp, schedule, date,
                            null, null, 0, DailyStatus.PUBLIC_HOLIDAY, false);
                }
                continue;
            }

            int daySeq = (int) from.until(date, java.time.temporal.ChronoUnit.DAYS);

            for (Employee emp : employees) {
                // Simple deterministic variation: use hash of emp+date to vary status
                int hash = (emp.getId().toString() + date.toString()).hashCode();
                int bucket = Math.abs(hash) % 20; // 0-19

                LocalDateTime clockIn;
                LocalDateTime clockOut;
                DailyStatus status;
                int workMinutes;

                if (bucket < 14) {
                    // 70% PRESENT — normal day
                    int lateMin = (bucket < 11) ? 0 : 20; // 15% late
                    clockIn     = date.atTime(9, 0).plusMinutes(lateMin);
                    clockOut    = date.atTime(17, 30).plusMinutes(daySeq % 30);
                    workMinutes = (int) java.time.Duration.between(clockIn, clockOut).toMinutes() - 60;
                    status      = (lateMin > 15) ? DailyStatus.LATE : DailyStatus.PRESENT;
                } else if (bucket < 16) {
                    // 10% HALF_DAY
                    clockIn     = date.atTime(9, 0);
                    clockOut    = date.atTime(13, 0);
                    workMinutes = 180;
                    status      = DailyStatus.HALF_DAY_MORNING;
                } else if (bucket == 16) {
                    // 5% ABSENT
                    clockIn = null; clockOut = null; workMinutes = 0;
                    status  = DailyStatus.ABSENT;
                } else {
                    // 15% ON_LEAVE
                    clockIn = null; clockOut = null; workMinutes = 0;
                    status  = DailyStatus.ON_LEAVE;
                }

                createAttendance(emp, schedule, date, clockIn, clockOut, workMinutes, status, false);
            }
        }
    }

    private void createAttendance(Employee emp, WorkSchedule schedule, LocalDate date,
                                  LocalDateTime clockIn, LocalDateTime clockOut, int minutes,
                                  DailyStatus status, boolean manuallyAdjusted) {
        Attendance a = new Attendance();
        a.setEmployee(emp);
        a.setWorkSchedule(schedule);
        a.setDate(date);
        a.setClockIn(clockIn);
        a.setClockOut(clockOut);
        a.setTotalWorkMinutes(minutes > 0 ? minutes : null);
        a.setDailyStatus(status);
        a.setIsManuallyAdjusted(manuallyAdjusted);
        a.setCreatedBy("SYSTEM");
        attendanceRepository.save(a);
    }

    // ─── Projects ─────────────────────────────────────────────────────────────

    private Project createProject(String code, String name, String desc,
                                  Department dept, Employee manager, ProjectStatus status,
                                  LocalDate start, LocalDate end, double budget) {
        Project p = new Project();
        p.setProjectCode(code);
        p.setName(name);
        p.setDescription(desc);
        p.setDepartment(dept);
        p.setProjectManager(manager);
        p.setStatus(status);
        p.setStartDate(start);
        p.setEndDate(end);
        p.setBudget(budget);
        p.setCreatedBy("SYSTEM");
        return projectRepository.save(p);
    }

    // ─── Tasks ────────────────────────────────────────────────────────────────

    private void seedTasks(Employee manager, Employee ashik, Employee john,
                           Employee priya, Employee qa,
                           Project coreProject, Project qaProject) {
        if (taskRepository.count() > 0) return;

        // Ashik's tasks — spread across all Kanban columns
        Task t1 = new Task("TASK-001", "Set up CI/CD pipeline",
                "Configure GitHub Actions for automated build and test on every PR.",
                manager, ashik, LocalDateTime.now().plusDays(7), TaskPriority.HIGH);
        t1.setRequiresEvidence(true);

        Task t2 = new Task("TASK-002", "Refactor authentication module",
                "Extract JWT logic into a dedicated service class with proper unit test coverage.",
                manager, ashik, LocalDateTime.now().plusDays(3), TaskPriority.HIGH);
        t2.startProgress();

        Task t3 = new Task("TASK-003", "Write unit tests for LeaveService",
                "Achieve 80% branch coverage on LeaveRequestService. Use Mockito for mocks.",
                manager, ashik, LocalDateTime.now().plusDays(5), TaskPriority.MEDIUM);
        t3.startProgress();
        t3.submitForReview();

        Task t4 = new Task("TASK-004", "Update API documentation",
                "Document all new endpoints added this sprint using Swagger/OpenAPI annotations.",
                manager, ashik, LocalDateTime.now().minusDays(2), TaskPriority.LOW);
        t4.startProgress();
        t4.submitForReview();
        t4.markAsCompleted();
        t4.rateTask(4, 87.5);

        // John's tasks
        Task t5 = new Task("TASK-005", "Fix pagination bug on EmployeeList",
                "The table does not reset to page 1 after applying a filter. Affects React Table component.",
                manager, john, LocalDateTime.now().plusDays(2), TaskPriority.HIGH);

        Task t6 = new Task("TASK-006", "Implement payslip download endpoint",
                "Return PDF blob from GET /api/payroll/{id}/payslip using iText or Jasper.",
                manager, john, LocalDateTime.now().plusDays(6), TaskPriority.MEDIUM);
        t6.startProgress();

        Task t7 = new Task("TASK-007", "Add department filter to roster board",
                "Allow managers to filter the daily roster board by department using dropdown.",
                manager, john, LocalDateTime.now().plusDays(4), TaskPriority.MEDIUM);
        t7.startProgress();
        t7.submitForReview();

        Task t8 = new Task("TASK-008", "Database index optimisation",
                "Add composite indexes on attendance and task tables to improve query performance by ~70%.",
                manager, john, LocalDateTime.now().minusDays(5), TaskPriority.LOW);
        t8.startProgress();
        t8.submitForReview();
        t8.markAsCompleted();
        t8.rateTask(5, 95.0);

        // Priya's tasks (Senior Engineer — URGENT tasks)
        Task t9 = new Task("TASK-009", "Implement payroll engine v2",
                "Refactor PayrollService to support tax regime switching and LOP calculation improvements.",
                manager, priya, LocalDateTime.now().plusDays(10), TaskPriority.URGENT);
        t9.startProgress();

        Task t10 = new Task("TASK-010", "Design database schema for audit logs",
                "Review AuditLog entity and propose index strategy for high-volume writes.",
                manager, priya, LocalDateTime.now().minusDays(1), TaskPriority.HIGH);
        t10.startProgress();
        t10.submitForReview();
        t10.markAsCompleted();
        t10.rateTask(5, 98.0);

        Task t11 = new Task("TASK-011", "Implement RBAC middleware",
                "Add per-endpoint role validation using Spring Security method-level security annotations.",
                manager, priya, LocalDateTime.now().plusDays(8), TaskPriority.HIGH);

        // QA Engineer tasks
        Task t12 = new Task("TASK-012", "Write Selenium tests for Login flow",
                "Cover happy path, invalid credentials, account lockout, and password reset flows.",
                manager, qa, LocalDateTime.now().plusDays(5), TaskPriority.HIGH);
        t12.startProgress();

        Task t13 = new Task("TASK-013", "Performance test payroll endpoint",
                "Use JMeter to load-test POST /api/payroll/generate with 200 concurrent users.",
                manager, qa, LocalDateTime.now().plusDays(9), TaskPriority.MEDIUM);

        Task t14 = new Task("TASK-014", "Write integration tests for LeaveRequest",
                "Cover all approval/rejection/cancellation flows end-to-end using TestContainers.",
                manager, qa, LocalDateTime.now().minusDays(3), TaskPriority.MEDIUM);
        t14.startProgress();
        t14.submitForReview();
        t14.markAsCompleted();
        t14.rateTask(4, 85.0);

        // Flagged task (for Auditor dashboard)
        Task t15 = new Task("TASK-015", "Investigate anomalous overtime records",
                "Employee ID #4 has 38 overtime hours recorded in March — verify with attendance logs.",
                manager, ashik, LocalDateTime.now().minusDays(7), TaskPriority.CRITICAL);
        t15.startProgress();
        t15.submitForReview();
        t15.markAsCompleted();
        t15.flagForAudit("Unusual overtime pattern detected by automated rule engine.", manager);

        List<Task> allTasks = List.of(t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11, t12, t13, t14, t15);
        taskRepository.saveAll(allTasks);

        // ── Task Comments ─────────────────────────────────────────────────────
        addTaskComment(t2, ashik,   "Started extracting the JWT filter. Will PR by EOD.");
        addTaskComment(t2, manager, "Looks good. Make sure to add Javadoc to the new service.");
        addTaskComment(t3, ashik,   "Unit tests for LeaveRequestService.submitRequest() done. Moving to approval flow.");
        addTaskComment(t3, manager, "Good progress. Also cover edge cases for overlapping leave dates.");
        addTaskComment(t7, john,    "Department dropdown added. Waiting for backend filter endpoint review.");
        addTaskComment(t7, manager, "Filter logic looks correct. Approve after QA sign-off.");
        addTaskComment(t9, priya,   "Working on the tax regime selection logic. ETA: 3 days.");
        addTaskComment(t12, qa,     "Login happy-path tests complete. Working on lockout scenario.");
    }

    private void addTaskComment(Task task, Employee author, String content) {
        TaskComment c = new TaskComment();
        c.setTask(task);
        c.setAuthor(author);
        c.setContent(content);
        c.setCreatedBy("SYSTEM");
        taskCommentRepository.save(c);
    }

    // ─── Company Assets ───────────────────────────────────────────────────────

    private void seedCompanyAssets(Employee manager, Employee ashik, Employee john,
                                   Employee priya, Employee qa, Employee hr) {
        if (companyAssetRepository.count() > 0) return;

        LocalDateTime now = LocalDateTime.now();

        // Assigned assets
        createAsset("ASSET-LT-001", AssetType.LAPTOP,    "Dell XPS 15 (2024)",        "SN-DL-001",
                LocalDate.of(2024, 1, 15), LocalDate.of(2027, 1, 14), AssetCondition.GOOD,  manager, now);
        createAsset("ASSET-LT-002", AssetType.LAPTOP,    "MacBook Pro M3",             "SN-MB-002",
                LocalDate.of(2024, 3, 1),  LocalDate.of(2027, 2, 28), AssetCondition.GOOD,  priya,   now);
        createAsset("ASSET-LT-003", AssetType.LAPTOP,    "Lenovo ThinkPad X1 Carbon",  "SN-LN-003",
                LocalDate.of(2023, 9, 10), LocalDate.of(2026, 9, 9),  AssetCondition.FAIR,  ashik,   now);
        createAsset("ASSET-LT-004", AssetType.LAPTOP,    "HP EliteBook 840 G9",        "SN-HP-004",
                LocalDate.of(2024, 6, 1),  LocalDate.of(2027, 5, 31), AssetCondition.GOOD,  john,    now);
        createAsset("ASSET-LT-005", AssetType.LAPTOP,    "Dell Latitude 5540",         "SN-DL-005",
                LocalDate.of(2024, 7, 1),  LocalDate.of(2027, 6, 30), AssetCondition.NEW,   qa,      now);
        createAsset("ASSET-LT-006", AssetType.LAPTOP,    "Lenovo IdeaPad 5 Pro",       "SN-LN-006",
                LocalDate.of(2023, 5, 1),  LocalDate.of(2026, 4, 30), AssetCondition.FAIR,  hr,      now);

        createAsset("ASSET-MN-001", AssetType.MONITOR,   "LG 27UL850 4K",              "SN-LG-001",
                LocalDate.of(2024, 1, 15), LocalDate.of(2028, 1, 14), AssetCondition.GOOD,  manager, now);
        createAsset("ASSET-MN-002", AssetType.MONITOR,   "Samsung 27\" QHD",           "SN-SS-002",
                LocalDate.of(2023, 9, 10), LocalDate.of(2027, 9, 9),  AssetCondition.GOOD,  ashik,   now);

        createAsset("ASSET-PH-001", AssetType.PHONE,     "iPhone 15 Pro (Company SIM)","SN-IP-001",
                LocalDate.of(2024, 2, 1),  LocalDate.of(2026, 1, 31), AssetCondition.GOOD,  manager, now);

        createAsset("ASSET-AC-001", AssetType.ACCESS_CARD, "HQ Office — Floor 3",      "SN-AC-001",
                LocalDate.of(2022, 11, 1), null, AssetCondition.GOOD,  manager, now);
        createAsset("ASSET-AC-002", AssetType.ACCESS_CARD, "HQ Office — Floor 3",      "SN-AC-002",
                LocalDate.of(2024, 2, 1),  null, AssetCondition.GOOD,  ashik,   now);

        // Unassigned (available inventory)
        createAsset("ASSET-LT-007", AssetType.LAPTOP,    "Dell XPS 13 (spare)",        "SN-DL-007",
                LocalDate.of(2025, 1, 5),  LocalDate.of(2028, 1, 4),  AssetCondition.NEW,   null, null);
        createAsset("ASSET-KB-001", AssetType.KEYBOARD,  "Logitech MX Keys",           "SN-LG-KB-001",
                LocalDate.of(2024, 8, 1),  null, AssetCondition.GOOD,  null, null);
    }

    private void createAsset(String tag, AssetType type, String makeModel, String serial,
                             LocalDate purchaseDate, LocalDate warrantyExpiry,
                             AssetCondition condition, Employee emp, LocalDateTime assignedAt) {
        CompanyAsset a = new CompanyAsset();
        a.setAssetTag(tag);
        a.setType(type);
        a.setMakeModel(makeModel);
        a.setSerialNumber(serial);
        a.setPurchaseDate(purchaseDate);
        a.setWarrantyExpiry(warrantyExpiry);
        a.setCondition(condition);
        a.setEmployee(emp);
        a.setAssignedAt(assignedAt);
        a.setCreatedBy("SYSTEM");
        companyAssetRepository.save(a);
    }

    // ─── Grievance Tickets ────────────────────────────────────────────────────

    private void seedGrievanceTickets(Employee ashik, Employee qa, Employee hr, Employee manager) {
        if (grievanceTicketRepository.count() > 0) return;

        // Ticket 1 — Payroll discrepancy (OPEN, raised by ashik)
        GrievanceTicket t1 = createGrievanceTicket(
                "TKT-2026-001",
                GrievanceCategory.PAYROLL,
                GrievancePriority.HIGH,
                "Payroll deduction discrepancy for February 2026",
                "My February payslip shows an LOP deduction of 2 days but I was present all days. " +
                        "My attendance records show PRESENT for Feb 10–12 but payroll says otherwise.",
                GrievanceStatus.IN_PROGRESS,
                ashik,
                hr.getId());

        addTicketComment(t1, ashik, "I have attached my attendance confirmation email as evidence.", false);
        addTicketComment(t1, hr,    "Looking into this. Will cross-check with the payroll batch processed on Mar 1.", false);
        addTicketComment(t1, hr,    "Internal note: Possible system error during LOP recalculation.", true);

        // Ticket 2 — IT support (RESOLVED, raised by qa)
        GrievanceTicket t2 = createGrievanceTicket(
                "TKT-2026-002",
                GrievanceCategory.IT_SUPPORT,
                GrievancePriority.MEDIUM,
                "Unable to access internal QA dashboard after password reset",
                "Since resetting my password last Tuesday, I cannot log into the internal test management " +
                        "dashboard (qa-dash.worksphere.internal). Getting 403 Forbidden error.",
                GrievanceStatus.RESOLVED,
                qa,
                manager.getId());
        t2.setResolution("Admin re-provisioned LDAP group membership. Access restored on Mar 15.");

        addTicketComment(t2, qa,      "Still facing the issue after clearing cookies.", false);
        addTicketComment(t2, manager, "Escalated to IT. They'll fix LDAP permissions today.", false);

        // Ticket 3 — HR Policy (OPEN, raised by another engineer)
        createGrievanceTicket(
                "TKT-2026-003",
                GrievanceCategory.HR_POLICY,
                GrievancePriority.LOW,
                "Clarification on work-from-home policy for 2026",
                "I would like clarity on the number of WFH days permitted per month for Software Engineers " +
                        "and whether prior approval from the manager is required for each day.",
                GrievanceStatus.OPEN,
                ashik,
                hr.getId());

        // Update the resolved ticket
        grievanceTicketRepository.save(t2);
    }

    private GrievanceTicket createGrievanceTicket(String ticketNumber, GrievanceCategory category,
                                                  GrievancePriority priority, String subject, String description,
                                                  GrievanceStatus status, Employee raisedBy, UUID assignedTo) {
        GrievanceTicket t = new GrievanceTicket();
        t.setTicketNumber(ticketNumber);
        t.setCategory(category);
        t.setPriority(priority);
        t.setSubject(subject);
        t.setDescription(description);
        t.setStatus(status);
        t.setRaisedBy(raisedBy);
        t.setAssignedTo(assignedTo);
        t.setCreatedBy("SYSTEM");
        return grievanceTicketRepository.save(t);
    }

    private void addTicketComment(GrievanceTicket ticket, Employee author, String content, boolean internal) {
        TicketComment c = new TicketComment();
        c.setTicket(ticket);
        c.setAuthor(author);
        c.setContent(content);
        c.setIsInternal(internal);
        c.setCreatedBy("SYSTEM");
        ticketCommentRepository.save(c);
    }

    // ─── Notifications ────────────────────────────────────────────────────────

    private void seedNotifications(Employee ashik, Employee john, Employee priya,
                                   Employee qa, Employee hr) {
        if (notificationRepository.count() > 0) return;

        createNotification(ashik, NotificationType.PAYSLIP_READY,
                "February 2026 Payslip Available",
                "Your payslip for February 2026 has been generated and is ready for download.",
                true);

        createNotification(ashik, NotificationType.APPRAISAL_DUE,
                "Q1 2026 Self-Appraisal Due",
                "Your Q1 2026 performance self-appraisal is due by March 31. Please complete it.",
                false);

        createNotification(ashik, NotificationType.ASSET_ASSIGNED,
                "Company Asset Assigned",
                "A Lenovo ThinkPad X1 Carbon (SN-LN-003) has been assigned to you.",
                true);

        createNotification(john, NotificationType.PAYSLIP_READY,
                "February 2026 Payslip Available",
                "Your payslip for February 2026 has been generated and is ready for download.",
                true);

        createNotification(john, NotificationType.APPRAISAL_DUE,
                "Q1 2026 Self-Appraisal Due",
                "Your Q1 2026 performance self-appraisal is due by March 31. Please complete it.",
                false);

        createNotification(priya, NotificationType.APPRAISAL_RECEIVED,
                "Your Appraisal Has Been Reviewed",
                "Mike Johnson has completed your Q4 2025 performance review. Check your appraisal details.",
                false);

        createNotification(priya, NotificationType.PAYSLIP_READY,
                "February 2026 Payslip Available",
                "Your payslip for February 2026 has been generated and is ready for download.",
                true);

        createNotification(qa, NotificationType.TICKET_UPDATE,
                "Your Support Ticket Has Been Resolved",
                "Ticket TKT-2026-002 (Unable to access QA dashboard) has been marked as RESOLVED.",
                true);

        createNotification(hr, NotificationType.APPRAISAL_DUE,
                "Pending Appraisals Require Your Attention",
                "3 employee appraisals are awaiting your HR review and sign-off.",
                false);
    }

    private void createNotification(Employee recipient, NotificationType type,
                                    String title, String message, boolean isRead) {
        Notification n = new Notification();
        n.setRecipient(recipient);
        n.setType(type);
        n.setTitle(title);
        n.setMessage(message);
        n.setIsRead(isRead);
        n.setReadAt(isRead ? LocalDateTime.now().minusDays(1) : null);
        n.setCreatedBy("SYSTEM");
        notificationRepository.save(n);
    }

    // ─── Performance Appraisals ───────────────────────────────────────────────

    private void seedPerformanceAppraisals(Employee ashik, Employee john, Employee priya,
                                           Employee qa, Employee manager) {
        if (performanceAppraisalRepository.count() > 0) return;

        // Q4 2025 cycle — CLOSED (Priya — highest performer)
        PerformanceAppraisal pa1 = PerformanceAppraisal.builder()
                .employee(priya)
                .manager(manager)
                .cycleType(AppraisalCycleType.QUARTERLY)
                .status(AppraisalStatus.CLOSED)
                .reviewPeriodStart(LocalDate.of(2025, 10, 1))
                .reviewPeriodEnd(LocalDate.of(2025, 12, 31))
                .tasksCompletedInPeriod(14)
                .tasksOverdueInPeriod(0)
                .averageTaskScore(new BigDecimal("93.50"))
                .selfRating(new BigDecimal("4.50"))
                .managerRating(new BigDecimal("4.80"))
                .selfComments("Delivered all sprint tasks ahead of schedule. Led the payroll refactor.")
                .managerComments("Exceptional quarter. Priya has shown strong leadership and technical depth.")
                .hrComments("Recommended for senior promotion review in Q2 2026.")
                .finalScore(new BigDecimal("4.65"))
                .build();
        pa1.setCreatedBy("SYSTEM");
        performanceAppraisalRepository.save(pa1);

        // Q4 2025 — ACKNOWLEDGED (Ashik)
        PerformanceAppraisal pa2 = PerformanceAppraisal.builder()
                .employee(ashik)
                .manager(manager)
                .cycleType(AppraisalCycleType.QUARTERLY)
                .status(AppraisalStatus.ACKNOWLEDGED)
                .reviewPeriodStart(LocalDate.of(2025, 10, 1))
                .reviewPeriodEnd(LocalDate.of(2025, 12, 31))
                .tasksCompletedInPeriod(11)
                .tasksOverdueInPeriod(1)
                .averageTaskScore(new BigDecimal("82.00"))
                .selfRating(new BigDecimal("4.00"))
                .managerRating(new BigDecimal("3.80"))
                .selfComments("Completed all assigned tasks. One task was delayed due to dependency blocker.")
                .managerComments("Solid performance. Needs to improve on proactive communication when blocked.")
                .hrComments("On track. Continue monitoring.")
                .finalScore(new BigDecimal("3.90"))
                .build();
        pa2.setCreatedBy("SYSTEM");
        performanceAppraisalRepository.save(pa2);

        // Q4 2025 — REVIEWED (John)
        PerformanceAppraisal pa3 = PerformanceAppraisal.builder()
                .employee(john)
                .manager(manager)
                .cycleType(AppraisalCycleType.QUARTERLY)
                .status(AppraisalStatus.REVIEWED)
                .reviewPeriodStart(LocalDate.of(2025, 10, 1))
                .reviewPeriodEnd(LocalDate.of(2025, 12, 31))
                .tasksCompletedInPeriod(9)
                .tasksOverdueInPeriod(2)
                .averageTaskScore(new BigDecimal("77.50"))
                .selfRating(new BigDecimal("3.50"))
                .managerRating(new BigDecimal("3.40"))
                .selfComments("Faced some blockers in Q4 but delivered the core pagination fix.")
                .managerComments("Good effort. 2 tasks missed deadlines — needs time management improvement.")
                .hrComments(null)
                .finalScore(new BigDecimal("3.45"))
                .build();
        pa3.setCreatedBy("SYSTEM");
        performanceAppraisalRepository.save(pa3);

        // Q1 2026 — PENDING (all active engineers — current cycle)
        for (Employee emp : List.of(ashik, john, priya, qa)) {
            PerformanceAppraisal pa = PerformanceAppraisal.builder()
                    .employee(emp)
                    .manager(manager)
                    .cycleType(AppraisalCycleType.QUARTERLY)
                    .status(AppraisalStatus.PENDING)
                    .reviewPeriodStart(LocalDate.of(2026, 1, 1))
                    .reviewPeriodEnd(LocalDate.of(2026, 3, 31))
                    .tasksCompletedInPeriod(0)
                    .tasksOverdueInPeriod(0)
                    .build();
            pa.setCreatedBy("SYSTEM");
            performanceAppraisalRepository.save(pa);
        }
    }

    // ─── Payroll Records ──────────────────────────────────────────────────────

    private void seedPayrollRecords(List<Employee> employees, UUID processedBy) {
        if (payrollRecordRepository.count() > 0) return;

        // Seed January 2026 (PAID) and February 2026 (PROCESSED)
        for (Employee emp : employees) {
            BigDecimal gross = BigDecimal.valueOf(emp.getSalary());
            BigDecimal pf    = gross.multiply(new BigDecimal("0.12")).setScale(2, java.math.RoundingMode.HALF_UP);
            BigDecimal tax   = gross.multiply(new BigDecimal("0.08")).setScale(2, java.math.RoundingMode.HALF_UP);
            BigDecimal profT = new BigDecimal("200.00");
            BigDecimal net   = gross.subtract(pf).subtract(tax).subtract(profT);

            // January 2026 — PAID
            createPayrollRecord(emp, 1, 2026, 23, 23, 0, gross,
                    BigDecimal.ZERO, pf, tax, profT, BigDecimal.ZERO, net,
                    PayrollStatus.PAID, processedBy, LocalDateTime.of(2026, 2, 1, 10, 0));

            // February 2026 — PROCESSED (payslip ready but not marked as paid yet)
            createPayrollRecord(emp, 2, 2026, 20, 19, 1, gross,
                    gross.divide(BigDecimal.valueOf(20), 2, java.math.RoundingMode.HALF_UP),
                    pf, tax, profT, BigDecimal.ZERO,
                    net.subtract(gross.divide(BigDecimal.valueOf(20), 2, java.math.RoundingMode.HALF_UP)),
                    PayrollStatus.PROCESSED, processedBy, LocalDateTime.of(2026, 3, 1, 10, 0));
        }
    }

    private void createPayrollRecord(Employee emp, int month, int year,
                                     int workingDays, int presentDays, int lopDays,
                                     BigDecimal gross, BigDecimal lopDeduction,
                                     BigDecimal pf, BigDecimal tax, BigDecimal profTax,
                                     BigDecimal otherDeductions, BigDecimal netPay,
                                     PayrollStatus status, UUID processedBy, LocalDateTime processedAt) {
        PayrollRecord r = new PayrollRecord();
        r.setEmployee(emp);
        r.setMonth(month);
        r.setYear(year);
        r.setWorkingDays(workingDays);
        r.setPresentDays(presentDays);
        r.setLopDays(lopDays);
        r.setGrossPay(gross);
        r.setLopDeduction(lopDeduction);
        r.setPfDeduction(pf);
        r.setTaxDeduction(tax);
        r.setProfessionalTax(profTax);
        r.setOtherDeductions(otherDeductions);
        r.setPerformanceBonus(BigDecimal.ZERO);
        r.setNetPay(netPay);
        r.setStatus(status);
        r.setProcessedBy(processedBy);
        r.setProcessedAt(processedAt);
        r.setCreatedBy("SYSTEM");
        payrollRecordRepository.save(r);
    }

    // ─── Hiring Pipeline ──────────────────────────────────────────────────────

    private void seedHiringPipeline(Employee hrOwner, Department engDept, Department qaDept,
                                    JobPosition devPos, JobPosition qaPos, Employee interviewer) {
        if (jobOpeningRepository.count() > 0) return;

        // ── Job Openings ──────────────────────────────────────────────────────
        JobOpening jdOpen = createJobOpening(
                "Full-Stack Software Engineer",
                "We are looking for a talented Full-Stack Engineer to join our Engineering team. " +
                        "You will work on the WorkSphere platform using Java Spring Boot and React.",
                engDept, devPos, hrOwner, JobOpeningStatus.OPEN, 2,
                LocalDate.of(2026, 4, 30),
                new BigDecimal("55000"), new BigDecimal("80000"));

        JobOpening jqOpen = createJobOpening(
                "QA Automation Engineer",
                "Seeking a detail-oriented QA Automation Engineer to build our Selenium + TestNG test suite. " +
                        "Must have experience with CI/CD integration and API testing.",
                qaDept, qaPos, hrOwner, JobOpeningStatus.OPEN, 1,
                LocalDate.of(2026, 5, 15),
                new BigDecimal("45000"), new BigDecimal("65000"));

        JobOpening jHrOpen = createJobOpening(
                "HR Business Partner",
                "Looking for an experienced HRBP to drive talent strategies and employee engagement initiatives.",
                engDept, devPos, hrOwner, JobOpeningStatus.DRAFT, 1,
                LocalDate.of(2026, 6, 30),
                new BigDecimal("60000"), new BigDecimal("85000"));

        // ── Candidates ────────────────────────────────────────────────────────

        // Candidate 1 — Software Engineer — INTERVIEWING
        Candidate c1 = createCandidate(jdOpen, "Arjun Mehta", "arjun.mehta@email.com",
                "+91-9876543210", CandidateSource.LINKEDIN, CandidateStatus.INTERVIEWING,
                "Passionate full-stack developer with 4 years experience in Java and React.");

        // Candidate 2 — Software Engineer — SHORTLISTED
        Candidate c2 = createCandidate(jdOpen, "Deepa Krishnan", "deepa.k@email.com",
                "+91-9865432100", CandidateSource.REFERRAL, CandidateStatus.SHORTLISTED,
                "Referred by Sarah Smith. Strong Spring Boot background.");

        // Candidate 3 — Software Engineer — OFFERED (accepted)
        Candidate c3 = createCandidate(jdOpen, "Nikhil Sharma", "nikhil.s@email.com",
                "+91-9834561230", CandidateSource.PORTAL, CandidateStatus.ACCEPTED,
                "5 years experience. Excellent technical interview performance.");

        // Candidate 4 — Software Engineer — REJECTED
        createCandidate(jdOpen, "Ramesh Pillai", "ramesh.p@email.com",
                "+91-9812345670", CandidateSource.PORTAL, CandidateStatus.REJECTED,
                "Applied via portal. Skills did not meet the minimum requirements.");

        // Candidate 5 — QA Engineer — INTERVIEWING
        Candidate c5 = createCandidate(jqOpen, "Kavitha Rao", "kavitha.r@email.com",
                "+91-9798765430", CandidateSource.PORTAL, CandidateStatus.INTERVIEWING,
                "3 years Selenium + TestNG. Actively looking.");

        // ── Interview Schedules ───────────────────────────────────────────────

        // Arjun (c1) — Round 1 COMPLETED, Round 2 SCHEDULED
        InterviewSchedule is1 = createInterviewSchedule(c1, interviewer, 1,
                LocalDateTime.of(2026, 3, 10, 10, 0), InterviewMode.VIDEO,
                InterviewStatus.COMPLETED, 4, "Strong Java skills. Passed Round 1 with a score of 4/5.");

        createInterviewSchedule(c1, interviewer, 2,
                LocalDateTime.now().plusDays(5), InterviewMode.IN_PERSON,
                InterviewStatus.SCHEDULED, null, null);

        // Nikhil (c3) — Both rounds completed
        createInterviewSchedule(c3, interviewer, 1,
                LocalDateTime.of(2026, 3, 5, 14, 0), InterviewMode.VIDEO,
                InterviewStatus.COMPLETED, 5, "Outstanding. Strong system design knowledge.");

        createInterviewSchedule(c3, interviewer, 2,
                LocalDateTime.of(2026, 3, 12, 10, 0), InterviewMode.IN_PERSON,
                InterviewStatus.COMPLETED, 5, "Excellent culture fit. Offer recommended.");

        // Kavitha (c5) — Round 1 SCHEDULED
        createInterviewSchedule(c5, interviewer, 1,
                LocalDateTime.now().plusDays(3), InterviewMode.PHONE,
                InterviewStatus.SCHEDULED, null, null);

        // ── Offer Letters ─────────────────────────────────────────────────────

        // Nikhil accepted offer
        OfferLetter offer1 = new OfferLetter();
        offer1.setCandidate(c3);
        offer1.setJobOpening(jdOpen);
        offer1.setProposedSalary(new BigDecimal("72000"));
        offer1.setJoiningDate(LocalDate.of(2026, 4, 7));
        offer1.setStatus(OfferStatus.ACCEPTED);
        offer1.setSentAt(LocalDateTime.of(2026, 3, 15, 10, 0));
        offer1.setRespondedAt(LocalDateTime.of(2026, 3, 18, 14, 0));
        offer1.setExpiresAt(LocalDate.of(2026, 3, 25));
        offer1.setGeneratedBy(hrOwner);
        offer1.setSalaryStructureSnapshot("{\"baseSalary\":60000,\"hra\":24000,\"da\":6000,\"travelAllowance\":3600,\"otherAllowances\":2400}");
        offer1.setCreatedBy("SYSTEM");
        offerLetterRepository.save(offer1);
    }

    private JobOpening createJobOpening(String title, String description,
                                        Department dept, JobPosition pos, Employee hrOwner,
                                        JobOpeningStatus status, int slots, LocalDate closing,
                                        BigDecimal salaryMin, BigDecimal salaryMax) {
        JobOpening jo = new JobOpening();
        jo.setTitle(title);
        jo.setDescription(description);
        jo.setDepartment(dept);
        jo.setJobPosition(pos);
        jo.setHrOwner(hrOwner);
        jo.setStatus(status);
        jo.setOpenSlots(slots);
        jo.setClosingDate(closing);
        jo.setSalaryMin(salaryMin);
        jo.setSalaryMax(salaryMax);
        jo.setCreatedBy("SYSTEM");
        return jobOpeningRepository.save(jo);
    }

    private Candidate createCandidate(JobOpening opening, String fullName, String email,
                                      String phone, CandidateSource source, CandidateStatus status,
                                      String coverNote) {
        Candidate c = new Candidate();
        c.setJobOpening(opening);
        c.setFullName(fullName);
        c.setEmail(email);
        c.setPhone(phone);
        c.setSource(source);
        c.setStatus(status);
        c.setCoverNote(coverNote);
        c.setCreatedBy("SYSTEM");
        return candidateRepository.save(c);
    }

    private InterviewSchedule createInterviewSchedule(Candidate candidate, Employee interviewer,
                                                      int round, LocalDateTime scheduledAt,
                                                      InterviewMode mode, InterviewStatus status,
                                                      Integer score, String feedback) {
        InterviewSchedule is = new InterviewSchedule();
        is.setCandidate(candidate);
        is.setInterviewer(interviewer);
        is.setRoundNumber(round);
        is.setScheduledAt(scheduledAt);
        is.setMode(mode);
        is.setStatus(status);
        is.setScore(score);
        is.setFeedback(feedback);
        if (status == InterviewStatus.COMPLETED) {
            is.setCompletedAt(scheduledAt.plusHours(1));
        }
        is.setCreatedBy("SYSTEM");
        return interviewScheduleRepository.save(is);
    }

    // ─── Print Summary ────────────────────────────────────────────────────────

    private void printSeedSummary() {
        System.out.println("\n╔══════════════════════════════════════════════════════╗");
        System.out.println("║             WORKSPHERE — DATA SEED COMPLETE          ║");
        System.out.println("╚══════════════════════════════════════════════════════╝");
        System.out.println("  ► Roles        : SUPER_ADMIN, HR, MANAGER, EMPLOYEE, AUDITOR");
        System.out.println("  ► Departments  : Engineering, Human Resources, Quality Assurance");
        System.out.println("  ► Employees    : 8 (admin, hr_admin, manager, ashik, johndoe,");
        System.out.println("                       priya_nair, ravi_qa, auditor)");
        System.out.println("  ► Salary Structs: 11 (5 position-level + 6 employee-specific)");
        System.out.println("  ► Leave Policies: 4 (PTO, Sick, Maternity, Unpaid)");
        System.out.println("  ► Leave Balances: 12 (2 policies × 6 active employees)");
        System.out.println("  ► Leave Requests: 5");
        System.out.println("  ► Attendance    : ~3 weeks × 6 employees (Mon–Fri)");
        System.out.println("  ► Projects      : 2 (ENG-2026-001, QA-2026-001)");
        System.out.println("  ► Tasks         : 15 (all Kanban statuses + flagged)");
        System.out.println("  ► Task Comments : 8");
        System.out.println("  ► Company Assets: 14 (10 assigned, 2 unassigned + extras)");
        System.out.println("  ► Grievances    : 3 tickets with comments");
        System.out.println("  ► Notifications : 9");
        System.out.println("  ► Appraisals    : 7 (3 closed cycles + 4 pending Q1 2026)");
        System.out.println("  ► Payroll Records: 12 (Jan PAID + Feb PROCESSED × 6 employees)");
        System.out.println("  ► Job Openings  : 3 (2 OPEN, 1 DRAFT)");
        System.out.println("  ► Candidates    : 5 across 2 openings");
        System.out.println("  ► Interviews    : 5 schedules");
        System.out.println("  ► Offer Letters : 1 (ACCEPTED — Nikhil Sharma)");
        System.out.println("  ► Tax Slabs     : 6 (FY 2025-26 India New Regime)");
        System.out.println("  ► Public Holidays: 12");
        System.out.println("──────────────────────────────────────────────────────");
        System.out.println("  Credentials (password='password', admin uses 'admin123'):");
        System.out.println("    admin | hr_admin | auditor | manager");
        System.out.println("    ashik | johndoe  | priya_nair | ravi_qa");
        System.out.println("╚══════════════════════════════════════════════════════╝\n");
    }
}
