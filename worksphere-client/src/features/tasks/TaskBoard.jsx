import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getMyTasks, updateTaskStatus } from '../../api/taskApi';
import CreateTaskModal from './CreateTaskModal';
import TaskDetailsModal from './TaskDetailsModal';
import './TaskBoard.css';

const TaskBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [filterPriority, setFilterPriority] = useState('ALL');

  const columns = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'];

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await getMyTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  };

  // --- THE MAGIC: Handle Drag & Drop ---
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // 1. If dropped outside a valid column, do nothing
    if (!destination) return;

    // 2. If dropped in the exact same column, do nothing
    if (destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId;

    // 3. Optimistic UI Update (move card instantly for smooth UX)
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === draggableId ? { ...t, status: newStatus } : t
      )
    );

    // 4. Call Backend to save the new status
    try {
      await updateTaskStatus(draggableId, newStatus);
    } catch (error) {
      console.error('Failed to update status', error);
      loadTasks(); // If backend fails, reload original data to undo the visual move
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterPriority !== 'ALL' && task.priority !== filterPriority)
      return false;
    return true;
  });

  const getTasksByStatus = (status) => {
    return filteredTasks.filter((task) => task.status === status);
  };

  if (loading)
    return <div className="p-8 text-center">Loading your workspace...</div>;

  return (
    <div className="task-board-container">
      <div className="header-actions">
        <div>
          <h2>My Workspace</h2>
          <p className="text-gray-500 text-sm">Manage your assignments</p>
        </div>

        <div className="filters-bar" style={{ display: 'flex', gap: '10px' }}>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            + New Task
          </button>
        </div>
      </div>

      {/* --- DRAG CONTEXT WRAPPER --- */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="task-board">
          {columns.map((status) => (
            <div key={status} className="task-column">
              <div className="column-header">
                <span className="column-title">{status.replace('_', ' ')}</span>
                <span className="task-count">
                  {getTasksByStatus(status).length}
                </span>
              </div>

              {/* --- DROPPABLE AREA (The Column) --- */}
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    className="task-list"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      minHeight: '200px', // Ensures empty columns can still accept drops
                      backgroundColor: snapshot.isDraggingOver
                        ? '#f3f4f6'
                        : 'transparent',
                      transition: 'background-color 0.2s ease',
                      borderRadius: '8px',
                      padding: '4px',
                    }}
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
                            className={`task-card priority-${task.priority}`}
                            onClick={() => setSelectedTask(task)}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.8 : 1,
                              boxShadow: snapshot.isDragging
                                ? '0 10px 20px rgba(0,0,0,0.15)'
                                : '0 1px 3px rgba(0,0,0,0.1)',
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="task-code">{task.taskCode}</div>
                              <select
                                onClick={(e) => e.stopPropagation()}
                                onChange={async (e) => {
                                  const newStatus = e.target.value;
                                  if (newStatus) {
                                    // 1. Move it instantly in the UI
                                    setTasks((prev) =>
                                      prev.map((t) =>
                                        t.id === task.id
                                          ? { ...t, status: newStatus }
                                          : t
                                      )
                                    );
                                    // 2. Update the backend
                                    try {
                                      await updateTaskStatus(
                                        task.id,
                                        newStatus
                                      );
                                    } catch (err) {
                                      console.error(
                                        'Failed to update status via dropdown:',
                                        err
                                      );
                                      loadTasks();
                                    }
                                    e.target.value = '';
                                  }
                                }}
                                className="task-status-select"
                                title="Change status"
                              >
                                <option value="">⋮</option>
                                {columns.map((col) => (
                                  <option key={col} value={col}>
                                    {col.replace('_', ' ')}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="task-title">{task.title}</div>

                            <div className="task-meta">
                              <span>
                                Due:{' '}
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                              {task.assignerName && (
                                <span>By: {task.assignerName}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder} {/* Required by the library */}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {isModalOpen && (
        <CreateTaskModal
          onClose={() => setIsModalOpen(false)}
          onTaskCreated={loadTasks}
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
