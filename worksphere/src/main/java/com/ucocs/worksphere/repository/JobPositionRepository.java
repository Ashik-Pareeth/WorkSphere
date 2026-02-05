package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.JobPosition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface JobPositionRepository extends JpaRepository<JobPosition, UUID> {
}

