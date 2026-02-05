package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.Role;
import com.ucocs.worksphere.repository.RoleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoleService {
    private final RoleRepository roleRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    public void createRole(Role role) {
        roleRepository.save(role);
    }

    public List<Role> findAll() {
        return roleRepository.findAll();
    }
}
