package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.LeavePolicy;
import com.ucocs.worksphere.enums.AuditAction;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.LeavePolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LeavePolicyService {

    private final LeavePolicyRepository leavePolicyRepository;
    private final AuditService auditService;
    private final EmployeeRepository employeeRepository;

    private UUID getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return employeeRepository.findByUserName(username).map(e -> e.getId()).orElse(null);
    }

    public LeavePolicy createPolicy(LeavePolicy policy) {
        LeavePolicy saved = leavePolicyRepository.save(policy);
        UUID performedBy = getCurrentUserId();
        if (performedBy != null) {
            auditService.log("LeavePolicy", saved.getId(), AuditAction.CREATED, performedBy, null, saved.getName());
        }
        return saved;
    }

    public List<LeavePolicy> getAllPolicies() {
        return leavePolicyRepository.findAll();
    }

    public LeavePolicy getPolicyById(UUID id) {
        return leavePolicyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave Policy not found"));
    }
}