import { useState, useEffect, useCallback } from 'react';
import {
  getAllWorkSchedules,
  createWorkSchedule,
  updateWorkSchedule,
  deleteWorkSchedule,
} from '../../api/workScheduleApi';
import '../../styles/admin-ui.css';

import {
  Clock,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  Timer,
  Coffee,
  Globe,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DEFAULT_DAYS = [true, true, true, true, true, false, false];

const bitmaskToArray = (bitmask) =>
  DAYS.map((_, i) => (bitmask & (1 << i)) !== 0);

const arrayToBitmask = (arr) =>
  arr.reduce((mask, checked, i) => (checked ? mask | (1 << i) : mask), 0);

// ── Day toggle button (used in both form and cards) ───────────────────────────
function DayToggle({ day, active, onClick, readOnly = false }) {
  return (
    <button
      type="button"
      onClick={readOnly ? undefined : onClick}
      style={{
        fontFamily: 'var(--ws-font-sans)',
        fontSize: readOnly ? 11 : 12,
        fontWeight: 500,
        padding: readOnly ? '4px 9px' : '6px 13px',
        borderRadius: 8,
        border: '1px solid',
        cursor: readOnly ? 'default' : 'pointer',
        transition: 'all 0.14s',
        background: active ? 'var(--ws-ink)' : 'var(--ws-surface2)',
        color: active ? '#fff' : 'var(--ws-ink3)',
        borderColor: active ? 'var(--ws-ink)' : 'var(--ws-border)',
      }}
    >
      {day}
    </button>
  );
}

// ── Shared schedule form fields ───────────────────────────────────────────────
function ScheduleForm({
  scheduleName,
  setScheduleName,
  timezone,
  setTimezone,
  expectedStart,
  setExpectedStart,
  expectedEnd,
  setExpectedEnd,
  gracePeriodMin,
  setGracePeriodMin,
  breakDurationMin,
  setBreakDurationMin,
  workingDaysBits,
  toggleDay,
  onSubmit,
  onCancel,
  submitting,
  editingId,
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="ws-field">
        <label className="ws-label">Schedule name</label>
        <input
          className="ws-input"
          type="text"
          value={scheduleName}
          onChange={(e) => setScheduleName(e.target.value)}
          placeholder="e.g. Day Shift, Night Shift, Flex Hours"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div className="ws-field" style={{ marginBottom: 0 }}>
          <label className="ws-label">Expected start</label>
          <input
            className="ws-input"
            type="time"
            value={expectedStart}
            onChange={(e) => setExpectedStart(e.target.value)}
          />
        </div>
        <div className="ws-field" style={{ marginBottom: 0 }}>
          <label className="ws-label">Expected end</label>
          <input
            className="ws-input"
            type="time"
            value={expectedEnd}
            onChange={(e) => setExpectedEnd(e.target.value)}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div className="ws-field" style={{ marginBottom: 0 }}>
          <label className="ws-label">
            Grace period <span className="ws-label-muted">(min)</span>
          </label>
          <input
            className="ws-input"
            type="number"
            min="0"
            value={gracePeriodMin}
            onChange={(e) => setGracePeriodMin(e.target.value)}
          />
        </div>
        <div className="ws-field" style={{ marginBottom: 0 }}>
          <label className="ws-label">
            Break duration <span className="ws-label-muted">(min)</span>
          </label>
          <input
            className="ws-input"
            type="number"
            min="0"
            value={breakDurationMin}
            onChange={(e) => setBreakDurationMin(e.target.value)}
          />
        </div>
      </div>

      <div className="ws-field">
        <label className="ws-label">Timezone</label>
        <input
          className="ws-input"
          type="text"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          placeholder="e.g. Asia/Kolkata, America/New_York"
        />
      </div>

      <div className="ws-field">
        <label className="ws-label">Working days</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DAYS.map((day, i) => (
            <DayToggle
              key={day}
              day={day}
              active={workingDaysBits[i]}
              onClick={() => toggleDay(i)}
            />
          ))}
        </div>
      </div>

      <div className="ws-btn-row">
        <button
          type="submit"
          className="ws-btn ws-btn-primary"
          disabled={submitting}
          style={{ opacity: submitting ? 0.6 : 1 }}
        >
          {editingId ? (
            <>
              <Pencil size={13} /> {submitting ? 'Saving…' : 'Save changes'}
            </>
          ) : (
            <>
              <Plus size={13} /> {submitting ? 'Creating…' : 'Create schedule'}
            </>
          )}
        </button>
        <button
          type="button"
          className="ws-btn ws-btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function WorkSchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

  // form visibility / editing
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // form fields
  const [scheduleName, setScheduleName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [expectedStart, setExpectedStart] = useState('09:00');
  const [expectedEnd, setExpectedEnd] = useState('17:00');
  const [gracePeriodMin, setGracePeriodMin] = useState('15');
  const [breakDurationMin, setBreakDurationMin] = useState('60');
  const [workingDaysBits, setWorkingDaysBits] = useState(DEFAULT_DAYS);

  // ── fetch ──
  const fetchSchedules = useCallback(async (isMounted = true) => {
    try {
      const data = await getAllWorkSchedules();
      if (isMounted) setSchedules(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (isMounted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchSchedules(active);
    return () => {
      active = false;
    };
  }, [fetchSchedules]);

  // auto-dismiss alert
  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => setAlert(null), 4000);
    return () => clearTimeout(t);
  }, [alert]);

  // ── form helpers ──
  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setScheduleName('');
    setTimezone('Asia/Kolkata');
    setExpectedStart('09:00');
    setExpectedEnd('17:00');
    setGracePeriodMin('15');
    setBreakDurationMin('60');
    setWorkingDaysBits(DEFAULT_DAYS);
  };

  const toggleDay = (i) => {
    const updated = [...workingDaysBits];
    updated[i] = !updated[i];
    setWorkingDaysBits(updated);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (s) => {
    setEditingId(s.id);
    setScheduleName(s.scheduleName);
    setTimezone(s.timezone);
    setExpectedStart(s.expectedStart);
    setExpectedEnd(s.expectedEnd);
    setGracePeriodMin(String(s.gracePeriodMin));
    setBreakDurationMin(String(s.breakDurationMin));
    setWorkingDaysBits(bitmaskToArray(s.workingDays));
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── submit (create or update) ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleName.trim()) {
      setAlert({ type: 'error', message: 'Schedule name cannot be empty.' });
      return;
    }
    const payload = {
      scheduleName: scheduleName.trim(),
      timezone,
      expectedStart,
      expectedEnd,
      gracePeriodMin: parseInt(gracePeriodMin) || 0,
      breakDurationMin: parseInt(breakDurationMin) || 0,
      workingDays: arrayToBitmask(workingDaysBits),
    };
    setSubmitting(true);
    try {
      if (editingId) {
        await updateWorkSchedule(editingId, payload);
        setAlert({
          type: 'success',
          message: `Schedule "${payload.scheduleName}" updated.`,
        });
      } else {
        await createWorkSchedule(payload);
        setAlert({
          type: 'success',
          message: `Schedule "${payload.scheduleName}" created.`,
        });
      }
      resetForm();
      fetchSchedules();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Operation failed.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── delete ──
  const confirmDelete = async () => {
    try {
      await deleteWorkSchedule(deleteTarget.id);
      setAlert({
        type: 'success',
        message: `Schedule "${deleteTarget.name}" deleted.`,
      });
      fetchSchedules();
    } catch {
      setAlert({
        type: 'error',
        message: 'Cannot delete — this schedule may be in use.',
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
            <Clock size={20} color="#fff" />
          </div>
          <div>
            <div className="ws-page-title">Work Schedules</div>
            <div className="ws-page-sub">
              Define shift timings and working day patterns
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="ws-badge">{schedules.length} total</span>
          <button
            className={`ws-btn ${showForm ? 'ws-btn-secondary' : 'ws-btn-primary'}`}
            onClick={showForm ? resetForm : openCreate}
          >
            {showForm ? (
              <>
                <X size={13} /> Cancel
              </>
            ) : (
              <>
                <Plus size={13} /> New schedule
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
            <div className="ws-panel-title">
              {editingId ? (
                <>
                  Edit schedule
                  <span className="ws-editing-tag">
                    <Pencil size={9} /> editing
                  </span>
                </>
              ) : (
                'New schedule'
              )}
            </div>
          </div>
          <div className="ws-panel-body">
            <ScheduleForm
              scheduleName={scheduleName}
              setScheduleName={setScheduleName}
              timezone={timezone}
              setTimezone={setTimezone}
              expectedStart={expectedStart}
              setExpectedStart={setExpectedStart}
              expectedEnd={expectedEnd}
              setExpectedEnd={setExpectedEnd}
              gracePeriodMin={gracePeriodMin}
              setGracePeriodMin={setGracePeriodMin}
              breakDurationMin={breakDurationMin}
              setBreakDurationMin={setBreakDurationMin}
              workingDaysBits={workingDaysBits}
              toggleDay={toggleDay}
              onSubmit={handleSubmit}
              onCancel={resetForm}
              submitting={submitting}
              editingId={editingId}
            />
          </div>
        </div>
      )}

      {/* SCHEDULE CARDS */}
      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
          }}
        >
          {[...Array(3)].map((_, i) => (
            <div key={i} className="ws-panel" style={{ padding: 20 }}>
              <div
                className="ws-skeleton"
                style={{ width: '60%', marginBottom: 12 }}
              />
              <div
                className="ws-skeleton"
                style={{ width: '40%', marginBottom: 20 }}
              />
              <div
                className="ws-skeleton"
                style={{ width: '100%', marginBottom: 8 }}
              />
              <div className="ws-skeleton" style={{ width: '80%' }} />
            </div>
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <div className="ws-panel">
          <div className="ws-empty">
            <div className="ws-empty-icon">
              <Clock size={18} color="var(--ws-ink3)" />
            </div>
            No work schedules configured yet
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
          }}
        >
          {schedules.map((s, idx) => (
            <ScheduleCard
              key={s.id}
              schedule={s}
              idx={idx}
              onEdit={() => openEdit(s)}
              onDelete={() =>
                setDeleteTarget({ id: s.id, name: s.scheduleName })
              }
            />
          ))}
        </div>
      )}

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
            <h2>Delete schedule?</h2>
            <p>
              <strong>"{deleteTarget.name}"</strong> will be permanently
              removed. Employees assigned to this schedule may be affected.
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
                Delete schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Schedule card ─────────────────────────────────────────────────────────────
function ScheduleCard({ schedule: s, idx, onEdit, onDelete }) {
  const activeDays = bitmaskToArray(s.workingDays);

  return (
    <div
      className="ws-panel"
      style={{
        animation: 'ws-row-in 0.2s ease both',
        animationDelay: `${idx * 50}ms`,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 18px 14px',
          borderBottom: '1px solid var(--ws-border)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--ws-ink)',
              marginBottom: 2,
            }}
          >
            {s.scheduleName}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: 'var(--ws-ink3)',
              fontSize: 11,
            }}
          >
            <Globe size={11} />
            {s.timezone}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--ws-font-mono)',
              fontSize: 10,
              fontWeight: 500,
              background: 'var(--ws-amber-bg)',
              color: 'var(--ws-amber)',
              border: '1px solid var(--ws-amber-bdr)',
              borderRadius: 20,
              padding: '3px 10px',
              whiteSpace: 'nowrap',
            }}
          >
            {activeDays.filter(Boolean).length}d / wk
          </span>
          <button className="ws-icon-btn" title="Edit" onClick={onEdit}>
            <Pencil size={13} />
          </button>
          <button
            className="ws-icon-btn ws-icon-btn-danger"
            title="Delete"
            onClick={onDelete}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderBottom: '1px solid var(--ws-border)',
        }}
      >
        {[
          {
            icon: <Clock size={12} />,
            label: 'Shift',
            value: `${s.expectedStart} – ${s.expectedEnd}`,
          },
          {
            icon: <Timer size={12} />,
            label: 'Grace',
            value: `${s.gracePeriodMin} min`,
          },
          {
            icon: <Coffee size={12} />,
            label: 'Break',
            value: `${s.breakDurationMin} min`,
          },
        ].map(({ icon, label, value }, i, arr) => (
          <div
            key={label}
            style={{
              padding: '12px 14px',
              borderRight:
                i < arr.length - 1 ? '1px solid var(--ws-border)' : 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                color: 'var(--ws-ink3)',
                marginBottom: 4,
              }}
            >
              {icon} {label}
            </div>
            <div
              style={{
                fontFamily: 'var(--ws-font-mono)',
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--ws-ink)',
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Working days */}
      <div
        style={{
          padding: '12px 18px',
          display: 'flex',
          gap: 5,
          flexWrap: 'wrap',
        }}
      >
        {DAYS.map((day, i) => (
          <DayToggle key={day} day={day} active={activeDays[i]} readOnly />
        ))}
      </div>
    </div>
  );
}

export default WorkSchedulePage;
