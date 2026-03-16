import { useState, useEffect, useCallback } from 'react';
import {
  getHolidays,
  createHoliday,
  deleteHoliday,
} from '../../api/holidayApi';
import '../../styles/admin-ui.css';

import {
  CalendarDays,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertTriangle,
  Globe,
  MapPin,
} from 'lucide-react';

const formatDate = (dateStr) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [...Array(5)].map((_, i) => currentYear - 1 + i);

function PublicHolidayPage() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

  // form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [region, setRegion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchHolidays = useCallback(
    async (isMounted = true) => {
      setLoading(true);
      try {
        const data = await getHolidays(selectedYear);
        if (isMounted) setHolidays(data || []);
      } catch (err) {
        console.error(err);
        if (isMounted)
          setAlert({ type: 'error', message: 'Failed to load holidays.' });
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [selectedYear]
  );

  useEffect(() => {
    let active = true;
    fetchHolidays(active);
    return () => {
      active = false;
    };
  }, [fetchHolidays]);

  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => setAlert(null), 4000);
    return () => clearTimeout(t);
  }, [alert]);

  const resetForm = () => {
    setName('');
    setDate('');
    setRegion('');
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !date) {
      setAlert({
        type: 'error',
        message: 'Holiday name and date are required.',
      });
      return;
    }
    setSubmitting(true);
    try {
      await createHoliday({
        name: name.trim(),
        date,
        applicableRegion: region.trim() || null,
      });
      setAlert({
        type: 'success',
        message: `"${name.trim()}" added to ${selectedYear}.`,
      });
      resetForm();
      fetchHolidays();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to create holiday.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteHoliday(deleteTarget.id);
      setAlert({ type: 'success', message: `"${deleteTarget.name}" removed.` });
      fetchHolidays();
    } catch {
      setAlert({ type: 'error', message: 'Failed to delete holiday.' });
    }
    setDeleteTarget(null);
  };

  return (
    <div className="ws-page">
      {/* TOP BAR */}
      <div className="ws-topbar">
        <div className="ws-topbar-left">
          <div className="ws-icon-box">
            <CalendarDays size={20} color="#fff" />
          </div>
          <div>
            <div className="ws-page-title">Public Holidays</div>
            <div className="ws-page-sub">
              Days when employees will not be marked absent
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="ws-badge">
            {holidays.length} in {selectedYear}
          </span>

          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{
              fontFamily: 'var(--ws-font-mono)',
              fontSize: 12,
              fontWeight: 500,
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border2)',
              borderRadius: 9,
              padding: '7px 12px',
              color: 'var(--ws-ink)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {YEAR_OPTIONS.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          <button
            className={`ws-btn ${showForm ? 'ws-btn-secondary' : 'ws-btn-primary'}`}
            onClick={showForm ? resetForm : () => setShowForm(true)}
          >
            {showForm ? (
              <>
                <X size={13} /> Cancel
              </>
            ) : (
              <>
                <Plus size={13} /> Add holiday
              </>
            )}
          </button>
        </div>
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

      {/* FORM PANEL */}
      {showForm && (
        <div className="ws-panel" style={{ marginBottom: '1.25rem' }}>
          <div className="ws-panel-head">
            <div className="ws-eyebrow">Configuration</div>
            <div className="ws-panel-title">New holiday</div>
          </div>
          <div className="ws-panel-body">
            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 0,
                }}
              >
                <div className="ws-field">
                  <label className="ws-label">Holiday name</label>
                  <input
                    className="ws-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Christmas, Eid, Diwali"
                  />
                </div>
                <div className="ws-field">
                  <label className="ws-label">Date</label>
                  <input
                    className="ws-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="ws-field">
                <label className="ws-label">
                  Applicable region{' '}
                  <span className="ws-label-muted">
                    (optional — leave blank for global)
                  </span>
                </label>
                <input
                  className="ws-input"
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. US, India, UK"
                />
              </div>

              <div className="ws-btn-row">
                <button
                  type="submit"
                  className="ws-btn ws-btn-primary"
                  disabled={submitting}
                  style={{ opacity: submitting ? 0.6 : 1 }}
                >
                  <Plus size={13} />
                  {submitting ? 'Adding…' : 'Add holiday'}
                </button>
                <button
                  type="button"
                  className="ws-btn ws-btn-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TABLE PANEL */}
      <div className="ws-panel">
        <table className="ws-table">
          <thead>
            <tr>
              <th className="ws-th">Date</th>
              <th className="ws-th">Holiday</th>
              <th className="ws-th">Region</th>
              <th className="ws-th" style={{ width: 56 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="ws-tr">
                  <td className="ws-td">
                    <div className="ws-skeleton" style={{ width: 180 }} />
                  </td>
                  <td className="ws-td">
                    <div className="ws-skeleton" style={{ width: 140 }} />
                  </td>
                  <td className="ws-td">
                    <div className="ws-skeleton" style={{ width: 60 }} />
                  </td>
                  <td className="ws-td">
                    <div className="ws-skeleton" style={{ width: 28 }} />
                  </td>
                </tr>
              ))
            ) : holidays.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="ws-empty">
                    <div className="ws-empty-icon">
                      <CalendarDays size={18} color="var(--ws-ink3)" />
                    </div>
                    No public holidays configured for {selectedYear}
                  </div>
                </td>
              </tr>
            ) : (
              holidays.map((h, i) => (
                <tr
                  key={h.id}
                  className="ws-tr"
                  style={{ animationDelay: `${i * 35}ms` }}
                >
                  <td className="ws-td">
                    <span
                      style={{
                        fontFamily: 'var(--ws-font-mono)',
                        fontSize: 12,
                        fontWeight: 500,
                        color: 'var(--ws-ink)',
                      }}
                    >
                      {formatDate(h.date)}
                    </span>
                  </td>
                  <td className="ws-td">
                    <div className="ws-cell-name">
                      <span className="ws-cell-dot" />
                      {h.name}
                    </div>
                  </td>
                  <td className="ws-td">
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 500,
                        padding: '3px 9px',
                        borderRadius: 20,
                        border: '1px solid',
                        background: h.applicableRegion
                          ? 'var(--ws-surface2)'
                          : 'var(--ws-amber-bg)',
                        color: h.applicableRegion
                          ? 'var(--ws-ink2)'
                          : 'var(--ws-amber)',
                        borderColor: h.applicableRegion
                          ? 'var(--ws-border)'
                          : 'var(--ws-amber-bdr)',
                      }}
                    >
                      {h.applicableRegion ? (
                        <>
                          <MapPin size={10} /> {h.applicableRegion}
                        </>
                      ) : (
                        <>
                          <Globe size={10} /> Global
                        </>
                      )}
                    </span>
                  </td>
                  <td className="ws-td ws-cell-actions">
                    <button
                      className="ws-icon-btn ws-icon-btn-danger"
                      title="Delete"
                      onClick={() =>
                        setDeleteTarget({ id: h.id, name: h.name })
                      }
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
            <h2>Remove holiday?</h2>
            <p>
              <strong>"{deleteTarget.name}"</strong> will be permanently removed
              from the {selectedYear} calendar. Attendance records for this day
              may be affected.
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
                Remove holiday
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PublicHolidayPage;
