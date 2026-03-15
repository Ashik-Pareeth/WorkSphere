package com.ucocs.worksphere.scheduler;

import com.ucocs.worksphere.entity.CompanyAsset;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.enums.NotificationType;
import com.ucocs.worksphere.repository.CompanyAssetRepository;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Monthly job that flags company assets with warranties expiring within 30 days
 * and notifies HR administrators.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AssetWarrantyAlertJob {

    private final CompanyAssetRepository companyAssetRepository;
    private final EmployeeRepository employeeRepository;
    private final NotificationService notificationService;

    /**
     * Cron: at 7:00 AM on the 1st of every month.
     */
    @Scheduled(cron = "0 0 7 1 * ?")
    @Transactional(readOnly = true)
    public void checkExpiringWarranties() {
        log.info("AssetWarrantyAlertJob: Checking for expiring warranties...");

        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysOut = today.plusDays(30);

        List<CompanyAsset> allAssets = companyAssetRepository.findAll();
        List<CompanyAsset> expiringAssets = allAssets.stream()
                .filter(a -> a.getWarrantyExpiry() != null
                        && !a.getWarrantyExpiry().isBefore(today)
                        && !a.getWarrantyExpiry().isAfter(thirtyDaysOut))
                .toList();

        if (expiringAssets.isEmpty()) {
            log.info("AssetWarrantyAlertJob: No assets with expiring warranties found.");
            return;
        }

        log.info("AssetWarrantyAlertJob: Found {} assets with warranties expiring within 30 days.",
                expiringAssets.size());

        // Notify HR/Admin users
        List<Employee> hrAdmins = employeeRepository.findByRoleNamesIn(java.util.List.of("HR", "ADMIN"));

        String assetList = expiringAssets.stream()
                .map(a -> a.getAssetTag() + " (" + a.getMakeModel() + ") expires " + a.getWarrantyExpiry())
                .reduce((a, b) -> a + "; " + b)
                .orElse("");

        for (Employee hr : hrAdmins) {
            notificationService.send(
                    hr.getId(),
                    NotificationType.ASSET_ASSIGNED,
                    "Asset Warranty Expiring Soon",
                    expiringAssets.size() + " asset(s) have warranties expiring within 30 days: " + assetList,
                    null,
                    "CompanyAsset");
        }
    }
}
