package com.ucocs.worksphere.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Setter
@Getter
@Entity
@Table(name = "tax_slab_configs")
public class TaxSlabConfig extends BaseEntity {

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal minIncome;

    @Column(precision = 14, scale = 2)
    private BigDecimal maxIncome; // null means unlimited (top slab)

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal taxRate; // percentage, e.g. 5.00 for 5%

    @Column(nullable = false, length = 20)
    private String financialYear; // e.g. "2025-26"

    @Column(length = 100)
    private String description; // e.g. "5% slab"
}
