import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

export default function KanbanColumn({ status, tasks, onTaskClick }) {
  const isCancelled = status === 'CANCELLED';

  const dotColors = {
    TODO: 'bg-slate-400',
    IN_PROGRESS: 'bg-blue-500',
    IN_REVIEW: 'bg-orange-400',
    COMPLETED: 'bg-emerald-500',
    CANCELLED: 'bg-red-500',
  };

  return (
    <div className="flex flex-col h-full min-w-[280px]">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${dotColors[status] || 'bg-gray-400'}`}
          />
          <span
            className={`text-xs font-bold uppercase tracking-wide ${isCancelled ? 'text-red-600' : 'text-gray-600'}`}
          >
            {status.replace('_', ' ')}
          </span>
        </div>
        <span className="text-[10px] font-bold text-gray-500 bg-gray-200/50 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div
        className={`flex-1 min-h-0 rounded-xl border p-2 ${isCancelled ? 'bg-red-50/30 border-red-100' : 'bg-gray-100/40 border-gray-200/60'}`}
      >
        <Droppable droppableId={status}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`h-full overflow-y-auto pr-1 custom-scrollbar ${
                snapshot.isDraggingOver
                  ? isCancelled
                    ? 'bg-red-50/50'
                    : 'bg-blue-50/30'
                  : ''
              }`}
            >
              {tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided, snapshot) => (
                    <TaskCard
                      ref={provided.innerRef}
                      task={task}
                      onClick={onTaskClick}
                      isDragging={snapshot.isDragging}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
}
