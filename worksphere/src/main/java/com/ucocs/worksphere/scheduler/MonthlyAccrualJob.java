package com.ucocs.worksphere.scheduler;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.LeavePolicy;
import com.ucocs.worksphere.enums.EmployeeStatus;
import com.ucocs.worksphere.enums.LeaveTransactionType;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.LeavePolicyRepository;
import com.ucocs.worksphere.service.LeaveLedgerService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Monthly Accrual Engine (Phase 5).
 * Runs at midnight on the 1st of every month.
 * Automatically credits the monthly PTO allotment to every active employee's
 * balance.
 * Monthly accrual = (policy.defaultAnnualAllowance / 12).
 */
@Component
@RequiredArgsConstructor
public class MonthlyAccrualJob {

    private static final Logger log = LoggerFactory.getLogger(MonthlyAccrualJob.class);

    private final EmployeeRepository employeeRepository;
    private final LeavePolicyRepository policyRepository;
    private final LeaveLedgerService leaveLedgerService;

    @Scheduled(cron = "0 0 0 1 * *") // Midnight on the 1st of every month
    @Transactional
    public void accrueMontlyLeave() {
        List<Employee> activeEmployees = employeeRepository.findByEmployeeStatus(EmployeeStatus.ACTIVE);
        List<LeavePolicy> allPolicies = policyRepository.findAll();

        int accrualCount = 0;

        for (Employee emp : activeEmployees) {
            for (LeavePolicy policy : allPolicies) {
                // Skip unpaid leave types — they don't accrue
                if (Boolean.TRUE.equals(policy.getIsUnpaid())) {
                    continue;
                }

                double monthlyAccrual = policy.getDefaultAnnualAllowance() / 12.0;

                // Round to 2 decimal places to keep balances clean
                monthlyAccrual = Math.round(monthlyAccrual * 100.0) / 100.0;

                if (monthlyAccrual <= 0) {
                    continue;
                }

                try {
                    leaveLedgerService.adjustBalance(
                            emp.getId(),
                            policy.getId(),
                            LeaveTransactionType.ACCRUAL,
                            monthlyAccrual,
                            "Monthly auto-accrual");
                    accrualCount++;
                } catch (Exception e) {
                    log.error("[AccrualJob] Failed to accrue for employee {} policy {}: {}",
                            emp.getUserName(), policy.getName(), e.getMessage());
                }
            }
        }

        log.info("[AccrualJob] Completed. Processed {} accrual transactions for {} employees.",
                accrualCount, activeEmployees.size());
    }
}
