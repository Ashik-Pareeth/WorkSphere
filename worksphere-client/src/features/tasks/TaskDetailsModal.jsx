import { useState, useEffect, useRef } from 'react';
import {
  getTaskComments,
  addTaskComment,
  uploadTaskEvidence, // Matches your API export
  getTaskEvidence, // Matches your API export
} from '../../api/taskApi';
import AlertMessage from '../../components/common/AlertMessage';
import './TaskBoard.css';

const TaskDetailsModal = ({ task, onClose }) => {
  // --- STATE ---
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // Evidence State
  const [evidenceList, setEvidenceList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null); // Reference to hidden file input

  // Loading States
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  // Alert State
  const [alert, setAlert] = useState(null);

  // --- EFFECTS ---
  useEffect(() => {
    if (task?.id) {
      loadData();
    }
  }, [task]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [commentsData, evidenceData] = await Promise.all([
        getTaskComments(task.id),
        getTaskEvidence(task.id),
      ]);
      setComments(commentsData);
      setEvidenceList(evidenceData);
    } catch (error) {
      console.error('Failed to load task data:', error);
      setAlert({
        type: 'error',
        message: 'Failed to load details. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSendingComment(true);
      const savedComment = await addTaskComment(task.id, newComment);
      setComments((prev) => [...prev, savedComment]);
      setNewComment('');
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to post comment.' });
    } finally {
      setSendingComment(false);
    }
  };

  // 1. Triggered when file is selected via dialog
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setAlert(null); // Clear any previous errors
    }
  };

  // 2. Triggered when user cancels selection
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset hidden input
    }
  };

  // 3. Triggered when user clicks "Confirm Upload"
  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setAlert(null);

      const newEvidence = await uploadTaskEvidence(task.id, selectedFile);

      // Update List & Show Success
      setEvidenceList((prev) => [...prev, newEvidence]);
      setAlert({ type: 'success', message: 'Evidence uploaded successfully!' });

      // Reset Input
      handleRemoveFile();
    } catch (error) {
      console.error('Upload failed:', error);
      setAlert({
        type: 'error',
        message: 'Upload failed: ' + (error.message || 'Unknown error'),
      });
    } finally {
      setUploading(false);
    }
  };

  // --- RENDER ---

  return (
    <div className="modal-overlay" onClick={onClose} style={overlayStyle}>
      <div
        className="modal-content card"
        onClick={(e) => e.stopPropagation()}
        style={modalStyle}
      >
        {/* 1. ALERT MESSAGE */}
        {alert && (
          <AlertMessage
            error={alert.type === 'error' ? alert.message : null}
            success={alert.type === 'success' ? alert.message : null}
            onClose={() => setAlert(null)}
          />
        )}

        {/* 2. HEADER */}
        <div className="modal-header" style={headerStyle}>
          <div>
            <span style={metaTextStyle}>
              {task.taskCode} •{' '}
              <span
                className={`priority-badge ${task.priority?.toLowerCase()}`}
              >
                {task.priority}
              </span>
            </span>
            <h2 style={{ margin: '5px 0 0 0', color: '#1e293b' }}>
              {task.title}
            </h2>
          </div>
          <button onClick={onClose} style={closeButtonStyle}>
            ×
          </button>
        </div>

        {/* 3. BODY - Split into 2 columns */}
        <div style={{ display: 'flex', gap: '2rem', minHeight: '400px' }}>
          {/* LEFT COLUMN: Details & Evidence */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <div style={descriptionBoxStyle}>
                {task.description || 'No description provided.'}
              </div>
            </div>

            {/* Status & Due Date */}
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div>
                <label style={labelStyle}>Status</label>
                <div className={`status-badge ${task.status?.toLowerCase()}`}>
                  {task.status?.replace('_', ' ')}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Due Date</label>
                <div style={{ color: '#334155', fontWeight: 500 }}>
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : 'N/A'}
                </div>
              </div>
            </div>

            {/* EVIDENCE SECTION (New Modern UI) */}
            <div
              style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}
            >
              <h3
                style={{
                  fontSize: '1.1rem',
                  marginBottom: '0.8rem',
                  color: '#1e293b',
                }}
              >
                Proof of Work
              </h3>

              {/* Evidence List */}
              <ul
                style={{ listStyle: 'none', padding: 0, marginBottom: '1rem' }}
              >
                {evidenceList.length === 0 ? (
                  <li
                    style={{
                      color: '#94a3b8',
                      fontStyle: 'italic',
                      fontSize: '0.9rem',
                    }}
                  >
                    No files uploaded yet.
                  </li>
                ) : (
                  evidenceList.map((file) => (
                    <li key={file.id} style={fileItemStyle}>
                      <span style={{ fontSize: '1.2rem' }}>📄</span>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={linkStyle}
                        >
                          {file.fileName || 'Unknown File'}
                        </a>
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                          Uploaded:{' '}
                          {file.createdAt
                            ? new Date(file.createdAt).toLocaleDateString()
                            : 'Just now'}
                        </span>
                      </div>
                    </li>
                  ))
                )}
              </ul>

              {/* --- MODERN UPLOAD UI --- */}
              <div style={uploadBoxStyle}>
                {/* HIDDEN INPUT */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                {!selectedFile ? (
                  /* STATE 1: No File Selected */
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="btn"
                      style={selectButtonStyle}
                    >
                      <span style={{ fontSize: '1.2rem' }}>📎</span> Select
                      Evidence File
                    </button>
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: '#94a3b8',
                        marginTop: '0.5rem',
                        marginBottom: 0,
                      }}
                    >
                      Click to browse documents
                    </p>
                  </div>
                ) : (
                  /* STATE 2: File Selected */
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    {/* File Info */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        overflow: 'hidden',
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>📄</span>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: '#334155',
                          }}
                        >
                          {selectedFile.name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Ready to upload
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={handleRemoveFile}
                        disabled={uploading}
                        style={cancelButtonStyle}
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleFileUpload}
                        disabled={uploading}
                        className="btn btn-primary"
                        style={{
                          ...uploadButtonStyle,
                          opacity: uploading ? 0.7 : 1,
                          cursor: uploading ? 'wait' : 'pointer',
                        }}
                      >
                        {uploading ? 'Uploading...' : 'Confirm Upload'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Comments */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderLeft: '1px solid #e2e8f0',
              paddingLeft: '2rem',
            }}
          >
            <h3 style={{ marginTop: 0, color: '#1e293b' }}>
              Activity & Comments
            </h3>

            <div style={commentsContainerStyle}>
              {loading ? (
                <p style={{ color: '#64748b' }}>Loading...</p>
              ) : comments.length === 0 ? (
                <p style={{ color: '#94a3b8' }}>No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} style={commentBubbleStyle}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.3rem',
                      }}
                    >
                      <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                        {c.authorName}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.95rem',
                        color: '#334155',
                        lineHeight: '1.4',
                      }}
                    >
                      {c.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleSendComment}
              style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}
            >
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={commentInputStyle}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sendingComment || !newComment.trim()}
                style={{ borderRadius: '6px' }}
              >
                {sendingComment ? '...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- STYLES (Inline for simplicity, can be moved to CSS) ---

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
  backdropFilter: 'blur(2px)',
};

const modalStyle = {
  width: '900px',
  maxWidth: '95%',
  maxHeight: '90vh',
  overflowY: 'auto',
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '2rem',
  boxShadow:
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

const headerStyle = {
  borderBottom: '1px solid #e2e8f0',
  paddingBottom: '1rem',
  marginBottom: '1.5rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
};

const metaTextStyle = {
  fontSize: '0.8rem',
  color: '#64748b',
  textTransform: 'uppercase',
  fontWeight: 600,
  display: 'block',
  marginBottom: '0.25rem',
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '2rem',
  cursor: 'pointer',
  lineHeight: 1,
  color: '#94a3b8',
  padding: '0 0.5rem',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  color: '#64748b',
  marginBottom: '0.4rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const descriptionBoxStyle = {
  background: '#f8fafc',
  padding: '1rem',
  borderRadius: '8px',
  minHeight: '80px',
  color: '#334155',
  border: '1px solid #e2e8f0',
};

const fileItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginBottom: '0.75rem',
  padding: '0.5rem',
  borderRadius: '6px',
  border: '1px solid transparent',
  transition: 'background 0.2s',
};

const linkStyle = {
  color: '#2563eb',
  textDecoration: 'none',
  fontWeight: 500,
  fontSize: '0.95rem',
};

// Upload UI Styles
const uploadBoxStyle = {
  marginTop: '1rem',
  padding: '1.25rem',
  background: '#f8fafc',
  borderRadius: '8px',
  border: '1px dashed #cbd5e1',
  transition: 'all 0.2s',
};

const selectButtonStyle = {
  background: '#fff',
  border: '1px solid #cbd5e1',
  padding: '0.6rem 1.2rem',
  cursor: 'pointer',
  borderRadius: '6px',
  fontWeight: 500,
  color: '#475569',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const cancelButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#ef4444',
  cursor: 'pointer',
  fontSize: '0.85rem',
  padding: '0.5rem',
  fontWeight: 500,
};

const uploadButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 1rem',
  fontSize: '0.9rem',
  borderRadius: '6px',
};

// Comment Styles
const commentsContainerStyle = {
  flex: 1,
  overflowY: 'auto',
  marginBottom: '1rem',
  maxHeight: '400px',
  paddingRight: '0.5rem',
};

const commentBubbleStyle = {
  marginBottom: '1rem',
  padding: '0.85rem',
  background: '#f1f5f9',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
};

const commentInputStyle = {
  flex: 1,
  padding: '0.7rem',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '0.95rem',
};

export default TaskDetailsModal;
