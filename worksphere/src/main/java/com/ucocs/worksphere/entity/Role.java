package com.ucocs.worksphere.entity;

import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "roles")
public class Role extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String roleName;


    public void setRoleName(String roleName) {
        if(roleName != null) {
            this.roleName = roleName.trim().toUpperCase();
        }else {
            this.roleName = null;
        }
    }


}
