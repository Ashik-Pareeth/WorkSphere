import React from 'react';
import './RosterStatusCard.css';

const RosterStatusCard = ({ employee, onEditTime, onViewHistory }) => {
  const getStatusBadge = (status) => {
    const badges = {
      PRESENT: { className: 'badge-success', label: 'Present' },
      LATE: { className: 'badge-warning', label: 'Late' },
      ON_LEAVE: { className: 'badge-info', label: 'On Leave' },
      ABSENT: { className: 'badge-neutral', label: 'Absent' },
    };
    const badge = badges[status] || badges.ABSENT;
    return (
      <span className={`roster-badge ${badge.className}`}>{badge.label}</span>
    );
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (first, last) => {
    return `${(first || '?')[0]}${(last || '?')[0]}`.toUpperCase();
  };

  return (
    <div className="roster-card">
      <div className="roster-card__avatar">
        {getInitials(employee.firstName, employee.lastName)}
      </div>
      <div className="roster-card__info">
        <h4 className="roster-card__name">
          {employee.firstName} {employee.lastName}
        </h4>
        <span className="roster-card__title">
          {employee.jobTitle || 'Employee'}
        </span>
      </div>
      {getStatusBadge(employee.dailyStatus)}
      <div className="roster-card__time">
        <span className="time-label">In:</span>
        <span className="time-value">{formatTime(employee.clockIn)}</span>
        <span className="time-label">Out:</span>
        <span className="time-value">{formatTime(employee.clockOut)}</span>
      </div>
      <div className="roster-card__actions">
        <button
          className="btn-icon edit"
          onClick={() => onEditTime(employee)}
          disabled={!employee.attendanceId}
          title="Edit Time"
        >
          ✏️
        </button>
        <button
          className="btn-icon history"
          onClick={() => onViewHistory(employee)}
          disabled={!employee.attendanceId}
          title="View History"
        >
          📜
          {employee.isManuallyAdjusted && (
            <span className="dot-indicator"></span>
          )}
        </button>
      </div>
    </div>
  );
};

export default RosterStatusCard;
