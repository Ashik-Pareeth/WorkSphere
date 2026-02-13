package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.TaskEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface TaskEvidenceRepository extends JpaRepository<TaskEvidence, UUID> {
    List<TaskEvidence> findByTask_Id(UUID taskId);
}