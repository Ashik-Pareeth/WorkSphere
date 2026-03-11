package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.TaxSlabConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaxSlabConfigRepository extends JpaRepository<TaxSlabConfig, UUID> {

    List<TaxSlabConfig> findByFinancialYearOrderByMinIncomeAsc(String financialYear);
}
