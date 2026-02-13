import { useState, useEffect } from 'react';
import { getTaskComments, addTaskComment } from '../../api/taskApi';
import './TaskBoard.css'; // Reusing your existing CSS for consistency

const TaskDetailsModal = ({ task, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [task.id]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await getTaskComments(task.id);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSending(true);
      const savedComment = await addTaskComment(task.id, newComment);
      // Add the new comment to the UI instantly
      setComments((prev) => [...prev, savedComment]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to send comment', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={overlayStyle}>
      <div
        className="modal-content card"
        onClick={(e) => e.stopPropagation()}
        style={modalStyle}
      >
        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderBottom: '1px solid #eee',
            paddingBottom: '1rem',
            marginBottom: '1rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.8rem', color: '#666' }}>
              {task.taskCode} • {task.priority} Priority
            </span>
            <h2 style={{ margin: '5px 0 0 0' }}>{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {/* BODY - Split into 2 columns */}
        <div style={{ display: 'flex', gap: '2rem', minHeight: '300px' }}>
          {/* LEFT: Task Details */}
          <div style={{ flex: 1 }}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Status</label>
              <div
                style={{
                  padding: '0.5rem',
                  background: '#f3f4f6',
                  borderRadius: '4px',
                  display: 'inline-block',
                }}
              >
                {task.status.replace('_', ' ')}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Description</label>
              <p style={{ whiteSpace: 'pre-wrap', color: '#333' }}>
                {task.description || 'No description provided.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
              <div className="form-group">
                <label>Assigned By</label>
                <p>{task.assignerName}</p>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <p>{new Date(task.dueDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* RIGHT: Comments & Activity */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderLeft: '1px solid #eee',
              paddingLeft: '2rem',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Activity & Comments</h3>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                marginBottom: '1rem',
                maxHeight: '300px',
              }}
            >
              {loading ? (
                <p>Loading activity...</p>
              ) : comments.length === 0 ? (
                <p style={{ color: '#888' }}>
                  No comments yet. Start the conversation!
                </p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      marginBottom: '1rem',
                      padding: '0.75rem',
                      background: '#f9fafb',
                      borderRadius: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <strong>{c.authorName}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{c.content}</p>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleSendComment}
              style={{ display: 'flex', gap: '0.5rem' }}
            >
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sending || !newComment.trim()}
              >
                {sending ? '...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple inline styles for the modal structure
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalStyle = {
  width: '800px',
  maxWidth: '90%',
  maxHeight: '90vh',
  overflowY: 'auto',
  backgroundColor: '#fff',
  borderRadius: '8px',
  padding: '2rem',
};

export default TaskDetailsModal;
