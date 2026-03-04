import React, { useState, useEffect, useRef } from 'react';
import DailyRosterBoard from '../features/attendance/DailyRosterBoard';
import TimesheetAdjustModal from '../features/attendance/TimesheetAdjustModal';
import AuditLogDrawer from '../features/attendance/AuditLogDrawer';
import { getDailyRoster } from '../api/attendanceApi';
import './ManagerDashboard.css';

const POLL_INTERVAL_MS = 60000; // 60 seconds

const ManagerDashboard = () => {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Modal/Drawer state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);

  const intervalRef = useRef(null);

  const fetchRoster = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const data = await getDailyRoster();
      setRoster(data || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        'Unable to load the daily roster. Ensure you have manager permissions.'
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster(true);

    // Polling: refresh every 60 seconds for a live view
    intervalRef.current = setInterval(
      () => fetchRoster(false),
      POLL_INTERVAL_MS
    );

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleEditTime = (employee) => {
    setSelectedRecord(employee);
    setIsAdjustModalOpen(true);
  };

  const handleViewHistory = (employee) => {
    setSelectedRecord(employee);
    setIsAuditDrawerOpen(true);
  };

  return (
    <div className="manager-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>📋 Live Roster</h1>
          <p className="dashboard-subtitle">
            Real-time department attendance for{' '}
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="header-actions">
          {lastUpdated && (
            <span className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <span className="live-dot"></span>
          <span className="live-label">LIVE</span>
        </div>
      </div>

      {error && <div className="error-alert">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading roster data...</div>
      ) : (
        <DailyRosterBoard
          roster={roster}
          onEditTime={handleEditTime}
          onViewHistory={handleViewHistory}
        />
      )}

      <TimesheetAdjustModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        attendanceId={selectedRecord?.attendanceId}
        currentClockIn={selectedRecord?.clockIn}
        currentClockOut={selectedRecord?.clockOut}
        onRefresh={() => fetchRoster(false)}
      />

      <AuditLogDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        attendanceId={selectedRecord?.attendanceId}
      />
    </div>
  );
};

export default ManagerDashboard;
