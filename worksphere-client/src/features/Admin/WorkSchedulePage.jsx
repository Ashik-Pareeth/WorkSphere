import React, { useState, useEffect } from 'react';
import {
  getAllWorkSchedules,
  createWorkSchedule,
} from '../../api/workScheduleApi';
import './WorkSchedulePage.css';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WorkSchedulePage = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [scheduleName, setScheduleName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [expectedStart, setExpectedStart] = useState('09:00');
  const [expectedEnd, setExpectedEnd] = useState('17:00');
  const [gracePeriodMin, setGracePeriodMin] = useState('15');
  const [breakDurationMin, setBreakDurationMin] = useState('60');
  const [workingDaysBits, setWorkingDaysBits] = useState([
    true,
    true,
    true,
    true,
    true,
    false,
    false,
  ]); // Mon-Fri
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const data = await getAllWorkSchedules();
      setSchedules(data || []);
    } catch (err) {
      setError('Failed to load work schedules.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const bitmaskToArray = (bitmask) => {
    return DAYS_OF_WEEK.map((_, i) => (bitmask & (1 << i)) !== 0);
  };

  const arrayToBitmask = (arr) => {
    return arr.reduce(
      (mask, checked, i) => (checked ? mask | (1 << i) : mask),
      0
    );
  };

  const toggleDay = (index) => {
    const updated = [...workingDaysBits];
    updated[index] = !updated[index];
    setWorkingDaysBits(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleName.trim()) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await createWorkSchedule({
        scheduleName: scheduleName.trim(),
        timezone,
        expectedStart,
        expectedEnd,
        gracePeriodMin: parseInt(gracePeriodMin) || 0,
        breakDurationMin: parseInt(breakDurationMin) || 0,
        workingDays: arrayToBitmask(workingDaysBits),
      });
      setSuccess(`Schedule "${scheduleName}" created!`);
      setScheduleName('');
      setExpectedStart('09:00');
      setExpectedEnd('17:00');
      setGracePeriodMin('15');
      setBreakDurationMin('60');
      setWorkingDaysBits([true, true, true, true, true, false, false]);
      setShowForm(false);
      fetchSchedules();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create schedule.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderWorkingDays = (bitmask) => {
    return DAYS_OF_WEEK.map((day, i) => (
      <span
        key={day}
        className={`day-chip ${bitmask & (1 << i) ? 'active' : 'inactive'}`}
      >
        {day}
      </span>
    ));
  };

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <div>
          <h1>⏰ Work Schedules</h1>
          <p>
            Define shift timings and assign working day patterns. The Midnight
            Absentee Job uses these to determine who should have worked.
          </p>
        </div>
        <button className="btn-create" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ New Schedule'}
        </button>
      </div>

      {error && <div className="error-alert">{error}</div>}
      {success && <div className="success-alert">{success}</div>}

      {showForm && (
        <form className="schedule-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Schedule Name</label>
            <input
              type="text"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              placeholder='e.g., "Day Shift", "Night Shift", "Flex Hours"...'
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Expected Start</label>
              <input
                type="time"
                value={expectedStart}
                onChange={(e) => setExpectedStart(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Expected End</label>
              <input
                type="time"
                value={expectedEnd}
                onChange={(e) => setExpectedEnd(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Grace Period (min)</label>
              <input
                type="number"
                min="0"
                value={gracePeriodMin}
                onChange={(e) => setGracePeriodMin(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Break Duration (min)</label>
              <input
                type="number"
                min="0"
                value={breakDurationMin}
                onChange={(e) => setBreakDurationMin(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Timezone</label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g., Asia/Kolkata, America/New_York"
              required
            />
          </div>

          <div className="form-group">
            <label>Working Days</label>
            <div className="day-selector">
              {DAYS_OF_WEEK.map((day, i) => (
                <button
                  key={day}
                  type="button"
                  className={`day-toggle ${workingDaysBits[i] ? 'selected' : ''}`}
                  onClick={() => toggleDay(i)}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={submitting || !scheduleName.trim()}
          >
            {submitting ? 'Creating...' : '💾 Create Schedule'}
          </button>
        </form>
      )}

      <div className="schedules-list">
        {loading ? (
          <div className="loading-state">Loading schedules...</div>
        ) : schedules.length === 0 ? (
          <div className="empty-state">No work schedules configured yet.</div>
        ) : (
          <div className="schedule-cards">
            {schedules.map((s) => (
              <div key={s.id} className="schedule-card">
                <div className="card-header">
                  <h3>{s.scheduleName}</h3>
                  <span className="tz-badge">{s.timezone}</span>
                </div>
                <div className="card-metrics">
                  <div className="metric">
                    <label>Shift</label>
                    <span>
                      {s.expectedStart} — {s.expectedEnd}
                    </span>
                  </div>
                  <div className="metric">
                    <label>Grace</label>
                    <span>{s.gracePeriodMin} min</span>
                  </div>
                  <div className="metric">
                    <label>Break</label>
                    <span>{s.breakDurationMin} min</span>
                  </div>
                </div>
                <div className="card-days">
                  {renderWorkingDays(s.workingDays)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkSchedulePage;
