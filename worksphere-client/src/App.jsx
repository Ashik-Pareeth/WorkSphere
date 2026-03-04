import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import PrivateRoute from './components/layout/PrivateRoute';
import Login from './features/auth/Login';
import Onboarding from './features/auth/Onboarding';
import Dashboard from './pages/Dashboard';
import TaskBoard from './features/tasks/TaskBoard';
import DepartmentForm from './features/Admin/DepartmentForm';
import AddEmployee from './features/Admin/AddEmployee';
import RoleForm from './features/Admin/RoleForm';
import JobPositionForm from './features/Admin/JobPositionForm';
import Profile from './pages/Profile';
import LeaveRequestPage from './pages/LeaveRequestPage';
import LeaveApprovalsPage from './pages/LeaveApprovalsPage';
import ManagerDashboard from './pages/ManagerDashboard';
import LeaveBalanceOverridePage from './features/leave/LeaveBalanceOverridePage';
import LeavePolicyPage from './features/leave/LeavePolicyPage';
import PublicHolidayPage from './features/admin/PublicHolidayPage';
import WorkSchedulePage from './features/admin/WorkSchedulePage';

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
            <Route
              path="/"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* --- TIER 1: EVERYONE (Employees, Managers, HR, Admins) --- */}
            <Route
              element={
                <PrivateRoute
                  allowedRoles={['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']}
                />
              }
            >
              <Route path="/onBoarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/tasks" element={<TaskBoard />} />
              <Route path="/leave" element={<LeaveRequestPage />} />
            </Route>

            {/* --- TIER 1.5: MANAGERS, HR, ADMINS --- */}
            <Route
              element={
                <PrivateRoute allowedRoles={['MANAGER', 'HR', 'ADMIN']} />
              }
            >
              <Route path="/approvals" element={<LeaveApprovalsPage />} />
              <Route path="/roster" element={<ManagerDashboard />} />
            </Route>

            {/* --- TIER 2: HR & ADMINS ONLY (System Config) --- */}
            <Route element={<PrivateRoute allowedRoles={['HR', 'ADMIN']} />}>
              <Route path="/departments" element={<DepartmentForm />} />
              <Route path="/register" element={<AddEmployee />} />
              <Route path="/jobPosition" element={<JobPositionForm />} />
              <Route path="/roles" element={<RoleForm />} />
              <Route path="/leave-policies" element={<LeavePolicyPage />} />
              <Route
                path="/leave-override"
                element={<LeaveBalanceOverridePage />}
              />
              <Route path="/holidays" element={<PublicHolidayPage />} />
              <Route path="/work-schedules" element={<WorkSchedulePage />} />
            </Route>

            {/* FALLBACK ROUTE */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
