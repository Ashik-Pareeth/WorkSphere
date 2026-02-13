import { useState, useEffect } from 'react';
import { getAllEmployees } from '../../api/employeeApi';
import { createTask } from '../../api/taskApi';
import './TaskBoard.css';

const CreateTaskModal = ({ onClose, onTaskCreated }) => {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assignedToId: '',
    dueDate: '',
    requiresEvidence: true,
  });
  const [loading, setLoading] = useState(false);

  // 1. Fetch Employees on Load
  useEffect(() => {
    async function fetchEmps() {
      try {
        const data = await getAllEmployees();
        setEmployees(data);
        // Default to first employee if available
        if (data.length > 0)
          setFormData((prev) => ({ ...prev, assignedToId: data[0].id }));
      } catch (err) {
        console.error('Failed to load employees', err);
      }
    }
    fetchEmps();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createTask(formData);
      onTaskCreated(); // Refresh the board
      onClose(); // Close modal
    } catch (error) {
      alert('Failed to create task :' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Create New Task</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Assign To</label>
            <select
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

          <div className="form-group">
            <label>Priority</label>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="form-group">
            <label>Due Date</label>
            <input
              type="datetime-local"
              required
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
