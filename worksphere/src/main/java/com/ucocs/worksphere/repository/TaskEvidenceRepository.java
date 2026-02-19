package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.TaskEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface TaskEvidenceRepository extends JpaRepository<TaskEvidence, UUID> {

    // FIX: "Fetch Everything" eagerly to prevent LazyInitializationException
    @Query("SELECT te FROM TaskEvidence te " +
            "LEFT JOIN FETCH te.task " +
            "LEFT JOIN FETCH te.uploadedBy " +
            "WHERE te.task.id = :taskId")
    List<TaskEvidence> findAllByTaskId(@Param("taskId") UUID taskId);

    // Keep this for the boolean check (efficient)
    boolean existsByTask_Id(UUID taskId);
}