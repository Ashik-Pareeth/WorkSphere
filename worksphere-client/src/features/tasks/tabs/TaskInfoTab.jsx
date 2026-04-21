import React, { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';

export default function TaskInfoTab({ task, onEditTask }) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title || '');
  const [editDesc, setEditDesc] = useState(task.description || '');
  const [saving, setSaving] = useState(false);

  if (!task) return null;

  const canEdit = onEditTask &&
    (task.status === 'TODO' || task.status === 'IN_PROGRESS');

  const handleSave = async () => {
    setSaving(true);
    try {
      await onEditTask({ title: editTitle, description: editDesc });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-2 mt-2">
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Description</span>
          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors"
              title="Edit task details"
            >
              <Pencil size={13} />
            </button>
          )}
        </div>
        {editing ? (
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full border border-indigo-300 rounded-lg px-3 py-2 text-sm text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Task title"
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
              placeholder="Task description..."
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <X size={12} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <Check size={12} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-700 leading-relaxed min-h-[80px]">
            {task.description || 'No description provided.'}
          </div>
        )}
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
