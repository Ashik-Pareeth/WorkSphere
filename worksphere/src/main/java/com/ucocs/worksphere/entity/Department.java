package com.ucocs.worksphere.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@Entity
@Table(name = "departments")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Department extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_head_id")
    @JsonIgnore
    private Employee departmentHead;

    private Integer budgetedHeadcount;

    @OneToMany(mappedBy = "department")
    @JsonIgnore
    private List<Employee> employees = new ArrayList<>();

    // --- Constructors ---
    public Department() {
    }

    public Department(String name, String description) {
        this.name = name;
        this.description = description;
    }

    // --- Getters and Setters ---
    // Note: ID, CreatedAt, UpdatedAt are handled by BaseEntity

}