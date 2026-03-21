import { useState, useEffect } from 'react';
import { getAttendanceHistory } from '../../api/attendanceApi';

const MyAttendanceLog = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await getAttendanceHistory();

        // Sort by date descending (newest first)
        const sortedData = data.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setHistory(sortedData);
      } catch (err) {
        console.error('Failed to fetch attendance history', err);
        setError('Could not load attendance records. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Helper function to format the datetime arrays/strings from Java
  const formatTime = (dateTimeStr) => {
    if (!dateTimeStr) return '--:--';
    return new Date(dateTimeStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper function to calculate hours worked
  const calculateHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return '-';
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    const diffHours = (end - start) / (1000 * 60 * 60);
    return diffHours.toFixed(2) + ' hrs';
  };

  if (loading) {
    return (
      <div className="p-8 text-gray-500 animate-pulse">
        Loading attendance history...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans w-full overflow-y-auto">
      <header className="flex-none bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          My Attendance Log
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review your daily clock-in and clock-out history.
        </p>
      </header>

      <main className="flex-1 p-8 w-full max-w-5xl mx-auto">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 border border-red-200">
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Clock In
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Clock Out
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Total Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.length > 0 ? (
                history.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-emerald-600 font-medium">
                      {formatTime(record.clockIn)}
                    </td>
                    <td className="px-6 py-4 text-sm text-orange-600 font-medium">
                      {formatTime(record.clockOut)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-semibold">
                      {calculateHours(record.clockIn, record.clockOut)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default MyAttendanceLog;
