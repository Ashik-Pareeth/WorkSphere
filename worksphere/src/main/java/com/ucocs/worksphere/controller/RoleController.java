package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.entity.Role;
import com.ucocs.worksphere.repository.RoleRepository;
import com.ucocs.worksphere.service.RoleService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/roles")
@RestController
public class RoleController {
    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public void saveRole(@RequestBody Role role) {
        roleService.createRole(role);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Role> getAllRoles() {
        return roleService.findAll();
    }
}
