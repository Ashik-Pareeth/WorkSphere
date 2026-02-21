package com.ucocs.worksphere.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "JobPosition")
public class JobPosition extends BaseEntity {
    @Column(unique = true, nullable = false)
    private String positionName;

}

