import React, { useState, useEffect } from 'react';
import StatCard from '../../components/common/StatCard';
import { getMyTasks } from '../../api/taskApi';
import FlaggedTasksFeed from '../../features/tasks/FlaggedTasksFeed';
import { CheckSquare, AlertOctagon, ShieldAlert, Activity } from 'lucide-react';

export default function AuditorDashboard() {
  const [totalTasks, setTotalTasks] = useState(0);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAuditStats = async () => {
      setLoading(true);
      try {
        const tasks = await getMyTasks();
        if (isMounted) {
          const taskList = Array.isArray(tasks) ? tasks : [];
          setTotalTasks(taskList.length);
          setFlaggedCount(taskList.filter(t => t.isFlagged === true).length);
          setReviewCount(taskList.filter(t => t.status === 'IN_REVIEW').length);
        }
      } catch (error) {
        console.error("Failed to load audit tasks", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAuditStats();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-900 w-full overflow-y-auto w-full">
      <main className="flex-1 p-8 w-full max-w-7xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-rose-600" />
          Task Auditor Dashboard
        </h1>

        {/* 1. AUDIT STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total System Tasks"
            value={loading ? '--' : totalTasks}
            icon={<CheckSquare className="w-6 h-6" />}
            colorClass="text-blue-600"
            bgColorClass="bg-blue-50/40"
          />
          <StatCard
            title="Flagged Actions"
            value={loading ? '--' : flaggedCount}
            icon={<AlertOctagon className="w-6 h-6" />}
            colorClass="text-rose-600"
            bgColorClass="bg-rose-50/40"
          />
          <StatCard
            title="Pending Review"
            value={loading ? '--' : reviewCount}
            icon={<Activity className="w-6 h-6" />}
            colorClass="text-amber-600"
            bgColorClass="bg-amber-50/40"
          />
        </div>

        {/* 2. FLAGGED TASKS FEED */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2">
              <FlaggedTasksFeed />
           </div>
           
           <div className="lg:col-span-1">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 mt-2">
                 <Activity size={20} className="text-emerald-500" />
                 Audit Log Activity
              </h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 h-64 flex flex-col items-center justify-center text-center text-gray-400 text-sm">
                 Recent system audit events will stream here in Phase 3.
              </div>
           </div>
        </div>

      </main>
    </div>
  );
}
