package com.ucocs.worksphere.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "JobPosition")
public class JobPosition extends BaseEntity {
    @Column(unique = true, nullable = false)
    private String positionName;

    public String getPositionName() {
        return positionName;
    }

    public void setPositionName(String positionName) {
        this.positionName = positionName;
    }
}

