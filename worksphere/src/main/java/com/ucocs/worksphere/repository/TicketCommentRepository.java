package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.GrievanceTicket;
import com.ucocs.worksphere.entity.TicketComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TicketCommentRepository extends JpaRepository<TicketComment, UUID> {

    @Query("SELECT DISTINCT tc FROM TicketComment tc " +
           "LEFT JOIN FETCH tc.author " +
           "LEFT JOIN FETCH tc.ticket " +
           "WHERE tc.ticket = :ticket " +
           "ORDER BY tc.createdAt ASC")
    List<TicketComment> findByTicketOrderByCreatedAtAsc(@Param("ticket") GrievanceTicket ticket);

    @Query("SELECT DISTINCT tc FROM TicketComment tc " +
           "LEFT JOIN FETCH tc.author " +
           "LEFT JOIN FETCH tc.ticket " +
           "WHERE tc.ticket = :ticket AND tc.isInternal = false " +
           "ORDER BY tc.createdAt ASC")
    List<TicketComment> findByTicketAndIsInternalFalseOrderByCreatedAtAsc(@Param("ticket") GrievanceTicket ticket);
}
