import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// --- Existing dashboard widgets ---
import ActiveTasksWidget from '../components/dashboard/ActiveTasksWidget';
import ActionItemsWidget from '../components/dashboard/ActionItemsWidget';
import TaskStatsWidget from '../components/dashboard/TaskStatsWidget';
import PayrollStatusBand from '../components/dashboard/PayrollStatusBand';
import HiringSnapshotCard from '../components/dashboard/HiringSnapshotCard';

// --- Common components ---
import StatCard from '../components/common/StatCard';
import { Skeleton } from '../components/ui/skeleton';

// --- API ---
import { getMyTasks, getTeamTasks } from '../api/taskApi';
import { getMyBalances, getPendingLeaveRequests } from '../api/leaveApi';
import { getAllEmployees, getMyTeam } from '../api/employeeApi';
import { getAttendanceHistory } from '../api/attendanceApi';

// ─────────────────────────────────────────────────────────────────────────────
// ROLE PRIORITY — mirrors the getHighestRole helper used in NavBar / PrivateRoute
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_PRIORITY = ['SUPER_ADMIN', 'HR', 'MANAGER', 'AUDITOR', 'EMPLOYEE'];

function getHighestRole(roles = []) {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return role;
  }
  return 'EMPLOYEE';
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED SKELETON ROWS
// ─────────────────────────────────────────────────────────────────────────────
const StatCardSkeleton = () => (
  <div className="p-5 rounded-xl border border-gray-100 bg-gray-50 shadow-sm flex flex-col gap-3 animate-pulse">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <Skeleton className="h-4 w-24 rounded" />
    </div>
    <Skeleton className="h-8 w-16 rounded mt-1" />
  </div>
);

const WidgetSkeleton = ({ className = '' }) => (
  <div
    className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm animate-pulse ${className}`}
  >
    <Skeleton className="h-5 w-1/3 mb-4 rounded" />
    <Skeleton className="h-4 w-full mb-2 rounded" />
    <Skeleton className="h-4 w-5/6 mb-2 rounded" />
    <Skeleton className="h-4 w-4/6 rounded" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SVG ICON HELPERS (inline — no extra dep)
// ─────────────────────────────────────────────────────────────────────────────
const Icons = {
  Tasks: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  ),
  Calendar: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  Clock: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  CheckCircle: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  Users: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  Alert: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  Briefcase: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
  Dollar: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  ChevronRight: (
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
        d="M9 5l7 7-7 7"
      />
    </svg>
  ),
  Flag: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
      />
    </svg>
  ),
  Settings: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// GREETING HELPER
// ─────────────────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK ACTION BUTTON
// ─────────────────────────────────────────────────────────────────────────────
const QuickAction = ({ label, to, icon, color = 'blue' }) => {
  const navigate = useNavigate();
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100',
    green:
      'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100',
    purple:
      'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100',
    gray: 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100',
    red: 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100',
  };
  return (
    <button
      onClick={() => navigate(to)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all active:scale-[0.97] ${colorMap[color] || colorMap.blue}`}
    >
      {icon}
      {label}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────────────────────
const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-1">
    <h2 className="text-base font-bold text-gray-800">{title}</h2>
    {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// EmployeeDashboard
// ─────────────────────────────────────────────────────────────────────────────
const EmployeeDashboard = ({ user }) => {
  const [tasks, setTasks] = useState([]);
  const [balances, setBalances] = useState([]);
  const [attendanceLog, setAttendanceLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [t, b, a] = await Promise.allSettled([
          getMyTasks(),
          getMyBalances(),
          getAttendanceHistory(),
        ]);
        if (t.status === 'fulfilled') setTasks(t.value ?? []);
        if (b.status === 'fulfilled') setBalances(b.value ?? []);
        if (a.status === 'fulfilled') setAttendanceLog(a.value ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── derived metrics ──────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];

  const tasksDueToday = tasks.filter(
    (t) => t.dueDate?.startsWith(today) && t.status !== 'COMPLETED'
  ).length;

  const annualBalance =
    balances.find(
      (b) =>
        b.leaveTypeName?.toLowerCase().includes('annual') ||
        b.leaveTypeName?.toLowerCase().includes('casual')
    )?.balance ?? '—';

  const actionItems = tasks.filter((t) => t.status === 'IN_REVIEW').length;

  // Attendance: how many present days this calendar month
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const presentDays = attendanceLog.filter(
    (l) => l.date?.startsWith(monthStr) && (l.clockIn || l.status === 'PRESENT')
  ).length;

  const firstName = user?.firstName || user?.username || 'there';

  return (
    <div className="flex flex-col gap-6">
      {/* ── Greeting ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's your work summary for{' '}
            {now.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickAction
            label="My Tasks"
            to="/tasks"
            icon={Icons.Tasks}
            color="blue"
          />
          <QuickAction
            label="Apply Leave"
            to="/leave"
            icon={Icons.Calendar}
            color="green"
          />
          <QuickAction
            label="Helpdesk"
            to="/helpdesk"
            icon={Icons.Alert}
            color="amber"
          />
        </div>
      </div>

      {/* ── Stat cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Due Today"
            value={tasksDueToday}
            icon={Icons.Clock}
            colorClass="text-orange-600"
            bgColorClass="bg-orange-50/40"
          />
          <StatCard
            title="Leave Balance"
            value={annualBalance}
            icon={Icons.Calendar}
            colorClass="text-teal-600"
            bgColorClass="bg-teal-50/40"
          />
          <StatCard
            title="Needs Review"
            value={actionItems}
            icon={Icons.CheckCircle}
            colorClass="text-purple-600"
            bgColorClass="bg-purple-50/40"
          />
          <StatCard
            title="Days Present (Month)"
            value={presentDays}
            icon={Icons.CheckCircle}
            colorClass="text-emerald-600"
            bgColorClass="bg-emerald-50/40"
          />
        </div>
      )}

      {/* ── Widgets ── */}
      {loading ? (
        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-5"
          style={{ minHeight: 360 }}
        >
          <WidgetSkeleton className="lg:col-span-1" />
          <WidgetSkeleton className="lg:col-span-2" />
        </div>
      ) : (
        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-5"
          style={{ minHeight: 360 }}
        >
          {/* Active tasks — left column */}
          <div className="lg:col-span-1" style={{ minHeight: 320 }}>
            <ActiveTasksWidget tasks={tasks} loading={loading} />
          </div>

          {/* Right column: Task stats + deadlines */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <TaskStatsWidget tasks={tasks} />
            <div style={{ flex: 1, minHeight: 200 }}>
              <ActionItemsWidget tasks={tasks} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ManagerDashboard
// ─────────────────────────────────────────────────────────────────────────────
const ManagerDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [teamTasks, setTeamTasks] = useState([]);
  const [pendingLeave, setPendingLeave] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [tt, pl, tm] = await Promise.allSettled([
          getTeamTasks(),
          getPendingLeaveRequests(),
          getMyTeam(),
        ]);
        if (tt.status === 'fulfilled') setTeamTasks(tt.value ?? []);
        if (pl.status === 'fulfilled') setPendingLeave(pl.value ?? []);
        if (tm.status === 'fulfilled') setTeamMembers(tm.value ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const teamSize = teamMembers.length;
  const pendingLeaveCount = pendingLeave.length;
  const inReviewCount = teamTasks.filter(
    (t) => t.status === 'IN_REVIEW'
  ).length;
  const inProgressCount = teamTasks.filter(
    (t) => t.status === 'IN_PROGRESS'
  ).length;

  const firstName = user?.firstName || user?.username || 'there';

  return (
    <div className="flex flex-col gap-6">
      {/* ── Greeting ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Team overview — manage your team's work and approvals
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickAction
            label="Roster"
            to="/roster"
            icon={Icons.Users}
            color="blue"
          />
          <QuickAction
            label="Leave Approvals"
            to="/approvals"
            icon={Icons.Calendar}
            color="green"
          />
          <QuickAction
            label="Team Appraisals"
            to="/team-appraisals"
            icon={Icons.CheckCircle}
            color="purple"
          />
        </div>
      </div>

      {/* ── Stat cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Team Size"
            value={teamSize}
            icon={Icons.Users}
            colorClass="text-blue-600"
            bgColorClass="bg-blue-50/40"
          />
          <StatCard
            title="Leave Pending"
            value={pendingLeaveCount}
            icon={Icons.Calendar}
            colorClass="text-amber-600"
            bgColorClass="bg-amber-50/40"
          />
          <StatCard
            title="Tasks In Review"
            value={inReviewCount}
            icon={Icons.CheckCircle}
            colorClass="text-orange-600"
            bgColorClass="bg-orange-50/40"
          />
          <StatCard
            title="In Progress"
            value={inProgressCount}
            icon={Icons.Tasks}
            colorClass="text-emerald-600"
            bgColorClass="bg-emerald-50/40"
          />
        </div>
      )}

      {/* ── Widgets ── */}
      {loading ? (
        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-5"
          style={{ minHeight: 360 }}
        >
          <WidgetSkeleton className="lg:col-span-2" />
          <WidgetSkeleton className="lg:col-span-1" />
        </div>
      ) : (
        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-5"
          style={{ minHeight: 360 }}
        >
          {/* Pending leave requests — left large */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Pending Leave Requests
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Needs your approval
                </p>
              </div>
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                {pendingLeaveCount} Pending
              </span>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              {pendingLeave.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-10 text-gray-400">
                  <span className="text-3xl mb-2">✅</span>
                  <p className="text-sm font-medium text-gray-700">
                    All clear!
                  </p>
                  <p className="text-xs mt-1">No pending leave requests.</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {pendingLeave.map((req) => (
                    <li
                      key={req.id}
                      onClick={() => navigate('/approvals')}
                      className="flex items-center justify-between p-3 rounded-lg border border-amber-100 bg-amber-50/30 hover:bg-amber-50 hover:border-amber-200 cursor-pointer transition-all group"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {req.employeeName ||
                            req.employeeFirstName ||
                            'Employee'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {req.leaveTypeName || req.type} · {req.startDate} →{' '}
                          {req.endDate} ·{' '}
                          <span className="font-medium text-gray-700">
                            {req.requestedDays} day
                            {req.requestedDays !== 1 ? 's' : ''}
                          </span>
                        </p>
                      </div>
                      <div className="text-amber-500 group-hover:text-amber-600 opacity-50 group-hover:opacity-100 transition-opacity">
                        {Icons.ChevronRight}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => navigate('/approvals')}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 hover:text-amber-600 hover:border-amber-300 transition-all"
              >
                Manage All Approvals {Icons.ChevronRight}
              </button>
            </div>
          </div>

          {/* Tasks needing review — right column */}
          <div className="lg:col-span-1" style={{ minHeight: 300 }}>
            <ActionItemsWidget tasks={teamTasks} />
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HRDashboard
// ─────────────────────────────────────────────────────────────────────────────
const HRDashboard = ({ user }) => {
  const [employees, setEmployees] = useState([]);
  const [payrollTotal, setPayrollTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [emp] = await Promise.allSettled([getAllEmployees()]);
        if (emp.status === 'fulfilled') setEmployees(emp.value ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const headcount = employees.length;
  const pendingOnboarding = employees.filter(
    (e) => e.status === 'PENDING'
  ).length;

  const firstName = user?.firstName || user?.username || 'there';

  return (
    <div className="flex flex-col gap-6">
      {/* ── Greeting ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Workforce overview — HR operations at a glance
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickAction
            label="Employees"
            to="/employee-list"
            icon={Icons.Users}
            color="blue"
          />
          <QuickAction
            label="Payroll"
            to="/hr/payroll"
            icon={Icons.Dollar}
            color="green"
          />
          <QuickAction
            label="Hiring"
            to="/hiring/jobs"
            icon={Icons.Briefcase}
            color="purple"
          />
        </div>
      </div>

      {/* ── Stat cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Headcount"
            value={headcount}
            icon={Icons.Users}
            colorClass="text-blue-600"
            bgColorClass="bg-blue-50/40"
          />
          <StatCard
            title="Pending Onboarding"
            value={pendingOnboarding}
            icon={Icons.Clock}
            colorClass="text-amber-600"
            bgColorClass="bg-amber-50/40"
          />
          <StatCard
            title="Net Pay (Month)"
            value={
              payrollTotal > 0 ? `$${(payrollTotal / 1000).toFixed(0)}k` : '—'
            }
            icon={Icons.Dollar}
            colorClass="text-emerald-600"
            bgColorClass="bg-emerald-50/40"
          />
          <StatCard
            title="Open Roles"
            value="—"
            icon={Icons.Briefcase}
            colorClass="text-indigo-600"
            bgColorClass="bg-indigo-50/40"
          />
        </div>
      )}

      {/* ── Payroll status band ── */}
      <PayrollStatusBand onPayrollDataLoaded={setPayrollTotal} />

      {/* ── Hiring + lower widgets ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <HiringSnapshotCard />

        {/* Pending onboarding list */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Pending Onboarding
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Employees awaiting activation
              </p>
            </div>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {pendingOnboarding}
            </span>
          </div>
          <div className="p-5 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : pendingOnboarding === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-gray-400">
                <span className="text-3xl mb-2">🎉</span>
                <p className="text-sm font-medium text-gray-700">
                  Everyone's onboarded!
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {employees
                  .filter((e) => e.status === 'PENDING')
                  .slice(0, 6)
                  .map((emp) => (
                    <li
                      key={emp.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {emp.jobTitle || emp.department || 'New Employee'}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                        PENDING
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SuperAdminDashboard
// ─────────────────────────────────────────────────────────────────────────────
const SuperAdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllEmployees()
      .then((data) => setEmployees(data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const headcount = employees.length;
  const pendingCount = employees.filter((e) => e.status === 'PENDING').length;
  const activeCount = employees.filter((e) => e.status === 'ACTIVE').length;

  const firstName = user?.firstName || user?.username || 'Admin';

  const quickLinks = [
    {
      label: 'Departments',
      to: '/departments',
      icon: Icons.Settings,
      color: 'gray',
    },
    {
      label: 'Job Positions',
      to: '/jobPosition',
      icon: Icons.Briefcase,
      color: 'blue',
    },
    {
      label: 'Role Management',
      to: '/role-management',
      icon: Icons.Flag,
      color: 'purple',
    },
    {
      label: 'Onboard Employee',
      to: '/register',
      icon: Icons.Users,
      color: 'green',
    },
    {
      label: 'Leave Policies',
      to: '/leave-policies',
      icon: Icons.Calendar,
      color: 'teal',
    },
    {
      label: 'Work Schedules',
      to: '/work-schedules',
      icon: Icons.Clock,
      color: 'amber',
    },
    { label: 'Permissions', to: '/roles', icon: Icons.Settings, color: 'red' },
    {
      label: 'Public Holidays',
      to: '/holidays',
      icon: Icons.Calendar,
      color: 'gray',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Greeting ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {firstName} ⚙️
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          System overview — org structure and configuration
        </p>
      </div>

      {/* ── Stat cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Employees"
            value={headcount}
            icon={Icons.Users}
            colorClass="text-blue-600"
            bgColorClass="bg-blue-50/40"
          />
          <StatCard
            title="Active"
            value={activeCount}
            icon={Icons.CheckCircle}
            colorClass="text-emerald-600"
            bgColorClass="bg-emerald-50/40"
          />
          <StatCard
            title="Pending Activation"
            value={pendingCount}
            icon={Icons.Clock}
            colorClass="text-amber-600"
            bgColorClass="bg-amber-50/40"
          />
          <StatCard
            title="System Status"
            value="OK"
            icon={Icons.Settings}
            colorClass="text-teal-600"
            bgColorClass="bg-teal-50/40"
          />
        </div>
      )}

      {/* ── Quick config panel ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <SectionHeader
          title="Quick Configuration"
          subtitle="Jump to any system config area"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {quickLinks.map((ql) => (
            <QuickAction
              key={ql.to}
              label={ql.label}
              to={ql.to}
              icon={ql.icon}
              color={ql.color}
            />
          ))}
        </div>
      </div>

      {/* ── Pending onboarding ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Pending Onboarding
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Employees in PENDING status awaiting activation
            </p>
          </div>
          <button
            onClick={() => navigate('/register')}
            className="text-xs font-semibold bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-all"
          >
            + Onboard New
          </button>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : pendingCount === 0 ? (
            <div className="flex items-center gap-3 py-4 text-gray-400">
              <span className="text-2xl">✅</span>
              <p className="text-sm text-gray-600">
                No employees pending activation.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {employees
                .filter((e) => e.status === 'PENDING')
                .slice(0, 5)
                .map((emp) => (
                  <li
                    key={emp.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-amber-200 hover:bg-amber-50/20 transition-all"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{emp.email}</p>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                      PENDING
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AuditorDashboard
// ─────────────────────────────────────────────────────────────────────────────
const AuditorDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auditors can see all tasks via /tasks/all-tasks endpoint
    import('../api/taskApi').then(({ getAllTasks }) => {
      getAllTasks()
        .then((data) => setTasks(data ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  const flaggedTasks = tasks.filter(
    (t) => t.flagged === true || t.auditFlagged === true
  );
  const evidenceTasks = tasks.filter(
    (t) => t.evidenceCount > 0 || t.hasEvidence
  );
  const totalTasks = tasks.length;

  const firstName = user?.firstName || user?.username || 'Auditor';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {firstName} 🔍
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Audit view — flagged tasks and evidence review queue
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Tasks"
            value={totalTasks}
            icon={Icons.Tasks}
            colorClass="text-blue-600"
            bgColorClass="bg-blue-50/40"
          />
          <StatCard
            title="Flagged for Audit"
            value={flaggedTasks.length}
            icon={Icons.Flag}
            colorClass="text-red-600"
            bgColorClass="bg-red-50/40"
          />
          <StatCard
            title="Evidence Pending"
            value={evidenceTasks.length}
            icon={Icons.CheckCircle}
            colorClass="text-amber-600"
            bgColorClass="bg-amber-50/40"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Flagged tasks feed */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Flagged Tasks
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Tasks marked for audit review
              </p>
            </div>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {flaggedTasks.length}
            </span>
          </div>
          <div
            className="p-5 flex-1 overflow-y-auto"
            style={{ maxHeight: 320 }}
          >
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : flaggedTasks.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-400">
                <span className="text-3xl mb-2">🏳️</span>
                <p className="text-sm text-gray-600">
                  No flagged tasks at the moment.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {flaggedTasks.map((t) => (
                  <li
                    key={t.id}
                    onClick={() => navigate('/tasks')}
                    className="flex items-center justify-between p-3 rounded-lg border border-red-100 bg-red-50/30 hover:bg-red-50 cursor-pointer transition-all group"
                  >
                    <div>
                      <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {t.taskCode}
                      </span>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {t.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t.assigneeName || t.assignedToName}
                      </p>
                    </div>
                    <div className="text-red-400 group-hover:text-red-600 opacity-50 group-hover:opacity-100 transition-opacity">
                      {Icons.ChevronRight}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={() => navigate('/tasks')}
              className="w-full text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 hover:text-red-600 hover:border-red-300 transition-all flex items-center justify-center gap-2"
            >
              Open Task Board {Icons.ChevronRight}
            </button>
          </div>
        </div>

        {/* Evidence review queue */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Evidence Review Queue
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Tasks with uploaded evidence
              </p>
            </div>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {evidenceTasks.length}
            </span>
          </div>
          <div
            className="p-5 flex-1 overflow-y-auto"
            style={{ maxHeight: 320 }}
          >
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : evidenceTasks.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-400">
                <span className="text-3xl mb-2">📭</span>
                <p className="text-sm text-gray-600">
                  No evidence pending review.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {evidenceTasks.map((t) => (
                  <li
                    key={t.id}
                    onClick={() => navigate('/tasks')}
                    className="flex items-center justify-between p-3 rounded-lg border border-amber-100 bg-amber-50/30 hover:bg-amber-50 cursor-pointer transition-all group"
                  >
                    <div>
                      <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {t.taskCode}
                      </span>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {t.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t.assigneeName || t.assignedToName}
                      </p>
                    </div>
                    <div className="text-amber-400 group-hover:text-amber-600 opacity-50 group-hover:opacity-100 transition-opacity">
                      {Icons.ChevronRight}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={() => navigate('/tasks')}
              className="w-full text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 hover:text-amber-600 hover:border-amber-300 transition-all flex items-center justify-center gap-2"
            >
              Go to Task Board {Icons.ChevronRight}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ROLE RESOLVER — main export
// ─────────────────────────────────────────────────────────────────────────────
const roleDashboardMap = {
  SUPER_ADMIN: SuperAdminDashboard,
  HR: HRDashboard,
  MANAGER: ManagerDashboard,
  AUDITOR: AuditorDashboard,
  EMPLOYEE: EmployeeDashboard,
};

const Dashboard = () => {
  const { user } = useAuth();

  const highestRole = getHighestRole(user?.roles ?? []);
  const RoleDashboard = roleDashboardMap[highestRole] ?? EmployeeDashboard;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <RoleDashboard user={user} />
    </div>
  );
};

export default Dashboard;
