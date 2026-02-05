import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';

function JobPositionForm() {
  const [title, setTitle] = useState('');
  const [rows, setRows] = useState([]);

  const fetchPositions = async () => {
    try {
      const response = await axiosInstance.get('/jobPositions');
      setRows(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  // Save new position
  const savePosition = async (e) => {
    e.preventDefault();
    const position = { positionName: title };
    try {
      await axiosInstance.post('/jobPositions', position);
      setTitle('');
      fetchPositions();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h2 className="page-header-main">Job Position Management</h2>
      </div>

      <div className="card">
        <form onSubmit={savePosition}>
          <div className="form-grid">
            <div className="form-group">
              <label>Job Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
              />
            </div>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-primary" type="submit">
              Add Position
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Position List</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Job Title</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id}>
                <td>{index + 1}</td>
                <td>{row.positionName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default JobPositionForm;
