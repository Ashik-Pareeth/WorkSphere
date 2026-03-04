import React from 'react';
import RosterStatusCard from './RosterStatusCard';
import './DailyRosterBoard.css';

const COLUMNS = [
  { key: 'PRESENT', label: 'Present', icon: '🟢' },
  { key: 'LATE', label: 'Late', icon: '🟡' },
  { key: 'ON_LEAVE', label: 'On Leave', icon: '🔵' },
  { key: 'ABSENT', label: 'Absent', icon: '⚫' },
];

const DailyRosterBoard = ({ roster, onEditTime, onViewHistory }) => {
  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.key] = roster.filter((emp) => emp.dailyStatus === col.key);
    return acc;
  }, {});

  return (
    <div className="kanban-board">
      {COLUMNS.map((col) => (
        <div
          key={col.key}
          className={`kanban-column kanban-column--${col.key.toLowerCase()}`}
        >
          <div className="kanban-column__header">
            <span className="kanban-column__icon">{col.icon}</span>
            <h3 className="kanban-column__title">{col.label}</h3>
            <span className="kanban-column__count">
              {grouped[col.key]?.length || 0}
            </span>
          </div>
          <div className="kanban-column__body">
            {grouped[col.key]?.length === 0 ? (
              <div className="kanban-empty">No employees</div>
            ) : (
              grouped[col.key].map((emp) => (
                <RosterStatusCard
                  key={emp.employeeId}
                  employee={emp}
                  onEditTime={onEditTime}
                  onViewHistory={onViewHistory}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DailyRosterBoard;
