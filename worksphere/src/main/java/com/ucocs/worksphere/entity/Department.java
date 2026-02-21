package com.ucocs.worksphere.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@Entity
@Table(name = "departments")
public class Department extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "department")
    @JsonIgnore
    private List<Employee> employees = new ArrayList<>();

    // --- Constructors ---
    public Department() {}

    public Department(String name, String description) {
        this.name = name;
        this.description = description;
    }

    // --- Getters and Setters ---
    // Note: ID, CreatedAt, UpdatedAt are handled by BaseEntity

}