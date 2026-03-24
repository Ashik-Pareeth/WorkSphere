import React, { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import HiringSnapshotCard from '../../components/dashboard/HiringSnapshotCard';
import PayrollStatusBand from '../../components/dashboard/PayrollStatusBand';
import { getAllEmployees } from '../../api/employeeApi';
import { fetchAllJobOpenings } from '../../api/hiringApi';
import { getPendingLeaveRequests } from '../../api/leaveApi';
import axiosInstance from '../../api/axiosInstance';
import {
  Users,
  Briefcase,
  AlertTriangle,
  CircleDollarSign,
  CalendarClock,
  Ticket,
  UserMinus,
  ChevronRight,
} from 'lucide-react';
import PageSkeleton from '../../components/common/PageSkeleton';

const ActionRow = ({ icon, label, count, route, color, navigate }) => (
  <button
    onClick={() => navigate(route)}
    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors group text-left"
  >
    <div className={`p-2 rounded-lg ${color} shrink-0`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-800">{label}</p>
    </div>
    <span
      className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${
        count > 0 ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-400'
      }`}
    >
      {count}
    </span>
    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
  </button>
);

export default function HRDashboard() {
  const [payrollThisMonth, setPayrollThisMonth] = useState(0);
  const navigate = useNavigate();

  const results = useQueries({
    queries: [
      { queryKey: ['employees'], queryFn: getAllEmployees },
      {
        queryKey: ['jobs'],
        queryFn: () => fetchAllJobOpenings().then((r) => r.data),
      },
      {
        queryKey: ['hrTickets'],
        queryFn: () => axiosInstance.get('/api/hr/tickets').then((r) => r.data),
      },
      {
        queryKey: ['offboarding'],
        queryFn: () =>
          axiosInstance.get('/api/hr/offboarding').then((r) => r.data),
      },
    ],
  });

  const { data: pendingLeaves = [], isLoading: leavesLoading } = useQuery({
    queryKey: ['pendingLeaveRequests'],
    queryFn: getPendingLeaveRequests,
  });

  const [employeesQ, jobsQ, ticketsQ, offboardingQ] = results;
  const isLoading = results.some((r) => r.isLoading);

  const headcount = (employeesQ.data || []).length;
  // fetchAllJobOpenings returns List<JobOpeningStatsDTO> — job data is nested under .jobOpening
  const openJobs = (jobsQ.data || []).filter(
    (j) => j.jobOpening?.status === 'OPEN'
  ).length;
  // GrievanceStatus enum: OPEN, IN_PROGRESS, PENDING_INFO, RESOLVED, CLOSED
  const openGrievances = (ticketsQ.data || []).filter(
    (g) => g.status !== 'RESOLVED' && g.status !== 'CLOSED'
  ).length;
  // OffboardingStatus: INITIATED, IN_PROGRESS, PENDING_ASSET_RETURN, COMPLETED
  const activeOffboarding = (offboardingQ.data || []).filter(
    (o) => o.status !== 'COMPLETED'
  ).length;

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-900 w-full overflow-y-auto">
      <main className="flex-1 p-8 w-full max-w-7xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          HR Operations
        </h1>

        {/* 1. TOP METRICS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Headcount"
            value={headcount}
            icon={<Users className="w-6 h-6" />}
            colorClass="text-blue-600"
            bgColorClass="bg-blue-50/40"
          />
          <StatCard
            title="Active Job Openings"
            value={openJobs}
            icon={<Briefcase className="w-6 h-6" />}
            colorClass="text-indigo-600"
            bgColorClass="bg-indigo-50/40"
          />
          <StatCard
            title="Open Grievances"
            value={openGrievances}
            icon={<AlertTriangle className="w-6 h-6" />}
            colorClass="text-rose-600"
            bgColorClass="bg-rose-50/40"
          />
          <StatCard
            title="Payroll This Month"
            value={
              payrollThisMonth > 0
                ? `$${(payrollThisMonth / 1000).toFixed(1)}k`
                : '--'
            }
            icon={<CircleDollarSign className="w-6 h-6" />}
            colorClass="text-emerald-600"
            bgColorClass="bg-emerald-50/40"
          />
        </div>

        {/* 2. PAYROLL STATUS BAND */}
        <div className="w-full">
          <PayrollStatusBand
            onPayrollDataLoaded={(val) => setPayrollThisMonth(val)}
          />
        </div>

        {/* 3. WIDGET GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 min-h-[400px]">
            <HiringSnapshotCard />
          </div>

          {/* HR Action Queue — replaced Phase 3 placeholder */}
          <div className="lg:col-span-2 min-h-[400px]">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-800 tracking-tight">
                  Pending Actions
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Items requiring your attention
                </p>
              </div>
              <div className="flex-1 p-3 flex flex-col gap-1">
                <ActionRow
                  navigate={navigate}
                  icon={<CalendarClock className="w-4 h-4 text-amber-600" />}
                  label="Leave Requests Pending"
                  count={leavesLoading ? '…' : pendingLeaves.length}
                  route="/approvals"
                  color="bg-amber-50"
                />
                <ActionRow
                  navigate={navigate}
                  icon={<Ticket className="w-4 h-4 text-rose-600" />}
                  label="Open Grievance Tickets"
                  count={openGrievances}
                  route="/hr/helpdesk"
                  color="bg-rose-50"
                />
                <ActionRow
                  navigate={navigate}
                  icon={<Briefcase className="w-4 h-4 text-indigo-600" />}
                  label="Active Job Openings"
                  count={openJobs}
                  route="/hiring/jobs"
                  color="bg-indigo-50"
                />
                <ActionRow
                  navigate={navigate}
                  icon={<UserMinus className="w-4 h-4 text-gray-600" />}
                  label="Offboarding In Progress"
                  count={activeOffboarding}
                  route="/hr/offboarding"
                  color="bg-gray-100"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
