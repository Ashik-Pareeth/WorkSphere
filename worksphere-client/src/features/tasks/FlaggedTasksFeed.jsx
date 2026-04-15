import React, { useState, useEffect } from 'react';
import { getFlaggedTasks } from '../../api/taskApi';
import TaskDetailsModal from './TaskDetailsModal';
import { ShieldAlert, Monitor, Clock } from 'lucide-react';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const diff = Date.now() - new Date(dateString).getTime();
  if (diff < 60000) return 'Just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

export default function FlaggedTasksFeed() {
  const [flaggedTasks, setFlaggedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    loadFlaggedTasks();
  }, []);

  const loadFlaggedTasks = async () => {
    try {
      // Call the dedicated system-wide flagged-tasks endpoint (Auditor + SUPER_ADMIN)
      const flagged = await getFlaggedTasks();
      // Backend already sorts by flaggedAt DESC — no client-side sort needed
      setFlaggedTasks(Array.isArray(flagged) ? flagged : []);
    } catch (err) {
      console.error('Failed to load flagged tasks', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading flagged feed...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-red-100 bg-red-50/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-900">Escalated Audit Feed</h2>
        </div>
        <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">{flaggedTasks.length} Active</span>
      </div>
      
      {flaggedTasks.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <Monitor className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-sm font-medium text-gray-900">All clear</h3>
          <p className="text-sm text-gray-500 mt-1">No tasks are currently flagged for your review.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {flaggedTasks.map((task) => (
            <div 
              key={task.id} 
              onClick={() => setSelectedTask(task)}
              className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 text-sm">{task.title}</span>
                  <span className="text-xs font-mono text-gray-400">{task.taskCode}</span>
                </div>
                {task.flagReason && (
                   <p className="text-sm text-red-600 font-medium line-clamp-1 border-l-2 border-red-400 pl-2">
                     "{task.flagReason}"
                   </p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                  <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-red-500"/> Flagged by: {task.flaggedByName || 'Auditor'}</span>
                  {task.flaggedAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {formatRelativeTime(task.flaggedAt)}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTask && (
        <TaskDetailsModal
          isOpen={true}
          onClose={() => {
            setSelectedTask(null);
            loadFlaggedTasks(); // Refresh if state changed
          }}
          task={selectedTask}
        />
      )}
    </div>
  );
}
