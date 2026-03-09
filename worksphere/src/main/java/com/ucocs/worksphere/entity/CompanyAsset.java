package com.ucocs.worksphere.entity;

import com.ucocs.worksphere.enums.AssetCondition;
import com.ucocs.worksphere.enums.AssetType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name = "company_assets")
public class CompanyAsset extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String assetTag;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssetType type;

    @Column(nullable = false)
    private String makeModel;

    @Column(nullable = false, unique = true)
    private String serialNumber;

    private LocalDate purchaseDate;

    private LocalDate warrantyExpiry;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssetCondition condition = AssetCondition.NEW;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDateTime assignedAt;

    private LocalDateTime returnedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;
}
