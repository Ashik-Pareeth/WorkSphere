import React, { useEffect, useState } from 'react';
import { getTimesheetAuditLogs } from '../../api/attendanceApi';
import './AuditLogDrawer.css';

const AuditLogDrawer = ({ isOpen, onClose, attendanceId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && attendanceId) {
      fetchLogs();
    } else {
      setLogs([]);
    }
  }, [isOpen, attendanceId]);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTimesheetAuditLogs(attendanceId);
      setLogs(data || []);
    } catch (err) {
      setError('Failed to load audit logs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString || isoString === 'null') return 'N/A';
    try {
      return new Date(isoString).toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <>
      {isOpen && <div className="drawer-overlay" onClick={onClose} />}
      <div className={`audit-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>📜 Audit Trail</h3>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="drawer-content">
          {loading && (
            <div className="loading-state">Loading audit trail...</div>
          )}
          {error && <div className="error-alert">{error}</div>}

          {!loading && !error && logs.length === 0 && (
            <div className="empty-state">
              <p>No manual edits recorded for this timesheet.</p>
            </div>
          )}

          {!loading && logs.length > 0 && (
            <div className="timeline">
              {logs.map((log) => (
                <div key={log.id} className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="changer-name">
                        {log.changedBy
                          ? `${log.changedBy.firstName} ${log.changedBy.lastName}`
                          : 'Unknown'}
                      </span>
                      <span className="timestamp">
                        {formatDateTime(log.changeTimestamp)}
                      </span>
                    </div>
                    <div className="timeline-body">
                      <p className="field-label">
                        Field Changed: <strong>{log.fieldChanged}</strong>
                      </p>
                      <div className="change-diff">
                        <span className="old-val">
                          {formatDateTime(log.oldValue)}
                        </span>
                        <span className="arrow">→</span>
                        <span className="new-val">
                          {formatDateTime(log.newValue)}
                        </span>
                      </div>
                      <div className="reason-box">
                        <span className="reason-label">Reason:</span>{' '}
                        {log.reason}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AuditLogDrawer;
