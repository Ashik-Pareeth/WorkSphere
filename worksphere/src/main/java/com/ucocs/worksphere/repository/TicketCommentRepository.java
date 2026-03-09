package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.GrievanceTicket;
import com.ucocs.worksphere.entity.TicketComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TicketCommentRepository extends JpaRepository<TicketComment, UUID> {

    List<TicketComment> findByTicketOrderByCreatedAtAsc(GrievanceTicket ticket);

    List<TicketComment> findByTicketAndIsInternalFalseOrderByCreatedAtAsc(GrievanceTicket ticket);
}
