package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.TaskEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TaskEvidenceRepository extends JpaRepository<TaskEvidence, UUID> {

    // Eagerly load the uploader, their department, and job position to satisfy the JSON serializer
    @Query("SELECT te FROM TaskEvidence te " +
            "LEFT JOIN FETCH te.uploadedBy u " +
            "LEFT JOIN FETCH u.department " +
            "LEFT JOIN FETCH u.jobPosition " +
            "WHERE te.task.id = :taskId")
    List<TaskEvidence> findAllByTaskId(@Param("taskId") UUID taskId);

    boolean existsByTask_Id(UUID taskId);
}