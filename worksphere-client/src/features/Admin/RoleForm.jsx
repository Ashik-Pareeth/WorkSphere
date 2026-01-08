import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
function Role() {
  const [name, setName] = useState('');
  const saveRole = async (e) => {
    e.preventDefault();
    const roles = {
      roleName: name,
    };
    try {
      await axiosInstance.post('/roles', roles);
      console.log('New Role added successfully');
      setName('');
      const response = await axiosInstance.get('/roles');
      getRows(response.data);
    } catch (err) {
      console.log(err);
    }
    // fetch('http://localhost:8080/roles', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(roles),
    // })
    //   .then(() => {
    //     console.log('successfull');
    //     setName('');
    //   })
    //   .then(() => {
    //     return fetch('http://localhost:8080/roles');
    //   })
    //   .then((res) => res.json())
    //   .then((data) => getRows(data));
  };
  const [rows, getRows] = useState([]);
  useEffect(() => {
    const fetchRows = async () => {
      try {
        const response = await axiosInstance.get('/roles');
        getRows(response.data);
      } catch (err) {
        console.log('failed to fetch roles:', err);
      }
    };
    fetchRows();
    // fetch('http://localhost:8080/roles', {
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    // })
    //   .then((res) => res.json())
    //   .then((data) => getRows(data));
  }, []);

  return (
    <div className="container">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-header-main">Role Management</h2>
      </div>

      {/* Form Card */}
      <div className="card">
        <form onSubmit={saveRole}>
          <div className="form-grid">
            <div className="form-group">
              <label>Role Name</label>
              <input
                type="text"
                value={name}
                name="roleName"
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter role name"
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

      {/* Table Card */}
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

export default Role;
