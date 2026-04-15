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

@Slf4j
@Service
public class PayslipPdfService {

    private static final String PAYSLIP_BASE_DIR = "uploads/payslips";

    public String generatePayslip(PayrollRecord record, Employee employee) {
        try {
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

        BigDecimal overtimePay = record.getOvertimePay() != null ? record.getOvertimePay() : BigDecimal.ZERO;
        BigDecimal totalEarnings = record.getGrossPay().add(overtimePay);
        BigDecimal totalDeductions = record.getLopDeduction()
                .add(record.getPfDeduction())
                .add(record.getTaxDeduction())
                .add(record.getProfessionalTax())
                .add(record.getOtherDeductions());

        String overtimeRow = overtimePay.compareTo(BigDecimal.ZERO) > 0
                ? "<tr><td style='color:#059669;font-weight:600;'>Overtime Pay <span style='font-size:9px;color:#059669;'>(1.5x hourly rate)</span></td><td style='text-align:right;color:#059669;font-weight:700;'>"
                        + formatCurrency(overtimePay) + "</td></tr>"
                : "";

        return """
                <?xml version="1.0" encoding="UTF-8"?>
                <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
                    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
                <html xmlns="http://www.w3.org/1999/xhtml">
                <head>
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
                <style type="text/css">
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: Arial, sans-serif; color: #1e293b; background: #f4f6fa; padding: 28px; }
                    .slip { background: #fff; border: 1px solid #dde1e9; border-radius: 10px; overflow: hidden; font-size: 11px; }

                    .header { padding: 22px 28px 18px 28px; border-bottom: 2px solid #e8eaf2; }
                    .header-inner { display: table; width: 100%%; }
                    .header-left { display: table-cell; vertical-align: bottom; }
                    .header-right { display: table-cell; vertical-align: bottom; text-align: right; }
                    .brand { font-size: 20px; font-weight: bold; color: #1a1a2e; }
                    .brand-sub { font-size: 9px; color: #94a3b8; margin-top: 3px; letter-spacing: 1px; }
                    .period-badge { background: #f1f5ff; border: 1px solid #c7d2fe; border-radius: 6px; padding: 7px 14px; display: inline-block; text-align: right; }
                    .period-label { font-size: 9px; color: #6366f1; letter-spacing: 1px; font-weight: bold; }
                    .period-val { font-size: 16px; font-weight: bold; color: #1a1a2e; margin-top: 2px; }

                    .info-section { padding: 16px 28px 16px 28px; border-bottom: 1px solid #f1f5f9; }
                    .info-table { width: 100%%; border-collapse: collapse; }
                    .info-table td { padding: 5px 0; font-size: 11px; border-bottom: 1px dashed #f1f5f9; vertical-align: middle; }
                    .info-divider { width: 1px; background: #f1f5f9; padding: 0 10px; }
                    .info-lbl { color: #94a3b8; font-size: 10px; font-weight: bold; width: 110px; }
                    .info-val { color: #1e293b; font-weight: bold; }
                    .info-lbl-r { color: #94a3b8; font-size: 10px; font-weight: bold; width: 110px; padding-left: 20px; }
                    .info-val-r { color: #1e293b; font-weight: bold; }
                    .status-badge { background: #ecfdf5; color: #059669; border: 1px solid #6ee7b7; border-radius: 4px; padding: 2px 8px; font-size: 10px; font-weight: bold; }

                    .tables-section { padding: 16px 28px 16px 28px; border-bottom: 1px solid #f1f5f9; }
                    .tables-wrap { display: table; width: 100%%; border-collapse: separate; border-spacing: 16px 0; margin-left: -16px; margin-right: -16px; }
                    .tbl-cell { display: table-cell; width: 50%%; vertical-align: top; }
                    .tbl-title { font-size: 9px; font-weight: bold; color: #6366f1; margin-bottom: 8px; letter-spacing: 1px; }
                    table.pay-table { width: 100%%; border-collapse: collapse; border: 1px solid #e8eaf2; }
                    table.pay-table thead tr { background: #f8f9ff; }
                    table.pay-table th { padding: 7px 10px; font-size: 10px; font-weight: bold; color: #6366f1; text-align: left; border-bottom: 1px solid #e8eaf2; }
                    table.pay-table th.amount { text-align: right; }
                    table.pay-table td { padding: 6px 10px; font-size: 11px; color: #334155; border-bottom: 1px solid #f8fafc; }
                    table.pay-table td.amount { text-align: right; font-weight: bold; }
                    table.pay-table tbody tr:last-child td { border-bottom: none; }
                    table.pay-table tfoot td { padding: 7px 10px; font-size: 11px; font-weight: bold; background: #f8f9ff; border-top: 1px solid #e8eaf2; color: #1a1a2e; }
                    table.pay-table tfoot td.amount { text-align: right; color: #6366f1; }

                    .net-bar { margin: 0px 28px 18px 28px; background: #1a1a2e; border-radius: 8px; padding: 16px 20px; }
                    .net-bar-inner { display: table; width: 100%%; }
                    .net-left { display: table-cell; vertical-align: middle; }
                    .net-right { display: table-cell; vertical-align: middle; text-align: right; }
                    .net-lbl { font-size: 9px; color: #94a3b8; letter-spacing: 1px; font-weight: bold; }
                    .net-amt { font-size: 24px; font-weight: bold; color: #ffffff; margin-top: 4px; }
                    .net-row { font-size: 10px; color: #94a3b8; margin-top: 3px; }
                    .net-row-val { color: #c7d2fe; font-weight: bold; }

                    .footer { padding: 12px 28px 12px 28px; background: #f8f9ff; border-top: 1px solid #e8eaf2; }
                    .footer-inner { display: table; width: 100%%; }
                    .footer-left { display: table-cell; vertical-align: middle; }
                    .footer-right { display: table-cell; vertical-align: middle; text-align: right; }
                    .footer p { font-size: 9px; color: #94a3b8; }
                </style>
                </head>
                <body>
                <div class="slip">

                    <!-- Header -->
                    <div class="header">
                        <div class="header-inner">
                            <div class="header-left">
                                <div class="brand">WorkSphere</div>
                                <div class="brand-sub">OFFICIAL PAYSLIP &#8212; CONFIDENTIAL</div>
                            </div>
                            <div class="header-right">
                                <div class="period-badge">
                                    <div class="period-label">PAY PERIOD</div>
                                    <div class="period-val">%s %d</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Employee Info -->
                    <div class="info-section">
                        <table class="info-table">
                            <tr>
                                <td class="info-lbl">Employee Name</td>
                                <td class="info-val">%s</td>
                                <td class="info-divider">&#160;</td>
                                <td class="info-lbl-r">Working Days</td>
                                <td class="info-val-r">%d</td>
                            </tr>
                            <tr>
                                <td class="info-lbl">Employee ID</td>
                                <td class="info-val">%s</td>
                                <td class="info-divider">&#160;</td>
                                <td class="info-lbl-r">Present Days</td>
                                <td class="info-val-r">%d</td>
                            </tr>
                            <tr>
                                <td class="info-lbl">Department</td>
                                <td class="info-val">%s</td>
                                <td class="info-divider">&#160;</td>
                                <td class="info-lbl-r">LOP Days</td>
                                <td class="info-val-r">%d</td>
                            </tr>
                            <tr>
                                <td class="info-lbl">Designation</td>
                                <td class="info-val">%s</td>
                                <td class="info-divider">&#160;</td>
                                <td class="info-lbl-r">Pay Status</td>
                                <td class="info-val-r"><span class="status-badge">%s</span></td>
                            </tr>
                        </table>
                    </div>

                    <!-- Earnings and Deductions -->
                    <div class="tables-section">
                        <div class="tables-wrap">
                            <div class="tbl-cell">
                                <div class="tbl-title">EARNINGS</div>
                                <table class="pay-table">
                                    <thead>
                                        <tr><th>Component</th><th class="amount">Amount (INR)</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr><td>Basic / Gross Pay</td><td class="amount">%s</td></tr>
                                        %s
                                    </tbody>
                                    <tfoot>
                                        <tr><td>Total Earnings</td><td class="amount">%s</td></tr>
                                    </tfoot>
                                </table>
                            </div>
                            <div class="tbl-cell">
                                <div class="tbl-title">DEDUCTIONS</div>
                                <table class="pay-table">
                                    <thead>
                                        <tr><th>Component</th><th class="amount">Amount (INR)</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr><td>LOP Deduction</td><td class="amount">%s</td></tr>
                                        <tr><td>Provident Fund (Employee)</td><td class="amount">%s</td></tr>
                                        <tr><td>Tax Deduction (TDS)</td><td class="amount">%s</td></tr>
                                        <tr><td>Professional Tax</td><td class="amount">%s</td></tr>
                                        <tr><td>Other Deductions</td><td class="amount">%s</td></tr>
                                    </tbody>
                                    <tfoot>
                                        <tr><td>Total Deductions</td><td class="amount">%s</td></tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Net Pay -->
                    <div class="net-bar">
                        <div class="net-bar-inner">
                            <div class="net-left">
                                <div class="net-lbl">NET PAY (TAKE HOME)</div>
                                <div class="net-amt">INR %s</div>
                            </div>
                            <div class="net-right">
                                <div class="net-row">Total Earnings:&#160;<span class="net-row-val">INR %s</span></div>
                                <div class="net-row">Total Deductions:&#160;<span class="net-row-val">INR %s</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="footer">
                        <div class="footer-inner">
                            <div class="footer-left">
                                <p>System-generated payslip. No signature required.</p>
                            </div>
                            <div class="footer-right">
                                <p>WorkSphere HCM &#160;|&#160; Confidential</p>
                            </div>
                        </div>
                    </div>

                </div>
                </body>
                </html>
                """
                .formatted(
                        monthName, record.getYear(),
                        empName,
                        record.getWorkingDays(),
                        employee.getId().toString(),
                        record.getPresentDays(),
                        department,
                        record.getLopDays(),
                        position,
                        "PAID",
                        formatCurrency(record.getGrossPay()),
                        overtimeRow,
                        formatCurrency(totalEarnings),
                        formatCurrency(record.getLopDeduction()),
                        formatCurrency(record.getPfDeduction()),
                        formatCurrency(record.getTaxDeduction()),
                        formatCurrency(record.getProfessionalTax()),
                        formatCurrency(record.getOtherDeductions()),
                        formatCurrency(totalDeductions),
                        formatCurrency(record.getNetPay()),
                        formatCurrency(totalEarnings),
                        formatCurrency(totalDeductions));
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null)
            return "0.00";
        return String.format("%,.2f", amount);
    }
}