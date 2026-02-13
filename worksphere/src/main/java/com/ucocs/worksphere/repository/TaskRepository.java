package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    Optional<Task> findByTaskCode(String taskCode);

    // 1. YOUR FIX (For "My Tasks")
    // Fetches the Task + The Person doing it + The Manager who assigned it
    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.assignedTo LEFT JOIN FETCH t.assigner WHERE t.assignedTo.id = :employeeId")
    List<Task> findByAssignedTo_Id(@Param("employeeId") UUID employeeId);

    // 2. SAME FIX (For "Tasks I Assigned")
    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.assignedTo LEFT JOIN FETCH t.assigner WHERE t.assigner.id = :managerId")
    List<Task> findByAssigner_Id(@Param("managerId") UUID managerId);

    // ... keep the rest of your file (findByProject, findOverdueTasks, etc.) ...
    List<Task> findByProject_Id(UUID projectId);

    @Query("SELECT t FROM Task t WHERE t.dueDate < CURRENT_TIMESTAMP AND t.status != 'COMPLETED' AND t.status != 'CANCELLED'")
    List<Task> findOverdueTasks();

    Optional<Task> findTopByOrderByCreatedAtDesc();

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.assignedTo LEFT JOIN FETCH t.assigner WHERE t.id = :taskId")
    Optional<Task> findByIdWithRelations(@Param("taskId") UUID taskId);
}