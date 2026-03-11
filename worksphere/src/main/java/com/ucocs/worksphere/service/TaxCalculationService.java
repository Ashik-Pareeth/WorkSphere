package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.TaxSlabConfig;
import com.ucocs.worksphere.repository.TaxSlabConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

/**
 * Calculates monthly TDS (Tax Deducted at Source) based on projected annual
 * income
 * and progressive tax slabs stored in TaxSlabConfig.
 *
 * Algorithm (Indian New Regime FY 2025-26):
 * 1. projectedAnnualGross = monthlyGross * 12
 * 2. Subtract standard deduction (INR 50,000)
 * 3. Subtract annual PF (employee share)
 * 4. Apply progressive slabs
 * 5. Add 4% Health & Education Cess
 * 6. Monthly TDS = annualTax / 12
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TaxCalculationService {

    private final TaxSlabConfigRepository taxSlabConfigRepository;

    private static final BigDecimal STANDARD_DEDUCTION = new BigDecimal("50000");
    private static final BigDecimal CESS_RATE = new BigDecimal("0.04"); // 4%
    private static final BigDecimal TWELVE = new BigDecimal("12");
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    /**
     * Calculate monthly TDS for an employee.
     *
     * @param monthlyGross     the monthly gross salary
     * @param annualPfEmployee total annual PF contribution by employee
     * @return monthly tax deduction (BigDecimal, rounded to 2 decimals)
     */
    public BigDecimal calculateMonthlyTax(BigDecimal monthlyGross, BigDecimal annualPfEmployee) {
        // Determine FY - April to March
        String fy = determineFinancialYear(LocalDate.now());

        List<TaxSlabConfig> slabs = taxSlabConfigRepository.findByFinancialYearOrderByMinIncomeAsc(fy);
        if (slabs.isEmpty()) {
            log.warn("No tax slabs configured for FY {}. Returning zero tax.", fy);
            return BigDecimal.ZERO;
        }

        // Step 1: Project annual gross
        BigDecimal annualGross = monthlyGross.multiply(TWELVE);

        // Step 2: Subtract standard deduction
        BigDecimal taxableIncome = annualGross.subtract(STANDARD_DEDUCTION);

        // Step 3: Subtract annual PF
        taxableIncome = taxableIncome.subtract(annualPfEmployee);

        if (taxableIncome.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        // Step 4: Apply progressive slabs
        BigDecimal totalTax = BigDecimal.ZERO;
        for (TaxSlabConfig slab : slabs) {
            if (taxableIncome.compareTo(slab.getMinIncome()) <= 0) {
                break;
            }

            BigDecimal slabUpperBound = slab.getMaxIncome() != null
                    ? slab.getMaxIncome()
                    : taxableIncome; // unlimited top slab

            BigDecimal taxableInSlab = taxableIncome.min(slabUpperBound)
                    .subtract(slab.getMinIncome())
                    .max(BigDecimal.ZERO);

            BigDecimal slabTax = taxableInSlab.multiply(slab.getTaxRate()).divide(HUNDRED, 2, RoundingMode.HALF_UP);
            totalTax = totalTax.add(slabTax);
        }

        // Step 5: Add 4% Health & Education Cess
        BigDecimal cess = totalTax.multiply(CESS_RATE).setScale(2, RoundingMode.HALF_UP);
        totalTax = totalTax.add(cess);

        // Step 6: Monthly TDS = annual / 12
        return totalTax.divide(TWELVE, 2, RoundingMode.HALF_UP);
    }

    /**
     * Determine the financial year string (e.g., "2025-26") from the current date.
     * Indian FY runs April to March.
     */
    private String determineFinancialYear(LocalDate date) {
        int year = date.getYear();
        if (date.getMonthValue() < 4) {
            // Jan-March belongs to previous FY
            return (year - 1) + "-" + String.valueOf(year).substring(2);
        } else {
            return year + "-" + String.valueOf(year + 1).substring(2);
        }
    }
}
