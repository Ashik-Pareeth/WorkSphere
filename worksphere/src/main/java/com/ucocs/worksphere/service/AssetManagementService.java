package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.hr.*;
import com.ucocs.worksphere.entity.CompanyAsset;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.enums.*;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.CompanyAssetRepository;
import com.ucocs.worksphere.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssetManagementService {

    private final CompanyAssetRepository assetRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    /**
     * Register a new company asset.
     */
    @Transactional
    public AssetResponse createAsset(AssetCreateRequest request, String performedByUsername) {
        Employee performer = resolveEmployee(performedByUsername);
        String assetTag = generateAssetTag(request.getType());

        CompanyAsset asset = new CompanyAsset();
        asset.setAssetTag(assetTag);
        asset.setType(request.getType());
        asset.setMakeModel(request.getMakeModel());
        asset.setSerialNumber(request.getSerialNumber());
        asset.setPurchaseDate(request.getPurchaseDate());
        asset.setWarrantyExpiry(request.getWarrantyExpiry());
        asset.setCondition(request.getCondition() != null ? request.getCondition() : AssetCondition.NEW);
        asset.setNotes(request.getNotes());

        CompanyAsset saved = assetRepository.save(asset);

        auditService.log("CompanyAsset", saved.getId(), AuditAction.CREATED,
                performer.getId(), null, assetTag);

        log.info("Asset created: {} ({})", assetTag, request.getMakeModel());
        return toResponse(saved);
    }

    /**
     * Get all assets.
     */
    @Transactional(readOnly = true)
    public List<AssetResponse> getAllAssets() {
        return assetRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get assets by type.
     */
    @Transactional(readOnly = true)
    public List<AssetResponse> getAssetsByType(AssetType type) {
        return assetRepository.findByType(type).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all assets assigned to a specific employee by ID.
     */
    @Transactional(readOnly = true)
    public List<AssetResponse> getAssetsForEmployee(UUID employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + employeeId));

        return assetRepository.findByEmployee(employee).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all assets for the currently authenticated user by username.
     */
    @Transactional(readOnly = true)
    public List<AssetResponse> getAssetsForUsername(String username) {
        Employee employee = resolveEmployee(username);
        return assetRepository.findByEmployee(employee).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Assign an asset to an employee.
     */
    @Transactional
    public AssetResponse assignAsset(UUID assetId, AssetAssignRequest request, String performedByUsername) {
        Employee performer = resolveEmployee(performedByUsername);

        CompanyAsset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found: " + assetId));

        if (asset.getEmployee() != null) {
            throw new IllegalStateException(
                    "Asset " + asset.getAssetTag() + " is already assigned to another employee.");
        }

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + request.getEmployeeId()));

        asset.setEmployee(employee);
        asset.setAssignedAt(LocalDateTime.now());
        asset.setReturnedAt(null);

        if (request.getNotes() != null) {
            asset.setNotes(request.getNotes());
        }

        CompanyAsset saved = assetRepository.save(asset);

        auditService.log("CompanyAsset", saved.getId(), AuditAction.ASSIGNED,
                performer.getId(), null, "Assigned to " + employee.getFirstName() + " " + employee.getLastName());

        notificationService.send(
                employee.getId(),
                NotificationType.ASSET_ASSIGNED,
                "Asset Assigned: " + asset.getAssetTag(),
                "You have been assigned " + asset.getMakeModel() + " (" + asset.getAssetTag() + ")",
                asset.getId(),
                "CompanyAsset");

        log.info("Asset {} assigned to employee {}", asset.getAssetTag(), employee.getId());
        return toResponse(saved);
    }

    /**
     * Record the return of an asset with condition update.
     */
    @Transactional
    public AssetResponse returnAsset(UUID assetId, AssetReturnRequest request, String performedByUsername) {
        Employee performer = resolveEmployee(performedByUsername);

        CompanyAsset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found: " + assetId));

        if (asset.getEmployee() == null) {
            throw new IllegalStateException("Asset " + asset.getAssetTag() + " is not currently assigned.");
        }

        String previousAssignee = asset.getEmployee().getFirstName() + " " + asset.getEmployee().getLastName();

        asset.setCondition(request.getCondition());
        asset.setReturnedAt(LocalDateTime.now());
        asset.setEmployee(null);

        if (request.getNotes() != null) {
            String existingNotes = asset.getNotes() != null ? asset.getNotes() + "\n" : "";
            asset.setNotes(existingNotes + "Return note: " + request.getNotes());
        }

        CompanyAsset saved = assetRepository.save(asset);

        auditService.log("CompanyAsset", saved.getId(), AuditAction.RETURNED,
                performer.getId(), "Assigned to: " + previousAssignee,
                "Returned. Condition: " + request.getCondition());

        log.info("Asset {} returned by {}", asset.getAssetTag(), previousAssignee);
        return toResponse(saved);
    }

    /**
     * Check if all assets for an employee are returned (used by offboarding).
     */
    public boolean areAllAssetsReturned(UUID employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + employeeId));
        return assetRepository.findByEmployee(employee).isEmpty();
    }

    private Employee resolveEmployee(String username) {
        return employeeRepository.findByUserName(username)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + username));
    }

    private String generateAssetTag(AssetType type) {
        String prefix = switch (type) {
            case LAPTOP -> "WS-LT";
            case MONITOR -> "WS-MN";
            case KEYBOARD -> "WS-KB";
            case PHONE -> "WS-PH";
            case ACCESS_CARD -> "WS-AC";
            case OTHER -> "WS-OT";
        };
        long count = assetRepository.count() + 1;
        return String.format("%s-%04d", prefix, count);
    }

    private AssetResponse toResponse(CompanyAsset asset) {
        return AssetResponse.builder()
                .id(asset.getId())
                .assetTag(asset.getAssetTag())
                .type(asset.getType())
                .makeModel(asset.getMakeModel())
                .serialNumber(asset.getSerialNumber())
                .condition(asset.getCondition())
                .purchaseDate(asset.getPurchaseDate())
                .warrantyExpiry(asset.getWarrantyExpiry())
                .notes(asset.getNotes())
                .assignedEmployeeId(asset.getEmployee() != null ? asset.getEmployee().getId() : null)
                .assignedEmployeeName(asset.getEmployee() != null
                        ? asset.getEmployee().getFirstName() + " " + asset.getEmployee().getLastName()
                        : null)
                .assignedAt(asset.getAssignedAt())
                .createdAt(asset.getCreatedAt())
                .createdBy(asset.getCreatedBy())
                .updatedAt(asset.getUpdatedAt())
                .updatedBy(asset.getUpdatedBy())
                .build();
    }
}
