package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.JobOpening;
import com.ucocs.worksphere.enums.JobOpeningStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JobOpeningRepository extends JpaRepository<JobOpening, UUID> {

    @Query("SELECT j FROM JobOpening j JOIN FETCH j.department JOIN FETCH j.jobPosition")
    List<JobOpening> findAllWithDetails();

    @Query("SELECT j FROM JobOpening j JOIN FETCH j.department JOIN FETCH j.jobPosition WHERE j.status = :status")
    List<JobOpening> findByStatusWithDetails(@Param("status") JobOpeningStatus status);

    List<JobOpening> findByStatus(JobOpeningStatus status);

    @Query("SELECT j FROM JobOpening j JOIN FETCH j.department JOIN FETCH j.jobPosition WHERE j.id = :id")
    Optional<JobOpening> findByIdWithDetails(@Param("id") UUID id);

}
