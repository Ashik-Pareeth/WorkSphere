# Auditor Role Capability Analysis

## 📋 Overview
The **Auditor** role is defined to be **read-only** with minimal write capabilities (task flagging only). However, the implementation is **incomplete and inconsistent** with multiple authorization gaps.

**Role Hierarchy Context:**
- SUPER_ADMIN (rank 4) > HR (rank 3) > MANAGER (rank 2) > EMPLOYEE (rank 1)
- **AUDITOR (rank 0)** — Outside hierarchy, cannot manage any role

---

## ✅ Current Capabilities

### 1. **Flag Tasks for Audit**
- **Endpoint**: `POST /api/tasks/{taskId}/flag`
- **Authorization**: 
  - File: `TaskController.java:157`
  - Code: `@PreAuthorize("hasAnyRole('AUDITOR', 'SUPER_ADMIN')")`
- **What it does**: 
  - Marks a task with flag reason
  - Updates: `task.isFlagged = true`
  - Records: `flagReason`, `flaggedBy`, `flaggedAt`
- **Frontend**: `TaskDetailsModal.jsx:109-122` — Button only shows for Auditor when task is not already flagged

### 2. **Post Announcements / Bulletins**
- **Endpoint**: `POST /api/bulletins`
- **Authorization**:
  - File: `BulletinController.java:34`
  - Code: `@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR', 'AUDITOR')")`
- **What it does**: Create board announcements visible company-wide
- **Note**: Unusual for Auditor role; typically HR/Admin-only

### 3. **Access Auditor Dashboard** 
- **Component**: `AuditorDashboard.jsx` (lines 1017-1237 in Dashboard.jsx)
- **Displays**:
  - Total tasks count
  - Flagged tasks count
  - Evidence review queue
  - Flagged tasks list (from dashboard filters)
  - Evidence pending review list
- **Data Source**: Dashboard imports `getAllTasks()` → Calls `taskApi.getAllTasks()` → `GET /tasks/all-tasks`

---

## ❌ Critical Gaps & Issues

### ⚠️ **ISSUE 1: Cannot Actually Access All Tasks**

**Problem**: Dashboard assumes Auditors can access `/tasks/all-tasks`, but they **cannot**.

**Code Evidence**:
- **Backend** (`TaskController.java:82-84`):
  ```java
  @GetMapping("/all-tasks")
  @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")  // ← AUDITOR NOT INCLUDED
  public ResponseEntity<List<TaskResponseDTO>> getAllTasks() {
  ```

- **Frontend** (`Dashboard.jsx:1025-1027`):
  ```javascript
  // Auditors can see all tasks via /tasks/all-tasks endpoint
  import('../api/taskApi').then(({ getAllTasks }) => {
    getAllTasks()  // ← This will FAIL with 403 Forbidden
  ```

**Impact**: 
- Auditor dashboard loads but fails silently (line 1031 catches error)
- All audit stats show 0 or "--"
- Cannot see system-wide flagged tasks
- Cannot perform audit function

**Why it's blocked**: Role hierarchy doesn't include AUDITOR; only HR and SUPER_ADMIN

---

### ⚠️ **ISSUE 2: Cannot View Any Employees**

**Problem**: Auditors cannot see employee list, profiles, or details.

**Code Evidence** (`EmployeeController.java:61-64`):
```java
@GetMapping
@PreAuthorize("hasAnyRole('MANAGER', 'HR', 'SUPER_ADMIN')")  // ← AUDITOR NOT INCLUDED
public List<EmployeeResponseDTO> getAllEmployee() {
```

**Blocked Endpoints**:
| Endpoint | Required Role | Status |
|----------|---------------|--------|
| GET `/employees` | MANAGER/HR/SUPER_ADMIN | ❌ BLOCKED |
| GET `/employees/{id}` | (checked internally by canManage()) | ❌ BLOCKED |
| GET `/my-team` | MANAGER only | ❌ BLOCKED |

**Impact**: 
- Cannot audit employee data
- Cannot see who was flagged in tasks
- Cannot cross-reference employee actions
- Cannot perform comprehensive audit

---

### ⚠️ **ISSUE 3: Cannot Access Employee Action Records (Disciplinary/HR Actions)**

**Problem**: Auditors cannot view suspension, termination, promotion, or other HR actions taken against employees.

**Code Evidence** (`EmployeeActionController.java`):
```java
@GetMapping("/employee/{employeeId}")
@PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN', 'MANAGER')")  // ← AUDITOR NOT INCLUDED
public ResponseEntity<List<EmployeeActionResponse>> getActionsForEmployee(...) {

@GetMapping("/pending-reports")
@PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")  // ← AUDITOR NOT INCLUDED
public ResponseEntity<List<EmployeeActionResponse>> getPendingReports() {
```

**Blocked Actions**:
| Action Type | Access | Auditor Can See? |
|-------------|--------|------------------|
| SUSPENSION | HR/SUPER_ADMIN | ❌ NO |
| TERMINATION | HR/SUPER_ADMIN | ❌ NO |
| PROMOTION | HR/SUPER_ADMIN | ❌ NO |
| DEMOTION | HR/SUPER_ADMIN | ❌ NO |
| FORCED_LEAVE | HR/SUPER_ADMIN | ❌ NO |
| REINSTATEMENT | HR/SUPER_ADMIN | ❌ NO |
| Manager Reports | HR/SUPER_ADMIN | ❌ NO |

**Why it matters**: 
- Cannot audit whether disciplinary actions were properly recorded
- Cannot verify employee status changes

---

### ⚠️ **ISSUE 4: Cannot View Grievances / Tickets**

**Problem**: Auditors cannot see employee grievances or support tickets.

**Code Evidence** (`GrievanceController.java`):
```java
@GetMapping
@PreAuthorize("hasRole('HR')")  // ← HR-ONLY, AUDITOR NOT INCLUDED
public ResponseEntity<List<TicketResponse>> getAllTickets(...) {

@GetMapping("/my")
@PreAuthorize("isAuthenticated()")  // ← Can only see OWN tickets
public ResponseEntity<List<TicketResponse>> getMyTickets(...) {
```

**Impact**:
- Cannot audit grievance handling quality
- Cannot verify timely resolution
- Cannot check for patterns of employee concerns

---

### ⚠️ **ISSUE 5: Cannot View Appraisals / Performance Records**

**Problem**: Auditors cannot access performance appraisals.

**Code Evidence** (`AppraisalController.java`):
```java
@GetMapping
@PreAuthorize("hasRole('HR')")  // ← HR-ONLY
public ResponseEntity<List<AppraisalResponse>> getAllAppraisals(...) {

@GetMapping("/my")
@PreAuthorize("isAuthenticated()")  // ← Can only see OWN appraisal
public ResponseEntity<List<AppraisalResponse>> getMyAppraisals(...) {
```

**Impact**:
- Cannot audit fairness of appraisal process
- Cannot verify manager compliance

---

### ⚠️ **ISSUE 6: No Access to Audit Logs (AuditLog entity)**

**Problem**: AuditLog entity exists but **no endpoint exists** to retrieve audit logs for Auditor review.

**Evidence**:
- **Entity exists**: `entity/AuditLog.java` (in STATUS_CHANGE_ANALYSIS.md, mentioned at line 12)
- **Service exists**: `AuditService.java` with `log()` method (documented in STATUS_CHANGE_ANALYSIS.md)
- **No Controller**: No `AuditLogController.java` found
- **Blueprint mentions**: `WorkSphere_Dashboard_Blueprint.md:298` states "AuditLog entity (exists in backend, not yet surfaced)"

**Blocked**: 
- No way to retrieve audit trail
- No way to see WHO changed WHAT

---

### ⚠️ **ISSUE 7: Cannot View Attendance Audit Logs**

**Problem**: Even though TimesheetAuditLog endpoint exists, Auditors cannot access it.

**Code Evidence** (`AttendanceController.java:61-64`):
```java
@GetMapping("/{attendanceId}/audit-logs")
@PreAuthorize("hasRole('MANAGER')")  // ← MANAGER-ONLY
public ResponseEntity<List<TimesheetAuditLogDTO>> getTimesheetAuditLogs(...) {
```

**Impact**:
- Cannot verify attendance adjustments
- Cannot audit timesheet modifications

---

### ⚠️ **ISSUE 8: FlaggedTasksFeed Uses Wrong API**

**Problem**: Frontend component gets flagged tasks from wrong endpoint.

**Code** (`FlaggedTasksFeed.jsx:26-31`):
```javascript
const loadFlaggedTasks = async () => {
  try {
    const allTasks = await getMyTasks();  // ← Gets ONLY AUDITOR'S OWN TASKS
    const flagged = allTasks.filter(task => task.isFlagged === true);
```

**Should be**: Call a dedicated `/tasks/flagged` endpoint to get **system-wide** flagged tasks

**Current behavior**:
- Only sees tasks assigned to Auditor personally
- Misses flagged tasks from other team members
- Defeats audit visibility purpose

---

### ⚠️ **ISSUE 9: Outside Role Hierarchy — Cannot Manage Employees**

**Problem**: Auditor rank = 0, lower than all managed roles.

**Code** (`rbac.js:1-6`):
```javascript
export const ROLE_HIERARCHY = {
  SUPER_ADMIN: 4,
  HR: 3,
  MANAGER: 2,
  EMPLOYEE: 1,
  AUDITOR: 0,  // ← OUTSIDE HIERARCHY
};
```

**Impact**:
- Function `canManage(viewerRank, targetRoles)` always returns `false` for Auditor
- Cannot edit employee records (already blocked by authorization)
- Reinforces read-only intent

**This is reasonable** — Auditors shouldn't modify employee data.

---

## 🎯 Missing but FEASIBLE Capabilities

### ✨ **CAPABILITY 1: View All Tasks (System-Wide Audit)**

**Why it's important**: Auditor needs to see all tasks to verify proper flagging and monitor system health.

**Current block**: `@PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")`

**Safe fix**: Add AUDITOR to preset authorization:
```java
@PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN', 'AUDITOR')")
```

**Risk level**: ✅ **LOW** — Read-only, no data modification possible

**Changes needed**:
- 1 Line in `TaskController.java:82`

---

### ✨ **CAPABILITY 2: View Employee Directory (Read-Only)**

**Why it's important**: Auditor needs to cross-reference task assignees with employee records for context.

**Current block**: `@PreAuthorize("hasAnyRole('MANAGER', 'HR', 'SUPER_ADMIN')")`

**Safe fix**: Add AUDITOR with read-only assurance:
```java
@PreAuthorize("hasAnyRole('MANAGER', 'HR', 'SUPER_ADMIN', 'AUDITOR')")
```

**Risk level**: ✅ **LOW** — Only listing public employee info (names, departments, roles, status)

**Sensitive fields NOT exposed**: 
- Salary (separate endpoint)
- Personal contact (not in list view)
- Performance data (separate endpoint)

**Changes needed**:
- 1 Line in `EmployeeController.java:61`

---

### ✨ **CAPABILITY 3: View Employee Action Records (Audit Compliance)**

**Why it's important**: Auditor must verify disciplinary actions comply with policy and are properly documented.

**Current block**: `@PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")`  (for pending actions)

**Safe fix** (for read-only view endpoint):
```java
@GetMapping("/all-records")
@PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN', 'AUDITOR')")  // ← Add AUDITOR
public ResponseEntity<List<EmployeeActionResponse>> getAllActionRecords() {
    // Returns: action type, target employee, initiator, timestamp, status
    // NO sensitive employee salary/personal data
}
```

**Risk level**: ✅ **LOW** — Auditor is a business function, needs to audit compliance

**Limitations**:
- Read-only (cannot create/modify actions)
- Cannot approve/reject (only HR/SUPER_ADMIN can)
- Cannot modify action records

**Changes needed**:
- Add new read-only endpoint in `EmployeeActionController.java`

---

### ✨ **CAPABILITY 4: View Grievances (Audit Quality)**

**Why it's important**: Auditor must verify grievance handling meets SLA and escalation policies.

**Current block**: `@PreAuthorize("hasRole('HR')")`

**Safe fix**: Create read-only endpoint for Auditor:
```java
@GetMapping("/all-tickets")
@PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN', 'AUDITOR')")  // ← Add AUDITOR
public ResponseEntity<List<TicketResponse>> getAllTicketsForAudit() {
    // Returns: all tickets with resolution status, timestamps, handler
    // NO internally-hidden HR comments (already filtered in model)
}
```

**Risk level**: ✅ **LOW** — Existing TicketResponse already filters internal comments

**Current filtering** (line in `GrievanceService`):
- Non-internal comments visible to all
- Internal HR comments hidden from non-HR

**Changes needed**:
- Add single read-only endpoint in `GrievanceController.java`

---

### ✨ **CAPABILITY 5: Create AuditLog Read Endpoint (Compliance Trail)**

**Why it's important**: Auditor must verify that all sensitive operations are logged.

**Current block**: AuditLog entity exists, but NO endpoint to retrieve it

**Safe fix**: Create new controller:
```java
@GetMapping("/audit-logs")
@PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN', 'AUDITOR')")  // ← Auditor only
public ResponseEntity<List<AuditLogResponse>> getAuditLogs(
    @RequestParam(required = false) UUID entityId,
    @RequestParam(required = false) String entityType,
    @RequestParam(required = false) LocalDate startDate,
    @RequestParam(required = false) LocalDate endDate) {
    // Returns filtered audit trail
    // Fields: action, entityType, entityId, performedBy, timestamp, previousValue, newValue
}
```

**Risk level**: ✅ **LOW** — Read-only audit trail visibility

**Changes needed**:
- Create new `AuditLogController.java` with single `GET` endpoint
- Roughly 30-40 lines of code

---

### ✨ **CAPABILITY 6: View Attendance Audit Logs (Verify Adjustments)**

**Why it's important**: Auditor must verify attendance adjustments are properly recorded and justified.

**Current block**: `@PreAuthorize("hasRole('MANAGER')")`

**Safe fix**: Also allow AUDITOR:
```java
@PreAuthorize("hasAnyRole('MANAGER', 'AUDITOR')")  // ← Add AUDITOR
public ResponseEntity<List<TimesheetAuditLogDTO>> getTimesheetAuditLogs(...) {
```

**Risk level**: ✅ **LOW** — Only audit data (datetime stamps, who adjusted what)

**Changes needed**:
- 1 Line in `AttendanceController.java:62`

---

### ✨ **CAPABILITY 7: Create Dedicated `/tasks/flagged` Endpoint**

**Why it's important**: Auditor needs to see **all flagged tasks**, not just their own.

**Current workaround** (broken):
- Dashboard tries to use `/tasks/all-tasks` (blocked)
- FlaggedTasksFeed uses `/tasks/my-tasks` (only gets own tasks)

**Safe fix**: Create dedicated endpoint:
```java
@GetMapping("/flagged")
@PreAuthorize("hasAnyRole('AUDITOR', 'SUPER_ADMIN')")
public ResponseEntity<List<TaskResponseDTO>> getFlaggedTasks() {
    // Returns: all tasks where isFlagged = true
    // Sorted by flaggedAt (newest first)
}
```

**Risk level**: ✅ **LOW** — Read-only filtered view

**Changes needed**:
- Add method in `TaskService.java`
- Add endpoint in `TaskController.java` (~5-10 lines)

---

## 📊 Capability Matrix

| Capability | What | Can Do Now | Should Be Able To | Blocker | Fix Risk |
|------------|------|-----------|------------------|---------|----------|
| **Flag Tasks** | Mark task for audit | ✅ YES | ✅ YES | None | — |
| **Post Bulletins** | Create announcements | ✅ YES | ⚠️ QUESTIONABLE | None | — |
| **View All Tasks** | System-wide task list | ❌ NO | ✅ YES | Authorization | ✅ LOW |
| **View Employees** | Employee directory | ❌ NO | ✅ YES | Authorization | ✅ LOW |
| **View Actions** | Discipline/Promotion records | ❌ NO | ✅ YES | Authorization | ✅ LOW |
| **View Grievances** | Support tickets | ❌ NO | ✅ YES | Authorization | ✅ LOW |
| **View Appraisals** | Performance reviews | ❌ NO | ⚠️ MAYBE | Authorization | ✅ LOW |
| **View Audit Logs** | Compliance trail | ❌ NO | ✅ YES | No endpoint | ✅ LOW |
| **View Attendance Logs** | Timesheet adjustments | ❌ NO | ✅ YES | Authorization | ✅ LOW |
| **View Flagged Tasks** | All system flags | ❌ NO | ✅ YES | Wrong endpoint | ✅ LOW |

---

## 🔧 Implementation Plan (Minimal Changes)

### **Phase 1: Quick Fixes (15 minutes)**
Update 3 existing endpoints to include AUDITOR:
1. `TaskController.java:82` — Add AUDITOR to `getAllTasks()`
2. `EmployeeController.java:61` — Add AUDITOR to `getAllEmployee()`
3. `AttendanceController.java:62` — Add AUDITOR to `getTimesheetAuditLogs()`

### **Phase 2: New Endpoints (45 minutes)**
Create 3 new read-only endpoints:
1. `TaskController.java` — Add `getFlaggedTasks()` method
2. `GrievanceController.java` — Add `getAllTicketsForAudit()` method
3. `AuditLogController.java` (new) — Create controller with `getAuditLogs()` method

### **Phase 3: Restricted Views (optional)**
Consider whether Auditor should see:
- ⚠️ Appraisals — Maybe (performance data sensitivity)
- ⚠️ Leave requests — Maybe (personal data sensitivity)

---

## ⚠️ What Auditor Should NOT Get Access To

These restrictions are **correct and should remain**:

| Restricted | Reason |
|-----------|--------|
| Modify/delete tasks | Auditors audit; don't manage |
| Change employee status | Only HR can suspend/terminate |
| Approve leave/appraisals | Only approvers can approve |
| Change salary/compensation | Finance/HR only |
| Access personal documents | Privacy/sensitivity |
| Modify role assignments | SUPER_ADMIN only |

---

## Summary

**Current Auditor Implementation: 40% Complete**
- ✅ Can flag tasks
- ✅ Can post announcements (questionable)
- ❌ Cannot see what to audit

**Quick wins available**: 7 small changes to unlock audit function
- 0 new tables/fields needed
- 0 breaking changes
- All read-only
- All low-risk

