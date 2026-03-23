import { useState, useEffect, useMemo } from 'react';
import { getAttendanceHistory } from '../../api/attendanceApi';
import { useAuth } from '../../hooks/useAuth';
import StatCard from '../../components/common/StatCard';
import { Calendar, UserX, Clock, Activity } from 'lucide-react';

const MyAttendanceLog = () => {
  const { user } = useAuth();
  console.log('User from context:', user); // Debugging line to check user data
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

  // --- STEP 11: Current Month Computations ---
  const currentMonthStats = useMemo(() => {
    const today = new Date();
    const currentMonthRecords = history.filter((record) => {
      const d = new Date(record.date);
      return (
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    });

    // 1. Present Days
    const presentDays = currentMonthRecords.filter(
      (r) => r.clockIn != null
    ).length;

    // 2. Absent Days
    // Assuming 22 working days per month as a standard benchmark if totally unknown,
    // but a true absent day calculation needs a calendar logic.
    // We'll compute it dynamically based on elapsed working days.
    const getElapsedWorkingDays = () => {
      let days = 0;
      for (let d = 1; d <= today.getDate(); d++) {
        const date = new Date(today.getFullYear(), today.getMonth(), d);
        if (date.getDay() !== 0 && date.getDay() !== 6) days++; // Skip Sun/Sat
      }
      return days;
    };
    const absentDays = Math.max(0, getElapsedWorkingDays() - presentDays);

    // 3. Late Arrivals
    let lateArrivals = '--';
    let isLateMissing = false;

    if (user?.workSchedule?.expectedStart) {
      let lateCount = 0;
      // expectedStart format ex: "09:00:00" or "09:00"
      const [stdHour, stdMinute] = user.workSchedule.expectedStart
        .split(':')
        .map(Number);

      currentMonthRecords.forEach((r) => {
        if (r.clockIn) {
          const clockInTime = new Date(r.clockIn);
          const clockInHour = clockInTime.getHours();
          const clockInMinute = clockInTime.getMinutes();
          if (
            clockInHour > stdHour ||
            (clockInHour === stdHour && clockInMinute > stdMinute)
          ) {
            lateCount++;
          }
        }
      });
      lateArrivals = lateCount;
    } else {
      isLateMissing = true;
    }

    // 4. Total Hours
    let totalHrs = 0;
    currentMonthRecords.forEach((r) => {
      if (r.clockIn && r.clockOut) {
        const diff = new Date(r.clockOut) - new Date(r.clockIn);
        totalHrs += diff / (1000 * 60 * 60);
      }
    });

    return {
      presentDays,
      absentDays,
      lateArrivals,
      isLateMissing,
      totalHours: Math.round(totalHrs),
    };
  }, [history, user]);

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Present Days (Month)"
            value={currentMonthStats.presentDays}
            icon={<Calendar className="w-6 h-6 text-emerald-600" />}
            colorClass="text-emerald-600"
            bgColorClass="bg-emerald-50 border-emerald-100"
          />
          <StatCard
            title="Absent Days (Month)"
            value={currentMonthStats.absentDays}
            icon={<UserX className="w-6 h-6 text-rose-600" />}
            colorClass="text-rose-600"
            bgColorClass="bg-rose-50 border-rose-100"
          />
          <StatCard
            title="Late Arrivals"
            value={
              currentMonthStats.isLateMissing
                ? '--'
                : currentMonthStats.lateArrivals
            }
            icon={
              <Clock
                className={`w-6 h-6 ${currentMonthStats.isLateMissing ? 'text-gray-400' : 'text-amber-600'}`}
              />
            }
            colorClass={
              currentMonthStats.isLateMissing
                ? 'text-gray-400'
                : 'text-amber-600'
            }
            bgColorClass={
              currentMonthStats.isLateMissing
                ? 'bg-gray-50 border-gray-200'
                : 'bg-amber-50 border-amber-100'
            }
          />
          <StatCard
            title="Total Hours"
            value={`${currentMonthStats.totalHours}h`}
            icon={<Activity className="w-6 h-6 text-blue-600" />}
            colorClass="text-blue-600"
            bgColorClass="bg-blue-50 border-blue-100"
          />
        </div>

        {currentMonthStats.isLateMissing && (
          <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200 mb-6 font-mono">
            [TODO]: Cannot compute late arrivals.
            `user.workSchedule.expectedStart` is missing from context.
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
