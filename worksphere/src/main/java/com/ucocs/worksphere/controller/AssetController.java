package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.hr.*;
import com.ucocs.worksphere.service.AssetManagementService;
import com.ucocs.worksphere.enums.AssetType;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/hr/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetManagementService assetService;

    /**
     * Get all assets. HR/Admin only.
     */
    @GetMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<AssetResponse>> getAllAssets(
            @RequestParam(required = false) AssetType type) {
        List<AssetResponse> assets = type != null ? assetService.getAssetsByType(type) : assetService.getAllAssets();
        return ResponseEntity.ok(assets);
    }

    /**
     * Register a new asset. HR/Admin only.
     */
    @PostMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<AssetResponse> createAsset(
            @Valid @RequestBody AssetCreateRequest request,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assetService.createAsset(request, auth.getName()));
    }

    /**
     * Assign asset to an employee. HR/Admin only.
     */
    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<AssetResponse> assignAsset(
            @PathVariable UUID id,
            @Valid @RequestBody AssetAssignRequest request,
            Authentication auth) {
        return ResponseEntity.ok(assetService.assignAsset(id, request, auth.getName()));
    }

    /**
     * Record return of an asset. HR/Admin only.
     */
    @PutMapping("/{id}/return")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<AssetResponse> returnAsset(
            @PathVariable UUID id,
            @Valid @RequestBody AssetReturnRequest request,
            Authentication auth) {
        return ResponseEntity.ok(assetService.returnAsset(id, request, auth.getName()));
    }

    /**
     * Get all assets assigned to a specific employee.
     * Accessible by HR/Admin or the employee themselves.
     */
    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasRole('HR') or #employeeId.toString() == authentication.name")
    public ResponseEntity<List<AssetResponse>> getEmployeeAssets(
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(assetService.getAssetsForEmployee(employeeId));
    }

    /**
     * Get assets assigned to the currently authenticated employee.
     */
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AssetResponse>> getMyAssets(Authentication auth) {
        return ResponseEntity.ok(assetService.getAssetsForUsername(auth.getName()));
    }
}

