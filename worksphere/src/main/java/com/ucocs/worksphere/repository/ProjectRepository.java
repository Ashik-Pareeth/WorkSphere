package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Project;
import com.ucocs.worksphere.enums.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    boolean existsByProjectCode(String projectCode);
    List<Project> findByStatus(ProjectStatus status);
    List<Project> findByDepartment_DepartmentId(Long departmentId);
}