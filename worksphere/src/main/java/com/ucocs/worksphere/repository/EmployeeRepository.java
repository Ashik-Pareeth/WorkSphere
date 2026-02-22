package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    Optional<Employee> findByUserName(String userName);

    // Grabs the employee and their lazy-loaded relationships in a single SQL query
    @Query("SELECT e FROM Employee e " +
            "LEFT JOIN FETCH e.department " +
            "LEFT JOIN FETCH e.jobPosition " +
            "WHERE e.id = :id")
    Optional<Employee> findByIdWithDetails(@Param("id") UUID id);
}