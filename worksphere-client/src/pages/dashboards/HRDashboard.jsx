import React, { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import StatCard from '../../components/common/StatCard';
import HiringSnapshotCard from '../../components/dashboard/HiringSnapshotCard';
import PayrollStatusBand from '../../components/dashboard/PayrollStatusBand';
import { getAllEmployees } from '../../api/employeeApi';
import { fetchAllJobOpenings } from '../../api/hiringApi';
import axiosInstance from '../../api/axiosInstance';
import {
  Users,
  Briefcase,
  AlertTriangle,
  CircleDollarSign,
} from 'lucide-react';
import PageSkeleton from '../../components/common/PageSkeleton';

export default function HRDashboard() {
  const [payrollThisMonth, setPayrollThisMonth] = useState(0);

  // Migration 4: All 3 HR KPI calls fire in parallel via useQueries
  const results = useQueries({
    queries: [
      { queryKey: ['employees'], queryFn: getAllEmployees },
      { queryKey: ['jobs'],      queryFn: () => fetchAllJobOpenings().then(r => r.data) },
      { queryKey: ['hrTickets'], queryFn: () => axiosInstance.get('/api/hr/tickets').then(r => r.data) },
    ],
  });

  const [employeesQ, jobsQ, ticketsQ] = results;
  const isLoading = results.some((r) => r.isLoading);

  const headcount = (employeesQ.data || []).length;
  const openJobs = (jobsQ.data || []).filter((j) => j.status === 'OPEN').length;
  const openGrievances = (ticketsQ.data || []).filter((g) => g.status !== 'RESOLVED').length;

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-900 w-full overflow-y-auto w-full">
      <main className="flex-1 p-8 w-full max-w-7xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          HR Operations
        </h1>

        {/* 1. TOP METRICS ROW (Exactly 4 KPI StatCards) */}
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
          <div className="lg:col-span-2 min-h-[400px]">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 h-full flex items-center justify-center text-gray-400">
              HR Event Queue / Actions Grid [Phase 3]
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
