package com.ucocs.worksphere.config;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.Role;
import com.ucocs.worksphere.enums.EmployeeStatus;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class DataSeeder implements CommandLineRunner {

    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(EmployeeRepository employeeRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Check if the table is empty
        if (employeeRepository.count() == 0) {

            // FIX: Check if "ADMIN" role exists before creating it
            Role adminRole = roleRepository.findByRoleName("ADMIN")
                    .orElseGet(() -> {
                        Role newRole = new Role();
                        newRole.setRoleName("ADMIN");
                        // FIX: Manually set createdBy to satisfy the DB constraint
                        newRole.setCreatedBy("SYSTEM");
                        return roleRepository.save(newRole);
                    });

            Employee admin = new Employee();
            admin.setFirstName("Super");
            admin.setLastName("Admin");
            admin.setUserName("admin");
            admin.setEmail("admin@worksphere.com");
            admin.setPhoneNumber("0000000000");
            admin.setSalary(0.0);
            admin.setCreatedBy("SYSTEM"); // You were already doing it here
            admin.setEmployeeStatus(EmployeeStatus.ACTIVE);
            admin.setPassword(passwordEncoder.encode("admin123"));

            // Assign the found or created role
            admin.setRoles(Set.of(adminRole));

            employeeRepository.save(admin);


            System.out.println("---------------------------------------------");
            System.out.println("DATA SEEDER: Super Admin checked/created successfully");
            System.out.println("---------------------------------------------");
            System.out.println("Username: admin");
            System.out.println("Password: admin123");
            System.out.println("---------------------------------------------");
        }
    }
}