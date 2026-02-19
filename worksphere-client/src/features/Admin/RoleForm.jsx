import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';

function RoleForm() {
  const [name, setName] = useState('');
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputStyle =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  const fetchRows = async () => {
    try {
      const res = await axiosInstance.get('/roles');
      setRows(res.data);
    } catch (err) {
      console.log('failed to fetch roles:', err);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  // ✅ VALIDATION
  const validate = () => {
    if (!name.trim()) {
      setError('Role name cannot be empty');
      return false;
    }
    setError('');
    return true;
  };

  // ✅ CREATE OR UPDATE
  const saveRole = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      if (editingId) {
        await axiosInstance.put(`/roles/${editingId}`, {
          roleName: name,
        });
      } else {
        await axiosInstance.post('/roles', {
          roleName: name,
        });
      }

      resetForm();
      fetchRows();
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEditingId(null);
    setError('');
  };

  // ✅ EDIT
  const handleEdit = (role) => {
    setName(role.roleName);
    setEditingId(role.id);
    window.scrollTo(0, 0);
  };

  // ✅ DELETE
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this role?')) return;

    try {
      await axiosInstance.delete(`/roles/${id}`);
      fetchRows();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Role Management</h2>

      {/* FORM */}
      <div className="bg-white shadow-sm rounded-xl p-6">
        <form onSubmit={saveRole} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Role Name</label>

            <input
              className={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ADMIN, USER"
            />

            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {editingId
                ? loading
                  ? 'Updating...'
                  : 'Update Role'
                : loading
                  ? 'Saving...'
                  : 'Add Role'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 rounded-lg text-sm font-medium border hover:bg-gray-100"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow-sm rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Roles List</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Role Name</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-4 text-gray-500">
                    No roles found.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{index + 1}</td>

                    <td className="px-4 py-2 font-medium text-gray-800">
                      {row.roleName}
                    </td>

                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(row)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(row.id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Delete
                        </button>
                      </div>
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

export default RoleForm;
