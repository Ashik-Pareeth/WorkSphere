import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
import AlertMessage from '../../components/common/AlertMessage';

function DepartmentForm() {
  // --- State ---
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // --- Shared Logic ---
  // We keep this outside for use in handleSubmit and handleDelete
  const fetchDepartments = useCallback(async (isMounted = true) => {
    try {
      const response = await axiosInstance.get('/departments');
      if (isMounted) {
        setRows(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch', err);
    } finally {
      if (isMounted) setLoading(false);
    }
  }, []);

  const resetForm = () => {
    setName('');
    setDescription('');
    setEditingId(null);
  };

  // --- Lifecycle (Vite/Strict Best Practice) ---
  useEffect(() => {
    let active = true;

    // Initial Load
    fetchDepartments(active);

    return () => {
      active = false; // Prevents "setState on unmounted component"
    };
  }, [fetchDepartments]);

  // --- Handlers ---
  const validateForm = () => {
    if (!name.trim()) {
      setAlert({ type: 'error', message: 'Department Name cannot be empty.' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = { name, description };

    try {
      if (editingId) {
        await axiosInstance.put(`/departments/${editingId}`, payload);
        setAlert({
          type: 'success',
          message: 'Department updated successfully!',
        });
      } else {
        await axiosInstance.post('/departments', payload);
        setAlert({
          type: 'success',
          message: 'Department created successfully!',
        });
      }

      resetForm();
      fetchDepartments(); // Refresh list after mutation
    } catch (err) {
      setAlert({
        type: 'error',
        message: 'Operation failed. Name might be duplicate.',
      });
      console.error(err);
    }
  };

  const handleEdit = (dept) => {
    setName(dept.name);
    setDescription(dept.description || '');
    setEditingId(dept.id);
    setAlert(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?'))
      return;

    try {
      await axiosInstance.delete(`/departments/${id}`);
      setAlert({ type: 'success', message: 'Department deleted.' });
      fetchDepartments();
    } catch (err) {
      setAlert({
        type: 'error',
        message: 'Cannot delete. It might be assigned to employees.',
      });
      console.error(err);
    }
  };

  // --- Render ---
  return (
    <div
      className="container"
      style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}
    >
      <div className="page-header">
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
          }}
        >
          Department Management
        </h2>
      </div>

      {alert && (
        <AlertMessage
          error={alert.type === 'error' ? alert.message : null}
          success={alert.type === 'success' ? alert.message : null}
          onClose={() => setAlert(null)}
        />
      )}

      {/* FORM CARD */}
      <div
        className="card"
        style={{
          background: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '2rem',
        }}
      >
        <h3 style={{ margin: '0 0 1rem 0' }}>
          {editingId ? 'Edit Department' : 'Add New Department'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
              }}
            >
              Department Name <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Human Resources"
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
              }}
            >
              Description
            </label>
            <textarea
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows="3"
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '0.6rem 1.2rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {editingId ? 'Update Department' : 'Save Department'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  background: '#64748b',
                  color: '#fff',
                  border: 'none',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* LIST CARD */}
      <div
        className="card"
        style={{
          background: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <h3 style={{ margin: '0 0 1rem 0' }}>Department List</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
              <th
                style={{
                  padding: '0.75rem',
                  borderBottom: '2px solid #e2e8f0',
                }}
              >
                Name
              </th>
              <th
                style={{
                  padding: '0.75rem',
                  borderBottom: '2px solid #e2e8f0',
                }}
              >
                Description
              </th>
              <th
                style={{
                  padding: '0.75rem',
                  borderBottom: '2px solid #e2e8f0',
                  width: '100px',
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="3"
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#666',
                  }}
                >
                  Loading departments...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan="3"
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                    color: '#888',
                  }}
                >
                  No departments found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 500 }}>
                    {row.name}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#64748b' }}>
                    {row.description}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <button
                      onClick={() => handleEdit(row)}
                      style={{
                        marginRight: '0.5rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(row.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                      }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DepartmentForm;
