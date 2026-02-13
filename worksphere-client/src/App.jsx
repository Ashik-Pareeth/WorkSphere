import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import NavBar from './components/layout/NavBar';
import Login from './features/auth/login';
import Dashboard from './pages/Dashboard';
import TaskBoard from './features/tasks/TaskBoard'; // Import TaskBoard
import DepartmentForm from './features/admin/DepartmentForm';
import AddEmployee from './features/Admin/AddEmployee';
import RoleForm from './features/admin/RoleForm';
import JobPositionForm from './features/admin/JobPositionForm';
import Onboarding from './features/auth/Onboarding';
import PrivateRoute from './components/layout/PrivateRoute'; // <--- Import the Guard

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <div className="container">
        <Routes>
          {/* Public Route: Login */}
          <Route path="/" element={<Login />} />
          <Route path="/onBoarding" element={<Onboarding />} />

          {/* PROTECTED ROUTES (Wrapped in PrivateRoute) */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<TaskBoard />} />
            <Route path="/departments" element={<DepartmentForm />} />
            <Route path="/register" element={<AddEmployee />} />
            <Route path="/jobPosition" element={<JobPositionForm />} />
            <Route path="/roles" element={<RoleForm />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
