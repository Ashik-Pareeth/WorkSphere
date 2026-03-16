import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
import '../../styles/admin-ui.css';

import {
  Shield,
  Pencil,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
} from 'lucide-react';

function RoleForm() {
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchRoles = useCallback(async (isMounted = true) => {
    try {
      const res = await axiosInstance.get('/roles');
      if (isMounted) setRows(res.data);
    } catch (err) {
      console.error('Failed to fetch roles', err);
    } finally {
      if (isMounted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchRoles(active);
    return () => {
      active = false;
    };
  }, [fetchRoles]);

  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => setAlert(null), 3500);
    return () => clearTimeout(t);
  }, [alert]);

  const resetForm = () => {
    setName('');
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setAlert({ type: 'error', message: 'Role name cannot be empty.' });
      return;
    }

    try {
      if (editingId) {
        await axiosInstance.put(`/roles/${editingId}`, {
          roleName: name,
        });

        setAlert({
          type: 'success',
          message: 'Role updated successfully.',
        });
      } else {
        await axiosInstance.post('/roles', {
          roleName: name,
        });

        setAlert({
          type: 'success',
          message: 'Role created successfully.',
        });
      }

      resetForm();
      fetchRoles();
    } catch {
      setAlert({
        type: 'error',
        message: 'Operation failed. Role may already exist.',
      });
    }
  };

  const handleEdit = (role) => {
    setName(role.roleName);
    setEditingId(role.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/roles/${deleteTarget}`);
      setAlert({ type: 'success', message: 'Role deleted.' });
      fetchRoles();
    } catch {
      setAlert({
        type: 'error',
        message: 'Cannot delete role.',
      });
    }

    setDeleteTarget(null);
  };

  return (
    <div className="ws-page">
      {/* TOP BAR */}

      <div className="ws-topbar">
        <div className="ws-topbar-left">
          <div className="ws-icon-box">
            <Shield size={20} color="#fff" />
          </div>

          <div>
            <div className="ws-page-title">Roles</div>
            <div className="ws-page-sub">Manage system access roles</div>
          </div>
        </div>

        <span className="ws-badge">{rows.length} total</span>
      </div>

      {/* ALERT */}

      {alert && (
        <div className={`ws-alert ws-alert-${alert.type}`}>
          {alert.type === 'success' ? (
            <CheckCircle2 size={15} />
          ) : (
            <XCircle size={15} />
          )}

          {alert.message}

          <button className="ws-alert-close" onClick={() => setAlert(null)}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* GRID */}

      <div className="ws-grid">
        {/* FORM PANEL */}

        <div className="ws-panel">
          <div className="ws-panel-head">
            <div className="ws-eyebrow">Configuration</div>

            <div className="ws-panel-title">
              {editingId ? (
                <>
                  Edit role
                  <span className="ws-editing-tag">
                    <Pencil size={9} /> editing
                  </span>
                </>
              ) : (
                'New role'
              )}
            </div>
          </div>

          <div className="ws-panel-body">
            <form onSubmit={handleSubmit}>
              <div className="ws-field">
                <label className="ws-label">Role name</label>

                <input
                  className="ws-input"
                  value={name}
                  placeholder="e.g. ADMIN"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="ws-btn-row">
                <button type="submit" className="ws-btn ws-btn-primary">
                  {editingId ? (
                    <>
                      <Pencil size={13} /> Save changes
                    </>
                  ) : (
                    <>
                      <Plus size={13} /> Create role
                    </>
                  )}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="ws-btn ws-btn-secondary"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* TABLE PANEL */}

        <div className="ws-panel">
          <table className="ws-table">
            <thead>
              <tr>
                <th className="ws-th" style={{ width: 60 }}>
                  #
                </th>
                <th className="ws-th">Role name</th>
                <th className="ws-th" style={{ width: 90 }}></th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="ws-tr">
                    <td className="ws-td">
                      <div className="ws-skeleton" style={{ width: 30 }} />
                    </td>

                    <td className="ws-td">
                      <div className="ws-skeleton" style={{ width: 160 }} />
                    </td>

                    <td className="ws-td">
                      <div className="ws-skeleton" style={{ width: 60 }} />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <div className="ws-empty">
                      <div className="ws-empty-icon">
                        <Shield size={18} color="var(--ws-ink3)" />
                      </div>
                      No roles yet
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className="ws-tr"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <td className="ws-td">
                      <span className="ws-cell-mono">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </td>

                    <td className="ws-td">
                      <div className="ws-cell-name">
                        <span className="ws-cell-dot" />
                        {row.roleName}
                      </div>
                    </td>

                    <td className="ws-td ws-cell-actions">
                      <button
                        className="ws-icon-btn"
                        title="Edit"
                        onClick={() => handleEdit(row)}
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        className="ws-icon-btn ws-icon-btn-danger"
                        title="Delete"
                        onClick={() => setDeleteTarget(row.id)}
                        style={{ marginLeft: 2 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DELETE MODAL */}

      {deleteTarget && (
        <div
          className="ws-modal-backdrop"
          onClick={() => setDeleteTarget(null)}
        >
          <div className="ws-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ws-modal-icon ws-modal-icon-danger">
              <AlertTriangle size={20} color="var(--ws-red)" />
            </div>

            <h2>Delete role?</h2>

            <p>This action is permanent and cannot be undone.</p>

            <div className="ws-modal-actions">
              <button
                className="ws-btn ws-btn-secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>

              <button
                className="ws-btn ws-btn-destructive"
                onClick={confirmDelete}
              >
                Delete role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleForm;
