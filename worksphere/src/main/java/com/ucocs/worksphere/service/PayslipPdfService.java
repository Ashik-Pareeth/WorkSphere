package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.PayrollRecord;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.*;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.Locale;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

/**
 * Generates payslip PDF documents from PayrollRecord data.
 * Uses openhtmltopdf to render an HTML template into a PDF file.
 */
@Slf4j
@Service
public class PayslipPdfService {

    private static final String PAYSLIP_BASE_DIR = "uploads/payslips";

    /**
     * Generate a payslip PDF for the given payroll record and return the file path.
     */
    public String generatePayslip(PayrollRecord record, Employee employee) {
        try {
            // Build the directory structure: uploads/payslips/{year}/{month}/
            String dirPath = String.format("%s/%d/%02d", PAYSLIP_BASE_DIR, record.getYear(), record.getMonth());
            Path dir = Paths.get(dirPath);
            Files.createDirectories(dir);

            String fileName = employee.getId().toString() + ".pdf";
            Path filePath = dir.resolve(fileName);

            String html = buildPayslipHtml(record, employee);

            try (OutputStream os = new FileOutputStream(filePath.toFile())) {
                PdfRendererBuilder builder = new PdfRendererBuilder();
                builder.useFastMode();
                builder.withHtmlContent(html, null);
                builder.toStream(os);
                builder.run();
            }

            log.info("Generated payslip PDF: {}", filePath);
            return filePath.toString().replace("\\", "/");
        } catch (Exception e) {
            log.error("Failed to generate payslip for employee {}: {}", employee.getId(), e.getMessage(), e);
            throw new RuntimeException("Payslip generation failed", e);
        }
    }

    private String buildPayslipHtml(PayrollRecord record, Employee employee) {
        String monthName = Month.of(record.getMonth()).getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        String empName = employee.getFirstName() + " " + employee.getLastName();
        String department = employee.getDepartment() != null ? employee.getDepartment().getName() : "N/A";
        String position = employee.getJobPosition() != null ? employee.getJobPosition().getPositionName() : "N/A";

        return """
                <!DOCTYPE html>
                <html>
                <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
                    .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
                    .header h1 { margin: 0; color: #1e40af; font-size: 24px; }
                    .header p { margin: 5px 0; color: #64748b; font-size: 12px; }
                    .info-grid { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .info-section { width: 48%%; }
                    .info-section table { width: 100%%; border-collapse: collapse; }
                    .info-section td { padding: 4px 8px; font-size: 12px; }
                    .info-section td:first-child { font-weight: bold; color: #475569; width: 40%%; }
                    .pay-table { width: 100%%; border-collapse: collapse; margin-top: 15px; }
                    .pay-table th { background: #2563eb; color: white; text-align: left; padding: 10px; font-size: 12px; }
                    .pay-table td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
                    .pay-table tr:nth-child(even) { background: #f8fafc; }
                    .total-row { font-weight: bold; background: #eff6ff !important; }
                    .total-row td { border-top: 2px solid #2563eb; font-size: 13px; }
                    .footer { margin-top: 30px; text-align: center; color: #94a3b8; font-size: 10px; }
                    .net-pay-box { background: #2563eb; color: white; text-align: center; padding: 15px; margin-top: 15px; border-radius: 6px; }
                    .net-pay-box .label { font-size: 12px; opacity: 0.9; }
                    .net-pay-box .amount { font-size: 28px; font-weight: bold; }
                </style>
                </head>
                <body>
                    <div class="header">
                        <h1>WorkSphere</h1>
                        <p>Payslip for %s %d</p>
                    </div>

                    <table style="width:100%%; border-collapse:collapse; margin-bottom:15px;">
                        <tr>
                            <td style="padding:4px 8px; font-size:12px; width:15%%; font-weight:bold; color:#475569;">Employee</td>
                            <td style="padding:4px 8px; font-size:12px; width:35%%;">%s</td>
                            <td style="padding:4px 8px; font-size:12px; width:15%%; font-weight:bold; color:#475569;">Employee ID</td>
                            <td style="padding:4px 8px; font-size:12px; width:35%%;">%s</td>
                        </tr>
                        <tr>
                            <td style="padding:4px 8px; font-size:12px; font-weight:bold; color:#475569;">Department</td>
                            <td style="padding:4px 8px; font-size:12px;">%s</td>
                            <td style="padding:4px 8px; font-size:12px; font-weight:bold; color:#475569;">Designation</td>
                            <td style="padding:4px 8px; font-size:12px;">%s</td>
                        </tr>
                        <tr>
                            <td style="padding:4px 8px; font-size:12px; font-weight:bold; color:#475569;">Working Days</td>
                            <td style="padding:4px 8px; font-size:12px;">%d</td>
                            <td style="padding:4px 8px; font-size:12px; font-weight:bold; color:#475569;">Present</td>
                            <td style="padding:4px 8px; font-size:12px;">%d</td>
                        </tr>
                        <tr>
                            <td style="padding:4px 8px; font-size:12px; font-weight:bold; color:#475569;">LOP Days</td>
                            <td style="padding:4px 8px; font-size:12px;">%d</td>
                            <td style="padding:4px 8px; font-size:12px;"></td>
                            <td style="padding:4px 8px; font-size:12px;"></td>
                        </tr>
                    </table>

                    <table class="pay-table">
                        <tr><th style="width:60%%">Earnings</th><th style="text-align:right">Amount (INR)</th></tr>
                        <tr><td>Gross Pay</td><td style="text-align:right">%s</td></tr>
                    </table>

                    <table class="pay-table" style="margin-top:10px;">
                        <tr><th style="width:60%%">Deductions</th><th style="text-align:right">Amount (INR)</th></tr>
                        <tr><td>LOP Deduction</td><td style="text-align:right">%s</td></tr>
                        <tr><td>Provident Fund (Employee)</td><td style="text-align:right">%s</td></tr>
                        <tr><td>Tax Deduction (TDS)</td><td style="text-align:right">%s</td></tr>
                        <tr><td>Professional Tax</td><td style="text-align:right">%s</td></tr>
                        <tr><td>Other Deductions</td><td style="text-align:right">%s</td></tr>
                    </table>

                    <div class="net-pay-box">
                        <div class="label">Net Pay</div>
                        <div class="amount">INR %s</div>
                    </div>

                    <div class="footer">
                        <p>This is a system-generated payslip. No signature required.</p>
                        <p>WorkSphere HCM — Confidential</p>
                    </div>
                </body>
                </html>
                """
                .formatted(
                        monthName, record.getYear(),
                        empName, employee.getUserName(),
                        department, position,
                        record.getWorkingDays(), record.getPresentDays(),
                        record.getLopDays(),
                        formatCurrency(record.getGrossPay()),
                        formatCurrency(record.getLopDeduction()),
                        formatCurrency(record.getPfDeduction()),
                        formatCurrency(record.getTaxDeduction()),
                        formatCurrency(record.getProfessionalTax()),
                        formatCurrency(record.getOtherDeductions()),
                        formatCurrency(record.getNetPay()));
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null)
            return "0.00";
        return String.format("%,.2f", amount);
    }
}
