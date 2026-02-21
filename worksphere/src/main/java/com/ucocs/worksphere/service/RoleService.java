package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.Role;
import com.ucocs.worksphere.repository.RoleRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class RoleService {

    private final RoleRepository roleRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    //  CREATE
    public Role createRole(Role role) {
        return roleRepository.save(role);
    }

    // UPDATE
    public Role updateRole(UUID id, Role role) {

        Role existing = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        existing.setRoleName(role.getRoleName());

        return roleRepository.save(existing);
    }

    //  DELETE
    public void deleteRole(UUID id) {

        Role existing = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        roleRepository.delete(existing);
    }

    //  GET ALL
    public List<Role> findAll() {
        return roleRepository.findAll();
    }

    //  GET BY ID  ← this was missing
    public Role findById(UUID id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found"));
    }
}
