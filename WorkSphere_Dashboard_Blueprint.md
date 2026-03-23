# WorkSphere ERP — Dashboard Blueprint

> **Stack:** React 18 + Vite · Tailwind CSS v4 · shadcn/ui · WS Design System · Spring Boot 3 + JWT  
> **Roles:** 5 · **Modules:** 11 · **Routes:** 47+ · **Version:** 1.0

---

## Table of Contents

- [Section 0 — Project Analysis](#section-0--project-analysis)
- [Section 1 — Global Layout](#section-1--global-layout)
- [Section 2 — Role-Based Dashboards](#section-2--role-based-dashboards)
- [Section 3 — Module Breakdown](#section-3--module-breakdown)
- [Section 4 — Component Architecture](#section-4--component-architecture)
- [Section 5 — UX Decisions](#section-5--ux-decisions)
- [Section 6 — Suggested Improvements](#section-6--suggested-improvements)

---

## Section 0 — Project Analysis

### What the system is

WorkSphere is a full-stack HR/ERP platform covering the complete employee lifecycle: onboarding → daily work (tasks, attendance, leave) → compensation → performance → offboarding. It also includes a full hiring pipeline (job openings → candidate Kanban → offer letters) and an admin layer for org configuration.

### Backend Stack

| Item | Detail |
|------|--------|
| Framework | Spring Boot 3 + Spring Security |
| Auth | JWT stateless (`JwtAuthenticationFilter`) |
| ORM | Spring Data JPA + Hibernate |
| Scheduling | Quartz-style scheduled jobs |
| Authorization | `@PreAuthorize` per-endpoint RBAC |
| Extras | PDF payslip generation service |

### Frontend Stack

| Item | Detail |
|------|--------|
| Framework | React 18 + Vite |
| Routing | React Router v6 (nested routes) |
| Styling | Tailwind CSS v4 + tw-animate-css |
| UI Kit | shadcn/ui component library |
| Design System | WS Design System (`admin-ui.css`) |
| Fonts | Geist Variable + Sora + JetBrains Mono |

### Current UI Patterns

- Top navbar: `bg-gray-900`, white text
- Right-side admin dropdown (collapsible)
- White page content on `bg-gray-50`
- shadcn Cards, Dialogs, Tables throughout
- Custom `.ws-*` CSS classes (from `admin-ui.css`)
- Dark clock-in modal with green accents

---

### Roles Identified

| Role | Scope | Key Capabilities | Exclusivity |
|------|-------|-----------------|-------------|
| `SUPER_ADMIN` | System-wide | All access. Manages roles, departments, job positions, onboards employees, flushes DB | `isExclusive: true` — cannot be combined |
| `HR` | Org-wide | Payroll, assets, grievance admin, appraisals, offboarding, hiring, leave policy, work schedules | Can coexist with other roles |
| `MANAGER` | Team | Leave approvals, team roster, timesheet adjustments, team tasks, team appraisals | Can coexist with other roles |
| `EMPLOYEE` | Self | Tasks, clock in/out, leave requests, helpdesk tickets, appraisals, compensation, assets | Base role for all staff |
| `AUDITOR` | Read + Flag | Flag tasks for audit, read-only access to tasks and evidence | Can coexist with other roles |

---

### System Module Map

| Module | Description |
|--------|-------------|
| 🔐 **Auth** | Login, forgot/reset password, activation onboarding, JWT management |
| 📊 **Dashboard** | Role-differentiated home with metrics, widgets, quick actions |
| ✅ **Tasks** | Kanban board, task creation, comments, evidence upload, ratings, audit flag |
| 🕐 **Attendance** | Clock in/out, attendance log, daily roster, timesheet adjustments, audit logs |
| 🌴 **Leave** | Request, approve/reject, policies, balance ledger, override, public holidays |
| 💰 **Payroll & Compensation** | Salary structures, payroll generation, payslip PDF, tax slabs, batch processing |
| 📦 **Assets** | Asset directory, assign/return, warranty alerts, employee asset view |
| 🎫 **Helpdesk** | Employee grievance tickets, HR admin view, comments, assignment, resolution |
| 📈 **Performance** | Appraisal cycles, self/manager ratings, acknowledgment, team overview |
| 🚪 **Offboarding** | Exit initiation, clearance tracking, documentation |
| 🧲 **Hiring Pipeline** | Job openings, public careers page, Kanban pipeline, interviews, offer letters |
| ⚙️ **Administration** | Departments, job positions, roles & permissions, work schedules, org config |

---

## Section 1 — Global Layout

The current horizontal-only topbar will not scale as the product grows. The recommended layout is a **persistent left sidebar + topbar combo** — consistent with modern ERP/SaaS patterns (Linear, Rippling, Gusto). This extends your existing `bg-gray-900` theme without breaking it.

### Layout Wireframe (text representation)

```
┌────────────────────────────────────────────────────────────────┐
│ WorkSphere          ⌕ Search (⌘K)    🔔  👤 Sarah HR   Logout  │  ← Topbar (bg-gray-900)
├──────────────┬─────────────────────────────────────────────────┤
│ MAIN         │                                                 │
│  ⊞ Dashboard │   DASHBOARD — HR Admin View                     │
│  ✓ Tasks     │  ┌──────┐ ┌──────────┐ ┌──────────┐ ┌───────┐ │
│  🕐 Attend.  │  │  124 │ │    7     │ │    3     │ │  ₹4.2M│ │
│  🌴 Leave    │  │ Head │ │ Pending  │ │  Open    │ │Payroll│ │
│  💰 Comp.    │  │count │ │ Leaves   │ │  Jobs    │ │ Total │ │
│  📦 Assets   │  └──────┘ └──────────┘ └──────────┘ └───────┘ │
│  🎫 Helpdesk │  ┌────────────────────────┐ ┌─────────────────┐│
│              │  │ Payroll Nov 2025       │ │ Pending Actions ││
│ HR OPS       │  │ ████████░░ 78 of 100   │ │ 7 Leave Reqs    ││
│  👥 Employees│  │ processed              │ │ 2 Offer Resp.   ││
│  💳 Payroll  │  └────────────────────────┘ │ 1 Grievance     ││
│  🧲 Hiring   │                             └─────────────────┘│
│  📈 Appraise │                                                 │
│  🚪 Offboard │                                                 │
│              │                                                 │
│ CONFIG       │                                                 │
│  ⚙️ Admin    │                                                 │
└──────────────┴─────────────────────────────────────────────────┘
```

---

### Sidebar Structure

The sidebar is **role-aware**: sections and links render conditionally based on `user.roles` from `AuthContext`.  
- **Desktop:** 220px fixed, collapsible to icon-only (64px)  
- **Mobile:** Full-screen drawer triggered by hamburger

```
EVERYONE (all roles):
  ⊞  Dashboard          → /dashboard
  ✓  My Tasks           → /tasks
  🕐  Attendance         → /attendance-log
  🌴  Leave              → /leave
  💰  Compensation       → /my-compensation
  📦  My Assets          → /my-assets
  🎫  Helpdesk           → /helpdesk
  📈  My Appraisals      → /my-appraisals

MANAGER and above:
  👥  Team Roster        → /roster
  ✅  Leave Approvals    → /approvals
  📊  Team Appraisals    → /team-appraisals

HR + SUPER_ADMIN (HR Operations group):
  👥  Employee List      → /employee-list
  🧲  Recruitment Hub    → /hiring/jobs
  💳  Payroll            → /hr/payroll
  📦  Asset Directory    → /hr/assets
  🎫  HR Helpdesk        → /hr/helpdesk
  📈  Appraisals         → /hr/appraisals
  🚪  Offboarding        → /hr/offboarding

HR + SUPER_ADMIN (Config group):
  🏛  Departments        → /departments
  📝  Job Positions      → /jobPosition
  📅  Leave Policies     → /leave-policies
  🗓  Work Schedules     → /work-schedules
  🎌  Public Holidays    → /holidays
  ⚖️  Leave Override     → /leave-override

SUPER_ADMIN only:
  🔑  Role Management    → /role-management
  👤  Onboard Employee   → /register
  🛡  Permissions        → /roles
```

---

### Topbar Elements

| Element | Component | Behaviour |
|---------|-----------|-----------|
| Hamburger / Logo | `TopbarBrand` | Toggle sidebar collapse on desktop; open drawer on mobile |
| Global Search | `GlobalSearch` *(new)* | `⌘K` shortcut; searches employees, tasks, job openings; uses shadcn `Command` component |
| Clock-in Button | `AttendanceTracker` trigger *(moved)* | Persistent button in topbar; opens existing dark modal on click from any page |
| Notification Bell | `NotificationBell` *(exists)* | Badge with unread count, dropdown panel with mark-all-read action |
| User Avatar + Name | `UserMenu` *(new)* | Shows `firstName + lastName` from profile, role badge, links to Profile & Logout |

---

### Navigation Flow

```
Landing Page → /login → JWT stored in localStorage → check status

  If PENDING  → /onBoarding → /dashboard (role-resolved)
  If ACTIVE   → /dashboard (role-resolved directly)

Public routes (no auth, external candidates):
  /careers
  /careers/:id
  /jobs/:openingId/apply
  /offers/:offerId/respond
```

---

## Section 2 — Role-Based Dashboards

`Dashboard.jsx` should be refactored to resolve the user's highest role and render a role-specific component. All share the same `AppShell` layout.

```js
// Dashboard.jsx — role resolver pattern
const roleDashboardMap = {
  SUPER_ADMIN: <SuperAdminDashboard />,
  HR:          <HRDashboard />,
  MANAGER:     <ManagerDashboard />,
  AUDITOR:     <AuditorDashboard />,
  EMPLOYEE:    <EmployeeDashboard />,
};

const highestRole = getHighestRole(user?.roles); // reuse from NavBar.jsx
return roleDashboardMap[highestRole] ?? <EmployeeDashboard />;
```

---

### Dashboard: EMPLOYEE

**Purpose:** Single-screen status view of the workday. Clock in/out, tasks, leave balance, upcoming events.

| Zone | Component | Data Source | Layout |
|------|-----------|-------------|--------|
| Greeting + Clock In/Out | `AttendanceTracker` (moved to topbar button) | `GET /api/attendance` | Topbar persistent button |
| Key Metrics Row | `EmployeeStatCards` *(new)* | Tasks API + Leave API | 4-card horizontal row |
| Active Tasks | `ActiveTasksWidget` *(exists)* | `GET /api/tasks/my-tasks` | Left column (1/3 width) |
| Task Stats + Due Soon | `TaskStatsWidget` + `DueSoonList` | Derived from tasks array | Top-right (2/3 width) |
| Leave Balance | `LeaveBalanceCard` *(exists)* | `GET /api/leave-ledger/my-balances` | Bottom-right card |
| Action Items | `ActionItemsWidget` *(exists)* | Tasks with `status = IN_REVIEW` | Bottom-right card |

**Metric Cards:**

| Card | Data Source |
|------|-------------|
| Tasks Due Today | `filter(tasks, t => t.dueDate === today).length` |
| Leave Balance (Annual) | `GET /api/leave-ledger/my-balances → annualLeave.balance` |
| Pending Action Items | `tasks.filter(t => t.status === 'IN_REVIEW').length` |
| This Month Attendance | Derived: present days / working days in current month |

---

### Dashboard: MANAGER

**Purpose:** Oversight of team productivity, attendance, and approvals. Surface blockers immediately.

| Zone | Component | Data Source | Layout |
|------|-----------|-------------|--------|
| Team Attendance Summary | `TeamAttendanceSummaryCard` *(new)* | `GET /api/attendance/roster/today` | Top-left, large card |
| Pending Leave Approvals | `PendingLeaveWidget` *(new)* | `GET /api/leave-requests/pending` | Top-right, inline approve/reject |
| Team Task Board Summary | `TeamTaskSummaryCard` *(new)* | `GET /api/tasks/team-tasks` | Mid-left |
| Tasks Awaiting Review | `ActionItemsWidget` *(exists — manager view)* | Team tasks where `status = IN_REVIEW` | Mid-right |
| Appraisal Reminders | `AppraisalReminderCard` *(new)* | `GET /api/appraisals/team` | Bottom row |

**Metric Cards:**

| Card | Data Source |
|------|-------------|
| Team Present Today | `roster/today → count(status = PRESENT)` |
| On Leave Today | `roster/today → count(status = ON_LEAVE)` |
| Leave Requests Pending | `GET /api/leave-requests/pending → length` |
| Tasks In Review | `team-tasks → count(status = IN_REVIEW)` |

---

### Dashboard: HR ADMIN

**Purpose:** Operational overview of the entire workforce, payroll status, open positions, and pending admin tasks.

| Zone | Component | Data Source | Layout |
|------|-----------|-------------|--------|
| Workforce KPI Row | `HRStatCards` *(new)* | Employee list, leave, hiring APIs | 5-card row |
| Payroll Status Band | `PayrollStatusBand` *(new)* | `GET /api/payroll/summary` | Full-width progress bar card |
| Pending Actions Panel | `HRActionQueue` *(new)* | Leave, grievances, offboarding APIs | Right column |
| Hiring Pipeline Summary | `HiringSnapshotCard` *(new)* | `GET /api/jobs/stats` *(new endpoint needed)* | Mid-left card |
| Recent Grievances | `GrievanceSummaryCard` *(new)* | `GET /api/grievances` | Bottom-left |
| Asset Alerts | `AssetAlertCard` *(new)* | Assets with warranty expiry approaching | Bottom-right |

**Metric Cards:**

| Card | Data Source |
|------|-------------|
| Total Headcount | `GET /api/employees → length` |
| Active Job Openings | `GET /api/jobs → count(status = OPEN)` |
| Payroll This Month | `GET /api/payroll/summary → totalNetPay` |
| Open Grievances | `GET /api/grievances → count(status != RESOLVED)` |
| Employees On Leave Today | Derived from approved leave requests for today |

---

### Dashboard: SUPER_ADMIN

**Purpose:** System health overview + quick-jump to critical org config. Focus on structural integrity rather than day-to-day HR data.

| Zone | Component | Data Source |
|------|-----------|-------------|
| System Overview Cards | `SystemStatCards` *(new)* | Employees, Roles, Departments, Job Positions counts |
| Recent Activity Log | `SystemActivityFeed` *(new)* | `AuditLog` entity (exists in backend, not yet surfaced) |
| Quick Config Panel | `QuickConfigPanel` *(new)* | Links to `/departments`, `/roles`, `/work-schedules`, `/register` |
| Pending Onboarding | `PendingOnboardingCard` *(new)* | `GET /api/employees → filter(status = PENDING)` |

---

### Dashboard: AUDITOR

**Purpose:** Focused, read-only view. Surface flagged tasks and outstanding audit items. No admin clutter.

| Zone | Component | Data Source |
|------|-----------|-------------|
| Audit Stats | `AuditStatCards` *(new)* | Flagged tasks vs total tasks count |
| Flagged Tasks Feed | `FlaggedTasksFeed` *(new)* | Tasks filtered by `flagged = true` (needs backend field added) |
| Evidence Review Queue | `EvidenceReviewQueue` *(new)* | Tasks with evidence in pending review state |

---

## Section 3 — Module Breakdown

---

### Tasks Module — `/tasks`

**Roles:** EMPLOYEE · MANAGER · AUDITOR  
**Pipeline:** `TODO → IN_PROGRESS → IN_REVIEW → DONE`

#### UI Components

| Component | Status | Description |
|-----------|--------|-------------|
| `TaskBoard.jsx` | Exists | Kanban with 4 columns using `@hello-pangea/dnd`. Employee sees own tasks; Manager sees toggle for Team Tasks via `GET /api/tasks/team-tasks`. |
| `TaskDetailsModal.jsx` | Exists (refactor) | Full task detail with comments, evidence, audit flag (AUDITOR), rating (MANAGER). Currently 42KB — split into 3 tabs: **Details / Comments / Evidence**. |
| `CreateTaskModal.jsx` | Exists | Manager-only. Add `priority: HIGH\|MEDIUM\|LOW` field to entity and form. |
| `TaskFilterBar` | **New** | Filter by status, assignee, due date range, priority. Inline above the Kanban. Persist state in URL query params. |
| `KanbanColumn` | Extract | Dumb component: props `columnId, tasks, onDrop`. |
| `TaskCard` | Extract | Dumb component: props `task, onClick`. Shows priority dot, due date chip, assignee avatar. |

#### API Dependencies

| Method | Endpoint | Used By |
|--------|----------|---------|
| `GET` | `/api/tasks/my-tasks` | TaskBoard — employee view |
| `GET` | `/api/tasks/team-tasks` | TaskBoard — manager toggle |
| `POST` | `/api/tasks` | `CreateTaskModal` |
| `PATCH` | `/api/tasks/:id/status` | Drag-and-drop handler |
| `POST` | `/api/tasks/:id/comments` | Comment thread |
| `POST` | `/api/tasks/:id/evidence` | Evidence upload |
| `PATCH` | `/api/tasks/evidence/:id/review` | Manager evidence review |
| `POST` | `/api/tasks/:id/flag` | Auditor flag button |
| `POST` | `/api/tasks/:id/rate` | Manager rating widget |

#### State Management

Tasks are fetched once on mount, stored in local component state. **Optimistic updates** on drag-and-drop: update local state immediately, call `PATCH /status`, rollback on error. Consider a `useTasksStore` Zustand slice if tasks are referenced from dashboard widgets to avoid duplicate fetches.

---

### Attendance Module — `/attendance-log`, `/roster`

**Roles:** EMPLOYEE (log) · MANAGER (roster + adjustments)

#### UI Components

| Component | Status | Description |
|-----------|--------|-------------|
| `AttendanceTracker` | Exists (move) | Dark clock-in modal. Move trigger from dashboard header to persistent topbar button so it's accessible from any page. |
| `MyAttendanceLog.jsx` | Exists | Monthly calendar/table. Add summary cards at top: total working days, present, absent, late. |
| `DailyRosterBoard.jsx` | Exists | Live team grid, auto-refreshes every 60s. Add department filter dropdown for multi-team scenarios. |
| `TimesheetAdjustModal.jsx` | Exists | Manager adjusts clock-in/out with reason. Keep as-is. |
| `AuditLogDrawer.jsx` | Exists | Slide-in drawer showing adjustment history per attendance record. |

#### API Dependencies

```
POST  /api/attendance/clock-in
POST  /api/attendance/clock-out
GET   /api/attendance                          (my log)
GET   /api/attendance/roster/today             (manager)
PUT   /api/attendance/:id/manual-update        (manager)
GET   /api/attendance/:id/audit-logs           (manager)
```

---

### Leave Module — `/leave`, `/approvals`

**Roles:** EMPLOYEE · MANAGER · HR

#### UI Components

| Component | Status | Description |
|-----------|--------|-------------|
| `LeaveRequestPage.jsx` | Exists | Wraps `LeaveBalanceCard` + `LeaveRequestForm` + `MyLeaveRequestsTable`. Add status timeline to each row. |
| `LeaveApprovalsPage.jsx` | Exists | Manager view with `PendingLeaveTable`. Add department filter and date range filter. |
| `LeaveActionModal.jsx` | Exists | Approve/reject with comment. Keep as-is. |
| `LeavePolicyPage.jsx` | Exists | HR-only policy CRUD. Apply WS design system card layout. |
| `LeaveBalanceOverridePage.jsx` | Exists | HR manual balance adjustment. Add `ConfirmDialog` before submit. |

#### State Management

Use a shared `useLeaveBalance()` hook so `LeaveBalanceCard` on the Employee Dashboard and `LeaveRequestPage` share the same cached fetch, avoiding duplicate API calls.

---

### Payroll & Compensation Module — `/hr/payroll`, `/my-compensation`

**Roles:** HR (full management) · EMPLOYEE (own payslips)

#### UI Components

| Component | Status | Description |
|-----------|--------|-------------|
| `PayrollDashboard.jsx` | Exists (extend) | Month/year picker → summary table → generate/process/mark-paid. Add `PayrollBatchProgressBar` (X of N processed). Add bulk action toolbar: "Process All Draft", "Mark All Paid". |
| `SalaryStructureModal` | Exists (extract) | Currently inline in `PayrollDashboard.jsx`. Extract to own file `SalaryStructureModal.jsx`. Fields: baseSalary, HRA, DA, travel allowance, PF%, professional tax. |
| `MyCompensation.jsx` | Exists (extend) | Employee payslip history. Add current month CTC summary card at top. |
| `PayslipViewerModal` | **New** | Renders payslip inline using `<iframe src={blobUrl}>` from `GET /api/payroll/:id/payslip`. Separate download button. |

#### API Dependencies

```
POST  /api/payroll/generate
GET   /api/payroll/summary
PUT   /api/payroll/:id/process
PUT   /api/payroll/:id/mark-paid
GET   /api/payroll/:id/payslip
POST  /api/payroll/salary-structure
GET   /api/payroll/salary-structure/:employeeId
GET   /api/payroll/my
```

---

### HR Operations Module

**Roles:** HR (admin views) · EMPLOYEE (self-service views)

#### Submodules

| Component | Role | Description |
|-----------|------|-------------|
| `AssetDirectory.jsx` | HR | Full asset CRUD + assign/return. Add warranty status badges: `Expiring Soon`, `Expired`. Filter by category and assigned status. |
| `MyAssets.jsx` | EMPLOYEE | Read-only list of assets assigned to me. Add asset category icon and condition badge. |
| `HelpdeskAdmin.jsx` | HR | All grievance tickets. Filter: OPEN / IN_PROGRESS / RESOLVED. Assign to HR member. Comment thread. Bulk close action. |
| `Helpdesk.jsx` | EMPLOYEE | Create ticket (title, description, category). View own ticket history with status timeline. Add ticket detail drawer with comment thread. |
| `PerformanceOverview.jsx` | HR | Org-wide appraisal cycles. Create new cycle. Track pending self/manager ratings. Add completion percentage per department. |
| `TeamAppraisals.jsx` | MANAGER | Rate direct reports. View team appraisal status. |
| `MyAppraisals.jsx` | EMPLOYEE | Self-rating, view manager rating, acknowledge final appraisal. |
| `OffboardingTracker.jsx` | HR | Initiate exit + clearance checklist: Asset Return → Access Revoked → Final Payroll → Exit Interview. Add bulk status update. |

---

### Hiring Pipeline Module — `/hiring/jobs`, `/hiring/jobs/:id/pipeline`

**Roles:** HR

#### Pipeline Stages

```
APPLIED → SHORTLISTED → INTERVIEWING → OFFERED → ACCEPTED → REJECTED
```

#### UI Components

| Component | Status | Description |
|-----------|--------|-------------|
| `JobOpeningsList.jsx` | Exists | Table of all job openings with status chips (DRAFT / OPEN / CLOSED). Create new via `CreateJobModal`. |
| `HiringPipelineBoard.jsx` | Exists | Per-job Kanban by candidate status using `@hello-pangea/dnd`. `CandidateDrawer` shows full profile. |
| `CandidateDrawer.jsx` | Exists | Candidate profile, resume, interview history, action buttons. |
| `InterviewScheduleModal.jsx` | Exists | Schedule interview date/time/interviewer. Triggers notification to both parties. |
| `OfferGenerationModal.jsx` | Exists | Generate offer letter with salary/start date. Sends token link email to candidate. |
| `FinalizeHireModal.jsx` | Exists | On ACCEPTED: triggers employee onboarding → calls `POST /api/employees`. |
| `PublicCareersList.jsx` | Exists | External-facing. No auth wrapper. Standalone layout without sidebar. |
| `PublicJobDetails.jsx` | Exists | External-facing. No auth. |
| `PublicApplyForm.jsx` | Exists | External application form. No auth. |
| `PublicOfferResponse.jsx` | Exists | Candidate accepts/declines offer via token URL. No auth. |

---

### Administration Module

**Roles:** SUPER_ADMIN (all) · HR (org config subset)

Refactor all admin pages from isolated full-page forms into a unified **Administration section** with sidebar sub-navigation grouping.

| Page | Route | Access | Current Status |
|------|-------|--------|---------------|
| Departments | `/departments` | HR, SA | `DepartmentForm.jsx` — exists |
| Job Positions | `/jobPosition` | HR, SA | `JobPositionForm.jsx` — exists |
| Work Schedules | `/work-schedules` | HR, SA | `WorkSchedulePage.jsx` — exists |
| Public Holidays | `/holidays` | HR, SA | `PublicHolidayPage.jsx` — exists |
| Leave Policies | `/leave-policies` | HR, SA | `LeavePolicyPage.jsx` — exists |
| Leave Balance Override | `/leave-override` | HR, SA | Exists |
| Permission Roles | `/roles` | SA only | `RoleForm.jsx` — exists |
| Role Allocation | `/role-management` | SA only | `RoleManagement.jsx` — exists |
| Onboard Employee | `/register` | SA only | `AddEmployee.jsx` — exists |

---

## Section 4 — Component Architecture

### Reusable Shared Components

| Component | Path | Props / Purpose |
|-----------|------|-----------------|
| `StatCard` | `components/common/StatCard.jsx` | `title, value, delta, icon, color` — KPI metric card using WS design system |
| `RoleBadge` | `components/common/RoleBadge.jsx` | `role` — color-coded badge per role; used in EmployeeList, RoleManagement, UserMenu |
| `StatusBadge` | `components/common/StatusBadge.jsx` | `status, map?` — generic colored badge for task/leave/payroll status |
| `ConfirmDialog` | `components/common/ConfirmDialog.jsx` | `title, description, onConfirm, onCancel, variant` — wraps shadcn `AlertDialog` |
| `PageHeader` | `components/common/PageHeader.jsx` | `icon, title, subtitle, actions` — renders `.ws-topbar` pattern from `admin-ui.css` consistently |
| `EmptyState` | `components/common/EmptyState.jsx` | `icon, title, description, action?` — shown when lists/tables are empty |
| `DataTable` | `components/common/DataTable.jsx` | `columns, data, loading, pagination?` — wraps shadcn Table with loading skeletons and empty state |
| `Sidebar` | `components/layout/Sidebar.jsx` | **New.** Role-aware nav tree. Collapsible. Persists collapse state in localStorage. |
| `GlobalSearch` | `components/layout/GlobalSearch.jsx` | **New.** `⌘K` command palette using shadcn `Command` component. |
| `UserMenu` | `components/layout/UserMenu.jsx` | **New.** Avatar, name (from profile), role badge, Profile link, Logout. |

---

### Smart vs Dumb Component Split

**Smart (container) components** own data fetching, state, and side effects.  
**Dumb (presentational) components** are pure render — only receive props and emit events.

#### TaskBoard tree

```
[SMART]  TaskBoard.jsx
│         owns: tasks state, filter state, API calls, drag handlers
│
├── [DUMB]  KanbanColumn
│           props: columnId, tasks, onDrop
│
├── [DUMB]  TaskCard
│           props: task, onClick
│           shows: priority badge, due date chip, assignee avatar
│
├── [SMART] TaskDetailsModal
│           owns: comments fetch, evidence upload, flag/rate API calls
│           props: taskId, isOpen, onClose
│
└── [DUMB]  TaskFilterBar
            props: filters, onChange (controlled)
```

#### HRDashboard tree

```
[SMART]  HRDashboard.jsx
│         orchestrates: Promise.all([employees, payroll, jobs, grievances])
│         passes resolved data as props downstream
│
├── [DUMB]  HRStatCards          props: headcount, openJobs, payrollTotal, openGrievances
├── [DUMB]  PayrollStatusBand    props: processed, total, month
├── [DUMB]  HRActionQueue        props: pendingLeaves, openGrievances, pendingOffboarding
└── [DUMB]  HiringSnapshotCard   props: openings, candidatesByStage
```

---

### Custom Hooks Pattern

```js
// hooks/useMyTasks.js
function useMyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyTasks().then(setTasks).finally(() => setLoading(false));
  }, []);

  return {
    tasks,
    loading,
    refetch: () => getMyTasks().then(setTasks),
  };
}

// Create similar hooks for each domain:
// useLeaveBalance.js  → GET /api/leave-ledger/my-balances
// useTeamRoster.js    → GET /api/attendance/roster/today
// usePayrollSummary.js → GET /api/payroll/summary
// useGrievances.js    → GET /api/grievances
```

Each hook: one API endpoint, one state slice, one refetch function. Dashboard components combine hooks without reimplementing fetch logic.

---

### Data Flow

```
AuthContext (user, roles, profile)
    │
    ├── Sidebar (renders role-aware nav)
    ├── Dashboard (resolves role → component)
    │       └── [role dashboard] → custom hooks → API layer → Spring Boot
    └── PrivateRoute (guards by allowedRoles)
```

---

## Section 5 — UX Decisions

### Why persistent sidebar instead of horizontal topbar nav

**Problem solved:** Scalability and discoverability.

The current navbar has 8+ top-level links plus a dense admin dropdown. With the sidebar, every feature is always visible, grouped, and labeled. The user can see where they are (active state with left border indicator) and where they can go without hunting through a dropdown. The current admin dropdown required 2 clicks to reach any HR/admin feature; the sidebar reduces this to 1.

---

### Why role-resolved dashboards instead of one shared dashboard

**Problem solved:** Context-first information architecture.

An EMPLOYEE waking up needs to know: "Did I clock in? What tasks are due today? How many leave days do I have?" An HR Manager needs: "How many employees are present? Is payroll ready? Are there open grievances?" These are fundamentally different mental models. One generic dashboard either shows noise (too much irrelevant data), or shows too little (misses what the role actually cares about).

---

### Why `AttendanceTracker` should be a topbar button, not embedded in the dashboard header

**Problem solved:** Persistent access from any page + recovered screen real estate.

Clock-in is the first action every employee does each day. It should always be reachable — not just on the dashboard. Moving it to the topbar means an employee can clock in from the Tasks page, the Leave page, anywhere. The dashboard header recovers ~100px of vertical space for actual metrics.

---

### Why Global Search (`⌘K`) in the topbar

**Problem solved:** Power-user navigation speed for HR operators.

HR admins regularly need to jump between 100+ employee records, job openings, and payroll batches. A command palette is faster than any sidebar tree. It searches employees by name, tasks by title, job openings by position, and navigates directly to the relevant page on selection. Target users will use it multiple times per session.

---

### Why Helpdesk is split into two views (`/helpdesk` vs `/hr/helpdesk`)

**Problem solved:** Role-appropriate scope and data privacy.

The employee should only see their own tickets — exposing the org-wide grievance list would be a privacy and confidentiality issue. The backend already enforces this correctly (`GET /api/grievances/my` vs `GET /api/grievances`). The UX reflects this separation with distinct page titles, column sets, and action buttons appropriate to each role.

---

### Why hiring pipeline uses a per-job Kanban, not a unified board

**Problem solved:** Contextual clarity and action isolation.

A single board mixing candidates from 5 different job openings would be unmanageable — you can't take an action (schedule interview, generate offer) without knowing which job opening a candidate belongs to. The current per-job pipeline board is the correct pattern. The improvement is to add a summary view at `/hiring/jobs` that shows candidate counts per stage per job — a quick health check before drilling into the Kanban.

---

## Section 6 — Suggested Improvements

### 🔴 Critical Fixes — Implement Immediately

#### Bug: Dashboard shows `firstName = 'there'` hardcoded

**Location:** `Dashboard.jsx:19` — `const firstName = 'there';`

This placeholder shipped to production. The greeting reads "Good morning, there! ☕" for all users.

**Fix:** Extend `AuthContext` to store `firstName` from a profile fetch at login time:
```js
// In AuthContext, after handleLogin:
const profile = await getEmployeeProfile(authData.employeeId);
setUser({ ...authData flags..., firstName: profile.firstName, profilePic: profile.profilePic });
```
The `employeeId` is already stored in localStorage. One fetch on login eliminates this across all pages.

---

#### Architecture: AuthContext doesn't persist user profile

`AuthContext` only stores `{ id, status, roles }`. Every component that needs `firstName`, `department`, or `profilePic` makes its own API call, causing redundant requests.

**Fix:** Add a `profile` field to `AuthContext`, populated by `GET /api/employees/{employeeId}` on login. Share this profile across `UserMenu`, `Dashboard` greeting, `Profile` page, and any component that needs user identity data.

---

#### UX: Navigation is not responsive on mobile

The horizontal topbar with 8+ links wraps and breaks on screens under ~900px. There is no mobile navigation pattern currently.

**Fix:** The sidebar migration solves this natively — the sidebar becomes a full-screen overlay drawer on mobile triggered by a hamburger icon. No additional work needed beyond implementing the sidebar.

---

### 🟡 UX Issues — Fix Before Launch

#### `TaskDetailsModal.jsx` is 42KB doing the work of 3 components

The single file handles: task info display, comment thread, evidence upload, evidence review, audit flagging, and manager rating. This creates a massive component that's hard to maintain and slow to parse.

**Fix:** Split into tabs inside the modal:
```
TaskDetailsModal (smart, owns all API calls)
  ├── <TaskInfoTab />        — title, description, assignee, due date, priority
  ├── <CommentsTab />        — comment list + input
  └── <EvidenceTab />        — upload + review + audit flag + manager rating
```

---

#### Manager lands on the Employee dashboard, not a management view

A MANAGER going to `/dashboard` sees the generic Employee task board. Their actual management view (team roster) is at `/roster` — a completely separate page they have to navigate to manually.

**Fix:** Apply the role resolver pattern. When `highestRole === 'MANAGER'`, render `<ManagerDashboard />` at `/dashboard`. This dashboard embeds the team roster as the primary widget, with leave approvals and team task summary alongside it.

---

#### No loading skeletons — plain text loading states throughout

Multiple pages show a raw `loading ? 'Loading roster data...' : <content>` pattern with no visual structure.

**Fix:** Use shadcn `Skeleton` which is already imported at `components/ui/skeleton.jsx`. Render page-shaped skeleton placeholders that match the layout of the content being loaded. The component already exists — it just needs to be used.

---

#### Admin dropdown has no keyboard navigation

`NavBar.jsx` uses `onBlur → setTimeout(close, 200)` which breaks keyboard focus navigation into dropdown links.

**Fix:** If keeping the dropdown temporarily, replace with a proper shadcn/Radix `NavigationMenu`. Long-term, this is deprecated by the sidebar migration.

---

### 🟢 Missing Features — Add These

#### No AUDITOR dashboard exists

The `AUDITOR` role has unique API access (`POST /api/tasks/:id/flag`) but currently lands on the generic Employee dashboard — a mismatch between the role's purpose and what it sees.

**Create:** `AuditorDashboard.jsx` with:
- `AuditStatCards` — flagged tasks vs total tasks
- `FlaggedTasksFeed` — list of tasks flagged for review
- `EvidenceReviewQueue` — tasks with uploaded evidence pending audit review

---

#### No Global Search / Command Palette

HR users managing 100+ employees have no fast-navigation mechanism. Finding a specific employee, payroll record, or job opening requires manual sidebar navigation.

**Create:** `GlobalSearch.jsx` using shadcn `Command` component, triggered by `⌘K`. Searches: employees (by name), tasks (by title), job openings (by title/department). Navigates to the relevant page on selection. Uses locally cached lists (from existing API calls already made) — no extra backend endpoint needed.

---

#### No payslip inline viewer

`GET /api/payroll/:id/payslip` returns a PDF blob. Currently employees and HR have no way to view it without downloading.

**Create:** `PayslipViewerModal.jsx`:
```js
const blobUrl = URL.createObjectURL(await fetchPayslipBlob(id));
return (
  <Dialog>
    <iframe src={blobUrl} width="100%" height="600px" />
    <Button onClick={() => downloadBlob(blobUrl, `payslip-${id}.pdf`)}>Download</Button>
  </Dialog>
);
```

---

#### Tasks lack a `priority` field

The Kanban has no urgency signal. All tasks appear equally important regardless of deadline or business impact.

**Add:** `priority: HIGH | MEDIUM | LOW` to the `Task` entity, `TaskService`, and `TaskResponseDTO`. Render as a colored dot on `TaskCard`. Filter by priority in `TaskFilterBar`. Set in `CreateTaskModal`.

---

#### No full notification center page

`NotificationBell` shows a small dropdown but there's no `/notifications` page for a full history.

**Create:** `/notifications` route with:
- Paginated notifications list
- Filter by type: leave, task, payroll, appraisal
- Bulk mark-all-read action
- Link each notification to the relevant page

---

### 🔵 Scalability Improvements

#### Add `React.lazy + Suspense` for code-splitting

`App.jsx` eagerly imports all 40+ components at startup. Heavy files like `EmployeeList.jsx` (45KB), `TaskDetailsModal.jsx` (42KB), and `HiringPipelineBoard.jsx` bloat the initial bundle.

```js
// Before
import EmployeeList from './features/hr/EmployeeList';

// After
const EmployeeList = React.lazy(() => import('./features/hr/EmployeeList'));

// Wrap routes in:
<Suspense fallback={<PageSkeleton />}>
  <Route path="/employee-list" element={<EmployeeList />} />
</Suspense>
```

Estimated bundle reduction: **40–50%** on initial load.

---

#### Add TanStack Query for server state management

Every component manages its own `useState + useEffect + loading + error` pattern with no caching, deduplication, or background refetch.

**Migration path** (incremental — start here):
1. `useMyTasks` → `useQuery({ queryKey: ['tasks'], queryFn: getMyTasks })`
2. `useLeaveBalance` → same pattern
3. Roll out to remaining data hooks over time

Benefits: automatic caching, deduplication of parallel requests, background refetch, and consistent loading/error states across all components.

---

#### Add 401 interceptor to `axiosInstance.js`

Currently `axiosInstance.js` only sets the base URL and auth header. If a JWT expires mid-session, API calls silently fail with 401 errors — the user sees broken UI with no redirect.

```js
// axiosInstance.js
instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      logout(); // from AuthContext
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

#### Add `GET /api/jobs/stats` backend endpoint

The HR Dashboard `HiringSnapshotCard` needs aggregate data that no current endpoint provides.

**New endpoint:**
```
GET /api/jobs/stats
Response: {
  openJobs: number,
  totalCandidates: number,
  byStage: {
    APPLIED: number,
    SHORTLISTED: number,
    INTERVIEWING: number,
    OFFERED: number,
    ACCEPTED: number
  },
  avgTimeToHireDays: number
}
```

This enables the HR dashboard hiring snapshot widget without multiple individual API calls.

---

*WorkSphere Dashboard Blueprint — All module names, routes, and component names are derived directly from analysis of the uploaded codebase. No invented names.*
