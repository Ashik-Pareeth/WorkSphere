package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.LeavePolicy;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.LeavePolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LeavePolicyService {

    private final LeavePolicyRepository leavePolicyRepository;

    public LeavePolicy createPolicy(LeavePolicy policy) {
        return leavePolicyRepository.save(policy);
    }

    public List<LeavePolicy> getAllPolicies() {
        return leavePolicyRepository.findAll();
    }

    public LeavePolicy getPolicyById(UUID id) {
        return leavePolicyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave Policy not found"));
    }
}