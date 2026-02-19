import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getMyTasks, updateTaskStatus, getTeamTasks } from '../../api/taskApi';
import CreateTaskModal from './CreateTaskModal';
import TaskDetailsModal from './TaskDetailsModal';
import AlertMessage from '../../components/common/AlertMessage';

// Simple Icons
const PlusIcon = () => (
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
      d="M12 4v16m8-8H4"
    />
  </svg>
);
const ClockIcon = () => (
  <svg
    className="w-3.5 h-3.5"
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
);
const UserIcon = () => (
  <svg
    className="w-3.5 h-3.5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const TaskBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [viewMode, setViewMode] = useState('MY_TASKS');
  const [filterPriority, setFilterPriority] = useState('ALL');

  const columns = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'];
  const userRole = localStorage.getItem('role') || '';
  const isManager = ['ROLE_MANAGER', 'MANAGER', 'ROLE_ADMIN', 'ADMIN'].includes(
    userRole.toUpperCase()
  );

  const loadTasks = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data =
        viewMode === 'TEAM_TASKS' ? await getTeamTasks() : await getMyTasks();
      setTasks(data);
    } catch (err) {
      console.error('Load failed', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId;
    setError(null);

    setTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTaskStatus(draggableId, newStatus);
    } catch (err) {
      setError(err);
      loadTasks(true);
    }
  };

  const filteredTasks = tasks.filter(
    (t) => filterPriority === 'ALL' || t.priority === filterPriority
  );
  const getTasksByStatus = (status) =>
    filteredTasks.filter((t) => t.status === status);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-sm font-medium text-gray-500 animate-pulse">
        Loading Workspace...
      </div>
    );

  return (
    // FIX 1: "w-full" instead of "max-w" to fill the screen
    <div className="flex flex-col h-screen bg-white text-gray-900 font-sans w-full overflow-hidden">
      {/* --- HEADER --- */}
      <header className="flex-none border-b border-gray-200 bg-white px-6 py-4 z-10">
        <div className="flex w-full items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              {viewMode === 'MY_TASKS' ? 'My Tasks' : 'Team Oversight'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {viewMode === 'MY_TASKS'
                ? 'Manage your personal active tasks'
                : 'Track project progress across the team'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isManager && (
              <div className="flex items-center p-1 bg-gray-100 rounded-lg border border-gray-200">
                <button
                  onClick={() => setViewMode('MY_TASKS')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    viewMode === 'MY_TASKS'
                      ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  My Tasks
                </button>
                <button
                  onClick={() => setViewMode('TEAM_TASKS')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    viewMode === 'TEAM_TASKS'
                      ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Team View
                </button>
              </div>
            )}

            <div className="h-6 w-px bg-gray-200 mx-1"></div>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-xs font-medium bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <PlusIcon />
              <span>New Issue</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- BOARD AREA --- */}
      <main className="flex-1 overflow-hidden bg-gray-50/50 p-6 w-full">
        {/* FIX 2: Added 'h-full' and removed max-w to ensure full stretch */}
        <div className="h-full w-full">
          <AlertMessage error={error} onClose={() => setError(null)} />

          <DragDropContext onDragEnd={handleDragEnd}>
            {/* GRID: Now spans full width with equal columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full min-w-250">
              {columns.map((status) => (
                <div key={status} className="flex flex-col h-full min-w-0">
                  {/* COLUMN HEADER */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          status === 'TODO'
                            ? 'bg-slate-400'
                            : status === 'IN_PROGRESS'
                              ? 'bg-blue-500'
                              : status === 'IN_REVIEW'
                                ? 'bg-orange-400'
                                : 'bg-emerald-500'
                        }`}
                      />
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-200/50 px-2 py-0.5 rounded-full">
                      {getTasksByStatus(status).length}
                    </span>
                  </div>

                  {/* DROP ZONE (Scrollable Lane) */}
                  <div className="flex-1 min-h-0 bg-gray-100/40 rounded-xl border border-gray-200/60 p-2">
                    <Droppable droppableId={status}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`h-full overflow-y-auto pr-1 custom-scrollbar ${
                            snapshot.isDraggingOver ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          {getTasksByStatus(status).map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => setSelectedTask(task)}
                                  className={`group relative mb-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                                    snapshot.isDragging
                                      ? 'rotate-1 scale-105 ring-2 ring-blue-500/20 z-50'
                                      : ''
                                  }`}
                                  style={{ ...provided.draggableProps.style }}
                                >
                                  {/* Top Row: Priority & ID */}
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-mono text-[10px] font-medium text-gray-400">
                                      {task.taskCode}
                                    </span>
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                        task.priority === 'HIGH'
                                          ? 'bg-red-50 text-red-600 border-red-100'
                                          : task.priority === 'MEDIUM'
                                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                      }`}
                                    >
                                      {task.priority}
                                    </span>
                                  </div>

                                  <h4 className="text-sm font-medium text-gray-900 leading-snug mb-3">
                                    {task.title}
                                  </h4>

                                  {/* Bottom Row: Date & Avatar */}
                                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                                      <ClockIcon />
                                      <span>
                                        {new Date(
                                          task.dueDate
                                        ).toLocaleDateString(undefined, {
                                          month: 'short',
                                          day: 'numeric',
                                        })}
                                      </span>
                                    </div>

                                    {/* FIX 3: PROFESSIONAL GENERATED AVATAR */}
                                    {task.assignerName && (
                                      <div className="flex items-center gap-2 group/avatar">
                                        <span className="text-[10px] text-gray-400 hidden group-hover/avatar:block transition-all">
                                          {task.assignerName}
                                        </span>
                                        <img
                                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignerName)}&background=random&color=fff&size=24`}
                                          alt={task.assignerName}
                                          className="w-6 h-6 rounded-full border border-gray-100 shadow-sm"
                                          title={`Assigned by ${task.assignerName}`}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>
      </main>

      {/* Modals */}
      {isModalOpen && (
        <CreateTaskModal
          onClose={() => setIsModalOpen(false)}
          onTaskCreated={() => loadTasks(false)}
        />
      )}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default TaskBoard;
