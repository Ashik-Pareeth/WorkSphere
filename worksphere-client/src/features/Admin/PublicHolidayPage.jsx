import React, { useState, useEffect } from 'react';
import {
  getHolidays,
  createHoliday,
  deleteHoliday,
} from '../../api/holidayApi';
import './PublicHolidayPage.css';

const PublicHolidayPage = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [region, setRegion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Year filter
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const data = await getHolidays(selectedYear);
      setHolidays(data || []);
    } catch (err) {
      setError('Failed to load holidays.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !date) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await createHoliday({
        name: name.trim(),
        date,
        applicableRegion: region.trim() || null,
      });
      setSuccess(`"${name}" added successfully!`);
      setName('');
      setDate('');
      setRegion('');
      setShowForm(false);
      fetchHolidays();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create holiday.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, holidayName) => {
    if (!window.confirm(`Delete "${holidayName}" from the calendar?`)) return;
    try {
      await deleteHoliday(id);
      setSuccess(`"${holidayName}" removed.`);
      fetchHolidays();
    } catch (err) {
      setError('Failed to delete holiday.');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="holiday-page">
      <div className="holiday-header">
        <div>
          <h1>🎉 Public Holidays</h1>
          <p>
            Configure days when the system will not mark employees as absent.
          </p>
        </div>
        <div className="header-controls">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {[...Array(5)].map((_, i) => {
              const yr = new Date().getFullYear() - 1 + i;
              return (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              );
            })}
          </select>
          <button className="btn-create" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Add Holiday'}
          </button>
        </div>
      </div>

      {error && <div className="error-alert">{error}</div>}
      {success && <div className="success-alert">{success}</div>}

      {showForm && (
        <form className="holiday-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Holiday Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Christmas, Eid, Diwali..."
                required
              />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Applicable Region (optional)</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Leave blank for global, or e.g. 'US', 'India'..."
            />
          </div>
          <button
            type="submit"
            className="btn-submit"
            disabled={submitting || !name.trim() || !date}
          >
            {submitting ? 'Adding...' : '💾 Save Holiday'}
          </button>
        </form>
      )}

      <div className="holidays-list">
        {loading ? (
          <div className="loading-state">Loading holidays...</div>
        ) : holidays.length === 0 ? (
          <div className="empty-state">
            No public holidays configured for {selectedYear}.
          </div>
        ) : (
          <table className="holidays-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Holiday</th>
                <th>Region</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((h) => (
                <tr key={h.id}>
                  <td className="date-cell">{formatDate(h.date)}</td>
                  <td className="name-cell">{h.name}</td>
                  <td>
                    <span className="region-badge">
                      {h.applicableRegion || 'Global'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(h.id, h.name)}
                      title="Remove"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PublicHolidayPage;
