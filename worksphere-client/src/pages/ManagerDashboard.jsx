import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StatCard from '../components/common/StatCard';
import { Skeleton } from '../components/ui/skeleton';
import RosterPage from './RosterPage';

import {
  getPendingLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
} from '../api/leaveApi';

import {
  Users,
  CalendarOff,
  ClipboardList,
  CheckCircle,
  XCircle,
  TrendingUp,
} from 'lucide-react';

// ─── Leave Approval Card ─────────────────────────────────────────────────────

const LeaveApprovalsWidget = () => {
  const queryClient = useQueryClient();
  const [actioningId, setActioningId] = React.useState(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['pendingLeaveRequests'],
    queryFn: getPendingLeaveRequests,
  });

  const approveMutation = useMutation({
    mutationFn: (id) => approveLeaveRequest(id, 'Approved from dashboard'),
    onMutate: (id) => setActioningId(id),
    onSettled: () => {
      setActioningId(null);
      queryClient.invalidateQueries({ queryKey: ['pendingLeaveRequests'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => rejectLeaveRequest(id, 'Rejected from dashboard'),
    onMutate: (id) => setActioningId(id),
    onSettled: () => {
      setActioningId(null);
      queryClient.invalidateQueries({ queryKey: ['pendingLeaveRequests'] });
    },
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800 tracking-tight">
          Leave Approvals
        </h2>
        {requests.length > 0 && (
          <span className="text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
            {requests.length} pending
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {isLoading ? (
          <div className="p-4 flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <CheckCircle className="w-8 h-8 mb-2 text-green-400" />
            <p className="text-sm font-medium">All caught up</p>
          </div>
        ) : (
          requests.map((req) => {
            const name = req.employee
              ? `${req.employee.firstName} ${req.employee.lastName}`
              : 'Unknown';

            const isActioning = actioningId === req.id;

            return (
              <div key={req.id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {name}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => approveMutation.mutate(req.id)}
                    disabled={isActioning}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-md"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => rejectMutation.mutate(req.id)}
                    disabled={isActioning}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ─── Appraisals Placeholder ───────────────────────────────────────────────────

const AppraisalsWidget = () => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full">
    <div className="px-5 py-4 border-b border-gray-100">
      <h2 className="text-sm font-semibold text-gray-800 tracking-tight">
        Team Appraisals
      </h2>
    </div>
    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
      <TrendingUp className="w-8 h-8 text-gray-300" />
      <p className="text-sm mt-2">Appraisals unavailable</p>
    </div>
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const ManagerDashboard = () => {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-6 font-sans">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* ── Stat Cards (placeholder for now) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Present Today" value="--" icon={<Users />} />
        <StatCard title="On Leave" value="--" icon={<CalendarOff />} />
        <StatCard title="Team Size" value="--" icon={<ClipboardList />} />
      </div>

      {/* ── Roster Section ── */}
      <RosterPage />

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaveApprovalsWidget />
        <AppraisalsWidget />
      </div>
    </div>
  );
};

export default ManagerDashboard;
