import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
import '../../styles/admin-ui.css';

import {
  Building2,
  Pencil,
  Trash2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
} from 'lucide-react';

function DepartmentForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');

  const fetchDepartments = useCallback(async (isMounted = true) => {
    try {
      const res = await axiosInstance.get('/departments');
      if (isMounted) setRows(res.data);
    } catch (err) {
      console.error('Failed to fetch', err);
    } finally {
      if (isMounted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchDepartments(active);
    return () => {
      active = false;
    };
  }, [fetchDepartments]);

  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => setAlert(null), 3500);
    return () => clearTimeout(t);
  }, [alert]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setAlert({ type: 'error', message: 'Department name cannot be empty.' });
      return;
    }
    try {
      if (editingId) {
        await axiosInstance.put(`/departments/${editingId}`, {
          name,
          description,
        });
        setAlert({
          type: 'success',
          message: 'Department updated successfully.',
        });
      } else {
        await axiosInstance.post('/departments', { name, description });
        setAlert({
          type: 'success',
          message: 'Department created successfully.',
        });
      }
      resetForm();
      fetchDepartments();
    } catch {
      setAlert({
        type: 'error',
        message: 'Operation failed. Name may already exist.',
      });
    }
  };

  const handleEdit = (dept) => {
    setName(dept.name);
    setDescription(dept.description || '');
    setEditingId(dept.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/departments/${deleteTarget}`);
      setAlert({ type: 'success', message: 'Department deleted.' });
      fetchDepartments();
    } catch {
      setAlert({
        type: 'error',
        message: 'Cannot delete — it may be assigned to employees.',
      });
    }
    setDeleteTarget(null);
  };

  const filteredRows = rows.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ws-page">
      {/* TOP BAR */}
      <div className="ws-topbar">
        <div className="ws-topbar-left">
          <div className="ws-icon-box">
            <Building2 size={20} color="#fff" />
          </div>
          <div>
            <div className="ws-page-title">Departments</div>
            <div className="ws-page-sub">Manage company departments</div>
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
                  Edit department
                  <span className="ws-editing-tag">
                    <Pencil size={9} /> editing
                  </span>
                </>
              ) : (
                'New department'
              )}
            </div>
          </div>
          <div className="ws-panel-body">
            <form onSubmit={handleSubmit}>
              <div className="ws-field">
                <label className="ws-label">Department name</label>
                <input
                  className="ws-input"
                  value={name}
                  placeholder="e.g. Human Resources"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="ws-field">
                <label className="ws-label">
                  Description <span className="ws-label-muted">(optional)</span>
                </label>
                <textarea
                  className="ws-textarea"
                  value={description}
                  placeholder="What does this department do?"
                  onChange={(e) => setDescription(e.target.value)}
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
                      <Plus size={13} /> Create department
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
          <div className="ws-search-row">
            <div className="ws-search-wrap">
              <span className="ws-search-icon">
                <Search size={14} />
              </span>
              <input
                className="ws-search-input"
                placeholder="Search departments…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <table className="ws-table">
            <thead>
              <tr>
                <th className="ws-th">Name</th>
                <th className="ws-th">Description</th>
                <th className="ws-th" style={{ width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="ws-tr">
                    <td className="ws-td">
                      <div className="ws-skeleton" style={{ width: 140 }} />
                    </td>
                    <td className="ws-td">
                      <div className="ws-skeleton" style={{ width: 240 }} />
                    </td>
                    <td className="ws-td">
                      <div className="ws-skeleton" style={{ width: 60 }} />
                    </td>
                  </tr>
                ))
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <div className="ws-empty">
                      <div className="ws-empty-icon">
                        <Building2 size={18} color="var(--ws-ink3)" />
                      </div>
                      {search
                        ? 'No departments match your search'
                        : 'No departments yet'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, i) => (
                  <tr
                    key={row.id}
                    className="ws-tr"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <td className="ws-td">
                      <div className="ws-cell-name">
                        <span className="ws-cell-dot" />
                        {row.name}
                      </div>
                    </td>
                    <td className="ws-td">
                      <span className="ws-cell-muted">
                        {row.description || (
                          <span style={{ color: 'var(--ws-ink3)' }}>—</span>
                        )}
                      </span>
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
            <h2>Delete department?</h2>
            <p>
              This action is permanent and cannot be undone. The department will
              be removed from all associated records.
            </p>
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
                Delete department
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentForm;
