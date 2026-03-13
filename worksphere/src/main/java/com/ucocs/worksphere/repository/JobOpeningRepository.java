package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.JobOpening;
import com.ucocs.worksphere.enums.JobOpeningStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JobOpeningRepository extends JpaRepository<JobOpening, UUID> {
    List<JobOpening> findByStatus(JobOpeningStatus status);
}
