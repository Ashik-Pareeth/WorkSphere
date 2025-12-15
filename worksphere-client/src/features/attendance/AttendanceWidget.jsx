import React, { useState, useEffect } from 'react';

const AttendanceWidget = () => {
  // 1. State to hold the data
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. The Fetch Logic
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Get credentials
        const employeeId = localStorage.getItem('employeeId');
        const token = localStorage.getItem('token');

        if (!employeeId || !token) {
          throw new Error('No credentials found. Please login.');
        }

        // Call the Backend
        // Note: We assume your WorkSessionController has a GET endpoint for history.
        // If not, we will add it to the backend next.
        const response = await fetch(
          `http://localhost:8080/work-session/employee/${employeeId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`, // The ID Card
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch attendance history');
        }

        const data = await response.json();
        setSessions(data); // Store the list
      } catch (err) {
        console.error('Widget Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []); // Empty dependency array = run once on mount

  // 3. UI Helper: Format Dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Ongoing';
    return new Date(dateString).toLocaleString();
  };

  // 4. Render
  if (loading) return <div>Loading history...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div style={styles.container}>
      <h3>Attendance History</h3>
      {sessions.length === 0 ? (
        <p>No work sessions recorded yet.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>Start Time</th>
              <th style={styles.th}>End Time</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id} style={styles.row}>
                <td style={styles.td}>{formatDate(session.startTime)}</td>
                <td style={styles.td}>{formatDate(session.endTime)}</td>
                <td style={styles.td}>
                  {session.isActive ? (
                    <span style={styles.active}>Active</span>
                  ) : (
                    <span style={styles.completed}>Completed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// Simple Styles
const styles = {
  container: {
    width: '100%',
    overflowX: 'auto', // Handle small screens
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
    fontSize: '0.9rem',
  },
  headerRow: {
    backgroundColor: '#f8f9fa',
    textAlign: 'left',
  },
  th: {
    padding: '10px',
    borderBottom: '2px solid #dee2e6',
    color: '#495057',
  },
  row: {
    borderBottom: '1px solid #dee2e6',
  },
  td: {
    padding: '10px',
    color: '#212529',
  },
  active: {
    color: 'green',
    fontWeight: 'bold',
  },
  completed: {
    color: '#6c757d',
  },
};

export default AttendanceWidget;
