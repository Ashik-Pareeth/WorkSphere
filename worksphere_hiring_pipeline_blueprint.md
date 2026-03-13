# WorkSphere — Hiring Pipeline Blueprint
> Recruitment Module · Architecture & Implementation Guide · Internal Use

---

## 1. Pipeline Overview

The hiring pipeline is a 5-stage Kanban-style workflow that connects a vacancy to an onboarded employee. Each stage produces a clear artifact that feeds the next, creating a fully traceable hiring record.

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────────┐
│  Job Opening │ →  │ Applications │ →  │  Screening  │ →  │  Interviews │ →  │ Offer & Hire │
└─────────────┘    └──────────────┘    └─────────────┘    └─────────────┘    └──────────────┘
```

The key integration is at the end: when a candidate accepts an offer, the system automatically creates an `Employee` record and triggers the existing Onboarding workflow — making the pipeline feel like a continuous, connected experience rather than a standalone module.

---

## 2. Pipeline Stages

### Stage 1 — Job Opening
**Owner:** HR / Admin

HR or Admin creates a job posting tied to a specific `Department` and `JobPosition`. The opening defines the vacancy's requirements, salary band, and approval status before going live.

- **Input:** Vacant `JobPosition` slot (or manual creation)
- **Output:** `JobOpening` record with status `DRAFT → OPEN`

---

### Stage 2 — Applications
**Owner:** Public (no auth) → HR

A public-facing apply form allows candidates to submit their details without logging in. Each submission auto-creates a `Candidate` record and fires a notification to the responsible HR officer.

- **Input:** Public apply form (name, email, resume, cover note)
- **Output:** `Candidate` record linked to `JobOpening`, HR notified

---

### Stage 3 — Screening
**Owner:** HR

HR reviews incoming applications and moves candidates to Shortlisted or Rejected. Internal notes can be left against each candidate (same pattern as `GrievanceTicket` comments). Rejected candidates receive a notification.

- **Input:** `Candidate` record in `APPLIED` status
- **Output:** Candidate status → `SHORTLISTED` or `REJECTED`, notes attached

---

### Stage 4 — Interviews
**Owner:** HR + Manager (interviewer)

One or more interview rounds are scheduled. Each round links a `Candidate` to an `Employee` (the interviewer) with a date/time. After the interview, the interviewer submits a score (1–5) and written feedback. Multiple rounds are supported sequentially.

- **Input:** Shortlisted candidate, assigned interviewer `Employee`
- **Output:** `InterviewSchedule` records with scores and feedback

---

### Stage 5 — Offer & Hire
**Owner:** HR / Admin

HR generates an offer letter with a proposed salary tied to the `JobPosition`'s salary band. The candidate receives the offer and responds. On acceptance, the system auto-creates an `Employee` record and triggers the Onboarding checklist.

> This is the money-shot integration — the pipeline hands off seamlessly to the existing Onboarding module.

- **Input:** Candidate with completed interviews, `OfferLetter` generated
- **Output:** Candidate `ACCEPTED` → `Employee` created → Onboarding triggered

---

## 3. Backend Entities

Four new entities required. All should extend `BaseEntity` for audit tracking consistency.

---

### 3.1 `JobOpening`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key, extends BaseEntity |
| `title` | String | e.g. "Senior Java Developer" |
| `description` | String (TEXT) | Full job description and requirements |
| `department` | FK → Department | Which department owns this opening |
| `jobPosition` | FK → JobPosition | Position being filled (salary band pulled from here) |
| `status` | Enum | `DRAFT` \| `OPEN` \| `CLOSED` \| `CANCELLED` |
| `openSlots` | Integer | How many vacancies this opening covers (default 1) |
| `closingDate` | LocalDate | Optional deadline for applications |
| `createdBy` | FK → Employee | HR officer who created this opening |
| `salaryMin` | BigDecimal | Overridable min salary (defaults to JobPosition band) |
| `salaryMax` | BigDecimal | Overridable max salary (defaults to JobPosition band) |

---

### 3.2 `Candidate`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key, extends BaseEntity |
| `jobOpening` | FK → JobOpening | Which opening they applied for |
| `fullName` | String | Candidate's full name |
| `email` | String | Contact email — used for offer delivery |
| `phone` | String | Optional contact number |
| `resumeUrl` | String | S3 / storage path for uploaded resume |
| `coverNote` | String (TEXT) | Free-text cover letter |
| `status` | Enum | `APPLIED` \| `SHORTLISTED` \| `REJECTED` \| `INTERVIEWING` \| `OFFERED` \| `ACCEPTED` \| `DECLINED` |
| `source` | Enum | `PORTAL` \| `REFERRAL` \| `LINKEDIN` \| `OTHER` |
| `rejectionReason` | String | Optional note when status = `REJECTED` |
| `convertedEmployee` | FK → Employee (nullable) | Set when candidate accepts and Employee is created |

---

### 3.3 `InterviewSchedule`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key, extends BaseEntity |
| `candidate` | FK → Candidate | Who is being interviewed |
| `interviewer` | FK → Employee | Internal employee conducting the interview |
| `roundNumber` | Integer | 1st round, 2nd round, etc. |
| `scheduledAt` | LocalDateTime | Date and time of interview |
| `mode` | Enum | `IN_PERSON` \| `VIDEO` \| `PHONE` |
| `status` | Enum | `SCHEDULED` \| `COMPLETED` \| `CANCELLED` \| `NO_SHOW` |
| `score` | Integer (1–5) | Interviewer's rating after completion |
| `feedback` | String (TEXT) | Interviewer's written notes |
| `completedAt` | LocalDateTime | When feedback was submitted |

---

### 3.4 `OfferLetter`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key, extends BaseEntity |
| `candidate` | FK → Candidate | Offer recipient |
| `jobOpening` | FK → JobOpening | Position being offered |
| `proposedSalary` | BigDecimal | Offered base salary |
| `joiningDate` | LocalDate | Expected start date |
| `status` | Enum | `DRAFT` \| `SENT` \| `ACCEPTED` \| `DECLINED` \| `EXPIRED` |
| `sentAt` | LocalDateTime | When the offer was dispatched |
| `respondedAt` | LocalDateTime | When candidate responded |
| `expiresAt` | LocalDate | Offer validity deadline |
| `generatedBy` | FK → Employee | HR officer who created the offer |
| `salaryStructureSnapshot` | JSON | Snapshot of SalaryStructure at time of offer |

---

## 4. API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/jobs` | Create a job opening | ADMIN, HR |
| `GET` | `/jobs` | List all openings (with filters) | Authenticated |
| `PUT` | `/jobs/{id}/status` | Open / Close / Cancel an opening | ADMIN, HR |
| `POST` | `/jobs/{id}/apply` | Submit a candidate application | **PUBLIC** |
| `GET` | `/jobs/{id}/candidates` | List candidates for an opening | ADMIN, HR, MANAGER |
| `PATCH` | `/candidates/{id}/status` | Shortlist or reject a candidate | ADMIN, HR |
| `POST` | `/candidates/{id}/notes` | Add internal note to candidate | Authenticated |
| `POST` | `/interviews` | Schedule an interview round | ADMIN, HR |
| `PATCH` | `/interviews/{id}/feedback` | Submit score and feedback | Authenticated (interviewer) |
| `POST` | `/offers` | Generate an offer letter | ADMIN, HR |
| `PATCH` | `/offers/{id}/respond` | Candidate accepts or declines | PUBLIC (token-based) |
| `POST` | `/offers/{id}/convert` | Convert accepted candidate to Employee | ADMIN, HR |

---

## 5. Frontend Screens

### 5.1 Job Openings List — `/hiring/jobs`
Accessible to HR and Admin. Shows all openings with status badges, candidate counts, and days since posting.

- Filter by: Department, JobPosition, Status, Date range
- Each row shows: Title, Department, Open Slots, Applications count, Status badge
- Quick action: Toggle `OPEN ↔ CLOSED` without leaving the list

---

### 5.2 Kanban Pipeline Board — `/hiring/jobs/:id/pipeline`
The centerpiece screen. Five columns represent the five stages. Candidate cards live in columns and can be dragged between stages (with confirmation modals for irreversible actions like Reject).

- Each candidate card shows: Name, Applied date, Interview score average, Status badge
- Click card → Side drawer opens with full candidate detail, notes, interview history
- Drag card from Screening → Interviews → prompts to schedule a round
- Drag card from Interviews → Offer → prompts offer generation modal
- Column headers show candidate count and average score for that stage

---

### 5.3 Public Apply Form — `/jobs/:openingId/apply`
Fully unauthenticated. Minimal friction — name, email, phone, resume upload, optional cover note.

- No login required — public endpoint
- Resume upload reuses existing `TaskEvidence` upload logic
- On submit: HR notified via existing `NotificationService`, confirmation screen shown

---

### 5.4 Interview Scheduling Modal
Triggered from the Pipeline Board when a candidate moves to Interviews stage. HR selects interviewer (Employee lookup), date/time, and mode. Interviewer receives a notification with a link to submit feedback.

---

### 5.5 Offer Generation Modal
HR clicks "Generate Offer" from the candidate drawer. Pre-fills salary from `JobPosition` band. HR can override. Sets joining date. On send, candidate receives a link to accept or decline.

---

## 6. Role Permissions

| Action | ADMIN / HR | MANAGER | PUBLIC |
|---|---|---|---|
| Create/Edit Job Openings | ✅ | View only | — |
| View Candidates | ✅ | Own team only | — |
| Shortlist / Reject | ✅ | — | — |
| Schedule Interview | ✅ | — | — |
| Submit Interview Feedback | ✅ | ✅ (as interviewer) | — |
| Generate Offer | ✅ | — | — |
| Accept / Decline Offer | — | — | ✅ (token-based) |
| Convert to Employee | ✅ | — | — |
| Apply for a job | — | — | ✅ |

> Note: A dedicated `RECRUITER` role does not exist in the current codebase. MANAGER covers team-scoped visibility for now. Can be added in a later iteration.

---

## 7. Integration Points with Existing Modules

### `NotificationService`
| Trigger | Recipient |
|---|---|
| New application submitted | HR officer |
| Interview scheduled | Interviewer (Employee) |
| Offer sent | Candidate (email) |
| Offer accepted | HR officer |

---

### `AuditService`
Log all of the following via `auditService.log()`:
- `JobOpening` status changes
- Candidate status transitions
- Offer generation and response
- Employee conversion from Candidate

---

### `EmployeeService` / Onboarding handoff
When a candidate accepts an offer and HR converts them:

```
Candidate.email          → Employee.email
Candidate.fullName       → Employee.name
OfferLetter.proposedSalary → SalaryStructure.baseSalary
JobOpening.department    → Employee.department
JobOpening.jobPosition   → Employee.jobPosition
OfferLetter.joiningDate  → Employee.joiningDate
                           → Onboarding checklist triggered
```

---

### `JobPosition` — what the pipeline will expose as missing
Building the pipeline will reveal these gaps in `JobPosition` that need to be added:
- **Salary band (min/max)** — needed for offer pre-fill
- **Total approved slots** — needed to validate if opening is legitimate
- **Required skills** — pulled into job description

> Do not enrich `JobPosition` before the pipeline. Build the pipeline first and let it tell you exactly what's missing.

---

## 8. Demo Script

| Step | Action | What the Audience Sees | Wow Moment |
|---|---|---|---|
| 1 | Admin creates "Senior Developer" opening | Job Openings list gains a new OPEN card | |
| 2 | Open public apply form in incognito tab | Clean form, no login required | External feel |
| 3 | Submit 2 candidate applications | Pipeline board: 2 cards appear in Applications column | |
| 4 | HR drags one to Shortlisted, rejects other with note | Rejected card gone, note saved | Drag = intuitive |
| 5 | Schedule interview, assign manager as interviewer | InterviewSchedule created, manager notified | |
| 6 | Manager submits score (4/5) + feedback | Card shows average score badge in Interviews column | Score visible |
| 7 | HR generates offer from pipeline board | Offer modal pre-fills salary from JobPosition band | Auto-filled |
| 8 | Candidate accepts offer (via link) | Candidate status → ACCEPTED | |
| 9 | HR clicks Convert to Employee | Employee record created, Onboarding checklist appears | **The money shot** |

Total demo time: ~5 minutes.

---

## 9. Implementation Order

Build in this sequence so there is always something demoable at each phase.

### Phase 1 — Backend Foundation
- Create `JobOpening`, `Candidate`, `InterviewSchedule`, `OfferLetter` entities
- Repositories and basic CRUD services
- Public `/apply` endpoint (no auth)
- Candidate status transition logic

### Phase 2 — Frontend Kanban Board
- Job Openings list page (`/hiring/jobs`)
- Kanban pipeline board with drag-and-drop columns
- Candidate side drawer with status actions
- Public apply form page

### Phase 3 — Interviews
- Interview scheduling modal
- Feedback submission for interviewers
- Score display on candidate cards

### Phase 4 — Offer & Handoff _(the money shot)_
- Offer generation modal with salary pre-fill
- Offer acceptance flow (token-based public link)
- Candidate → Employee conversion logic
- Onboarding trigger on conversion

### Phase 5 — Enrichment _(after pipeline is proven)_
- Add salary band and slot count to `JobPosition`
- Add headcount and department head to `Department`
- Link vacant slots to automatic job opening suggestions

---

*WorkSphere ERP · Hiring Pipeline Blueprint · Internal Architecture Document*
