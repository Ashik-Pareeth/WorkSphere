package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.LeaveBalance;
import com.ucocs.worksphere.entity.LeavePolicy;
import com.ucocs.worksphere.entity.LeaveTransaction;
import com.ucocs.worksphere.enums.LeaveTransactionType;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.LeaveBalanceRepository;
import com.ucocs.worksphere.repository.LeavePolicyRepository;
import com.ucocs.worksphere.repository.LeaveTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LeaveLedgerService {

    private final LeaveBalanceRepository balanceRepository;
    private final LeaveTransactionRepository transactionRepository;
    private final EmployeeRepository employeeRepository;
    private final LeavePolicyRepository policyRepository;

    // 1. View Current Balances
    public List<LeaveBalance> getEmployeeBalances(String username, int year) {
        Employee employee = employeeRepository.findByUserName(username)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        return balanceRepository.findByEmployeeAndValidForYear(employee, year);
    }

    // 2. View Ledger History
    public List<LeaveTransaction> getEmployeeLedger(String username) {
        Employee employee = employeeRepository.findByUserName(username)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        return transactionRepository.findByEmployeeOrderByCreatedAtDesc(employee);
    }

    // 3. The Atomic Ledger Update
    @Transactional
    public LeaveBalance adjustBalance(UUID employeeId, UUID policyId, LeaveTransactionType type, double days, String reason) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        LeavePolicy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found"));

        int currentYear = Year.now().getValue();

        // Find existing balance or create a new one initialized to 0
        LeaveBalance balance = balanceRepository.findByEmployeeAndLeavePolicyAndValidForYear(employee, policy, currentYear)
                .orElseGet(() -> {
                    LeaveBalance newBalance = new LeaveBalance();
                    newBalance.setEmployee(employee);
                    newBalance.setLeavePolicy(policy);
                    newBalance.setValidForYear(currentYear);
                    newBalance.setDaysAllocated(0.0);
                    newBalance.setDaysUsed(0.0);
                    newBalance.setDaysAvailable(0.0);
                    return balanceRepository.save(newBalance);
                });

        // Apply the math based on transaction type
        if (type == LeaveTransactionType.ACCRUAL) {
            balance.setDaysAllocated(balance.getDaysAllocated() + days);
        } else if (type == LeaveTransactionType.DEDUCTION) {
            if (balance.getDaysAvailable() < days && !policy.getIsUnpaid()) {
                throw new IllegalStateException("Insufficient leave balance for deduction.");
            }
            balance.setDaysUsed(balance.getDaysUsed() + days);
        } else if (type == LeaveTransactionType.ADJUSTMENT) {
            // Can be positive (bonus days) or negative (penalty/correction)
            balance.setDaysAllocated(balance.getDaysAllocated() + days);
        }

        // Materialize the available days for quick reading
        balance.setDaysAvailable(balance.getDaysAllocated() - balance.getDaysUsed());
        LeaveBalance savedBalance = balanceRepository.save(balance);

        // ALWAYS WRITE THE TRANSACTION RECORD
        LeaveTransaction transaction = new LeaveTransaction();
        transaction.setEmployee(employee);
        transaction.setLeavePolicy(policy);
        transaction.setTransactionType(type);
        transaction.setDaysChanged(type == LeaveTransactionType.DEDUCTION ? -days : days);
        transaction.setReason(reason);
        transactionRepository.save(transaction);

        return savedBalance;
    }
}