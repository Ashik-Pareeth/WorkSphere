import { useState, useEffect, useCallback, useMemo } from 'react';
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
const EyeIcon = () => (
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
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
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
  const [filterAssignee, setFilterAssignee] = useState('ALL');

  // NEW: Graveyard Toggle State
  const [showCancelled, setShowCancelled] = useState(false);

  // Dynamically build columns based on toggle
  const baseColumns = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'];
  const columns = showCancelled ? [...baseColumns, 'CANCELLED'] : baseColumns;

  const userRole = localStorage.getItem('role') || '';
  const normalizedRole = userRole.toUpperCase();
  const isGlobalAdmin = [
    'ROLE_ADMIN',
    'ADMIN',
    'ROLE_HR',
    'HR',
    'ROLE_AUDITOR',
    'AUDITOR',
  ].includes(normalizedRole);
  const isTeamManager = ['ROLE_MANAGER', 'MANAGER'].includes(normalizedRole);
  const hasOversightAccess = isGlobalAdmin || isTeamManager;

  const loadTasks = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setLoading(true);
          setError(null);
        }
        const data =
          viewMode === 'TEAM_TASKS' ? await getTeamTasks() : await getMyTasks();
        setTasks(data);
      } catch (err) {
        console.error('Load failed', err);
        if (!silent) setError(err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [viewMode]
  );

  useEffect(() => {
    loadTasks();
    setFilterAssignee('ALL');
  }, [loadTasks]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination || destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId;
    const taskBeingMoved = tasks.find((t) => t.id === draggableId);

    // --- RULE 1: Graveyard Lock (NEW) ---
    if (source.droppableId === 'CANCELLED') {
      setError('Cancelled tasks are archived and cannot be moved.');
      return;
    }
    if (newStatus === 'CANCELLED') {
      setError(
        'To cancel a task, click on it and use the red "Cancel Task" button inside the details panel.'
      );
      return;
    }

    // --- RULE 2: Only Managers/Admins can move to COMPLETED ---
    if (newStatus === 'COMPLETED' && !hasOversightAccess) {
      setError('Only Managers can mark a task as officially Completed.');
      return;
    }

    // --- RULE 3: Work-In-Progress (WIP) Limit of 3 ---
    if (newStatus === 'IN_PROGRESS' && !hasOversightAccess) {
      const assigneeId =
        taskBeingMoved.assignedToId || taskBeingMoved.assigneeId;
      const activeWipCount = tasks.filter(
        (t) =>
          t.status === 'IN_PROGRESS' &&
          (t.assignedToId === assigneeId || t.assigneeId === assigneeId)
      ).length;

      if (activeWipCount >= 3) {
        setError(
          'WIP Limit Reached: You already have 3 tasks in progress. Finish one first!'
        );
        return;
      }
    }

    // Optimistic UI update
    setError(null);
    setTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTaskStatus(draggableId, newStatus);
    } catch (err) {
      console.error('Full Backend Error:', err);

      let errorMessage = 'Action rejected by server.';
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      loadTasks(true);
    }
  };

  const uniqueAssignees = useMemo(() => {
    const assignees = tasks
      .map((t) => t.assignedToName || t.assigneeName)
      .filter(Boolean);
    return [...new Set(assignees)].sort();
  }, [tasks]);

  const filteredTasks = tasks.filter((t) => {
    const matchesPriority =
      filterPriority === 'ALL' || t.priority === filterPriority;
    const taskAssignee = t.assignedToName || t.assigneeName;
    const matchesAssignee =
      filterAssignee === 'ALL' || taskAssignee === filterAssignee;
    return matchesPriority && matchesAssignee;
  });

  const getTasksByStatus = (status) =>
    filteredTasks.filter((t) => t.status === status);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-sm font-medium text-gray-500 animate-pulse">
        Loading Workspace...
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 font-sans w-full overflow-hidden">
      {/* --- HEADER --- */}
      <header className="flex-none border-b border-gray-200 bg-white px-6 py-4 z-10">
        <div className="flex w-full items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              {viewMode === 'MY_TASKS'
                ? 'My Tasks'
                : isGlobalAdmin
                  ? 'Organization Tasks'
                  : 'Team Tasks'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {viewMode === 'MY_TASKS'
                ? 'Manage your personal active tasks'
                : isGlobalAdmin
                  ? 'Track task progress across the entire company'
                  : 'Track task progress across your department'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {hasOversightAccess && (
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
                  {isGlobalAdmin ? 'All Tasks' : 'Team View'}
                </button>
              </div>
            )}

            <div className="h-6 w-px bg-gray-200 mx-1"></div>

            {/* NEW: Graveyard Toggle Button */}
            <button
              onClick={() => setShowCancelled(!showCancelled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                showCancelled
                  ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <EyeIcon />
              <span>{showCancelled ? 'Hide Graveyard' : 'Show Cancelled'}</span>
            </button>

            {viewMode === 'TEAM_TASKS' && uniqueAssignees.length > 0 && (
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="text-xs font-medium bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 max-w-30 truncate"
              >
                <option value="ALL">All Employees</option>
                {uniqueAssignees.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-xs font-medium bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent Priority</option>
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
      <main className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-50/50 p-6 w-full">
        <div className="h-full w-full">
          <AlertMessage error={error} onClose={() => setError(null)} />

          <DragDropContext onDragEnd={handleDragEnd}>
            {/* Dynamically adjust grid columns based on toggle */}
            <div
              className={`grid gap-6 h-full min-w-250 ${showCancelled ? 'grid-cols-1 md:grid-cols-5' : 'grid-cols-1 md:grid-cols-4'}`}
            >
              {columns.map((status) => (
                <div key={status} className="flex flex-col h-full min-w-70">
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
                                : status === 'COMPLETED'
                                  ? 'bg-emerald-500'
                                  : 'bg-red-500' // CANCELLED Color
                        }`}
                      />
                      <span
                        className={`text-xs font-bold uppercase tracking-wide ${status === 'CANCELLED' ? 'text-red-600' : 'text-gray-600'}`}
                      >
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-200/50 px-2 py-0.5 rounded-full">
                      {getTasksByStatus(status).length}
                    </span>
                  </div>

                  <div
                    className={`flex-1 min-h-0 rounded-xl border p-2 ${status === 'CANCELLED' ? 'bg-red-50/30 border-red-100' : 'bg-gray-100/40 border-gray-200/60'}`}
                  >
                    <Droppable droppableId={status}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`h-full overflow-y-auto pr-1 custom-scrollbar ${
                            snapshot.isDraggingOver
                              ? status === 'CANCELLED'
                                ? 'bg-red-50/50'
                                : 'bg-blue-50/30'
                              : ''
                          }`}
                        >
                          {getTasksByStatus(status).map((task, index) => {
                            const isCancelled = task.status === 'CANCELLED';
                            return (
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
                                    className={`group relative mb-3 p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                                      isCancelled
                                        ? 'border-red-100 opacity-80 hover:opacity-100 hover:border-red-300'
                                        : 'border-gray-200 hover:border-blue-400'
                                    } ${
                                      snapshot.isDragging
                                        ? 'rotate-1 scale-105 ring-2 ring-blue-500/20 z-50'
                                        : ''
                                    }`}
                                    style={{ ...provided.draggableProps.style }}
                                  >
                                    {/* Top Row: Priority & ID */}
                                    <div className="flex justify-between items-start mb-2">
                                      <span
                                        className={`font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded ${isCancelled ? 'text-red-400 bg-red-50' : 'text-gray-500 bg-gray-100'}`}
                                      >
                                        {task.taskCode}
                                      </span>
                                      <span
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                          isCancelled
                                            ? 'bg-gray-50 text-gray-400 border-gray-200' // Subdue priority if cancelled
                                            : task.priority === 'URGENT'
                                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                                              : task.priority === 'HIGH'
                                                ? 'bg-red-50 text-red-600 border-red-100'
                                                : task.priority === 'MEDIUM'
                                                  ? 'bg-amber-50 text-amber-600 border-amber-100'
                                                  : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        }`}
                                      >
                                        {task.priority}
                                      </span>
                                    </div>

                                    {/* Title - Strikethrough if cancelled */}
                                    <h4
                                      className={`text-sm font-semibold leading-snug mb-3 ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                                    >
                                      {task.title}
                                    </h4>

                                    {/* Assigner & Assignee Details */}
                                    <div
                                      className={`flex flex-col gap-2 mb-3 p-2 rounded-lg border ${isCancelled ? 'bg-white border-red-50' : 'bg-gray-50/50 border-gray-100'}`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <img
                                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignedToName || task.assigneeName || 'U')}&background=${isCancelled ? 'fee2e2' : 'eff6ff'}&color=${isCancelled ? 'ef4444' : '2563eb'}&size=20`}
                                          alt="Assignee"
                                          className={`w-5 h-5 rounded-full shadow-sm ${isCancelled ? 'grayscale' : ''}`}
                                        />
                                        <div className="flex flex-col">
                                          <span className="text-[9px] text-gray-400 font-semibold leading-none uppercase tracking-wider">
                                            {isCancelled
                                              ? 'Was Doing'
                                              : 'Doing'}
                                          </span>
                                          <span
                                            className={`text-[11px] font-medium leading-tight truncate max-w-30 ${isCancelled ? 'text-gray-500' : 'text-gray-700'}`}
                                          >
                                            {task.assignedToName ||
                                              task.assigneeName ||
                                              'Unassigned'}
                                          </span>
                                        </div>
                                      </div>

                                      {task.assignerName && (
                                        <div className="flex items-center gap-2">
                                          <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignerName)}&background=f8fafc&color=64748b&size=20`}
                                            alt="Assigner"
                                            className="w-5 h-5 rounded-full shadow-sm"
                                          />
                                          <div className="flex flex-col">
                                            <span className="text-[9px] text-gray-400 font-semibold leading-none uppercase tracking-wider">
                                              Given By
                                            </span>
                                            <span
                                              className={`text-[11px] font-medium leading-tight truncate max-w-30 ${isCancelled ? 'text-gray-500' : 'text-gray-700'}`}
                                            >
                                              {task.assignerName}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Bottom Row: Date */}
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                                        <ClockIcon />
                                        <span
                                          className={
                                            isCancelled ? 'line-through' : ''
                                          }
                                        >
                                          {task.dueDate
                                            ? new Date(
                                                task.dueDate
                                              ).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                              })
                                            : 'No Due Date'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
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
