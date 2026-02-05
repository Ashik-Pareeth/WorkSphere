import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';

function AddEmployee() {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [salary, setSalary] = useState(0);
  const [password, setPassword] = useState('');

  const [roleId, setRoleId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [jobPositionId, setJobPositionId] = useState('');

  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  const [loading, setLoading] = useState(false);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);

      const [empRes, roleRes, depRes, posRes] = await Promise.all([
        axiosInstance.get('/employees'),
        axiosInstance.get('/roles'),
        axiosInstance.get('/departments'),
        axiosInstance.get('/jobPositions'),
      ]);
      console.log(empRes.data, roleRes.data, depRes.data, posRes.data);

      setEmployees(empRes.data);
      setRoles(roleRes.data);
      setDepartments(depRes.data);
      setPositions(posRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const resetForm = () => {
    setUsername('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setSalary(0);
    setPassword('');

    setRoleId('');
    setDepartmentId('');
    setJobPositionId('');
  };

  const saveEmployee = async (e) => {
    e.preventDefault();

    const payload = {
      username,
      firstName,
      lastName,
      email,
      password,
      salary,
      roleId,
      departmentId,
      jobPositionId,
    };

    try {
      console.log('Sending payload:', payload);

      await axiosInstance.post('/employees', payload);

      resetForm();
      fetchAllData();

      alert('Employee added successfully');
    } catch (error) {
      console.error(error);
      alert('Failed to add employee');
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h2>Add Employee</h2>
      </div>

      <div className="card">
        <form onSubmit={saveEmployee}>
          <div className="form-grid">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={firstName}
                required
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={lastName}
                required
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                required
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Salary</label>
              <input
                type="number"
                min="0"
                value={salary}
                required
                onChange={(e) => setSalary(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>System Role</label>

              <select
                value={roleId}
                required
                onChange={(e) => setRoleId(e.target.value)}
              >
                <option value="">-- Select Role --</option>

                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.roleName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Department</label>

              <select
                value={departmentId}
                required
                onChange={(e) => setDepartmentId(Number(e.target.value))}
              >
                <option value="">-- Select Department --</option>

                {departments.map((dep) => (
                  <option key={dep.departmentId} value={dep.departmentId}>
                    {dep.departmentName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Job Position</label>

              <select
                value={jobPositionId}
                required
                onChange={(e) => setJobPositionId(e.target.value)}
              >
                <option value="">-- Select Position --</option>

                {positions.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.positionName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Add Employee'}
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
              <th>Username</th>
              <th>Department</th>
              <th>Job Title</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan="5">Loading...</td>
              </tr>
            )}

            {!loading && employees.length === 0 && (
              <tr>
                <td colSpan="5">No Employees Found</td>
              </tr>
            )}

            {!loading &&
              employees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    {emp.firstName} {emp.lastName}
                  </td>

                  <td>{emp.username}</td>

                  <td>{emp.departmentName ?? 'Not Assigned'}</td>

                  <td>{emp.jobTitle ?? 'Not Assigned'}</td>

                  <td>{emp.employeeStatus}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AddEmployee;
