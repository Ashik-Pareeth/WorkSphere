import React from 'react';
import DepartmentForm from './features/admin/DepartmentForm';
import Role from './features/Admin/RoleForm';
import AddEmployee from './features/Admin/AddEmployee';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import NavBar from './components/layout/NavBar';
import Login from './features/auth/Login';
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
          <Route path="/jobPosition" element={<Role />} />
          <Route path="/register" element={<AddEmployee />} />
          <Route path="/onBoarding" element={<Onboarding />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
