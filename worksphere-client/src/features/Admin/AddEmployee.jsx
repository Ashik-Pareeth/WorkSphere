import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
import AlertMessage from '../../components/common/AlertMessage';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';

function AddEmployee() {
  const { user } = useAuth();

  // Determine if the logged-in user is an Admin
  const userRoles = (user?.roles || []).map((r) =>
    r.replace('ROLE_', '').toUpperCase()
  );
  const isAdmin = userRoles.includes('SUPER_ADMIN');

  // --- FORM STATE ---
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [salary, setSalary] = useState(0);
  const [password, setPassword] = useState('');

  // IDs for Relations
  const [selectedRoles, setSelectedRoles] = useState([]); // Now an array of IDs
  const [departmentId, setDepartmentId] = useState('');
  const [jobPositionId, setJobPositionId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [workScheduleId, setWorkScheduleId] = useState('');

  // EDIT STATE (Null = Create Mode)
  const [editingId, setEditingId] = useState(null);

  // --- DATA LISTS ---
  const [employees, setEmployees] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [schedules, setSchedules] = useState([]);

  // --- UI STATE ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', description: '', onConfirm: null });

  // --- 1. FETCH ALL DATA ---
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [empRes, roleRes, depRes, posRes, schedRes] = await Promise.all([
        axiosInstance.get('/employees'),
        axiosInstance.get('/roles'),
        axiosInstance.get('/departments'),
        axiosInstance.get('/jobPositions'),
        axiosInstance.get('/api/work-schedules'),
      ]);

      setEmployees(empRes.data);
      setDepartments(depRes.data);
      setPositions(posRes.data);
      setSchedules(schedRes.data);

      // Filter roles securely based on logged-in user's authority
      let fetchedRoles = roleRes.data;
      if (!isAdmin) {
        fetchedRoles = fetchedRoles.filter(
          (r) =>
            r.roleName.toUpperCase() !== 'SUPER_ADMIN' &&
            r.roleName.toUpperCase() !== 'ROLE_SUPER_ADMIN'
        );
      }
      setAvailableRoles(fetchedRoles);
    } catch (err) {
      console.error(err);
      setError('Failed to load data from server.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

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
    setSelectedRoles([]);
    setDepartmentId('');
    setJobPositionId('');
    setManagerId('');
    setWorkScheduleId('');

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
    if (selectedRoles.length === 0 || !departmentId || !jobPositionId) {
      setError('Please select at least one Role, Department, and Position.');
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

  const handleRoleToggle = (roleId) => {
    setSelectedRoles((prevSelected) => {
      if (prevSelected.includes(roleId)) {
        return prevSelected.filter((id) => id !== roleId);
      } else {
        return [...prevSelected, roleId];
      }
    });
  };

  const handleEdit = (emp) => {
    setEditingId(emp.id);

    setFirstName(emp.firstName);
    setLastName(emp.lastName);
    setUsername(emp.username);
    setEmail(emp.email);
    setSalary(emp.salary);
    setPassword('');

    setDepartmentId(emp.departmentId || '');
    setJobPositionId(emp.jobPositionId || '');
    setManagerId(emp.managerId || '');
    setWorkScheduleId(emp.workSchedule?.id || '');

    // Map the existing roles of the employee into our array
    const empRoleIds = emp.roles ? emp.roles.map((r) => r.id) : [];
    setSelectedRoles(empRoleIds);

    setSuccess(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Employee',
      description: 'Are you sure you want to delete this employee? This cannot be undone.',
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/employees/${id}`);
          setSuccess('Employee deleted successfully.');
          fetchAllData(); // Refresh list
        } catch (err) {
          setError(err.message || 'Failed to delete employee.');
        }
      }
    });
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
      roles: selectedRoles, // Send array of Role IDs
      Id: departmentId, // Map to department Id
      jobPositionId: jobPositionId,
      managerId: managerId || null,
      workScheduleId: workScheduleId || null,
    };

    // Only attach password if user typed one
    if (password) {
      payload.password = password;
    }

    try {
      if (editingId) {
        // UPDATE
        await axiosInstance.put(`/employees/${editingId}`, payload);
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
      setError(err);
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

            {/* CHECKBOXES FOR ROLES */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium mb-2">
                Assign Roles <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-4 p-3 border border-gray-300 rounded-md bg-gray-50">
                {availableRoles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.id)}
                      onChange={() => handleRoleToggle(role.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 font-medium">
                      {role.roleName ? role.roleName.replace('ROLE_', '') : ''}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* DROPDOWNS */}
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
            <div>
              <label className="block text-sm font-medium mb-1">
                Line Manager
              </label>
              <select
                className={inputStyle}
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
              >
                <option value="">-- No Manager --</option>
                {employees
                  .filter(
                    (e) =>
                      e.roles &&
                      e.roles.some((r) => r.roleName.includes('MANAGER'))
                  )
                  .map((mgr) => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.firstName} {mgr.lastName}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Work Schedule
              </label>
              <select
                className={inputStyle}
                value={workScheduleId}
                onChange={(e) => setWorkScheduleId(e.target.value)}
              >
                <option value="">-- No Schedule --</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.scheduleName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FORM BUTTONS */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
                className="bg-gray-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* --- TABLE CARD --- */}
      <div className="bg-white shadow-sm rounded-xl p-6 mt-6">
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
                    colSpan="7"
                    className="px-4 py-8 text-center text-gray-500 italic"
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
                        <div className="flex flex-wrap gap-1">
                          {emp.roles.map((r) => (
                            <span
                              key={r.id}
                              className="inline-block bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full"
                            >
                              {r.roleName
                                ? r.roleName.replace('ROLE_', '')
                                : ''}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-red-400 italic text-xs">
                          No Role
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {emp.departmentName || (
                        <span className="text-gray-400 italic text-xs">
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
                    <td className="px-4 py-3 text-right space-x-3">
                      <button
                        onClick={() => handleEdit(emp)}
                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="text-red-600 hover:text-red-800 font-medium transition-colors"
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

      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        onConfirm={() => {
          if (confirmConfig.onConfirm) confirmConfig.onConfirm();
          setConfirmConfig({ ...confirmConfig, isOpen: false });
        }}
        onCancel={() =>
          setConfirmConfig({ ...confirmConfig, isOpen: false })
        }
      />
    </div>
  );
}

export default AddEmployee;
