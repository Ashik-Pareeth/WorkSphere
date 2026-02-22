package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.WorkSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface WorkScheduleRepository extends JpaRepository<WorkSchedule, UUID> {
    // You can add custom finder methods here later if needed,
    // such as findByScheduleName(String name)
}