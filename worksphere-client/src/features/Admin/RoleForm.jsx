import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';

// FIX: Renamed from 'JobPosition' to 'RoleForm' to match the filename and purpose
function RoleForm() {
  const [name, setName] = useState('');
  const [rows, setRows] = useState([]);

  const saveRole = async (e) => {
    e.preventDefault();
    const roles = { roleName: name };
    try {
      await axiosInstance.post('/roles', roles);
      setName('');
      fetchRows();
    } catch (err) {
      console.log(err);
    }
  };

  const fetchRows = async () => {
    try {
      const response = await axiosInstance.get('/roles');
      setRows(response.data);
    } catch (err) {
      console.log('failed to fetch roles:', err);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  return (
    <div className="container">
      <div className="page-header">
        <h2 className="page-header-main">Role Management</h2>
      </div>
      <div className="card">
        <form onSubmit={saveRole}>
          <div className="form-grid">
            <div className="form-group">
              <label>Role Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ADMIN, USER"
              />
            </div>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-primary" type="submit">
              Add Role
            </button>
          </div>
        </form>
      </div>
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Roles List</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Role Name</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.roleId}>
                <td>{row.roleId}</td>
                <td>{row.roleName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RoleForm;
