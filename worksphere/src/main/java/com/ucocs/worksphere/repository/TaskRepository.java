package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Task;
import com.ucocs.worksphere.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    // 1. Search by Code (e.g., "TSK-102")
    Optional<Task> findByTaskCode(String taskCode);

    // 2. Fetch My Tasks (Optimized with JOIN FETCH)
    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.assignedTo LEFT JOIN FETCH t.assigner WHERE t.assignedTo.id = :employeeId")
    List<Task> findByAssignedTo_Id(@Param("employeeId") UUID employeeId);

    // 3. Fetch Tasks I Assigned (Optimized with JOIN FETCH)
    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.assignedTo LEFT JOIN FETCH t.assigner WHERE t.assigner.id = :managerId")
    List<Task> findByAssigner_Id(@Param("managerId") UUID managerId);

    // 4. Fetch Tasks by Project
    List<Task> findByProject_Id(UUID projectId);

    // 5. Fetch Overdue Tasks (For Scheduler)
    @Query("SELECT t FROM Task t WHERE t.dueDate < CURRENT_TIMESTAMP AND t.status != 'COMPLETED' AND t.status != 'CANCELLED'")
    List<Task> findOverdueTasks();

    // 6. Generate Next Task Code
    Optional<Task> findTopByOrderByCreatedAtDesc();

    // 7. Get Single Task with Details
    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.assignedTo LEFT JOIN FETCH t.assigner WHERE t.id = :taskId")
    Optional<Task> findByIdWithRelations(@Param("taskId") UUID taskId);

    // --- ARCHITECTURE ADDITION ---
    // 8. Department View (For Manager Dashboard)
    // We apply your same optimization here so the Manager dashboard is fast.
    @Query("SELECT t FROM Task t " +
            "LEFT JOIN FETCH t.assignedTo " +
            "LEFT JOIN FETCH t.assigner " +
            "WHERE t.assignedTo.department.id = :deptId")
    List<Task> findAllByDepartmentId(@Param("deptId") UUID deptId);

    long countByAssignedTo_IdAndStatus(UUID employeeId, TaskStatus status);

    // 10. Fetch ALL Tasks with Relations (For Admin Global View)
    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.assignedTo LEFT JOIN FETCH t.assigner")
    List<Task> findAllWithRelations();
}