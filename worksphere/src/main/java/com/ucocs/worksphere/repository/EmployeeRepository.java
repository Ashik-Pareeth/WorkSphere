package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.enums.EmployeeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
       @Query("SELECT DISTINCT e FROM Employee e " +
                     "LEFT JOIN FETCH e.department " +
                     "LEFT JOIN FETCH e.jobPosition " +
                     "LEFT JOIN FETCH e.roles " +
                     "LEFT JOIN FETCH e.manager " +
                     "LEFT JOIN FETCH e.workSchedule " +
                     "WHERE e.userName = :userName")
       Optional<Employee> findByUserName(@Param("userName") String userName);

       @Query("SELECT DISTINCT e FROM Employee e " +
                     "LEFT JOIN FETCH e.department " +
                     "LEFT JOIN FETCH e.jobPosition " +
                     "LEFT JOIN FETCH e.roles " +
                     "LEFT JOIN FETCH e.manager " +
                     "LEFT JOIN FETCH e.workSchedule " +
                     "WHERE e.email = :email")
       Optional<Employee> findByEmail(@Param("email") String email);

       // Grabs the employee and their lazy-loaded relationships in a single SQL query
       @Query("SELECT e FROM Employee e " +
                     "LEFT JOIN FETCH e.department " +
                     "LEFT JOIN FETCH e.jobPosition " +
                     "WHERE e.id = :id")
       Optional<Employee> findByIdWithDetails(@Param("id") UUID id);

       @Query("SELECT DISTINCT e FROM Employee e " +
                     "LEFT JOIN FETCH e.department " +
                     "LEFT JOIN FETCH e.jobPosition " +
                     "LEFT JOIN FETCH e.roles " +
                     "LEFT JOIN FETCH e.manager " +
                     "LEFT JOIN FETCH e.workSchedule " +
                     "WHERE e.employeeStatus = :status")
       List<Employee> findByEmployeeStatus(@Param("status") EmployeeStatus status);

       @Query("SELECT DISTINCT e FROM Employee e " +
                     "JOIN e.roles r " +
                     "LEFT JOIN FETCH e.roles " +
                     "WHERE r.roleName IN :roleNames")
       List<Employee> findByRoleNamesIn(@Param("roleNames") List<String> roleNames);
}