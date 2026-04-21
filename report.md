# Formal Employee Actions Report

## Scope

This report covers the formal employee-action flow currently represented by:

- `worksphere-client/src/features/hr/HRActionModal.jsx`
- `worksphere-client/src/features/hr/ManagerReportModal.jsx`
- `worksphere-client/src/features/hr/PendingReportsPanel.jsx`
- `worksphere-client/src/features/audit/ActionCompliance.jsx`
- `worksphere-client/src/components/employees/EmployeeModal.jsx`
- `worksphere-client/src/components/layout/NotificationBell.jsx`
- `worksphere-client/src/pages/NotificationsPage.jsx`
- `worksphere-client/src/pages/Profile.jsx`
- `worksphere-client/src/api/employeeActionApi.js`
- `worksphere/src/main/java/com/ucocs/worksphere/controller/EmployeeActionController.java`
- `worksphere/src/main/java/com/ucocs/worksphere/service/EmployeeActionService.java`
- `worksphere/src/main/java/com/ucocs/worksphere/service/EmployeeService.java`
- `worksphere/src/main/java/com/ucocs/worksphere/entity/EmployeeActionRecord.java`
- `worksphere/src/main/java/com/ucocs/worksphere/dto/hr/EmployeeActionRequest.java`
- `worksphere/src/main/java/com/ucocs/worksphere/dto/hr/EmployeeActionResponse.java`
- `worksphere/src/main/java/com/ucocs/worksphere/dto/hr/ManagerReportRequest.java`
- `worksphere/src/main/java/com/ucocs/worksphere/enums/EmployeeActionType.java`
- `worksphere/src/main/java/com/ucocs/worksphere/enums/EmployeeActionStatus.java`

The report only includes findings that are directly supported by the code inspected.

## Current Data Model

`EmployeeActionRecord` stores one action record per formal action or manager report. The stored fields include:

- Target employee.
- Initiator.
- Optional reviewer.
- Action type.
- Status.
- Reason.
- Review notes.
- Effective date.
- End date.
- New job position name.
- New department name.
- New salary.
- Previous job position snapshot.
- Previous department snapshot.
- Previous salary snapshot.

The response DTO exposes the same important audit data through `EmployeeActionResponse`, including previous and new job, department, salary, reviewer, status, dates, and audit timestamps.

The current status enum is limited to:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `COMPLETED`

The current action enum includes:

- `PROMOTION`
- `DEMOTION`
- `SUSPENSION`
- `EMERGENCY_SUSPENSION`
- `FORCED_LEAVE`
- `REINSTATEMENT`
- `SALARY_REVISION`
- `TRANSFER`
- `WARNING_ISSUED`
- `MANAGER_REPORT`

## Current Backend Behavior

`EmployeeActionController` exposes:

- `POST /api/employee-actions` for HR and Super Admin direct actions.
- `POST /api/employee-actions/report` for Manager reports.
- `GET /api/employee-actions/pending-reports` for HR and Super Admin.
- `PATCH /api/employee-actions/{id}/review` for HR and Super Admin review.
- `GET /api/employee-actions/all-records` for HR, Super Admin, and Auditor.
- `GET /api/employee-actions/employee/{employeeId}` for HR, Super Admin, and Manager.
- `GET /api/employee-actions/my-reports` for Manager.

`EmployeeActionService.applyAction` immediately creates a `COMPLETED` record for direct HR/Super Admin actions. It also mutates the employee for the supported action types:

- Promotion/demotion can apply job, department, and salary changes.
- Suspension sets employee status to `SUSPENDED`.
- Forced leave sets employee status to `INACTIVE`.
- Reinstatement sets employee status to `ACTIVE`.
- Salary revision updates salary.
- Transfer can apply job and department changes.
- Warning records the action without changing employee status.

After applying a direct action, the service sends an `EMPLOYEE_ACTION_APPLIED` notification to the affected employee.

`EmployeeActionService.submitManagerReport` creates a `MANAGER_REPORT` record with status `PENDING`, stores the manager's suggested action and reason together in the `reason` field, and sends `MANAGER_REPORT_SUBMITTED` notifications to HR/admin recipients.

`EmployeeActionService.reviewReport` only changes the manager report status to `APPROVED` or `REJECTED` and stores review notes. It does not itself apply a formal employee action.

`EmployeeService.updateEmployeeStatus` has a separate status-management path. When an employee is suspended through that route, it creates an `EMERGENCY_SUSPENSION` action record with status `PENDING`. When a suspended employee is restored to active through that route, it creates a `REINSTATEMENT` action record with status `COMPLETED`.

## Current Frontend Behavior

`HRActionModal.jsx` provides two tabs:

- `Take Action`
- `Action History`

The direct action form supports these action types:

- Promotion
- Demotion
- Suspension
- Forced Leave
- Reinstatement
- Salary Revision
- Transfer
- Issue Warning

The modal validates only:

- An action type is selected.
- Reason is present.
- Effective date is present.
- End date is present for suspension and forced leave.

The modal posts to `applyEmployeeAction`. If `pendingRecordId` is passed, it then calls `reviewReport(pendingRecordId, true, "Formal action applied & formalized.")`.

The history tab calls `getEmployeeActionHistory(employee.id)` and renders:

- Action type.
- Status.
- Effective date.
- Reason.
- Initiator name and role.

The history tab does not currently render the before/after job, department, or salary fields even though the backend response provides them.

`EmployeeModal.jsx` now opens `HRActionModal` from the employee detail modal. It passes:

- `employee={emp}`
- `onClose`
- `onActionApplied`

It does not pass `pendingRecordId` from that employee-detail entry point.

`Dashboard.jsx` also opens `HRActionModal` from the HR dashboard. In the pending report resolution flow, it passes `pendingRecordId`, so `HRActionModal` applies a direct action and then approves the original report.

## Confirmed UI/Data Integration Gaps

### 1. Job position and department inputs are free text in `HRActionModal`

The modal asks HR to type `newJobPosition` and `newDepartment`.

The backend then attempts to resolve those strings with:

- `jobPositionRepo.findByPositionName(newPositionName)`
- `departmentRepo.findByName(newDeptName)`

If the typed text does not exactly match an existing job position or department name, the backend helper simply does not update that relation. There is no error returned from that helper path.

This means the action record can be created while the intended job or department update does not happen.

### 2. Required action-specific fields are not fully enforced

The modal marks some action types as needing fields, but `handleSubmit` does not require all of them.

Confirmed examples:

- `PROMOTION` has `needsPosition` and `needsSalary`, but submit only requires action type, reason, and effective date.
- `DEMOTION` has `needsPosition` and `needsSalary`, but submit only requires action type, reason, and effective date.
- `SALARY_REVISION` has `needsSalary`, but submit does not require salary.
- `TRANSFER` has `needsPosition` and `needsDept`, but submit does not require either field.

The result is that HR can submit a formal action with missing data that the UI itself implies is needed.

### 3. Date validation is incomplete

The modal requires an end date for suspension and forced leave, but it does not check whether `endDate` is after `effectiveDate`.

The inspected backend request/service code also does not show an end-date-after-effective-date validation in the employee action flow.

### 4. Salary input has weak client-side validation

The salary field is `type="number"` and is converted with `parseFloat`.

There is no client-side check in `HRActionModal` for:

- Positive value.
- Non-zero value.
- Finite numeric value.
- Salary being present when the selected action says salary is needed.

### 5. Header reads a nested job position field that standard employee DTOs do not provide

`HRActionModal` displays:

`employee.jobPosition?.positionName ?? 'No position'`

The inspected employee response DTO exposes:

- `jobPositionId`
- `jobTitle`

It does not expose a nested `jobPosition` object.

This means employee objects coming from the normal employee DTO shape can show `No position` in the modal header even when `jobTitle` exists.

### 6. Action history hides available audit detail

`EmployeeActionResponse` includes:

- `newJobPosition`
- `newDepartment`
- `newSalary`
- `previousJobPosition`
- `previousDepartment`
- `previousSalary`
- `reviewedByName`
- `reviewNotes`
- `createdAt`
- `updatedAt`

`HRActionModal` history currently displays only action type, status, effective date, reason, and initiator.

This makes the history less useful than the available data allows.

### 7. Compliance view also hides before/after change details

`ActionCompliance.jsx` fetches all action records and provides an expanded row.

The expanded row displays:

- Reason.
- Effective date.
- End date.
- Reviewed by.
- Review notes.
- Action ID.
- Employee ID.
- Initiator ID.

It does not render the previous/new job position, department, or salary fields exposed by the backend response.

### 8. Pending report resolution is split across multiple UI paths

There are at least two frontend concepts for pending reports:

- `Dashboard.jsx` pending actions panel.
- `PendingReportsPanel.jsx`.

`Dashboard.jsx` uses `HRActionModal` to resolve a pending report by applying an action and then approving the report.

`PendingReportsPanel.jsx` can approve or reject a report directly with review notes, but it does not apply a formal employee action.

These are different behaviors for the same backend record type.

### 9. `PendingReportsPanel.jsx` and `ManagerReportModal.jsx` appear unmounted

Search results show:

- `ManagerReportModal.jsx` exports a component.
- `PendingReportsPanel.jsx` exports a component.
- Neither component appears imported or rendered elsewhere in `worksphere-client/src`.

Based on the inspected client code, those components currently do not participate in the running app.

### 10. Manager report notifications route to appraisals

Both `NotificationBell.jsx` and `NotificationsPage.jsx` route:

- `MANAGER_REPORT_SUBMITTED`
- `MANAGER_REPORT_REVIEWED`

to `/my-appraisals`.

The inspected `MyAppraisals.jsx` loads appraisal data through `fetchMyAppraisals`; it does not load manager reports through `getMyReports`.

Therefore, a manager clicking a manager-report notification is routed to an appraisal page that does not show the submitted/reviewed manager report data in the inspected code.

### 11. Employee action notifications route to profile, but profile does not show action details

Both `NotificationBell.jsx` and `NotificationsPage.jsx` route `EMPLOYEE_ACTION_APPLIED` to `/profile`.

The inspected `Profile.jsx` displays:

- Overview.
- Schedule and leave.
- IT assets.
- Financials.

It does not call `getEmployeeActionHistory`, does not render action records, and does not open a specific action referenced by the notification.

Therefore, an affected employee can receive an action notification, click it, and land on a profile page that does not show the formal action record or its details.

### 12. Employee acknowledgement is not modeled for formal actions

The action entity, DTOs, service, and frontend modal do not include employee acknowledgement fields or endpoints for formal employee actions.

This is different from appraisals, where `MyAppraisals.jsx` has an acknowledgement flow and the backend has an appraisal acknowledgement endpoint.

For employee actions, notification read state exists, but notification read state is not the same as acknowledging a formal action record.

### 13. Employee response/dispute is not modeled for formal actions

The inspected employee action entity, DTOs, controller, service, and frontend components do not include a field or endpoint for an affected employee response, comment, dispute, or clarification request.

### 14. No dedicated employee-facing action detail surface exists in inspected frontend code

The frontend has:

- HR action modal history.
- Audit compliance list.
- Notifications list.
- Profile page.

The inspected frontend does not contain a route, page, modal, or profile tab dedicated to the affected employee viewing a specific formal action record.

### 15. Direct status changes and formal actions are separate mutation paths

`EmployeeModal.jsx` has a status tab that calls `/employees/{id}/status`.

`HRActionModal.jsx` calls `/api/employee-actions`.

Both paths can change employee status or create employee action records:

- Direct status suspension creates an `EMERGENCY_SUSPENSION` pending action record in `EmployeeService`.
- Formal action suspension creates a `SUSPENSION` completed action record in `EmployeeActionService`.
- Direct status reinstatement creates a completed `REINSTATEMENT` record.
- Formal action reinstatement also creates a completed `REINSTATEMENT` record.

These paths are both present and can create overlapping action history depending on how HR changes status.

### 16. `EMERGENCY_SUSPENSION` exists in the backend but is not selectable in `HRActionModal`

The backend enum includes `EMERGENCY_SUSPENSION`.

`HRActionModal` includes an icon mapping for `EMERGENCY_SUSPENSION`.

The modal action type grid does not include `EMERGENCY_SUSPENSION` as a selectable direct action.

This is consistent with `EmployeeService.updateEmployeeStatus` creating emergency suspension records from the status-management path, but it also confirms that emergency suspension is not handled as a first-class direct selection inside the modal.

### 17. `TERMINATION` is referenced in the compliance UI but not in the employee-action enum

`ActionCompliance.jsx` checks for `TERMINATION` in `getTypeStyle`.

The inspected `EmployeeActionType` enum does not include `TERMINATION`; it includes `SUSPENSION`, `EMERGENCY_SUSPENSION`, `FORCED_LEAVE`, and other action types.

This is a confirmed mismatch between the compliance UI style logic and the current backend enum.

### 18. The report approval status can mean different things depending on UI path

In `EmployeeActionService.reviewReport`, approving a manager report sets status to `APPROVED`.

In the `Dashboard.jsx` pending report resolution path, the formal action modal applies a new direct action and then approves the original manager report with fixed notes.

In `PendingReportsPanel.jsx`, approving a manager report only marks it approved; no formal action is applied by that component.

So an `APPROVED` manager report does not always imply that a formal employee action was applied.

## Employee Point of View

The affected employee currently receives an in-app notification when `EmployeeActionService.applyAction` applies a direct action.

The notification contains:

- Type `EMPLOYEE_ACTION_APPLIED`.
- A title such as `HR Action: PROMOTION`.
- A message built from the action type, reason, dates, salary, position, department, and initiator where applicable.
- `referenceId` set to the saved action record ID.
- `referenceType` set to `EmployeeAction`.

However, the frontend notification route for `EMPLOYEE_ACTION_APPLIED` ignores the reference ID and sends the employee to `/profile`.

The profile page does not display the action record, action history, acknowledgement controls, review notes, or before/after changes.

Confirmed consequence:

- The backend creates a notification that references a specific `EmployeeAction` record.
- The frontend does not use that reference to show the employee the specific action.

The employee can mark the notification as read through the notification UI, but no inspected code marks the formal action itself as acknowledged.

## Manager Point of View

The backend supports manager reports through:

- `POST /api/employee-actions/report`
- `GET /api/employee-actions/my-reports`

The frontend API wrapper exposes:

- `submitManagerReport`
- `getMyReports`

`ManagerReportModal.jsx` can submit a manager report.

However, `ManagerReportModal.jsx` appears unmounted in the inspected client code, and `getMyReports` does not appear used by a page or component.

Manager report review notifications route to `/my-appraisals`, but `MyAppraisals.jsx` does not load manager reports.

Confirmed consequence:

- Backend and API support manager report submission/history.
- The inspected frontend does not expose a mounted manager report submission or report history experience.

## HR Point of View

HR has an actionable path through `Dashboard.jsx` and `HRActionModal.jsx`.

Confirmed HR capabilities:

- Select an employee.
- Open formal action modal.
- Select an action type.
- Submit a formal action.
- Resolve a pending report by applying an action, when `pendingRecordId` is passed.
- View simplified action history in the modal.
- View pending reports on the HR dashboard.

Confirmed HR limitations:

- HR must type job position and department names manually.
- HR can submit some actions without the fields implied by the selected action type.
- HR does not see full before/after action details in the modal history.
- HR cannot see from the modal whether the affected employee has acknowledged the action, because no acknowledgement state exists in the inspected action model.

## Auditor / Compliance Point of View

The backend exposes all action records to HR, Super Admin, and Auditor through `/api/employee-actions/all-records`.

`ActionCompliance.jsx` uses that endpoint and displays a read-only compliance table.

Confirmed compliance strengths:

- It lists official action records.
- It displays employee, type, status, initiator, reason, dates, reviewer, notes, and IDs.

Confirmed compliance limitations:

- It does not display before/after job, department, or salary values even though they are present in `EmployeeActionResponse`.
- It does not display `createdBy`, `updatedBy`, or `updatedAt`, although those are present in the response DTO.
- It references `TERMINATION` styling even though the inspected backend enum does not define that action type.

## Recommended Implementation Work, Grounded in Confirmed Findings

### High priority

1. Add a dedicated employee-facing action detail view or profile tab.

Reason: `EMPLOYEE_ACTION_APPLIED` notifications reference an `EmployeeAction` record, but currently route to `/profile`, which does not show that record.

2. Use the notification `referenceId` for employee action notifications.

Reason: The backend sends `referenceId = saved.getId()` and `referenceType = "EmployeeAction"`, but the frontend currently routes only to `/profile`.

3. Replace free-text job position and department fields in `HRActionModal`.

Reason: The backend resolves job and department changes by exact name lookup. The existing employee edit form already fetches departments and job positions, so the application has APIs/components patterns for select-based input.

4. Enforce action-specific required fields in `HRActionModal`.

Reason: The modal metadata says some actions need salary, position, or department, but submit validation does not require those fields.

5. Show before/after changes in HR history and compliance views.

Reason: `EmployeeActionResponse` already exposes previous/new job, department, and salary values.

6. Clarify pending report resolution behavior.

Reason: `Dashboard.jsx` approval after action means "formal action applied and original report approved"; `PendingReportsPanel.jsx` approval means only "report approved." Both use the same backend review status.

### Medium priority

7. Add employee acknowledgement fields and endpoint if formal acknowledgement is required.

Reason: Current notification read state exists, but the formal action record has no acknowledgement state. Appraisals already have a separate acknowledgement concept, showing the app has precedent for this pattern.

8. Add manager report history UI.

Reason: Backend and API expose `getMyReports`, but the inspected frontend does not use it.

9. Mount or remove `ManagerReportModal.jsx` and `PendingReportsPanel.jsx`.

Reason: Both components exist but appear unused in the inspected frontend.

10. Fix manager-report notification routing.

Reason: Manager-report notifications route to `/my-appraisals`, but `MyAppraisals.jsx` does not display manager reports.

11. Validate end date after effective date.

Reason: Current submit logic only checks end-date presence for timed actions.

12. Align modal header with employee DTO shape.

Reason: `HRActionModal` reads `employee.jobPosition?.positionName`, while the inspected employee DTO exposes `jobTitle`.

### Low priority

13. Remove or align `TERMINATION` styling in `ActionCompliance.jsx`.

Reason: The current backend enum does not include `TERMINATION`.

14. Remove unused modal imports if confirmed by lint configuration.

Reason: `HRActionModal.jsx` imports `ChevronDown`, but no usage was found in the inspected file.

## Suggested Target Shape

The formal-action feature would be more coherent if it were organized around one action record lifecycle:

1. Manager submits a report, if applicable.
2. HR reviews the report.
3. HR applies or dismisses a formal action.
4. The affected employee receives a notification.
5. The employee can open the exact action record.
6. The employee can acknowledge the action if the product requires acknowledgement.
7. HR and Auditor can review the complete record, including before/after values.

Every step above is based on existing code concepts already present in the repository:

- Manager reports exist in backend/API.
- HR direct actions exist in backend/API/modal.
- Notifications already carry `referenceId` and `referenceType`.
- Action records already store before/after fields.
- Compliance view already fetches all records.
- Appraisal acknowledgement already provides an example of employee acknowledgement elsewhere in the app.

## Items Not Confirmed By This Review

The following were not confirmed from the inspected code and are not treated as current issues in this report:

- Whether the database schema has additional columns not represented in the inspected entities.
- Whether another branch or unmounted route provides employee action detail pages.
- Whether backend validation exists outside the inspected service/controller/DTO path.
- Whether a future design intentionally treats notification read state as sufficient acknowledgement.
- Whether exact-name lookup failure for job/department is intentionally silent.

