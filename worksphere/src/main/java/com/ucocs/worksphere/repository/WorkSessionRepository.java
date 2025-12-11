package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.WorkSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WorkSessionRepository extends JpaRepository<WorkSession, Long> {
    //isActive "true" so it only fetches active sessions
    Optional<WorkSession> findByEmployeeAndIsActiveTrue(Employee employee);

}
