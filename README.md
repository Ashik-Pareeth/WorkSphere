# WorkSphere - HR Management & Recruitment Platform

WorkSphere is a comprehensive, full-stack Human Resources and Recruitment application designed to manage the entire employee lifecycle. From job publishing and applicant tracking to onboarding, payroll, and performance management, WorkSphere provides modern HR operations in a unified platform.

## 🚀 Key Features

*   **Public Careers Portal**: A branded, public-facing careers page listing open roles.
*   **Applicant Tracking System (ATS)**: Hiring pipeline with Kanban board (Drag & Drop), interview scheduling, feedback tracking, and automated offer generation.
*   **Core HR Hub**: Employee directory, hierarchical management structure, and self-service portals.
*   **Leave Management**: Role-based leave policies, balance tracking, and manager approvals.
*   **Performance & Appraisals**: Structured review cycles, 360-degree feedback, and goal tracking.
*   **Payroll & Compensation**: Salary structures, tax slab management, and compliant payroll runs.
*   **Helpdesk & Asset Management**: Internal ticketing system and company equipment tracking.
*   **Access Control**: Granular Role-Based Access Control (RBAC) securing internal endpoints via JWT (Employee, Manager, HR, Super Admin, Auditor).

## 🛠 Tech Stack

### Frontend (Client)
*   **Framework**: React 18 with Vite
*   **Routing**: React Router DOM v6
*   **Styling**: Tailwind CSS, Shadcn UI (Radix UI primitives)
*   **State Management & Data Fetching**: React Hooks, Axios
*   **Interactions**: `@hello-pangea/dnd` (for Kanban boards), `lucide-react` (icons), `sonner` (toast notifications)

### Backend (Server)
*   **Framework**: Java 21, Spring Boot 3
*   **Security**: Spring Security 6, JWT (JSON Web Tokens)
*   **Database ORM**: Hibernate, Spring Data JPA
*   **Database Engine**: PostgreSQL (or MySQL/H2 depending on configuration)
*   **API Architecture**: REST APIs (JSON)

## 📦 Project Structure

```text
UCOC_Project/
├── worksphere/               # Spring Boot Backend Code
│   ├── src/main/java/.../
│   │   ├── config/           # Security, Seeder, CORS
│   │   ├── controller/       # REST API Endpoints
│   │   ├── entity/           # JPA Entities
│   │   ├── repository/       # Data Access Layer
│   │   └── service/          # Business Logic
│   └── pom.xml               # Maven Dependencies
│
└── worksphere-client/        # React Frontend Code
    ├── src/
    │   ├── api/              # Axios interceptors and services
    │   ├── components/       # Reusable UI (Shadcn)
    │   ├── context/          # React Context (Auth)
    │   ├── features/         # Feature-based modules (hiring, hr, tasks)
    │   └── pages/            # High-level route pages (Landing, Dashboard)
    ├── package.json          # Node Dependencies
    └── tailwind.config.js    # Styling Config
```

## ⚙️ Local Development Setup

### Prerequisite Requirements
- Node.js (v18+)
- Java JDK 21
- Maven
- MySQL/PostgreSQL (Ensure `src/main/resources/application.properties` connects to your local instance)

### Starting the Backend
1. Navigate to the backend directory:
   ```bash
   cd worksphere
   ```
2. Build and run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```
   *Note: On first boot, the `DataSeeder` will automatically populate the database with mock departments, roles, generic salary configurations, and default admin/employee accounts.*

### Starting the Frontend
1. Navigate to the client directory:
   ```bash
   cd worksphere-client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## 🔐 Default Credentials (Local Seeder)

If the database is empty, the application seeds local accounts for testing (Password for all non-admin is `password`):
*   **Super Admin**: `admin` / `admin123`
*   **HR Admin**: `hr_admin` / `password`
*   **Engineering Manager**: `manager` / `password`
*   **Employee**: `ashik` / `password`

## 🛡️ Security Guidelines
Internal APIs sit behind a strict JWT authentication wall (`/api/**`). 
Public endpoints (such as `/api/jobs/public` and `/api/candidates/public/apply`) bypass the authentication wall to allow external interaction with the recruiting portal. Evolving infrastructure should carefully map permissions using method-level security (`@PreAuthorize`).
