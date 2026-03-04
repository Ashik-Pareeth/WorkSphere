package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.LeaveBalanceDTO;
import com.ucocs.worksphere.dto.LeaveTransactionDTO;
import com.ucocs.worksphere.dto.ManualAdjustmentRequest;
import com.ucocs.worksphere.entity.LeaveBalance;
import com.ucocs.worksphere.entity.LeaveTransaction;
import com.ucocs.worksphere.service.LeaveLedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Year;
import java.util.List;

@RestController
@RequestMapping("/api/leave")
@RequiredArgsConstructor
public class LeaveLedgerController {

    private final LeaveLedgerService ledgerService;

    // 1. Employee checking their own balances
    @GetMapping("/my-balances")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<LeaveBalanceDTO>> getMyBalances(Principal principal) {
        int currentYear = Year.now().getValue();
        List<LeaveBalance> balances = ledgerService.getEmployeeBalances(principal.getName(), currentYear);
        List<LeaveBalanceDTO> dtos = balances.stream()
                .map(LeaveBalanceDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    // 2. Employee viewing their ledger history
    @GetMapping("/my-ledger")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<LeaveTransactionDTO>> getMyLedger(Principal principal) {
        List<LeaveTransaction> ledger = ledgerService.getEmployeeLedger(principal.getName());
        List<LeaveTransactionDTO> dtos = ledger.stream()
                .map(LeaveTransactionDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    // 3. HR Manually adjusting a balance (The DTO is kept inline for brevity)
    @PostMapping("/adjust-balance")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<LeaveBalanceDTO> adjustBalance(@RequestBody ManualAdjustmentRequest request) {
        LeaveBalance updatedBalance = ledgerService.adjustBalance(
                request.getEmployeeId(),
                request.getPolicyId(),
                request.getTransactionType(),
                request.getDays(),
                request.getReason());
        return ResponseEntity.ok(LeaveBalanceDTO.fromEntity(updatedBalance));
    }
}
