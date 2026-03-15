package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.JobOpening;
import com.ucocs.worksphere.enums.JobOpeningStatus;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@NullMarked
@Repository
public interface JobOpeningRepository extends JpaRepository<JobOpening, UUID> {

    @EntityGraph(attributePaths = {"department", "jobPosition", "hrOwner"})
    List<JobOpening> findByStatus(JobOpeningStatus status);

    @Override
    @EntityGraph(attributePaths = {"department", "jobPosition", "hrOwner"})
    Optional<JobOpening> findById(UUID id);

    @Override
    @EntityGraph(attributePaths = {"department", "jobPosition", "hrOwner"})
    List<JobOpening> findAll();
}
