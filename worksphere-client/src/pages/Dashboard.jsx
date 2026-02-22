import { useState, useEffect } from 'react';
import { getMyTasks } from '../api/taskApi';
import ActiveTasksWidget from '../components/dashboard/ActiveTasksWidget';
import TaskStatsWidget from '../components/dashboard/TaskStatsWidget';
import ActionItemsWidget from '../components/dashboard/ActionItemsWidget';
import AttendanceTracker from '../components/dashboard/AttendanceTracker';

const Dashboard = () => {
  // We store ALL tasks here now
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // We will pull the real name from the AuthContext or backend later
  const firstName = 'there';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // ONE API call to rule them all
        const tasks = await getMyTasks();
        setAllTasks(tasks);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans w-full overflow-y-auto">
      {/* --- DASHBOARD HEADER --- */}
      <header className="flex-none bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Good morning, {firstName}! ☕
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here is what's happening in your workspace today.
        </p>
        <div>
          <AttendanceTracker />
        </div>
      </header>

      {/* --- DASHBOARD GRID --- */}
      <main className="flex-1 p-8 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-125">
          {/* LEFT COLUMN: ACTIVE TASKS */}
          <div className="lg:col-span-1 h-150">
            <ActiveTasksWidget tasks={allTasks} loading={loading} />
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 h-150 flex flex-col gap-6">
            {/* TOP RIGHT: QUICK STATS */}
            <div className="h-30">
              <TaskStatsWidget tasks={allTasks} />
            </div>

            {/* BOTTOM RIGHT: ACTION ITEMS WIDGET */}
            <div className="flex-1 min-h-0">
              <ActionItemsWidget tasks={allTasks} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
