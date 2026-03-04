package com.ucocs.worksphere.scheduler;

import com.ucocs.worksphere.entity.LeaveBalance;
import com.ucocs.worksphere.entity.LeavePolicy;
import com.ucocs.worksphere.enums.LeaveTransactionType;
import com.ucocs.worksphere.repository.LeaveBalanceRepository;
import com.ucocs.worksphere.service.LeaveLedgerService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;

/**
 * Year-End Rollover Job (Phase 5).
 * Runs at midnight on January 1st every year.
 * For each employee's leave balance from the previous year:
 * 1. Calculate carry-forward days (min of daysAvailable,
 * policy.maxCarryForwardDays)
 * 2. If the policy allowsCarryForward AND there are leftover days, credit them
 * to the new year
 * 3. New year's balance starts fresh, with carry-forward applied as an ACCRUAL
 * transaction
 */
@Component
@RequiredArgsConstructor
public class YearEndRolloverJob {

    private static final Logger log = LoggerFactory.getLogger(YearEndRolloverJob.class);

    private final LeaveBalanceRepository balanceRepository;
    private final LeaveLedgerService leaveLedgerService;

    @Scheduled(cron = "0 0 0 1 1 *") // Midnight on January 1st
    @Transactional
    public void performYearEndRollover() {
        int previousYear = Year.now().getValue() - 1;
        int newYear = Year.now().getValue();

        log.info("[RolloverJob] Starting year-end rollover from {} to {}.", previousYear, newYear);

        List<LeaveBalance> lastYearBalances = balanceRepository.findByValidForYear(previousYear);

        int rolloverCount = 0;

        for (LeaveBalance oldBalance : lastYearBalances) {
            LeavePolicy policy = oldBalance.getLeavePolicy();

            // Skip if the policy does not allow carry-forward
            if (!Boolean.TRUE.equals(policy.getAllowsCarryForward())) {
                continue;
            }

            double availableDays = oldBalance.getDaysAvailable();
            if (availableDays <= 0) {
                continue; // Nothing to carry forward
            }

            // Cap carry-forward to the policy maximum
            double maxCF = policy.getMaxCarryForwardDays() != null ? policy.getMaxCarryForwardDays() : 0.0;
            double carryForwardDays = Math.min(availableDays, maxCF);

            if (carryForwardDays <= 0) {
                continue;
            }

            try {
                leaveLedgerService.adjustBalance(
                        oldBalance.getEmployee().getId(),
                        policy.getId(),
                        LeaveTransactionType.ACCRUAL,
                        carryForwardDays,
                        String.format("Year-end carry-forward from %d (%.1f days available, capped at %.1f)",
                                previousYear, availableDays, maxCF));
                rolloverCount++;
            } catch (Exception e) {
                log.error("[RolloverJob] Failed rollover for employee {} policy {}: {}",
                        oldBalance.getEmployee().getUserName(), policy.getName(), e.getMessage());
            }
        }

        log.info("[RolloverJob] Completed. Processed {} carry-forward transactions.", rolloverCount);
    }
}
