package com.ucocs.worksphere.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Setter
@Getter
@Entity
@Table(name = "JobPosition")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class JobPosition extends BaseEntity {
    @Column(unique = true, nullable = false)
    private String positionName;

    private Double salaryMin;
    private Double salaryMax;

    @Column(columnDefinition = "TEXT")
    private String requiredSkills;

    private Integer approvedSlots;

}
