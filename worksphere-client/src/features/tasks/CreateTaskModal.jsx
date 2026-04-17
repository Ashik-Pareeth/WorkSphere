import { useState, useEffect } from 'react';
import { getAllEmployees } from '../../api/employeeApi';
import { createTask } from '../../api/taskApi';
import { toast } from 'sonner';

/** Returns true if the given priority auto-requires evidence */
const autoRequiresEvidence = (priority) =>
  priority === 'HIGH' || priority === 'URGENT';

const CreateTaskModal = ({ onClose, onTaskCreated }) => {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assignedToId: '',
    dueDate: '',
    requiresEvidence: autoRequiresEvidence('MEDIUM'),
  });
  // Track whether the user has manually overridden the evidence toggle
  const [evidenceManual, setEvidenceManual] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchEmps() {
      try {
        const data = await getAllEmployees();
        setEmployees(data);
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, assignedToId: data[0].id }));
        }
      } catch (err) {
        console.error('Failed to load employees', err);
      }
    }
    fetchEmps();
  }, []);

  /** When priority changes, auto-update evidence unless user locked it manually */
  const handlePriorityChange = (e) => {
    const newPriority = e.target.value;
    setFormData((prev) => ({
      ...prev,
      priority: newPriority,
      requiresEvidence: evidenceManual
        ? prev.requiresEvidence
        : autoRequiresEvidence(newPriority),
    }));
  };

  /** Toggle handler — marks as manual override */
  const handleEvidenceToggle = () => {
    setEvidenceManual(true);
    setFormData((prev) => ({
      ...prev,
      requiresEvidence: !prev.requiresEvidence,
    }));
  };

  /** Reset to auto-derived value */
  const handleEvidenceAutoReset = () => {
    setEvidenceManual(false);
    setFormData((prev) => ({
      ...prev,
      requiresEvidence: autoRequiresEvidence(prev.priority),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createTask(formData);
      onTaskCreated();
      onClose();
    } catch (error) {
      toast.error(
        'Failed to create task: ' +
          (error?.response?.data?.message || error?.message || 'Unknown error')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 animate-in fade-in zoom-in-95">
        <h3 className="text-xl font-semibold mb-4">Create New Task</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              required
              placeholder="Enter task title"
              className="border border-gray-300 bg-white shadow-sm rounded-lg px-3 py-2 
            focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          {/* Assign To */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Assign To
            </label>
            <select
              className="border border-gray-300 bg-white shadow-sm rounded-lg px-3 py-2 
            focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              value={formData.assignedToId}
              onChange={(e) =>
                setFormData({ ...formData, assignedToId: e.target.value })
              }
            >
              <option value="" disabled>
                Select Employee
              </option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.username} ({emp.jobTitle || 'No Job Title'})
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              className="border border-gray-300 bg-white shadow-sm rounded-lg px-3 py-2 
            focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              value={formData.priority}
              onChange={handlePriorityChange}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Evidence Required Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-gray-700">
                Requires Evidence
              </span>
              <span className="text-xs text-gray-400">
                {evidenceManual ? (
                  <>
                    <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Manual override
                    </span>
                    {' · '}
                    <button
                      type="button"
                      onClick={handleEvidenceAutoReset}
                      className="text-blue-500 hover:underline"
                    >
                      Reset to auto
                    </button>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Auto · based on priority
                  </span>
                )}
              </span>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              role="switch"
              aria-checked={formData.requiresEvidence}
              onClick={handleEvidenceToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 ${
                formData.requiresEvidence ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  formData.requiresEvidence ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Due Date */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              type="datetime-local"
              required
              placeholder="Select due date and time"
              className="border border-gray-300 bg-white shadow-sm rounded-lg px-3 py-2 
            focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              rows="3"
              placeholder="Enter task description..."
              className="border border-gray-300 bg-white shadow-sm rounded-lg px-3 py-2 
            focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 
            hover:bg-gray-100 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white 
            hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
