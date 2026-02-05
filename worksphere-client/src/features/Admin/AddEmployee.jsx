import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';

function AddEmployee() {
  const [userName, setUserName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [salary, setSalary] = useState('');
  const [password, setPassword] = useState('');

  const [roleId, setRoleId] = useState('');
  const [departmentId, setDepertmentId] = useState('');
  const [jobPositionId, setJobPositionId] = useState('');

  const [employeeRows, setEmployeeRows] = useState([]);
  const [roleRows, setRolesRows] = useState([]);
  const [depRows, setDepRows] = useState([]);
  const [positionRows, setPositionRows] = useState([]);

  const fetchAllData = useCallback(async () => {
    try {
      const [emps, roles, deps, positions] = await Promise.all([
        axiosInstance.get('/employees'),
        axiosInstance.get('/roles'),
        axiosInstance.get('/departments'),
        axiosInstance.get('/job-positions'),
      ]);
      setEmployeeRows(emps.data);
      setRolesRows(roles.data);
      setDepRows(deps.data);
      setPositionRows(positions.data);
    } catch (err) {
      console.log(err);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const saveEmployee = async (e) => {
    e.preventDefault();
    const employee = {
      userName,
      firstName,
      lastName,
      email,
      salary,
      password,
      roles: [{ roleId: roleId }],
      department: { departmentId: departmentId },
      jobPosition: { jobPositionId: jobPositionId },
    };

    try {
      await axiosInstance.post('/employees', employee);
      // Reset Form
      setFirstName('');
      setLastName('');
      setUserName('');
      setEmail('');
      setPassword('');
      setSalary('');
      setRoleId('');
      setDepertmentId('');
      setJobPositionId('');

      fetchAllData();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h2 className="page-header-main">Add Employee</h2>
      </div>

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
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
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
              <label>System Role (Permission)</label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
              >
                <option value="">-- Select Role --</option>
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
                <option value="">-- Select Department --</option>
                {depRows.map((row) => (
                  <option key={row.departmentId} value={row.departmentId}>
                    {row.departmentName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Job Position (Title)</label>
              <select
                value={jobPositionId}
                onChange={(e) => setJobPositionId(e.target.value)}
              >
                <option value="">-- Select Position --</option>
                {positionRows.map((row) => (
                  <option key={row.jobPositionId} value={row.jobPositionId}>
                    {row.jobTitle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-primary" type="submit">
              Add Employee
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Employee List</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Department</th>
              <th>Job Title</th>
            </tr>
          </thead>
          <tbody>
            {employeeRows.map((emp) => (
              <tr key={emp.id}>
                <td>
                  {emp.firstName} {emp.lastName}
                </td>
                <td>{emp.roleName}</td>
                <td>{emp.department}</td>
                <td>{emp.jobPosition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AddEmployee;
