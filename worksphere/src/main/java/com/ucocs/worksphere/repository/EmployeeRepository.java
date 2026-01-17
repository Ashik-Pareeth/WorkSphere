package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    Optional<Employee> findByUserName(String userName);
}

