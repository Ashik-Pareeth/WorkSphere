package com.ucocs.worksphere.entity;

import com.ucocs.worksphere.enums.EmployeeStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Set;

@Setter
@Getter
@Entity
@Table(name = "employees")
public class Employee extends BaseEntity {

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String userName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(unique = true)
    private String phoneNumber;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private double salary;

    private String profilePic;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Enumerated(EnumType.STRING)
    private EmployeeStatus employeeStatus = EmployeeStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    private JobPosition jobPosition;

    @ManyToMany(fetch = FetchType.EAGER)
    private Set<Role> roles;

    @Column(nullable = true)
    private LocalDateTime joiningDate;

}
