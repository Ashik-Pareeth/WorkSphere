package com.ucocs.worksphere.scheduler;

import com.ucocs.worksphere.dto.hr.PayrollGenerateRequest;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.enums.NotificationType;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.service.NotificationService;
import com.ucocs.worksphere.service.PayrollCalculationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Automatically generates DRAFT payroll records on the 25th of each month.
 * Sends a notification to HR users to review and process.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MonthlyPayrollDraftJob {

    private final PayrollCalculationService payrollCalculationService;
    private final EmployeeRepository employeeRepository;
    private final NotificationService notificationService;

    /**
     * Cron: at 9:00 AM on the 25th of every month.
     */
    @Scheduled(cron = "0 0 9 25 * ?")
    @Transactional
    public void generateMonthlyDrafts() {
        LocalDate now = LocalDate.now();
        int month = now.getMonthValue();
        int year = now.getYear();

        log.info("MonthlyPayrollDraftJob: Generating DRAFT payroll for {}/{}", month, year);

        try {
            PayrollGenerateRequest request = new PayrollGenerateRequest();
            request.setMonth(month);
            request.setYear(year);
            // null employeeIds = all active employees
            request.setEmployeeIds(null);

            var response = payrollCalculationService.generateForMonth(request, null);

            log.info("MonthlyPayrollDraftJob: Generated {} DRAFT records. Errors: {}", response.getRecords().size(),
                    response.getErrors().size());

            // Notify all HR/Admin users
            List<Employee> hrAdmins = employeeRepository.findByRoleNamesIn(List.of("HR", "ADMIN"));

            for (Employee hr : hrAdmins) {
                notificationService.send(
                        hr.getId(),
                        NotificationType.PAYSLIP_READY,
                        "Monthly Payroll Drafts Ready",
                        response.getRecords().size() + " payroll draft records for " + month + "/" + year
                                + " are ready for review and processing.",
                        null,
                        "PayrollRecord");
            }
        } catch (Exception e) {
            log.error("MonthlyPayrollDraftJob FAILED: {}", e.getMessage(), e);
        }
    }
}
