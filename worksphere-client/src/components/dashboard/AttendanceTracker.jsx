import React, { useState, useEffect } from 'react';
import {
  clockIn,
  clockOut,
  getAttendanceHistory,
} from '../../api/attendanceApi';

// Simple Icons
const PlayIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const StopIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 10h6v4H9z"
    />
  </svg>
);

const AttendanceTracker = () => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize status by checking history
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const history = await getAttendanceHistory();
        if (history && history.length > 0) {
          // Grab the most recent entry
          const latestLog = history[history.length - 1];
          // If they have a clockInTime but NO clockOutTime, they are actively clocked in!
          // (Adjust these variable names if your Attendance.java uses different field names)
          if (latestLog.clockIn && !latestLog.clockOut) {
            setIsClockedIn(true);
          }
        }
      } catch (err) {
        console.error('Failed to load attendance history', err);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, []);

  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await clockIn();
      setIsClockedIn(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clock in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await clockOut();
      setIsClockedIn(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clock out');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-10 w-32 bg-gray-100 rounded-lg animate-pulse"></div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {error && (
        <span className="text-xs text-red-500 font-medium">{error}</span>
      )}

      {!isClockedIn ? (
        <button
          onClick={handleClockIn}
          disabled={actionLoading}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
          <PlayIcon />
          {actionLoading ? 'Processing...' : 'Clock In'}
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Currently On Shift
          </div>
          <button
            onClick={handleClockOut}
            disabled={actionLoading}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <StopIcon />
            {actionLoading ? 'Processing...' : 'Clock Out'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;
