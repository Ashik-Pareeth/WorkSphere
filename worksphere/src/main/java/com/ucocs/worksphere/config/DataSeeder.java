package com.ucocs.worksphere.config;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.enums.EmployeeStatus;
import com.ucocs.worksphere.repository.EmployeeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class DataSeeder implements CommandLineRunner {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(EmployeeRepository employeeRepository, PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Check if the table is empty
        if (employeeRepository.count() == 0) {
            Employee admin = new Employee();
            admin.setFirstName("Super");
            admin.setLastName("Admin");
            admin.setUserName("admin");
            admin.setEmail("admin@worksphere.com");
            admin.setPhoneNumber("0000000000"); // Dummy number
            admin.setSalary(0.0);
            admin.setCreatedBy("SYSTEM");

            // Critical: Set status to ACTIVE so they can login
            admin.setEmployeeStatus(EmployeeStatus.ACTIVE);

            // Critical: Encode the password
            admin.setPassword(passwordEncoder.encode("admin123"));

            // Initialize roles to empty to avoid NullPointerException in CustomUserDetailsService
            admin.setRoles(Collections.emptySet());

            employeeRepository.save(admin);

            System.out.println("---------------------------------------------");
            System.out.println("DATA SEEDER: Default Admin User Created");
            System.out.println("Username: admin");
            System.out.println("Password: admin123");
            System.out.println("---------------------------------------------");
        }
    }
}