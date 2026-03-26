import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyTasks } from '../../api/taskApi';
import { getMyBalances } from '../../api/leaveApi';
import { getAttendanceHistory } from '../../api/attendanceApi';
import ActiveTasksWidget from '../../components/dashboard/ActiveTasksWidget';
import TaskStatsWidget from '../../components/dashboard/TaskStatsWidget';
import ActionItemsWidget from '../../components/dashboard/ActionItemsWidget';
import StatCard from '../../components/common/StatCard';
import { useAuth } from '../../hooks/useAuth';
import { CheckSquare, CalendarRange, AlertCircle, Clock } from 'lucide-react';
import PageSkeleton from '../../components/common/PageSkeleton';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [monthAttendanceCount, setMonthAttendanceCount] = useState(0);

  const firstName = user?.firstName || 'User';

  // Migration 1: getMyTasks — shared cache with TaskBoard via queryKey ['myTasks']
  const { data: allTasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['myTasks'],
    queryFn: getMyTasks,
  });

  // Migration 2: getMyLeaveBalances
  const { data: balances, isLoading: isLoadingLeave } = useQuery({
    queryKey: ['leaveBalance'],
    queryFn: getMyBalances,
  });
  console.log('Leave Balances:', balances);

  const leaveBalance = balances?.annualLeave?.balance ?? 0;

  // Attendance still fetched locally (not part of migration spec)
  useEffect(() => {
    getAttendanceHistory()
      .then((attendance) => {
        if (Array.isArray(attendance)) {
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const count = attendance.filter((record) => {
            if (!record.date) return false;
            const d = new Date(record.date);
            return (
              d.getMonth() === currentMonth && d.getFullYear() === currentYear
            );
          }).length;
          setMonthAttendanceCount(count);
        }
      })
      .catch(() => {});
  }, []);

  const loading = isLoadingTasks || isLoadingLeave;

  // Compute Task stats client-side
  const todayStr = new Date().toISOString().split('T')[0];
  const tasksDueToday = allTasks.filter((t) => t.dueDate === todayStr).length;
  const pendingActionItems = allTasks.filter(
    (t) => t.status === 'IN_REVIEW'
  ).length;

  if (loading) return <PageSkeleton />;

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-900 font-sans w-full overflow-y-auto">
      {/* --- DASHBOARD HEADER --- */}
      <header className="flex-none bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Good morning, {firstName}! ☕
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here is what's happening in your workspace today.
        </p>
      </header>

      {/* --- DASHBOARD GRID --- */}
      <main className="flex-1 p-8 w-full max-w-7xl mx-auto space-y-6">
        {/* TOP METRICS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Tasks Due Today"
            value={tasksDueToday}
            icon={<CheckSquare className="w-6 h-6" />}
            colorClass="text-blue-600"
            bgColorClass="bg-blue-50/40"
          />
          <StatCard
            title="Leave Balance"
            value={leaveBalance}
            icon={<CalendarRange className="w-6 h-6" />}
            colorClass="text-emerald-600"
            bgColorClass="bg-emerald-50/40"
          />
          <StatCard
            title="Pending Actions"
            value={pendingActionItems}
            icon={<AlertCircle className="w-6 h-6" />}
            colorClass="text-amber-600"
            bgColorClass="bg-amber-50/40"
          />
          <StatCard
            title="Month Attendance"
            value={`${monthAttendanceCount}d`}
            icon={<Clock className="w-6 h-6" />}
            colorClass="text-purple-600"
            bgColorClass="bg-purple-50/40"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
          {/* LEFT COLUMN: ACTIVE TASKS */}
          <div className="lg:col-span-1 h-full">
            <ActiveTasksWidget tasks={allTasks} loading={loading} />
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 h-full flex flex-col gap-6">
            <TaskStatsWidget tasks={allTasks} />

            <div className="flex-1 min-h-[300px]">
              <ActionItemsWidget tasks={allTasks} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
