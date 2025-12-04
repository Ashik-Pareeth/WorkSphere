package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
}
