import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';

function DepartmentForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        const response = await axiosInstance.get('/departments');
        setRows(response.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchDepartment();
  }, []);

  console.log(rows);

  const saveDepartment = async (e) => {
    e.preventDefault();
    const department = {
      departmentName: name,
      departmentDescription: description,
    };
    try {
      await axiosInstance.post('/departments', department);
      console.log('Department added successfully');
      setName('');
      setDescription('');
      const response = await axiosInstance.get('/departments');
      setRows(response.data);
    } catch (err) {
      console.log(err);
    }
    // fetch('http://localhost:8080/departments', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(department),
    // }).then(() => {
    //   console.log('Department saved');
    //   setDescription('');
    //   setName('');
    // });
  };

  return (
    <div className="container">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-header-main">Department Management</h2>
      </div>

      {/* Form Card */}
      <div className="card">
        <form onSubmit={saveDepartment}>
          <div className="form-grid">
            <div className="form-group">
              <label>Department Name</label>
              <input
                type="text"
                value={name}
                name="name"
                id="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter department name"
              />
            </div>

            <div className="form-group">
              <label>Department Description</label>
              <textarea
                value={description}
                name="description"
                id="description"
                rows="4"
                placeholder="Brief description of the department"
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-primary" type="submit">
              Save Department
            </button>
          </div>
        </form>
      </div>

      {/* Table Card */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Department List</h3>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Department Name</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.departmentId}>
                <td>{row.departmentId}</td>
                <td>{row.departmentName}</td>
                <td>{row.departmentDescription}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default DepartmentForm;
