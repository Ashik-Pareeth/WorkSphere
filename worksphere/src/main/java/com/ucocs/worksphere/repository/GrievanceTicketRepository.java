package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.GrievanceTicket;
import com.ucocs.worksphere.enums.GrievanceCategory;
import com.ucocs.worksphere.enums.GrievancePriority;
import com.ucocs.worksphere.enums.GrievanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GrievanceTicketRepository extends JpaRepository<GrievanceTicket, UUID> {

    @Query("SELECT DISTINCT g FROM GrievanceTicket g " +
           "LEFT JOIN FETCH g.raisedBy " +
           "LEFT JOIN FETCH g.department " +
           "WHERE g.ticketNumber = :ticketNumber")
    Optional<GrievanceTicket> findByTicketNumber(@Param("ticketNumber") String ticketNumber);

    @Query("SELECT DISTINCT g FROM GrievanceTicket g " +
           "LEFT JOIN FETCH g.raisedBy " +
           "LEFT JOIN FETCH g.department " +
           "WHERE g.raisedBy = :raisedBy")
    List<GrievanceTicket> findByRaisedBy(@Param("raisedBy") Employee raisedBy);

    @Query("SELECT DISTINCT g FROM GrievanceTicket g " +
           "LEFT JOIN FETCH g.raisedBy " +
           "LEFT JOIN FETCH g.department " +
           "WHERE g.status = :status")
    List<GrievanceTicket> findByStatus(@Param("status") GrievanceStatus status);

    @Query("SELECT DISTINCT g FROM GrievanceTicket g " +
           "LEFT JOIN FETCH g.raisedBy " +
           "LEFT JOIN FETCH g.department " +
           "WHERE g.category = :category")
    List<GrievanceTicket> findByCategory(@Param("category") GrievanceCategory category);

    @Query("SELECT DISTINCT g FROM GrievanceTicket g " +
           "LEFT JOIN FETCH g.raisedBy " +
           "LEFT JOIN FETCH g.department " +
           "WHERE g.priority = :priority")
    List<GrievanceTicket> findByPriority(@Param("priority") GrievancePriority priority);

    @Query("SELECT DISTINCT g FROM GrievanceTicket g " +
           "LEFT JOIN FETCH g.raisedBy " +
           "LEFT JOIN FETCH g.department " +
           "WHERE g.assignedTo = :assignedTo")
    List<GrievanceTicket> findByAssignedTo(@Param("assignedTo") UUID assignedTo);

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(g.ticketNumber, 9) AS int)), 0) FROM GrievanceTicket g WHERE g.ticketNumber LIKE :yearPrefix")
    int findMaxSequenceForYear(@Param("yearPrefix") String yearPrefix);

    @Query("SELECT DISTINCT g FROM GrievanceTicket g " +
           "LEFT JOIN FETCH g.raisedBy " +
           "LEFT JOIN FETCH g.department " +
           "WHERE g.raisedBy = :raisedBy " +
           "ORDER BY g.createdAt DESC")
    List<GrievanceTicket> findByRaisedByOrderByCreatedAtDesc(@Param("raisedBy") Employee raisedBy);
}
