import { useState, useEffect, useRef } from 'react';
import {
  getTaskComments,
  addTaskComment,
  uploadTaskEvidence,
  getTaskEvidence,
  reviewTaskEvidence,
} from '../../api/taskApi';
import AlertMessage from '../../components/common/AlertMessage';
import './TaskBoard.css';
import axiosInstance from '../../api/axiosInstance';

const TaskDetailsModal = ({ task, onClose }) => {
  // --- USER ROLE CHECK ---
  const storedRoles = JSON.parse(localStorage.getItem('roles') || '[]');
  const isManagerOrAdmin =
    storedRoles.includes('ROLE_MANAGER') || storedRoles.includes('ROLE_ADMIN');
  const currentUser = JSON.parse(localStorage.getItem('user')) || {
    id: localStorage.getItem('employeeId'),
  };
  // --- DEBUGGING ---
  console.log('=== DEBUG INFO ===');
  console.log('1. The Task Object from Backend:', task);
  console.log(
    '2. My Local Storage Employee ID:',
    localStorage.getItem('employeeId')
  );
  console.log('3. My Local Storage User Object:', localStorage.getItem('user'));

  // --- STATE ---
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // Evidence State
  const [evidenceList, setEvidenceList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Manager Actions State
  const [rating, setRating] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false); // NEW: Cancel State

  // Evidence Review State
  const [activeReview, setActiveReview] = useState({
    id: null,
    status: null,
    feedback: '',
  });

  // Loading States
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [reviewingEvidence, setReviewingEvidence] = useState(false);

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
        message: error.message || 'Failed to load data',
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
      console.error('Failed to post comment:', error);
      setAlert({
        type: 'error',
        message: error.message || 'Failed to post comment',
      });
    } finally {
      setSendingComment(false);
    }
  };

  const handleApproveAndComplete = async () => {
    if (rating === 0) {
      setAlert({
        type: 'error',
        message:
          'You must provide a 1-5 star rating before completing the task.',
      });
      return;
    }

    try {
      setIsCompleting(true);

      // 1. Move the Task to COMPLETED first! (This unlocks the rating mechanism on the backend)
      await axiosInstance.patch(`/tasks/${task.id}/status`, {
        status: 'COMPLETED',
      });

      // 2. NOW submit the Rating
      await axiosInstance.post(`/tasks/${task.id}/rate`, { rating });

      setAlert({
        type: 'success',
        message: 'Task officially completed and rated!',
      });

      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to complete task.',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleLateRating = async () => {
    if (rating === 0) return;
    try {
      setIsCompleting(true); // Reusing this state for the loading spinner
      await axiosInstance.post(`/tasks/${task.id}/rate`, { rating });
      setAlert({ type: 'success', message: 'Rating submitted successfully!' });

      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit rating.',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  // NEW: Cancel Task Handler
  const handleCancelTask = async () => {
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this task? This will remove it from the active workflow.'
    );
    if (!confirmCancel) return;

    try {
      setIsCanceling(true);
      await axiosInstance.patch(`/tasks/${task.id}/status`, {
        status: 'CANCELLED',
      });

      setAlert({
        type: 'success',
        message: 'Task has been successfully cancelled.',
      });

      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to cancel task.',
      });
    } finally {
      setIsCanceling(false);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setAlert(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setAlert(null);
      const newEvidence = await uploadTaskEvidence(task.id, selectedFile);
      setEvidenceList((prev) => [...prev, newEvidence]);
      setAlert({ type: 'success', message: 'Evidence uploaded successfully!' });
      handleRemoveFile();
    } catch (error) {
      console.error('Upload failed:', error);
      setAlert({ type: 'error', message: error.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleEvidenceReview = async (evidenceId, status) => {
    if (status === 'REJECTED' && activeReview.id !== evidenceId) {
      setActiveReview({ id: evidenceId, status: 'REJECTED', feedback: '' });
      return;
    }

    try {
      setReviewingEvidence(true);
      const feedbackToSubmit =
        status === 'REJECTED' ? activeReview.feedback : '';
      const updatedEvidence = await reviewTaskEvidence(
        evidenceId,
        status,
        feedbackToSubmit
      );

      setEvidenceList((prev) =>
        prev.map((e) => (e.id === evidenceId ? updatedEvidence : e))
      );

      setAlert({ type: 'success', message: `Evidence marked as ${status}` });
      setActiveReview({ id: null, status: null, feedback: '' });
    } catch (error) {
      console.error('Review failed:', error);
      setAlert({ type: 'error', message: error.message || 'Review failed' });
    } finally {
      setReviewingEvidence(false);
    }
  };

  // --- RENDER HELPERS ---
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return {
          backgroundColor: '#dcfce7',
          color: '#166534',
          border: '1px solid #bbf7d0',
        };
      case 'REJECTED':
        return {
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          border: '1px solid #fecaca',
        };
      default:
        return {
          backgroundColor: '#f1f5f9',
          color: '#475569',
          border: '1px solid #e2e8f0',
        };
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

            {/* COMPLETED RATING DISPLAY */}
            {task.status === 'COMPLETED' && (
              <div style={{ marginTop: '1rem' }}>
                {task.managerRating ? (
                  /* ALREADY RATED: Read-Only View */
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          margin: '0 0 0.25rem 0',
                          color: '#1e293b',
                          fontSize: '0.9rem',
                        }}
                      >
                        Manager Rating
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Final Performance Score
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '4px',
                        fontSize: '1.5rem',
                        color: '#fbbf24',
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star}>
                          {task.managerRating >= star ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : /* MISSING RATING: Interactive UI for Managers */
                isManagerOrAdmin ? (
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px',
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            margin: '0 0 0.25rem 0',
                            color: '#92400e',
                            fontSize: '0.9rem',
                          }}
                        >
                          ⚠️ Rating Required
                        </h4>
                        <span style={{ fontSize: '0.8rem', color: '#b45309' }}>
                          This task was completed without a performance rating.
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '1.5rem',
                              cursor: 'pointer',
                              color: rating >= star ? '#fbbf24' : '#cbd5e1',
                              transition: 'color 0.2s',
                              padding: 0,
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={handleLateRating}
                      disabled={isCompleting || rating === 0}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: rating === 0 ? '#fcd34d' : '#d97706',
                        color: rating === 0 ? '#b45309' : '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: rating === 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isCompleting ? 'Saving...' : 'Submit Rating'}
                    </button>
                  </div>
                ) : (
                  /* MISSING RATING: Read-Only for Employees */
                  <div
                    style={{
                      padding: '0.75rem',
                      backgroundColor: '#f1f5f9',
                      border: '1px dashed #cbd5e1',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.85rem',
                        color: '#64748b',
                        fontStyle: 'italic',
                      }}
                    >
                      Pending Manager Rating...
                    </span>
                  </div>
                )}
              </div>
            )}

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

            {/* NEW: DANGER ZONE (Cancel Task) */}
            {isManagerOrAdmin &&
              !['COMPLETED', 'CANCELLED'].includes(task.status) && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid #e2e8f0',
                  }}
                >
                  <label style={{ ...labelStyle, color: '#ef4444' }}>
                    Danger Zone
                  </label>
                  <button
                    onClick={handleCancelTask}
                    disabled={isCanceling}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: isCanceling ? 'wait' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: isCanceling ? 0.7 : 1,
                    }}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundColor = '#fee2e2')
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundColor = '#fef2f2')
                    }
                  >
                    {isCanceling ? 'Canceling Task...' : '🚫 Cancel this Task'}
                  </button>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      marginTop: '6px',
                    }}
                  >
                    Canceling a task removes it from the active workflow. This
                    cannot be easily undone.
                  </p>
                </div>
              )}

            {/* EVIDENCE SECTION */}
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

              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  marginBottom: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
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
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          width: '100%',
                        }}
                      >
                        <span style={{ fontSize: '1.5rem' }}>📄</span>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                          }}
                        >
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={linkStyle}
                          >
                            {file.fileName || 'Unknown File'}
                          </a>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginTop: '4px',
                            }}
                          >
                            <span
                              style={{ color: '#94a3b8', fontSize: '0.75rem' }}
                            >
                              {file.createdAt
                                ? new Date(file.createdAt).toLocaleDateString()
                                : 'Just now'}
                            </span>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                letterSpacing: '0.5px',
                                ...getStatusBadgeStyle(
                                  file.status || 'PENDING'
                                ),
                              }}
                            >
                              {file.status || 'PENDING'}
                            </span>
                          </div>
                        </div>

                        {/* MANAGER ACTIONS: Accept / Reject */}
                        {isManagerOrAdmin &&
                          (file.status === 'PENDING' || !file.status) &&
                          activeReview.id !== file.id && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() =>
                                  handleEvidenceReview(file.id, 'ACCEPTED')
                                }
                                disabled={reviewingEvidence}
                                style={acceptButtonStyle}
                              >
                                ✓ Accept
                              </button>
                              <button
                                onClick={() =>
                                  handleEvidenceReview(file.id, 'REJECTED')
                                }
                                disabled={reviewingEvidence}
                                style={rejectButtonStyle}
                              >
                                ✕ Reject
                              </button>
                            </div>
                          )}
                      </div>

                      {/* REJECTION FEEDBACK INPUT */}
                      {activeReview.id === file.id &&
                        activeReview.status === 'REJECTED' && (
                          <div style={feedbackContainerStyle}>
                            <input
                              type="text"
                              placeholder="Why is this rejected? (Optional)"
                              value={activeReview.feedback}
                              onChange={(e) =>
                                setActiveReview({
                                  ...activeReview,
                                  feedback: e.target.value,
                                })
                              }
                              style={feedbackInputStyle}
                              autoFocus
                            />
                            <div
                              style={{
                                display: 'flex',
                                gap: '0.5rem',
                                marginTop: '0.5rem',
                              }}
                            >
                              <button
                                onClick={() =>
                                  handleEvidenceReview(file.id, 'REJECTED')
                                }
                                disabled={reviewingEvidence}
                                style={confirmRejectButtonStyle}
                              >
                                Confirm Rejection
                              </button>
                              <button
                                onClick={() =>
                                  setActiveReview({
                                    id: null,
                                    status: null,
                                    feedback: '',
                                  })
                                }
                                style={cancelButtonStyle}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                      {/* SHOW FEEDBACK TEXT */}
                      {file.status === 'REJECTED' && file.reviewFeedback && (
                        <div
                          style={{
                            marginTop: '0.5rem',
                            fontSize: '0.85rem',
                            color: '#991b1b',
                            backgroundColor: '#fef2f2',
                            padding: '0.5rem',
                            borderRadius: '4px',
                          }}
                        >
                          <strong>Reason:</strong> {file.reviewFeedback}
                        </div>
                      )}
                    </li>
                  ))
                )}
              </ul>

              {/* UPLOAD UI */}
              {task.assignedToId === currentUser.id && (
                <div style={uploadBoxStyle}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  {!selectedFile ? (
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
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          overflow: 'hidden',
                        }}
                      >
                        <span style={{ fontSize: '1.5rem' }}>📄</span>
                        <div
                          style={{ display: 'flex', flexDirection: 'column' }}
                        >
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              color: '#334155',
                            }}
                          >
                            {selectedFile.name}
                          </span>
                          <span
                            style={{ fontSize: '0.75rem', color: '#64748b' }}
                          >
                            Ready to upload
                          </span>
                        </div>
                      </div>
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
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Comments & Manager Review */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderLeft: '1px solid #e2e8f0',
              paddingLeft: '2rem',
            }}
          >
            {/* --- MANAGER REVIEW PANEL --- */}
            {isManagerOrAdmin && task.status === 'IN_REVIEW' && (
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px',
                }}
              >
                <h3
                  style={{
                    fontSize: '1rem',
                    color: '#1e293b',
                    marginTop: 0,
                    marginBottom: '10px',
                  }}
                >
                  Manager Review & Approval
                </h3>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: '#64748b',
                    marginBottom: '12px',
                  }}
                >
                  Review the submitted evidence. Rate the employee's performance
                  to officially close this task.
                </p>

                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '15px' }}
                >
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '1.5rem',
                          cursor: 'pointer',
                          color: rating >= star ? '#fbbf24' : '#cbd5e1',
                          transition: 'color 0.2s',
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <span
                    style={{
                      fontSize: '0.9rem',
                      color: '#475569',
                      fontWeight: 'bold',
                    }}
                  >
                    {rating > 0 ? `${rating} / 5 Stars` : 'Select a rating'}
                  </span>
                </div>

                <button
                  onClick={handleApproveAndComplete}
                  disabled={isCompleting || rating === 0}
                  style={{
                    marginTop: '16px',
                    width: '100%',
                    padding: '10px',
                    backgroundColor: rating === 0 ? '#94a3b8' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: rating === 0 ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                >
                  {isCompleting ? 'Processing...' : 'Approve & Complete Task'}
                </button>
              </div>
            )}

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

// --- STYLES ---
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
  flexDirection: 'column',
  gap: '0.5rem',
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc',
};
const linkStyle = {
  color: '#2563eb',
  textDecoration: 'none',
  fontWeight: 500,
  fontSize: '0.95rem',
};
const acceptButtonStyle = {
  padding: '4px 8px',
  fontSize: '0.8rem',
  backgroundColor: '#22c55e',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
};
const rejectButtonStyle = {
  padding: '4px 8px',
  fontSize: '0.8rem',
  backgroundColor: '#ef4444',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
};
const feedbackContainerStyle = {
  marginTop: '0.5rem',
  padding: '0.75rem',
  backgroundColor: '#fff',
  border: '1px dashed #cbd5e1',
  borderRadius: '6px',
};
const feedbackInputStyle = {
  width: '100%',
  padding: '0.5rem',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  fontSize: '0.85rem',
};
const confirmRejectButtonStyle = {
  padding: '4px 10px',
  fontSize: '0.8rem',
  backgroundColor: '#991b1b',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};
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
  color: '#64748b',
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
