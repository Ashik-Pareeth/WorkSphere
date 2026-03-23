import React from 'react';

export default function TaskInfoTab({ task }) {
  if (!task) return null;

  return (
    <div className="flex flex-col gap-6 p-2 mt-2">
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2 block">Description</span>
        <div className="text-sm text-gray-700 leading-relaxed min-h-[80px]">
          {task.description || 'No description provided.'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Priority</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border w-fit
             ${task.priority === 'URGENT' ? 'bg-purple-50 text-purple-700 border-purple-200' :
               task.priority === 'HIGH' ? 'bg-red-50 text-red-600 border-red-100' :
               task.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border-amber-100' :
               'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
            {task.priority || 'MEDIUM'}
          </span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Due Date</span>
          <span className="text-sm font-semibold text-gray-800">
            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
          </span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Assigned To</span>
          <span className="text-sm font-semibold text-gray-800">{task.assignedToName || '—'}</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Assigned By</span>
          <span className="text-sm font-semibold text-gray-800">{task.assignerName || '—'}</span>
        </div>
      </div>
    </div>
  );
}
