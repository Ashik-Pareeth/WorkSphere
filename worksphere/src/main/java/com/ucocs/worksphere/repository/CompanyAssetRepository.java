package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.CompanyAsset;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.enums.AssetCondition;
import com.ucocs.worksphere.enums.AssetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanyAssetRepository extends JpaRepository<CompanyAsset, UUID> {

    Optional<CompanyAsset> findByAssetTag(String assetTag);

    Optional<CompanyAsset> findBySerialNumber(String serialNumber);

    List<CompanyAsset> findByEmployee(Employee employee);

    List<CompanyAsset> findByEmployeeIsNull();

    List<CompanyAsset> findByType(AssetType type);

    List<CompanyAsset> findByCondition(AssetCondition condition);

    List<CompanyAsset> findByWarrantyExpiryBetween(LocalDate start, LocalDate end);
}
