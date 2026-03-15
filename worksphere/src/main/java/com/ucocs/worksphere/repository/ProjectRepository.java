package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Project;
import com.ucocs.worksphere.enums.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    boolean existsByProjectCode(String projectCode);

    @Query("SELECT DISTINCT p FROM Project p " +
           "LEFT JOIN FETCH p.department " +
           "LEFT JOIN FETCH p.manager " +
           "WHERE p.status = :status")
    List<Project> findByStatus(@Param("status") ProjectStatus status);

    @Query("SELECT DISTINCT p FROM Project p " +
           "LEFT JOIN FETCH p.department " +
           "LEFT JOIN FETCH p.manager " +
           "WHERE p.department.id = :departmentId")
    List<Project> findByDepartment_id(@Param("departmentId") UUID departmentId);
}