import React from 'react';
import DepartmentForm from './features/Admin/DepartmentForm';
import Role from './features/Admin/RoleForm';
import AddEmployee from './features/Admin/AddEmployee';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import AttendanceWidget from './features/employee/AttendanceWidget';

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <div className="container">
        <Routes>
          <Route
            path="/"
            element={
              <div>
                <h1>Welcom To workSphere</h1>
                <AttendanceWidget />
              </div>
            }
          />
          <Route path="/departments" element={<DepartmentForm />} />
          <Route path="/roles" element={<Role />} />
          <Route path="/register" element={<AddEmployee />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

//
//
//     <card>
//       <h1>WorkSphere</h1>
//       <p>Welcome to the Employee Portal</p>
//       <hr></hr>
//       <DepartmentForm />

//       <Role />
//     </card>
//
