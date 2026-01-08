import { useEffect, useState } from 'react';

import axiosInstance from '../../api/axiosInstance';

function AddEmployee() {
  const [userName, setUserName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [departmentId, setDepertmentId] = useState('');
  const [salary, setSalary] = useState('');
  const [password, setPassword] = useState('');

  const [employeeRows, setEmployeeRows] = useState([]);

  const saveEmployee = async (e) => {
    e.preventDefault();
    const employee = {
      userName: userName,
      firstName: firstName,
      lastName: lastName,
      email: email,
      role: { roleId: roleId },
      department: { departmentId: departmentId },
      salary: salary,
      password: password,
    };
    try {
      await axiosInstance.post('/employees', employee);
      setFirstName('');
      setEmail('');
      setLastName('');
      setRoleId('');
      setDepertmentId('');
      setPassword('');
      setSalary('');
      setUserName('');
      try {
        const response = await axiosInstance.get('/employees');
        setEmployeeRows(response.data);
      } catch (err) {
        console.log(err);
      }
    } catch (err) {
      console.log(err);
    }
    // fetch('http://localhost:8080/employees', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(employee),
    // }).then(() => {
    //   console.log('Successful');
  };

  const [roleRows, setRolesRows] = useState([]);
  const [depRows, setDepRows] = useState([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await axiosInstance.get('/roles');
        setRolesRows(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    const fetchDepartment = async () => {
      try {
        const res = await axiosInstance.get('/departments');
        setDepRows(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    const fetchEmployees = async () => {
      try {
        const res = await axiosInstance.get('/employees');
        setEmployeeRows(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    // fetch('http://localhost:8080/roles', {
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    // })
    //   .then((res) => res.json())
    //   .then((data) => setRolesRows(data));

    // fetch('http://localhost:8080/departments', {
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    // })
    //   .then((res) => res.json())
    //   .then((data) => setDepRows(data));

    // fetch('http://localhost:8080/employees', {
    //   method: 'get',
    //   headers: { 'Content-Type': 'application/json' },
    // })
    //   .then((res) => res.json())
    //   .then((data) => setEmployeeRows(data));

    fetchDepartment();
    fetchEmployees();
    fetchRoles();
  }, []);

  console.log(employeeRows);
  return (
    <div className="container">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-header-main">Add Employee</h2>
      </div>

      {/* Form Card */}
      <div className="card">
        <form onSubmit={saveEmployee}>
          <div className="form-grid">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>User Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
              >
                <option value="">-- Select --</option>
                {roleRows.map((row) => (
                  <option key={row.roleId} value={row.roleId}>
                    {row.roleName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepertmentId(e.target.value)}
              >
                <option value="">-- Select --</option>
                {depRows.map((row) => (
                  <option key={row.departmentId} value={row.departmentId}>
                    {row.departmentName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Salary</label>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-primary" type="submit">
              Add Employee
            </button>
          </div>
        </form>
      </div>

      {/* Table Card */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Employee List</h3>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User Name</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Salary</th>
              <th>Joining Date</th>
            </tr>
          </thead>
          <tbody>
            {employeeRows.map((emp) => (
              <tr key={emp.id}>
                <td>{emp.id}</td>
                <td>{emp.userName}</td>
                <td>
                  {emp.firstName} {emp.lastName}
                </td>
                <td>{emp.email}</td>
                <td>{emp.role}</td>
                <td>{emp.department}</td>
                <td>{emp.salary}</td>
                <td>
                  {emp.joiningDate
                    ? new Date(emp.joiningDate).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default AddEmployee;
