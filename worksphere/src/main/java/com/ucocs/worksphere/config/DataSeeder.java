package com.ucocs.worksphere.config;

import com.ucocs.worksphere.entity.*;
import com.ucocs.worksphere.enums.EmployeeStatus;
import com.ucocs.worksphere.repository.*;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.Set;

@Component
public class DataSeeder implements CommandLineRunner {

    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final JobPositionRepository jobPositionRepository;
    private final WorkScheduleRepository workScheduleRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(EmployeeRepository employeeRepository,
                      RoleRepository roleRepository,
                      DepartmentRepository departmentRepository,
                      JobPositionRepository jobPositionRepository,
                      WorkScheduleRepository workScheduleRepository,
                      PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.roleRepository = roleRepository;
        this.departmentRepository = departmentRepository;
        this.jobPositionRepository = jobPositionRepository;
        this.workScheduleRepository = workScheduleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String @NonNull ... args) throws
            Exception {
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
            engDept.setName("Engineering"); // Change "setName" to whatever your Department entity uses
            engDept.setCreatedBy("SYSTEM");
            engDept = departmentRepository.save(engDept);

            Department hrDept = new Department();
            hrDept.setName("Human Resources");
            hrDept.setCreatedBy("SYSTEM");
            hrDept = departmentRepository.save(hrDept);

            // 3. Seed Job Positions
            JobPosition managerPos = new JobPosition();
            managerPos.setPositionName("Engineering Manager"); // Change "setTitle" to whatever your JobPosition entity uses
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
            Role adminRole = createRoleIfNotFound("ADMIN");
            Role hrRole = createRoleIfNotFound("HR");
            Role managerRole = createRoleIfNotFound("MANAGER");
            Role employeeRole = createRoleIfNotFound("EMPLOYEE");

            // 5. Seed Employees

            // System Admin (No Dept)
            createEmployee("Super", "Admin", "admin", "admin@worksphere.com", "admin123",
                    null, null, adminRole, standardShift);

            // HR Admin
            createEmployee("Sarah", "Smith", "hr_admin", "hr@worksphere.com", "password",
                    hrDept, hrPos, hrRole, standardShift);

            // Engineering Manager
            createEmployee("Mike", "Johnson", "manager", "manager@worksphere.com", "password",
                    engDept, managerPos, managerRole, standardShift);

            // Normal Employee 1 (You!)
            createEmployee("Ashik", "Dev", "ashik", "ashik@worksphere.com", "password",
                    engDept, devPos, employeeRole, standardShift);

            // Normal Employee 2
            createEmployee("John", "Doe", "johndoe", "john@worksphere.com", "password",
                    engDept, devPos, employeeRole, standardShift);


            System.out.println("---------------------------------------------");
            System.out.println("DATA SEEDER: Mock Environment Generated");
            System.out.println("---------------------------------------------");
            System.out.println("Accounts created with password 'password' (except admin123):");
            System.out.println("- admin");
            System.out.println("- hr_admin");
            System.out.println("- manager");
            System.out.println("- ashik");
            System.out.println("- johndoe");
            System.out.println("---------------------------------------------");
        }
    }

    // Helper method to keep code clean
    private Role createRoleIfNotFound(String name) {
        return roleRepository.findByRoleName(name).orElseGet(() -> {
            Role role = new Role();
            role.setRoleName(name);
            role.setCreatedBy("SYSTEM");
            return roleRepository.save(role);
        });
    }

    // Helper method to easily spin up users
    private void createEmployee(String fName, String lName, String uName, String email, String pass,
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

        employeeRepository.save(emp);
    }
}