import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
import AlertMessage from '../../components/common/AlertMessage';

function AddEmployee() {
  // --- FORM STATE ---
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [salary, setSalary] = useState(0);
  const [password, setPassword] = useState('');

  // IDs for Relations
  const [roleId, setRoleId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [jobPositionId, setJobPositionId] = useState('');

  // EDIT STATE (Null = Create Mode)
  const [editingId, setEditingId] = useState(null);

  // --- DATA LISTS ---
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  // --- UI STATE ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // --- 1. FETCH ALL DATA ---
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [empRes, roleRes, depRes, posRes] = await Promise.all([
        axiosInstance.get('/employees'),
        axiosInstance.get('/roles'),
        axiosInstance.get('/departments'),
        axiosInstance.get('/jobPositions'),
      ]);
      setEmployees(empRes.data);
      console.log(empRes.data);
      setRoles(roleRes.data);
      setDepartments(depRes.data);
      setPositions(posRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load data from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // --- 2. FORM HELPERS ---
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

    setEditingId(null);
    setSuccess(null);
    setError(null);
  };

  const validateForm = () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !username.trim() ||
      !email.trim()
    ) {
      setError('Please fill in all required text fields.');
      return false;
    }
    if (!roleId || !departmentId || !jobPositionId) {
      setError('Please select Role, Department, and Position.');
      return false;
    }
    // Password is mandatory for NEW employees, optional for EDITS
    if (!editingId && !password) {
      setError('Password is required for new employees.');
      return false;
    }
    return true;
  };

  // --- 3. ACTIONS (Edit / Delete / Save) ---

  const handleEdit = (emp) => {
    setEditingId(emp.id);

    setFirstName(emp.firstName);
    setLastName(emp.lastName);
    setUsername(emp.username);
    setEmail(emp.email);
    setSalary(emp.salary);
    setPassword('');

    // ✅ FIX: Use the flat IDs from the new DTO
    setDepartmentId(emp.departmentId || '');
    setJobPositionId(emp.jobPositionId || '');

    // ✅ FIX: Roles are now available in the DTO
    const firstRole = emp.roles && emp.roles.length > 0 ? emp.roles[0].id : '';
    setRoleId(firstRole);

    setSuccess(null);
    setError(null);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this employee? This cannot be undone.'
      )
    )
      return;
    try {
      await axiosInstance.delete(`/employees/${id}`);
      setSuccess('Employee deleted successfully.');
      fetchAllData(); // Refresh list
    } catch (err) {
      setError(
        'Failed to delete employee. They might be assigned to active tasks.',
        err
      );
    }
  };

  const saveEmployee = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      username,
      firstName,
      lastName,
      email,
      salary,
      // Fix 1: Wrap roleId in an array and rename key to 'roles'. Remove Number()
      roles: [roleId],

      // Fix 2: Rename 'departmentId' to 'Id' to match backend DTO
      Id: departmentId,

      // Fix 3: Remove Number() wrapper. IDs are UUID strings.
      jobPositionId: jobPositionId,
    };

    // Only attach password if user typed one
    if (password) {
      payload.password = password;
    }

    try {
      if (editingId) {
        // UPDATE
        await axiosInstance.put(`/employees/${editingId}`, payload);
        console.log(payload);
        setSuccess('Employee updated successfully!');
      } else {
        // CREATE
        await axiosInstance.post('/employees', payload);
        setSuccess('Employee created successfully!');
      }
      resetForm();
      fetchAllData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Operation failed.');
    }
  };

  const inputStyle =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        {editingId ? 'Edit Employee' : 'Add Employee'}
      </h2>

      {(error || success) && <AlertMessage error={error} success={success} />}

      {/* --- FORM CARD --- */}
      <div className="bg-white shadow-sm rounded-xl p-6">
        <form onSubmit={saveEmployee} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* TEXT FIELDS */}
            <div>
              <label className="block text-sm font-medium mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                className={inputStyle}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                className={inputStyle}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                className={inputStyle}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className={inputStyle}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Password{' '}
                {editingId && (
                  <span className="text-xs text-gray-400 font-normal">
                    (Leave blank to keep current)
                  </span>
                )}
              </label>
              <input
                type="password"
                className={inputStyle}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Salary</label>
              <input
                type="number"
                min="0"
                className={inputStyle}
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
              />
            </div>

            {/* DROPDOWNS */}
            <div>
              <label className="block text-sm font-medium mb-1">
                System Role <span className="text-red-500">*</span>
              </label>
              <select
                className={inputStyle}
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
              >
                <option value="">-- Select Role --</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roleName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                className={inputStyle}
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="">-- Select Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Job Position <span className="text-red-500">*</span>
              </label>
              <select
                className={inputStyle}
                value={jobPositionId}
                onChange={(e) => setJobPositionId(e.target.value)}
              >
                <option value="">-- Select Position --</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.positionName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FORM BUTTONS */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? 'Saving...'
                : editingId
                  ? 'Update Employee'
                  : 'Add Employee'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-600"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* --- TABLE CARD --- */}
      <div className="bg-white shadow-sm rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Employee List</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200 rounded-lg">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-3 border-b">Name</th>
                <th className="px-4 py-3 border-b">Username</th>
                <th className="px-4 py-3 border-b">Roles</th>
                <th className="px-4 py-3 border-b">Department</th>
                <th className="px-4 py-3 border-b">Job Title</th>
                <th className="px-4 py-3 border-b">Status</th>
                <th className="px-4 py-3 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {employees.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-4 text-center text-gray-500"
                  >
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {emp.firstName} {emp.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{emp.username}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {emp.roles && emp.roles.length > 0 ? (
                        emp.roles.map((r) => (
                          <span
                            key={r.id}
                            className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full mr-1"
                          >
                            {r.roleName}
                          </span>
                        ))
                      ) : (
                        <span className="text-red-400 italic">No Role</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {emp.departmentName || (
                        <span className="text-red-400 italic">
                          Not Assigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {emp.jobPosition
                        ? emp.jobPosition.positionName
                        : emp.jobTitle || '-'}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold 
                        ${emp.employeeStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {emp.employeeStatus || 'ACTIVE'}
                      </span>
                    </td>

                    {/* ACTION BUTTONS */}
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(emp)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AddEmployee;
