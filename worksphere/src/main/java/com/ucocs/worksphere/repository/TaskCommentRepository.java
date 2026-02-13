package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.TaskComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TaskCommentRepository extends JpaRepository<TaskComment, UUID>
{
    @Query("SELECT tc FROM TaskComment tc LEFT JOIN FETCH tc.author WHERE tc.task.id = :taskId ORDER BY tc.createdAt ASC")
    List<TaskComment> findByTask_IdOrderByCreatedAtAsc(@Param("taskId") UUID taskId);
}