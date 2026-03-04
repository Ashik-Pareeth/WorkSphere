import React, { useState } from 'react';
import { updateTimesheetManually } from '../../api/attendanceApi';
import './TimesheetAdjustModal.css';

const TimesheetAdjustModal = ({
  isOpen,
  onClose,
  attendanceId,
  currentClockIn,
  currentClockOut,
  onRefresh,
}) => {
  const [newClockIn, setNewClockIn] = useState('');
  const [newClockOut, setNewClockOut] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isReasonFilled = reason.trim().length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isReasonFilled) {
      setError('A mandatory reason must be provided for audit tracking.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = { reason };
      if (newClockIn) payload.newClockIn = newClockIn;
      if (newClockOut) payload.newClockOut = newClockOut;

      await updateTimesheetManually(attendanceId, payload);
      setNewClockIn('');
      setNewClockOut('');
      setReason('');
      onRefresh();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to update timesheet. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNewClockIn('');
    setNewClockOut('');
    setReason('');
    setError('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⏱️ Manual Timesheet Adjustment</h3>
          <button className="close-btn" onClick={handleClose}>
            &times;
          </button>
        </div>

        <div className="current-values">
          <p>
            <strong>Current Clock In:</strong>{' '}
            {currentClockIn
              ? new Date(currentClockIn).toLocaleString()
              : 'Not set'}
          </p>
          <p>
            <strong>Current Clock Out:</strong>{' '}
            {currentClockOut
              ? new Date(currentClockOut).toLocaleString()
              : 'Not set'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="adjust-form">
          {error && <div className="error-alert">{error}</div>}

          <div className="form-group">
            <label>New Clock In Time</label>
            <input
              type="datetime-local"
              value={newClockIn}
              onChange={(e) => setNewClockIn(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>New Clock Out Time</label>
            <input
              type="datetime-local"
              value={newClockOut}
              onChange={(e) => setNewClockOut(e.target.value)}
            />
          </div>

          <div className="form-group required">
            <label>Reason for Adjustment</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Employee forgot to clock out, system error, manager correction..."
              rows={3}
            />
            {!isReasonFilled && reason.length === 0 && (
              <span className="field-hint">
                This field is required for audit compliance.
              </span>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!isReasonFilled || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : '✅ Confirm Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimesheetAdjustModal;
