package com.ucocs.worksphere.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "roles")
public class Role extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String roleName;


    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }


    public String getRoleName() {
        return roleName;
    }
}
