package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
}
