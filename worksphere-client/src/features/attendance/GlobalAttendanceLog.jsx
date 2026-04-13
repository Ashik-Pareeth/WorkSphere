import { useState, useEffect, useMemo } from 'react';
import { getAttendanceForEmployee } from '../../api/attendanceApi';
import { getAllEmployees, getMyTeam } from '../../api/employeeApi';
import { useAuth } from '../../hooks/useAuth';
import {
  Search,
  Calendar,
  Clock,
  Activity,
  UserX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const ROWS_PER_PAGE = 15;

// ─── helpers ─────────────────────────────────────────────────────────────────
const formatTime = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const calcHours = (clockIn, clockOut) => {
  if (!clockIn || !clockOut) return '—';
  const diff = (new Date(clockOut) - new Date(clockIn)) / (1000 * 60 * 60);
  return diff.toFixed(2) + ' h';
};

const statusBadge = (clockIn, clockOut) => {
  if (!clockIn) return { label: 'Absent', cls: 'bg-red-100 text-red-700' };
  if (!clockOut) return { label: 'Active', cls: 'bg-blue-100 text-blue-700' };
  return { label: 'Present', cls: 'bg-emerald-100 text-emerald-700' };
};

// ─── StatCard mini ────────────────────────────────────────────────────────────
const MiniStat = ({ icon, label, value, colorCls }) => (
  <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
    <span className={`p-2 rounded-lg ${colorCls}`}>{icon}</span>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const TeamAttendanceLog = () => {
  const { user } = useAuth();

  const hasRole = (roles) => {
    if (!user?.roles) return false;
    const normalized = user.roles.map((r) =>
      r.replace('ROLE_', '').toUpperCase()
    );
    return roles.some((r) => normalized.includes(r));
  };

  const isHrOrAdmin = hasRole(['HR', 'SUPER_ADMIN']);

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  // ── Load employee list ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        // Managers only see their direct reports; HR/Admin see everyone
        const data = isHrOrAdmin ? await getAllEmployees() : await getMyTeam();
        setEmployees(data);

        // For managers: auto-select first team member if available
        if (!isHrOrAdmin && data.length > 0) {
          setSelectedEmployee(data[0]);
        }
      } catch (err) {
        console.error('Failed to load employees', err);
        setError('Could not load employee list.');
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  // ── Load records when employee changes ────────────────────────────────────
  useEffect(() => {
    if (!selectedEmployee) return;

    const fetchRecords = async () => {
      try {
        setLoadingRecords(true);
        setError(null);
        setPage(1);
        const data = await getAttendanceForEmployee(selectedEmployee.id);
        const sorted = [...data].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setRecords(sorted);
      } catch (err) {
        console.error('Failed to load attendance records', err);
        setError('Could not load attendance records for this employee.');
        setRecords([]);
      } finally {
        setLoadingRecords(false);
      }
    };

    fetchRecords();
  }, [selectedEmployee]);

  // ── Filtering + Pagination ────────────────────────────────────────────────
  const filteredEmployees = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.fullName?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.department?.name?.toLowerCase().includes(q)
    );
  }, [employees, search]);

  const totalPages = Math.ceil(records.length / ROWS_PER_PAGE);
  const pageRecords = records.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );

  // ── Stats for selected employee ───────────────────────────────────────────
  const stats = useMemo(() => {
    const presentDays = records.filter((r) => r.clockIn).length;
    const absentDays = records.filter((r) => !r.clockIn).length;
    let totalHrs = 0;
    records.forEach((r) => {
      if (r.clockIn && r.clockOut) {
        totalHrs +=
          (new Date(r.clockOut) - new Date(r.clockIn)) / (1000 * 60 * 60);
      }
    });
    return { presentDays, absentDays, totalHrs: totalHrs.toFixed(1) };
  }, [records]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* ── Left Panel: Employee picker (only for HR/Admin, managers see all by default) ── */}
      {isHrOrAdmin && (
        <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
          <div className="px-4 py-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-black uppercase tracking-wider">
              Select Employee
            </h2>
            <div className="mt-3 relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-black"
              />
              <input
                type="text"
                placeholder="Search by name or dept..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingEmployees ? (
              <div className="p-4 text-sm text-gray-400 animate-pulse">
                Loading...
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="p-4 text-sm text-gray-400">
                No employees found.
              </div>
            ) : (
              filteredEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-blue-50 transition-colors ${
                    selectedEmployee?.id === emp.id
                      ? 'bg-blue-50 border-l-4 border-l-blue-500'
                      : ''
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {emp.departmentName || 'No Department'} ·{' '}
                    {emp.jobTitle || emp.position || ''}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>
      )}

      {/* ── Right Panel: Attendance records ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-none bg-white border-b border-gray-200 px-8 py-5">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {isHrOrAdmin ? 'All Attendance Records' : 'Team Attendance Log'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedEmployee
              ? `Showing history for ${selectedEmployee.fullName}`
              : isHrOrAdmin
                ? 'Select an employee from the list'
                : 'Loading team members…'}
          </p>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-6">
          {/* Manager: Employee picker as dropdown (simpler than sidebar) */}
          {!isHrOrAdmin && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Member
              </label>
              {loadingEmployees ? (
                <div className="text-sm text-gray-400 animate-pulse">
                  Loading employees...
                </div>
              ) : (
                <select
                  value={selectedEmployee?.id || ''}
                  onChange={(e) => {
                    const emp = employees.find(
                      (em) => em.id === e.target.value
                    );
                    setSelectedEmployee(emp || null);
                  }}
                  className="w-72 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">— Select employee —</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.department?.name || 'N/A'})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-5">
              {error}
            </div>
          )}

          {/* Placeholder when no employee selected */}
          {!selectedEmployee && !loadingEmployees && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
              <Calendar size={40} className="opacity-50" />
              <p className="text-sm">
                Select an employee to view their attendance history.
              </p>
            </div>
          )}

          {/* Loading spinner */}
          {loadingRecords && (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm animate-pulse">
              Loading attendance records…
            </div>
          )}

          {/* Stats + Table */}
          {selectedEmployee && !loadingRecords && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <MiniStat
                  icon={<Calendar size={18} className="text-emerald-600" />}
                  label="Present Days"
                  value={stats.presentDays}
                  colorCls="bg-emerald-50"
                />
                <MiniStat
                  icon={<UserX size={18} className="text-rose-600" />}
                  label="Absent Days"
                  value={stats.absentDays}
                  colorCls="bg-rose-50"
                />
                <MiniStat
                  icon={<Activity size={18} className="text-blue-600" />}
                  label="Total Hours"
                  value={`${stats.totalHrs}h`}
                  colorCls="bg-blue-50"
                />
              </div>

              {/* Table */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Clock In
                      </th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Clock Out
                      </th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Hours
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pageRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-10 text-center text-sm text-gray-400"
                        >
                          No attendance records found for this employee.
                        </td>
                      </tr>
                    ) : (
                      pageRecords.map((record) => {
                        const badge = statusBadge(
                          record.clockIn,
                          record.clockOut
                        );
                        return (
                          <tr
                            key={record.id}
                            className="hover:bg-gray-50/60 transition-colors"
                          >
                            <td className="px-6 py-3.5 text-sm font-medium text-gray-800">
                              {new Date(record.date).toLocaleDateString(
                                'en-US',
                                {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                }
                              )}
                            </td>
                            <td className="px-6 py-3.5">
                              <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}
                              >
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-sm text-emerald-600 font-medium">
                              {formatTime(record.clockIn)}
                            </td>
                            <td className="px-6 py-3.5 text-sm text-orange-500 font-medium">
                              {formatTime(record.clockOut)}
                            </td>
                            <td className="px-6 py-3.5 text-sm text-gray-600 font-semibold">
                              {calcHours(record.clockIn, record.clockOut)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-gray-500">
                    Page {page} of {totalPages} · {records.length} records
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default TeamAttendanceLog;
