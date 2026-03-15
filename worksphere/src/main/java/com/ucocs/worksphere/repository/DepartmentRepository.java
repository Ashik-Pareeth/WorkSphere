package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    @Query("SELECT DISTINCT d FROM Department d " +
           "LEFT JOIN FETCH d.manager " +
           "WHERE d.name = :name")
    Optional<Department> findByName(@Param("name") String name);
    boolean existsByName(String name);
}