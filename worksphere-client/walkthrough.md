# Walkthrough of the Appraisal-to-Payroll Changes

This document explains the exact changes made to connect WorkSphere's appraisal score with payroll generation.

## Problem Fixed

Before this change, `AppraisalService` calculated a reliable `finalScore` for completed appraisals, but `PayrollCalculationService` ignored that score entirely. Payroll generated `PayrollRecord` entries from salary, deductions, LOP, and overtime only.

The fix connects those modules so payroll can:

1. Find the employee's latest acknowledged appraisal.
2. Read its `finalScore`.
3. Convert that score into a monthly performance bonus.
4. Persist the score and bonus on the payroll record.
5. Include the bonus in net pay, API responses, HR screens, employee screens, and payslips.

## Files Changed

Backend:

```text
../worksphere/src/main/java/com/ucocs/worksphere/repository/PerformanceAppraisalRepository.java
../worksphere/src/main/java/com/ucocs/worksphere/entity/PayrollRecord.java
../worksphere/src/main/java/com/ucocs/worksphere/dto/hr/PayrollRecordResponse.java
../worksphere/src/main/java/com/ucocs/worksphere/service/PayrollCalculationService.java
../worksphere/src/main/java/com/ucocs/worksphere/service/PayslipPdfService.java
../worksphere/src/main/java/com/ucocs/worksphere/config/DataSeeder.java
```

Frontend:

```text
src/features/hr/PayrollDashboard.jsx
src/features/hr/MyCompensation.jsx
```

Documentation:

```text
walkthrough.md
```

## Backend Change Details

### 1. `PerformanceAppraisalRepository.java`

Added a Spring Data query method:

```java
Optional<PerformanceAppraisal> findFirstByEmployeeAndStatusAndFinalScoreIsNotNullAndReviewPeriodEndLessThanEqualOrderByReviewPeriodEndDesc(
        Employee employee,
        AppraisalStatus status,
        LocalDate reviewPeriodEnd);
```

Why:

Payroll needs the latest eligible appraisal for the employee. Eligible means:

- Same employee.
- Status is `ACKNOWLEDGED`.
- `finalScore` is not null.
- Appraisal review period ended on or before the payroll month end.

The ordering ensures the most recent valid appraisal is used.

### 2. `PayrollRecord.java`

Added two persisted fields:

```java
@Column(precision = 4, scale = 2)
private BigDecimal performanceScore;

@Column(nullable = false, precision = 12, scale = 2, columnDefinition = "numeric(12,2) default 0.00")
private BigDecimal performanceBonus = BigDecimal.ZERO;
```

Why:

Payroll records should snapshot the values used during calculation. If an appraisal changes later, old payroll records and payslips should not silently change.

Field behavior:

- `performanceScore` is nullable because an employee may not have an acknowledged appraisal.
- `performanceBonus` defaults to `0.00` because payroll arithmetic should always have a safe value.

### 3. `PayrollRecordResponse.java`

Added API response fields:

```java
private BigDecimal performanceScore;
private BigDecimal performanceBonus;
```

Why:

The frontend needs both values to explain the employee's pay:

- `performanceScore` tells HR/employee which score drove the bonus.
- `performanceBonus` shows the actual earning amount.

### 4. `PayrollCalculationService.java`

Added the repository dependency:

```java
private final PerformanceAppraisalRepository performanceAppraisalRepository;
```

Added constants for the bonus policy:

```java
private static final BigDecimal PERFORMANCE_BONUS_MIN_SCORE = new BigDecimal("3.00");
private static final BigDecimal PERFORMANCE_BONUS_MAX_SCORE = new BigDecimal("5.00");
private static final BigDecimal PERFORMANCE_BONUS_MAX_PERCENT = new BigDecimal("10.00");
```

Added the bonus calculation during `calculateForEmployee()`:

```java
PerformanceBonusResult performanceBonus = calculatePerformanceBonus(emp, grossPay, yearMonth);
```

Updated net pay:

```java
BigDecimal netPay = grossPay
        .add(overtimePay)
        .add(performanceBonus.amount())
        .subtract(lopDeduction)
        .subtract(pfDeduction)
        .subtract(taxDeduction)
        .subtract(professionalTax)
        .setScale(2, RoundingMode.HALF_UP);
```

Persisted the result:

```java
record.setPerformanceScore(performanceBonus.score());
record.setPerformanceBonus(performanceBonus.amount());
```

Mapped it into `PayrollRecordResponse`:

```java
.performanceScore(record.getPerformanceScore())
.performanceBonus(record.getPerformanceBonus() != null ? record.getPerformanceBonus() : BigDecimal.ZERO)
```

### 5. Performance Bonus Formula

The policy I implemented:

```text
score <= 3.00 = no bonus
score 5.00 = 10% of monthly gross pay
score between 3.00 and 5.00 = linearly scaled bonus
```

Formula:

```text
bonusPercent = ((min(finalScore, 5.00) - 3.00) / 2.00) * 10.00
performanceBonus = grossPay * bonusPercent / 100
```

Examples:

| Gross Pay | Score | Bonus Percent |    Bonus |
| --------- | ----: | ------------: | -------: |
| 100000.00 |  3.00 |         0.00% |     0.00 |
| 100000.00 |  4.00 |         5.00% |  5000.00 |
| 100000.00 |  4.65 |         8.25% |  8250.00 |
| 100000.00 |  5.00 |        10.00% | 10000.00 |

The score is capped at `5.00` for bonus purposes, so anything above 5 cannot exceed the 10% max.

### 6. `PayslipPdfService.java`

Updated payslip earnings calculation:

```java
BigDecimal totalEarnings = record.getGrossPay()
        .add(overtimePay)
        .add(performanceBonus);
```

Added a performance bonus row when the amount is greater than zero:

```text
Performance Bonus (Score x.xx/5)
```

Why:

Without this, the generated PDF would show a higher net pay but no visible earning component explaining the increase.

### 7. `DataSeeder.java`

Updated seeded payroll records to explicitly set:

```java
r.setPerformanceBonus(BigDecimal.ZERO);
```

Why:

Seeded historical payroll records should keep the old behavior and safely satisfy the new non-null field.

## Frontend Change Details

### 1. `PayrollDashboard.jsx`

Added:

```javascript
const performanceBonus = Number(r.performanceBonus || 0);
const totalEarnings = Number(r.grossPay || 0) + overtimePay + performanceBonus;
```

Updated the HR payroll table to show:

```text
+ Performance Bonus
```

Updated the expanded earnings breakdown to include:

```text
Performance Bonus (score/5)
```

Why:

HR users need to see the bonus as an earning component, not just a mysterious increase in net pay.

### 2. `MyCompensation.jsx`

Added:

```javascript
const performanceBonus = Number(r.performanceBonus || 0);
```

Updated employee compensation cards to show:

```text
+ performance bonus
Performance bonus: amount (score/5)
```

Why:

Employees can now understand how their acknowledged appraisal affected their compensation.

## Runtime Behavior After the Change

When HR generates payroll:

1. Payroll resolves gross pay from salary structure or employee salary.
2. Payroll calculates attendance, LOP, PF, tax, professional tax, and overtime.
3. Payroll looks up the latest acknowledged appraisal ending on or before the payroll month end.
4. If no appraisal exists, `performanceScore` is null and `performanceBonus` is `0.00`.
5. If an appraisal exists with score above `3.00`, payroll calculates the scaled bonus.
6. Payroll adds the bonus to net pay.
7. Payroll stores the score and bonus on `PayrollRecord`.
8. Payroll responses and payslips expose the stored values.

## Verification Performed

Backend verification:

```powershell
cd C:\Users\Ashik\MyProjects\UCOC_Project\worksphere
.\mvnw.cmd test
```

Result:

```text
BUILD SUCCESS
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
```

During this run, Hibernate also applied the two new columns locally because the project uses:

```properties
spring.jpa.hibernate.ddl-auto=update
```

Frontend verification:

```powershell
cd C:\Users\Ashik\MyProjects\UCOC_Project\worksphere-client
npm run build
```

Result:

```text
vite build completed successfully
```

The build still reports existing warnings about large chunks, font assets, and mixed static/dynamic imports. Those warnings were not caused by this change.

## Important Notes

- Only `ACKNOWLEDGED` appraisals affect payroll.
- Appraisals in `PENDING`, `IN_REVIEW`, or `REVIEWED` are ignored.
- Payroll uses the latest eligible appraisal as of the payroll month end.
- Old payroll records snapshot their score and bonus; they do not recalculate automatically.
- Existing payroll rows default to `0.00` bonus.
- If an HR user regenerates a `DRAFT` payroll record, the bonus is recalculated from the latest eligible appraisal.
