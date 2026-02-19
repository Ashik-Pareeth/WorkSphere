package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.TaskHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface TaskHistoryRepository extends JpaRepository<TaskHistory, Long> {
    // Find history for a specific task (Ordered by latest first)
    List<TaskHistory> findByTask_IdOrderByTimestampDesc(UUID taskId);
}