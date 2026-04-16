import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { DragDropContext } from '@hello-pangea/dnd';
import {
  getMyTasks,
  updateTaskStatus,
  getTeamTasks,
  getAllTasks,
} from '../../api/taskApi';
import CreateTaskModal from './CreateTaskModal';
import TaskDetailsModal from './TaskDetailsModal';
import AlertMessage from '../../components/common/AlertMessage';
import KanbanColumn from './KanbanColumn';
import TaskFilterBar from './TaskFilterBar';

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

const TaskBoard = () => {
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const filters = {
    viewMode: searchParams.get('view') || 'MY_TASKS',
    showCancelled: searchParams.get('graveyard') === 'true',
    filterPriority: searchParams.get('priority') || 'ALL',
    filterAssignee: searchParams.get('assignee') || 'ALL',
    dateFrom: searchParams.get('from') || '',
    dateTo: searchParams.get('to') || '',
  };

  const setFilters = (newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.viewMode !== 'MY_TASKS')
      params.set('view', newFilters.viewMode);
    if (newFilters.showCancelled) params.set('graveyard', 'true');
    if (newFilters.filterPriority !== 'ALL')
      params.set('priority', newFilters.filterPriority);
    if (newFilters.filterAssignee !== 'ALL')
      params.set('assignee', newFilters.filterAssignee);
    if (newFilters.dateFrom) params.set('from', newFilters.dateFrom);
    if (newFilters.dateTo) params.set('to', newFilters.dateTo);
    setSearchParams(params);
  };

  const baseColumns = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'];
  const columns = filters.showCancelled
    ? [...baseColumns, 'CANCELLED']
    : baseColumns;

  const userRole = localStorage.getItem('role') || '';
  const normalizedRole = userRole.toUpperCase();

  const isGlobalAdmin = [
    'ROLE_SUPER_ADMIN',
    'SUPER_ADMIN',
    'ROLE_HR',
    'HR',
    'ROLE_AUDITOR',
    'AUDITOR',
  ].includes(normalizedRole);

  const isTeamManager = ['ROLE_MANAGER', 'MANAGER'].includes(normalizedRole);

  // ✅ Added role-specific checks
  const isHR = ['ROLE_HR', 'HR'].includes(normalizedRole);
  const isSuperAdmin = ['ROLE_SUPER_ADMIN', 'SUPER_ADMIN'].includes(
    normalizedRole
  );

  const hasOversightAccess = isGlobalAdmin || isTeamManager;

  // ✅ Updated API selection logic
  let taskQueryFn;
  if (filters.viewMode === 'TEAM_TASKS') {
    if (isHR || isSuperAdmin) {
      taskQueryFn = getAllTasks;
    } else if (isTeamManager) {
      taskQueryFn = getTeamTasks;
    } else {
      taskQueryFn = getMyTasks;
    }
  } else {
    taskQueryFn = getMyTasks;
  }

  // ✅ Updated query keys for caching correctness
  const taskQueryKey =
    taskQueryFn === getAllTasks
      ? ['allTasks']
      : taskQueryFn === getTeamTasks
        ? ['teamTasks']
        : ['myTasks'];

  const {
    data: fetchedTasks = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: taskQueryKey,
    queryFn: taskQueryFn,
  });

  const [optimisticTasks, setOptimisticTasks] = useState(null);
  const tasks2 = optimisticTasks ?? fetchedTasks;

  useState(() => {
    setOptimisticTasks(null);
  });

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId;
    const taskBeingMoved = tasks2.find((t) => t.id === draggableId);

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

    if (newStatus === 'COMPLETED' && !hasOversightAccess) {
      setError('Only Managers can mark a task as officially Completed.');
      return;
    }

    if (newStatus === 'IN_PROGRESS' && !hasOversightAccess) {
      const assigneeId =
        taskBeingMoved.assignedToId || taskBeingMoved.assigneeId;
      const activeWipCount = tasks2.filter(
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

    setError(null);
    setOptimisticTasks((prev) =>
      (prev ?? fetchedTasks).map((t) =>
        t.id === draggableId ? { ...t, status: newStatus } : t
      )
    );

    try {
      await updateTaskStatus(draggableId, newStatus);
    } catch (err) {
      let errorMessage = 'Action rejected by server.';
      if (err.response?.data) {
        errorMessage =
          typeof err.response.data === 'string'
            ? err.response.data
            : err.response.data.message ||
              err.response.data.error ||
              errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setOptimisticTasks(null);
      refetch();
    }
  };

  const uniqueAssignees = useMemo(() => {
    const assignees = tasks2
      .map((t) => t.assignedToName || t.assigneeName)
      .filter(Boolean);
    return [...new Set(assignees)].sort();
  }, [tasks2]);

  const filteredTasks = tasks2.filter((t) => {
    const matchesPriority =
      filters.filterPriority === 'ALL' || t.priority === filters.filterPriority;
    const taskAssignee = t.assignedToName || t.assigneeName;
    const matchesAssignee =
      filters.filterAssignee === 'ALL' ||
      taskAssignee === filters.filterAssignee;

    let matchesDateFrom = true;
    let matchesDateTo = true;
    if (filters.dateFrom && t.dueDate) {
      matchesDateFrom = new Date(t.dueDate) >= new Date(filters.dateFrom);
    }
    if (filters.dateTo && t.dueDate) {
      matchesDateTo = new Date(t.dueDate) <= new Date(filters.dateTo);
    }

    return (
      matchesPriority && matchesAssignee && matchesDateFrom && matchesDateTo
    );
  });

  const getTasksByStatus = (status) =>
    filteredTasks.filter((t) => t.status === status);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm font-medium text-gray-500 animate-pulse">
        Loading Workspace...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 font-sans w-full overflow-hidden">
      <header className="flex-none border-b border-gray-200 bg-white px-6 py-4 z-10">
        <div className="flex w-full items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              {filters.viewMode === 'MY_TASKS'
                ? 'My Tasks'
                : isGlobalAdmin
                  ? 'Organization Tasks'
                  : 'Team Tasks'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {filters.viewMode === 'MY_TASKS'
                ? 'Manage your personal active tasks'
                : isGlobalAdmin
                  ? 'Track task progress across the entire company'
                  : 'Track task progress across your department'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <TaskFilterBar
              filters={filters}
              onChange={setFilters}
              hasOversightAccess={hasOversightAccess}
              isGlobalAdmin={isGlobalAdmin}
              uniqueAssignees={uniqueAssignees}
            />

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95 ml-2"
            >
              <PlusIcon />
              <span>New Issue</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-auto bg-gray-50/50 p-6 flex flex-col w-full">
        <div className="flex-none">
          <AlertMessage error={error} onClose={() => setError(null)} />
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex-1 min-h-0 min-w-max mt-4">
            <div
              className="grid gap-6 min-h-full"
              style={{
                gridTemplateColumns: `repeat(${columns.length}, minmax(280px, 1fr))`,
              }}
            >
              {columns.map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  tasks={getTasksByStatus(status)}
                  onTaskClick={setSelectedTask}
                />
              ))}
            </div>
          </div>
        </DragDropContext>
      </main>

      {isModalOpen && (
        <CreateTaskModal
          onClose={() => setIsModalOpen(false)}
          onTaskCreated={() => {
            setOptimisticTasks(null);
            refetch();
          }}
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
