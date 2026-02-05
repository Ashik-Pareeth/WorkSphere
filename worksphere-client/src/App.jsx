import React from 'react';
import DepartmentForm from './features/admin/DepartmentForm';
import AddEmployee from './features/Admin/AddEmployee';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import NavBar from './components/layout/NavBar';
import RoleForm from './features/admin/RoleForm';
import Login from './features/auth/login';
import Dashboard from './pages/Dashboard';
import Onboarding from './features/auth/Onboarding';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');
  return (
    <BrowserRouter>
      <NavBar />
      <div className="container">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard"
            element={isAuthenticated ? <Dashboard /> : <Navigate to={'/'} />}
          />
          <Route path="/departments" element={<DepartmentForm />} />
          <Route path="/register" element={<AddEmployee />} />
          <Route path="/roles" element={<RoleForm />} />
          <Route path="/onBoarding" element={<Onboarding />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
