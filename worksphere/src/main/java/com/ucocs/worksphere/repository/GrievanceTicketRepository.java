package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.GrievanceTicket;
import com.ucocs.worksphere.enums.GrievanceCategory;
import com.ucocs.worksphere.enums.GrievancePriority;
import com.ucocs.worksphere.enums.GrievanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GrievanceTicketRepository extends JpaRepository<GrievanceTicket, UUID> {

    Optional<GrievanceTicket> findByTicketNumber(String ticketNumber);

    List<GrievanceTicket> findByRaisedBy(Employee raisedBy);

    List<GrievanceTicket> findByStatus(GrievanceStatus status);

    List<GrievanceTicket> findByCategory(GrievanceCategory category);

    List<GrievanceTicket> findByPriority(GrievancePriority priority);

    List<GrievanceTicket> findByAssignedTo(UUID assignedTo);

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(g.ticketNumber, 9) AS int)), 0) FROM GrievanceTicket g WHERE g.ticketNumber LIKE :yearPrefix")
    int findMaxSequenceForYear(String yearPrefix);

    List<GrievanceTicket> findByRaisedByOrderByCreatedAtDesc(Employee raisedBy);
}
