# 🔍 SalaryStructure Usage Gap Analysis

## Current State

### SalaryStructure Entity ✅

```java
public class SalaryStructure extends BaseEntity {
    private BigDecimal baseSalary;      // Core salary
    private BigDecimal hra;            // House Rent Allowance
    private BigDecimal da;             // Dearness Allowance
    private BigDecimal travelAllowance;
    private BigDecimal otherAllowances;
    private Double pfEmployeePercent;
    private Double pfEmployerPercent;
    private BigDecimal professionalTax;
    private LocalDate effectiveDate;

    @OneToOne  // Links to Employee
    private Employee employee;

    @ManyToOne  // Template per position
    private JobPosition jobPosition;

    public BigDecimal computeGross() { /* sums all allowances */ }
}
```

### Hiring Flow vs SalaryStructure

```
OfferGenerationModal          FinalizeHireModal           Backend              Database
      ↓                             ↓                          ↓                    ↓
 proposedSalary (flat)   →   salary (flat)        →   Employee Created      ← SalaryStructure unused
                                                                             (created separately via PayrollController)
```

**Problem:**

- OfferGenerationModal: Takes only `proposedSalary` (number)
- FinalizeHireModal: Takes only `salary` (number)
- SalaryStructure: Exists but created AFTER hire finalization
- No breakdown (HRA, DA, deductions) in hiring flow

---

## Where SalaryStructure IS Used

✅ **PayrollController.java** (Lines 102-113)

```java
@PostMapping("/save-salary-structure")
public ResponseEntity<SalaryStructureResponse> saveSalaryStructure(
        @Valid @RequestBody SalaryStructureRequest request,
        @AuthenticationPrincipal UserDetails principal) {
    return new ResponseEntity<>(
        payrollCalculationService.saveSalaryStructure(request, performedBy),
        HttpStatus.CREATED);
}

@GetMapping("/salary-structure/{employeeId}")
public ResponseEntity<SalaryStructureResponse> getSalaryStructure(@PathVariable UUID employeeId) {
    return ResponseEntity.ok(payrollCalculationService.getSalaryStructure(employeeId));
}
```

**Current workflow:**

1. Candidate → Hired → Employee created with flat salary
2. Later: HR manually creates SalaryStructure via Payroll section

---

## Where SalaryStructure SHOULD Be Used (But Isn't)

### ❌ Missing in OfferGenerationModal

```jsx
// Current
<input type="number" placeholder="e.g. 85000" />

// Should be
1. Fetch job position details
2. Load SalaryStructure template for that position
3. Show breakdown: Base + HRA + DA + TA + Other
4. Let HR adjust components
5. Save as salaryStructureSnapshot in OfferLetter
```

### ❌ Missing in FinalizeHireModal

```jsx
// Current
<input type="number" value={salary} />

// Should be
1. Pre-fill from OfferLetter.proposedSalary
2. Fetch SalaryStructure template for JobPosition
3. Show breakdown with ability to adjust
4. Create SalaryStructure during hire finalization (not later)
```

---

## Two Options

### Option 1: **Keep Simple** (Current Approach) ✅ Quick

```
Offer Letter → Proposed Salary (flat)
             ↓
Finalize Hire → Employee Salary (flat)
             ↓
Later: HR manually creates SalaryStructure via Payroll UI

✅ Pros: No changes needed, works now
❌ Cons: Two-step process, no salary breakdown visibility during hiring
```

### Option 2: **Integrate SalaryStructure** (Recommended) 🎯 Better UX

```
OfferGenerationModal:
  ├─ Select JobOpening
  ├─ Fetch SalaryStructure template for JobPosition
  ├─ Show/edit breakdown (Base, HRA, DA, etc.)
  └─ Save as salaryStructureSnapshot in OfferLetter

FinalizeHireModal:
  ├─ Select JobPosition
  ├─ Fetch SalaryStructure template
  ├─ HR reviews/adjusts breakdown
  └─ Create SalaryStructure record + Employee in one transaction

✅ Pros: Complete hiring flow, salary breakdown visible, HR controls components
❌ Cons: More code changes, API additions needed
```

---

## Implementation: Option 2 (Recommended)

### Step 1: Backend - Add SalaryStructure to Hiring API

**New endpoint needed:**

```java
// PayrollController.java
@GetMapping("/salary-structure-template/{jobPositionId}")
public ResponseEntity<SalaryStructureResponse> getSalaryStructureTemplate(
        @PathVariable UUID jobPositionId) {
    // Find average/template SalaryStructure for this job position
    return ResponseEntity.ok(
        payrollCalculationService.getTemplateForJobPosition(jobPositionId)
    );
}
```

### Step 2: Frontend - Update OfferGenerationModal

```jsx
// OfferGenerationModal.jsx - UPDATED
import { fetchSalaryStructureTemplate } from '../../api/salaryApi';

const OfferGenerationModal = ({ candidate, onClose, onOfferGenerated }) => {
    const [formData, setFormData] = useState({
        candidateId: candidate?.id,
        jobOpeningId: candidate?.jobOpening?.id || '',
        baseSalary: '',
        hra: '',
        da: '',
        otherAllowances: '',
        joiningDate: ''
    });

    const [salaryTemplate, setSalaryTemplate] = useState(null);

    // Fetch salary structure when job opening changes
    useEffect(() => {
        if (formData.jobOpeningId) {
            const jobPosition = candidate?.jobOpening?.jobPosition;
            if (jobPosition?.id) {
                fetchSalaryStructureTemplate(jobPosition.id)
                    .then(data => setSalaryTemplate(data))
                    .catch(err => console.error(err));
            }
        }
    }, [formData.jobOpeningId]);

    // Pre-fill with template if available
    useEffect(() => {
        if (salaryTemplate) {
            setFormData(prev => ({
                ...prev,
                baseSalary: salaryTemplate.baseSalary || '',
                hra: salaryTemplate.hra || '',
                da: salaryTemplate.da || '',
                otherAllowances: salaryTemplate.otherAllowances || ''
            }));
        }
    }, [salaryTemplate]);

    return (
        <div className="...">
            {/* Salary Breakdown Section */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-blue-900 mb-3">Salary Breakdown</h4>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-sm font-medium">Base Salary</label>
                        <input
                            type="number"
                            name="baseSalary"
                            value={formData.baseSalary}
                            onChange={handleChange}
                            className="w-full..."
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">HRA</label>
                        <input
                            type="number"
                            name="hra"
                            value={formData.hra}
                            onChange={handleChange}
                            className="w-full..."
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">DA</label>
                        <input
                            type="number"
                            name="da"
                            value={formData.da}
                            onChange={handleChange}
                            className="w-full..."
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Other Allowances</label>
                        <input
                            type="number"
                            name="otherAllowances"
                            value={formData.otherAllowances}
                            onChange={handleChange}
                            className="w-full..."
                        />
                    </div>
                </div>

                {/* Total Gross */}
                <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-sm font-semibold">
                        Total Gross: ${(
                            (parseFloat(formData.baseSalary) || 0) +
                            (parseFloat(formData.hra) || 0) +
                            (parseFloat(formData.da) || 0) +
                            (parseFloat(formData.otherAllowances) || 0)
                        ).toFixed(2)}
                    </p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">
                    <Calendar className="inline h-4 w-4 mr-1" /> Expected Joining Date
                    <span className="text-red-500 ml-1">*</span>
                </label>
                <input type="date" name="joiningDate" ... />
            </div>

            {/* Note about templates */}
            <div className="bg-purple-50 p-3 rounded text-xs text-purple-700">
                📋 Salary structure auto-loaded from job position template. HR can adjust components above.
            </div>
        </div>
    );
};
```

### Step 3: Update FinalizeHireModal Similarly

```jsx
// FinalizeHireModal.jsx - UPDATED
useEffect(() => {
  if (isOpen && candidate) {
    const emp = candidate.convertedEmployee;
    if (emp) {
      setSalary(emp.salary || '');
      setUsername(emp.userName || '');
    }
    fetchFormData();

    // 🆕 Load salary structure template
    if (candidate?.jobOpening?.jobPosition?.id) {
      fetchSalaryStructureTemplate(candidate.jobOpening.jobPosition.id).then(
        (template) => setSalaryTemplate(template)
      );
    }
  }
}, [isOpen, candidate]);
```

### Step 4: Update Hiring Service

```java
// HiringService.java - UPDATED finalize hire
public Employee finalizeHire(FinalizeHireRequest request) {
    Candidate candidate = candidateRepository.findById(request.getCandidateId()).orElseThrow();
    Employee emp = candidate.getConvertedEmployee();

    emp.setSalary(request.getSalary());
    emp.setDepartment(departmentRepository.findById(request.getDepartmentId()).orElseThrow());
    emp.setJobPosition(jobPositionRepository.findById(request.getJobPositionId()).orElseThrow());
    emp.setWorkSchedule(workScheduleRepository.findById(request.getWorkScheduleId()).orElse(null));
    emp.setManager(employeeRepository.findById(request.getManagerId()).orElseThrow());
    emp.setEmployeeStatus(EmployeeStatus.ACTIVE);

    Employee saved = employeeRepository.save(emp);

    // 🆕 CREATE SALARY STRUCTURE HERE (not later!)
    SalaryStructure salaryStructure = new SalaryStructure();
    salaryStructure.setEmployee(saved);
    salaryStructure.setJobPosition(emp.getJobPosition());
    salaryStructure.setBaseSalary(new BigDecimal(request.getBaseSalary()));
    salaryStructure.setHra(new BigDecimal(request.getHra()));
    salaryStructure.setDa(new BigDecimal(request.getDa()));
    salaryStructure.setOtherAllowances(new BigDecimal(request.getOtherAllowances()));
    salaryStructure.setEffectiveDate(LocalDate.now());
    salaryStructureRepository.save(salaryStructure);

    // 🆕 Log the hire completion
    auditService.log("Employee", saved.getId(), AuditAction.CREATED,
        getCurrentUserId(), null,
        "Hired with salary structure: " + salaryStructure.computeGross(),
        "Employee finalized and onboarded");

    return saved;
}
```

---

## Summary

| Aspect                       | Current                   | Recommended                        |
| ---------------------------- | ------------------------- | ---------------------------------- |
| **Offer Generation**         | Flat salary only          | Show salary breakdown template     |
| **Finalization**             | Flat salary only          | Create full SalaryStructure        |
| **SalaryStructure Creation** | Manual (Payroll UI later) | Automated during hire finalization |
| **HR Visibility**            | Minimal                   | Full salary component breakdown    |
| **Audit Trail**              | ❌ Missing                | ✅ Full audit of salary offer      |

**Recommendation:** Implement Option 2 - it's only ~2-3 hours of work but significantly improves UX and completes the hiring flow.

---

**Last Updated:** 2026-04-16
