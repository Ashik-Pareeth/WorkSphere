package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.Role;
import com.ucocs.worksphere.enums.EmployeeStatus;
import com.ucocs.worksphere.repository.EmployeeRepository;
import jakarta.validation.constraints.NotNull;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;


@Service
public class CustomUserDetailsService implements UserDetailsService {
    private final EmployeeRepository employeeRepository;

    public CustomUserDetailsService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @Override
    public @NonNull UserDetails loadUserByUsername(@NonNull String userName) throws UsernameNotFoundException {
        Employee employee = employeeRepository.findByUserName(userName)
                .orElseThrow(() -> new UsernameNotFoundException("No User found with username:" + userName));

        String[] role = employee.getRoles().stream().map(Role::getRoleName).toArray(String[]::new);

        boolean isAccountAllowed = employee.getEmployeeStatus() != EmployeeStatus.RESIGNED &&
                employee.getEmployeeStatus() != EmployeeStatus.SUSPENDED &&
                employee.getEmployeeStatus() != EmployeeStatus.TERMINATED;

        return org.springframework.security.core.userdetails.User
                .withUsername(employee.getUserName())
                .password(employee.getPassword())
                .roles(role)
                .disabled(!isAccountAllowed)
                .build();

    }
}
