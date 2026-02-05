package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.entity.Role;
import com.ucocs.worksphere.repository.RoleRepository;
import com.ucocs.worksphere.service.RoleService;
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
    public void saveRole(@RequestBody Role role) {
        roleService.createRole(role);
    }

    @GetMapping
    public List<Role> getAllRoles() {
        return roleService.findAll();
    }
}
