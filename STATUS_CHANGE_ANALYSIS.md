# Employee Status Change Implementation Review

## Current Implementation Status ❌

### What IS Implemented:
1. **Frontend Permission Check** ✅
   - Location: `worksphere-client/src/components/employees/EmployeeModal.jsx:424`
   - Uses `canManage(viewerRank, emp.roles)` to check authorization
   - Only HR role can change status via `@PreAuthorize("hasRole('HR')")`

2. **Frontend User Feedback** ✅
   - Toast notifications for success/error
   - Warning banner explaining access impact
   - Loading state during submission

3. **Backend Authorization** ✅
   - `@PreAuthorize("hasRole('HR')")` on endpoint

### Major Gaps - MISSING Implementations ❌

#### 1. **No Audit Logging**
- **Issue**: Status changes are NOT logged to AuditLog table
- **Impact**: No record of WHO changed status, WHEN, or FROM what status
- **Location**: `EmployeeService.updateEmployeeStatus()` (line 526)
- **Should Use**: `AuditService.log()` (exists at `service/AuditService.java` line 26)
- **Example**: `OffboardingService` correctly uses audit logging (line 161)

```java
// MISSING in updateEmployeeStatus():
auditService.log("Employee", id, AuditAction.UPDATED,
    performedBy.getId(), 
    employee.getEmployeeStatus().toString(),  // previous value
    status.toString());  // new value
```

#### 2. **No Notifications to Affected Employee**
- **Issue**: Employee is NOT notified when their status changes (SUSPENDED, TERMINATED, etc.)
- **Impact**: Employee doesn't know their access was revoked or reinstated
- **Location**: `EmployeeService.updateEmployeeStatus()` missing notification call
- **Should Use**: `NotificationService.send()` (exists and used in `AttendanceService`, `EmployeeActionService`, `CandidateService`)
- **Missing Logic**:

```java
// MISSING notifications based on status:
switch(status) {
    case SUSPENDED -> notificationService.send(
        employee.getId(),
        NotificationType.EMPLOYEE_STATUS_CHANGED,
        "Your account has been suspended"
    );
    case TERMINATED -> notificationService.send(
        employee.getId(),
        NotificationType.EMPLOYEE_STATUS_CHANGED,
        "Your employment has been terminated"
    );
    case ACTIVE -> notificationService.send(
        employee.getId(),
        NotificationType.EMPLOYEE_STATUS_CHANGED,
        "Your account has been reactivated"
    );
}
```

#### 3. **No Status Transition Validation**
- **Issue**: No validation of VALID state transitions
- **Impact**: Allows invalid transitions (e.g., SUSPENDED → PENDING)
- **Current Code** (line 526):
```java
public void updateEmployeeStatus(UUID id, EmployeeStatus status) {
    Employee employee = employeeRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
    employee.setEmployeeStatus(status);  // ❌ NO VALIDATION!
    employeeRepository.save(employee);
}
```

**Valid Transitions Should Be**:
- `PENDING` → `ACTIVE` (onboarding completion)
- `PENDING` → `INACTIVE` (rejected onboarding)
- `ACTIVE` → `SUSPENDED` (disciplinary action)
- `ACTIVE` → `INACTIVE` (forced leave/LOA)
- `ACTIVE` → `TERMINATED` (offboarding)
- `SUSPENDED` → `ACTIVE` (after reviewing suspension)
- `INACTIVE` → `ACTIVE` (reinstatement)

#### 4. **No Side Effects/Necessary Blocks**
- **Issue**: Changing status to SUSPENDED/TERMINATED doesn't revoke access
- **Missing Logic**:
  - Revoke active sessions/JWT tokens
  - Disable login credentials
  - Revoke API access
  - Notify managers if direct reports
  - Handle active tasks/assignments

#### 5. **No Response Feedback**
- **Issue**: Endpoint returns `204 No Content` (empty response)
- **Impact**: Client doesn't know final state; can't do optimistic updates
- **Current Code** (line 125):
```java
public ResponseEntity<Void> updateEmployeeStatus(...) {
    employeeService.updateEmployeeStatus(id, request.status());
    return ResponseEntity.noContent().build();  // ❌ EMPTY RESPONSE
}
```

**Should Return**:
```java
// Return the updated employee with confirmation
public ResponseEntity<EmployeeResponseDTO> updateEmployeeStatus(...) {
    Employee updated = employeeService.updateEmployeeStatus(id, request.status());
    return ResponseEntity.ok(toDTO(updated));
}
```

---

## Comparison: How EmployeeActionService Does It Correctly ✅

Location: `worksphere/src/main/java/com/ucocs/worksphere/service/EmployeeActionService.java` (lines 60-110)

✅ **Validates Status Transitions**
- Checks action type and applies appropriate status change
- Uses enum-based logic for valid transitions

✅ **Applies Business Logic / Necessary Blocks**
- Case SUSPENSION → Sets `EmployeeStatus.SUSPENDED`
- Case REINSTATEMENT → Sets `EmployeeStatus.ACTIVE`
- Case PROMOTION/DEMOTION → Updates job position, department, salary

✅ **Saves Employee Changes**
- Persists to database

✅ **Creates Audit Trail**
- No audit logging shown in excerpt, but saved record exists

✅ **Sends Notifications**
- Calls `notificationService.send()` to notify employee
- Includes friendly message about action taken

---

## Comparison: How OffboardingService Does It ✅

Location: `worksphere/src/main/java/com/ucocs/worksphere/service/OffboardingService.java` (lines 140-161)

✅ **Has Business Logic**
- Checks offboarding reason (TERMINATION vs RESIGNATION)
- Sets appropriate status (TERMINATED vs RESIGNED)

✅ **Creates Audit Trail**
- Calls `auditService.log()` with details
- Records what changed and who performed it

✅ **Persists Changes**
- Saves employee with new status

❌ **No Notification** - This is also missing!

---

## Required Fixes for updateEmployeeStatus()

### Fix 1: Add Audit Logging
```java
// Inject AuditService (add to constructor)
private final AuditService auditService;

// In updateEmployeeStatus method:
public Employee updateEmployeeStatus(UUID id, EmployeeStatus status, UUID performedBy) {
    Employee employee = employeeRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
    
    EmployeeStatus oldStatus = employee.getEmployeeStatus();
    validateTransition(oldStatus, status);  // NEW: Validate transition
    
    employee.setEmployeeStatus(status);
    Employee saved = employeeRepository.save(employee);
    
    // Log to audit trail
    auditService.log("Employee", id, AuditAction.UPDATED, performedBy,
        oldStatus.toString(), status.toString(),
        "Employee status changed");
    
    return saved;
}
```

### Fix 2: Add Status Validation
```java
private void validateTransition(EmployeeStatus from, EmployeeStatus to) {
    Set<EmployeeStatus> validNext = switch(from) {
        case PENDING -> Set.of(EmployeeStatus.ACTIVE, EmployeeStatus.INACTIVE);
        case ACTIVE -> Set.of(EmployeeStatus.SUSPENDED, EmployeeStatus.INACTIVE, 
                              EmployeeStatus.TERMINATED);
        case SUSPENDED -> Set.of(EmployeeStatus.ACTIVE, EmployeeStatus.TERMINATED);
        case INACTIVE -> Set.of(EmployeeStatus.ACTIVE, EmployeeStatus.TERMINATED);
        case TERMINATED -> Collections.emptySet(); // No transitions FROM terminated
    };
    
    if (!validNext.contains(to)) {
        throw new IllegalStateException(
            "Invalid status transition: " + from + " → " + to);
    }
}
```

### Fix 3: Add Notifications
```java
// Need to inject NotificationService
private final NotificationService notificationService;

// After saving in updateEmployeeStatus:
switch(status) {
    case SUSPENDED:
        notificationService.send(employee.getId(),
            NotificationType.EMPLOYEE_STATUS_CHANGED,
            "Your account has been suspended");
        break;
    case TERMINATED:
        notificationService.send(employee.getId(),
            NotificationType.EMPLOYEE_STATUS_CHANGED,
            "Your employment has been terminated");
        break;
    case ACTIVE:
        notificationService.send(employee.getId(),
            NotificationType.EMPLOYEE_STATUS_CHANGED,
            "Your account has been reactivated");
        break;
    // Add other cases
}
```

### Fix 4: Return Updated Employee
```java
// In EmployeeController (line 122):
@PatchMapping("/{id}/status")
@PreAuthorize("hasRole('HR')")
public ResponseEntity<EmployeeResponseDTO> updateEmployeeStatus(
        @PathVariable UUID id,
        @RequestBody UpdateStatusRequest request,
        Principal principal) {
    UUID performedBy = getCurrentUserId(principal);
    Employee updated = employeeService.updateEmployeeStatus(id, request.status(), performedBy);
    return ResponseEntity.ok(toDTO(updated));
}
```

### Fix 5: Handle Side Effects for SUSPENDED/TERMINATED
```java
// Add to updateEmployeeStatus method:
if (status == EmployeeStatus.SUSPENDED || status == EmployeeStatus.TERMINATED) {
    // Revoke active sessions
    sessionService.revokeAllSessions(id);
    
    // Notify managers if this employee is a team member
    List<Employee> managers = employeeRepository.findManagingEmployees(id);
    for (Employee manager : managers) {
        notificationService.send(manager.getId(),
            NotificationType.TEAM_MEMBER_STATUS_CHANGED,
            "%s's employment status changed to %s"
                .formatted(employee.getFirstName(), status));
    }
}
```

---

## Summary of Missing Features

| Feature | Current | Status | Priority |
|---------|---------|--------|----------|
| Audit Logging | ❌ Missing | Should log WHO/WHEN/WHAT changed | **HIGH** |
| Notifications | ❌ Missing | Should notify affected employee | **HIGH** |
| Status Validation | ❌ Missing | Should prevent invalid transitions | **HIGH** |
| Side Effects | ❌ Missing | Should revoke access for SUSPENDED/TERMINATED | **CRITICAL** |
| Response Feedback | ❌ Empty (204) | Should return updated employee | **MEDIUM** |
| Manager Notification | ❌ Missing | Should notify direct managers | **MEDIUM** |

---

## Files to Modify

1. **`worksphere/src/main/java/com/ucocs/worksphere/service/EmployeeService.java`**
   - Update `updateEmployeeStatus()` method (line 526)
   - Add validation logic
   - Add audit logging
   - Add notifications
   - Add side effects handling

2. **`worksphere/src/main/java/com/ucocs/worksphere/controller/EmployeeController.java`**
   - Update endpoint to capture `performedBy` from principal
   - Change return type to include employee data
   - Extract current user ID from Principal

3. **`worksphere-client/src/components/employees/EmployeeModal.jsx`**
   - Update to handle rich response (currently expects empty body)
   - May already work if response is optional

---

## Test Scenarios to Verify

1. ✅ Can PENDING → ACTIVE (valid)
2. ❌ Cannot PENDING → SUSPENDED (invalid)
3. ✅ ACTIVE → SUSPENDED works, employee gets notification
4. ✅ SUSPENDED → ACTIVE works, previous status logged
5. ✅ TERMINATED transition blocked (no valid next state)
6. ✅ Audit log shows WHO changed status, WHEN, and FROM/TO values
7. ✅ Manager receives notification of team member status change

