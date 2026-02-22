import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- IMPORT THE PROVIDER ---
import { AuthProvider } from './context/AuthContext'; // Adjust path if needed!

import NavBar from './components/layout/NavBar';
import PrivateRoute from './components/layout/PrivateRoute';

import Login from './features/auth/Login';
import Onboarding from './features/auth/Onboarding';
import Dashboard from './pages/Dashboard';
import TaskBoard from './features/tasks/TaskBoard';
import DepartmentForm from './features/admin/DepartmentForm';
import AddEmployee from './features/Admin/AddEmployee';
import RoleForm from './features/admin/RoleForm';
import JobPositionForm from './features/admin/JobPositionForm';
import Profile from './pages/Profile';

// Helper to prevent logged-in users from seeing login again
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
      {/* --- WRAP THE APP IN THE AUTH PROVIDER --- */}
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

            {/* PROTECTED ROUTES */}
            <Route element={<PrivateRoute />}>
              {/* Moved Onboarding inside so it is protected from logged-out users */}
              <Route path="/onBoarding" element={<Onboarding />} />

              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/tasks" element={<TaskBoard />} />
              <Route path="/departments" element={<DepartmentForm />} />
              <Route path="/register" element={<AddEmployee />} />
              <Route path="/jobPosition" element={<JobPositionForm />} />
              <Route path="/roles" element={<RoleForm />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
