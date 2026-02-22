package com.ucocs.worksphere.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Setter
@Getter
@Entity
@Table(name = "public_holidays")
public class PublicHoliday extends BaseEntity {

    @Column(nullable = false, unique = true)
    private LocalDate date;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 100)
    private String applicableRegion; // Nullable. Null means it applies globally.
}