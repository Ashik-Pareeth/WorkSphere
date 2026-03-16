package com.ucocs.worksphere.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "roles")
public class Role extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String roleName;

    @Column(name = "is_exclusive", nullable = false)
    private boolean exclusive = false;

    public void setRoleName(String roleName) {
        if (roleName != null) {
            this.roleName = roleName.trim().toUpperCase();
        } else {
            this.roleName = null;
        }
    }
}