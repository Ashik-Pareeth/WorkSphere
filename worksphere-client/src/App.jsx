import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import PrivateRoute from './components/layout/PrivateRoute';
import Login from './features/auth/Login';
import LandingPage from './pages/LandingPage';
import ForgotPassword from './features/auth/ForgotPassword';
import ResetPassword from './features/auth/ResetPassword';
import Onboarding from './features/auth/Onboarding';
import Dashboard from './pages/Dashboard';
import TaskBoard from './features/tasks/TaskBoard';
import DepartmentForm from './features/Admin/DepartmentForm';
import AddEmployee from './features/Admin/AddEmployee';
import RoleForm from './features/Admin/RoleForm';
import JobPositionForm from './features/Admin/JobPositionForm';
import RoleManagement from './features/Admin/RoleManagement';
import Profile from './pages/Profile';
import LeaveRequestPage from './pages/LeaveRequestPage';
import LeaveApprovalsPage from './pages/LeaveApprovalsPage';
import ManagerDashboard from './pages/ManagerDashboard';
import LeaveBalanceOverridePage from './features/leave/LeaveBalanceOverridePage';
import LeavePolicyPage from './features/leave/LeavePolicyPage';
import PublicHolidayPage from './features/admin/PublicHolidayPage';
import WorkSchedulePage from './features/admin/WorkSchedulePage';
import AssetDirectory from './features/hr/AssetDirectory';
import HelpdeskAdmin from './features/hr/HelpdeskAdmin';
import MyAssets from './features/hr/MyAssets';
import Helpdesk from './features/hr/Helpdesk';
import PerformanceOverview from './features/hr/PerformanceOverview';
import OffboardingTracker from './features/hr/OffboardingTracker';
import TeamAppraisals from './features/hr/TeamAppraisals';
import MyAppraisals from './features/hr/MyAppraisals';
import PayrollDashboard from './features/hr/PayrollDashboard';
import MyCompensation from './features/hr/MyCompensation';
import EmployeeList from './features/hr/EmployeeList';
import Unauthorized from './pages/Unauthorized';
import MyAttendanceLog from './features/attendance/MyAttendanceLog';

// Hiring Pipeline
import JobOpeningsList from './features/hiring/JobOpeningsList';
import HiringPipelineBoard from './features/hiring/HiringPipelineBoard';
import PublicApplyForm from './features/hiring/PublicApplyForm';
import PublicOfferResponse from './features/hiring/PublicOfferResponse';
import PublicCareersList from './features/hiring/PublicCareersList';
import PublicJobDetails from './features/hiring/PublicJobDetails';

import { Toaster } from '@/components/ui/sonner';

const isTokenValid = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

const PublicRoute = ({ children }) => {
  return isTokenValid() ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              }
            />

            {/* PUBLIC HIRING ROUTES (No Auth checking wrapper) */}
            <Route path="/careers" element={<PublicCareersList />} />
            <Route path="/careers/:id" element={<PublicJobDetails />} />
            <Route
              path="/jobs/:openingId/apply"
              element={<PublicApplyForm />}
            />
            <Route
              path="/offers/:offerId/respond"
              element={<PublicOfferResponse />}
            />

            {/* --- TIER 1: EVERYONE (Employees, Managers, HR, Admins, Auditors) --- */}
            <Route
              element={
                <PrivateRoute
                  allowedRoles={[
                    'EMPLOYEE',
                    'MANAGER',
                    'HR',
                    'SUPER_ADMIN',
                    'AUDITOR',
                  ]}
                />
              }
            >
              <Route path="/onBoarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/tasks" element={<TaskBoard />} />
              <Route path="/attendance-log" element={<MyAttendanceLog />} />
              <Route path="/leave" element={<LeaveRequestPage />} />
              <Route path="/my-assets" element={<MyAssets />} />
              <Route path="/helpdesk" element={<Helpdesk />} />
              <Route path="/my-appraisals" element={<MyAppraisals />} />
              <Route path="/my-compensation" element={<MyCompensation />} />
            </Route>

            {/* --- TIER 1.5: MANAGERS, HR, SUPER_ADMINS --- */}
            <Route
              element={
                <PrivateRoute allowedRoles={['MANAGER', 'HR', 'SUPER_ADMIN']} />
              }
            >
              <Route path="/approvals" element={<LeaveApprovalsPage />} />
              <Route path="/roster" element={<ManagerDashboard />} />
              <Route path="/team-appraisals" element={<TeamAppraisals />} />
            </Route>

            {/* --- TIER 1.8: SUPER_ADMINS ONLY (Core System Config) --- */}
            <Route element={<PrivateRoute allowedRoles={['SUPER_ADMIN']} />}>
              <Route path="/roles" element={<RoleForm />} />
              <Route path="/role-management" element={<RoleManagement />} />
              <Route path="/register" element={<AddEmployee />} />
            </Route>

            {/* --- TIER 2: HR & SUPER_ADMINS ONLY (System Config) --- */}
            <Route
              element={<PrivateRoute allowedRoles={['HR', 'SUPER_ADMIN']} />}
            >
              <Route path="/departments" element={<DepartmentForm />} />
              <Route path="/jobPosition" element={<JobPositionForm />} />
              <Route path="/leave-policies" element={<LeavePolicyPage />} />
              <Route path="/employee-list" element={<EmployeeList />} />
              <Route
                path="/leave-override"
                element={<LeaveBalanceOverridePage />}
              />
              <Route path="/holidays" element={<PublicHolidayPage />} />
              <Route path="/work-schedules" element={<WorkSchedulePage />} />
              <Route path="/hr/assets" element={<AssetDirectory />} />
              <Route path="/hr/helpdesk" element={<HelpdeskAdmin />} />
              <Route path="/hr/appraisals" element={<PerformanceOverview />} />
              <Route path="/hr/offboarding" element={<OffboardingTracker />} />
              <Route path="/hr/payroll" element={<PayrollDashboard />} />

              {/* Hiring Pipeline module routes */}
              <Route path="/hiring/jobs" element={<JobOpeningsList />} />
              <Route
                path="/hiring/jobs/:id/pipeline"
                element={<HiringPipelineBoard />}
              />
            </Route>

            {/* FALLBACK ROUTE */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
