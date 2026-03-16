import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
import '../../styles/admin-ui.css';

import {
  Briefcase,
  Pencil,
  Trash2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
} from 'lucide-react';

function JobPositionForm() {
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [alert, setAlert] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [search, setSearch] = useState('');

  const fetchPositions = useCallback(async (active = true) => {
    try {
      const res = await axiosInstance.get('/jobPositions');
      if (active) setRows(res.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      if (active) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchPositions(active);
    return () => {
      active = false;
    };
  }, [fetchPositions]);

  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => setAlert(null), 3500);
    return () => clearTimeout(t);
  }, [alert]);

  const resetForm = () => {
    setTitle('');
    setEditingId(null);
  };

  const savePosition = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setAlert({ type: 'error', message: 'Job title cannot be empty.' });
      return;
    }

    try {
      if (editingId) {
        await axiosInstance.put(`/jobPositions/${editingId}`, {
          positionName: title,
        });

        setAlert({
          type: 'success',
          message: 'Position updated successfully.',
        });
      } else {
        await axiosInstance.post('/jobPositions', {
          positionName: title,
        });

        setAlert({
          type: 'success',
          message: 'Position added successfully.',
        });
      }

      resetForm();
      fetchPositions();
    } catch {
      setAlert({
        type: 'error',
        message: 'Failed to save. Title may already exist.',
      });
    }
  };

  const handleEdit = (row) => {
    setTitle(row.positionName);
    setEditingId(row.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/jobPositions/${deleteTarget}`);

      setAlert({
        type: 'success',
        message: 'Position deleted successfully.',
      });

      fetchPositions();
    } catch {
      setAlert({
        type: 'error',
        message: 'Delete failed.',
      });
    }

    setDeleteTarget(null);
  };

  const filteredRows = rows.filter((p) =>
    p.positionName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ws-page">
      {/* TOP BAR */}

      <div className="ws-topbar">
        <div className="ws-topbar-left">
          <div className="ws-icon-box">
            <Briefcase size={20} color="#fff" />
          </div>

          <div>
            <div className="ws-page-title">Job Positions</div>
            <div className="ws-page-sub">
              Define roles across the organization
            </div>
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
                  Edit position
                  <span className="ws-editing-tag">
                    <Pencil size={9} /> editing
                  </span>
                </>
              ) : (
                'New position'
              )}
            </div>
          </div>

          <div className="ws-panel-body">
            <form onSubmit={savePosition}>
              <div className="ws-field">
                <label className="ws-label">Job title</label>

                <input
                  className="ws-input"
                  value={title}
                  placeholder="e.g. Software Engineer"
                  onChange={(e) => setTitle(e.target.value)}
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
                      <Plus size={13} /> Add position
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
          {/* SEARCH */}

          <div className="ws-search-row">
            <div className="ws-search-wrap">
              <span className="ws-search-icon">
                <Search size={14} />
              </span>

              <input
                className="ws-search-input"
                placeholder="Search job positions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <table className="ws-table">
            <thead>
              <tr>
                <th className="ws-th" style={{ width: 60 }}>
                  #
                </th>
                <th className="ws-th">Job title</th>
                <th className="ws-th" style={{ width: 90 }}></th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="ws-tr">
                    <td className="ws-td">
                      <div className="ws-skeleton" style={{ width: 24 }} />
                    </td>
                    <td className="ws-td">
                      <div className="ws-skeleton" style={{ width: 180 }} />
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
                        <Briefcase size={18} color="var(--ws-ink3)" />
                      </div>

                      {search
                        ? 'No positions match your search'
                        : 'No positions added yet'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, i) => (
                  <tr
                    key={row.id}
                    className="ws-tr"
                    style={{ animationDelay: `${i * 35}ms` }}
                  >
                    <td className="ws-td">
                      <span className="ws-cell-mono">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </td>

                    <td className="ws-td">
                      <div className="ws-cell-name">
                        <span className="ws-cell-dot" />
                        {row.positionName}
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

            <h2>Delete position?</h2>

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
                Delete position
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobPositionForm;
