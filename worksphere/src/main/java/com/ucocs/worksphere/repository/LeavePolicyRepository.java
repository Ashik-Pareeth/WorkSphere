package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.LeavePolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeavePolicyRepository extends JpaRepository<LeavePolicy, UUID> {
    Optional<LeavePolicy> findByName(String name);
}