import { useState, useEffect, useRef } from 'react';
import {
  getTaskComments,
  addTaskComment,
  uploadTaskEvidence,
  getTaskEvidence,
  reviewTaskEvidence,
} from '../../api/taskApi';
import AlertMessage from '../../components/common/AlertMessage';
import axiosInstance from '../../api/axiosInstance';

/* ─────────────────────────────────────────
   STYLES  (scoped via <style> tag injected once)
───────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

  .tdm-overlay {
    position: fixed; inset: 0;
    background: rgba(10, 10, 15, 0.6);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000;
    animation: tdm-fade-in 0.18s ease;
  }
  @keyframes tdm-fade-in { from { opacity: 0 } to { opacity: 1 } }

  .tdm-modal {
    font-family: 'DM Sans', sans-serif;
    width: 940px; max-width: 96vw; max-height: 92vh;
    overflow-y: auto; overflow-x: hidden;
    background: #FAFAF8;
    border-radius: 16px;
    border: 1px solid #E5E2DC;
    box-shadow: 0 32px 64px -12px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.6) inset;
    animation: tdm-slide-up 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    scrollbar-width: thin;
    scrollbar-color: #D4CFC7 transparent;
  }
  .tdm-modal::-webkit-scrollbar { width: 6px; }
  .tdm-modal::-webkit-scrollbar-track { background: transparent; }
  .tdm-modal::-webkit-scrollbar-thumb { background: #D4CFC7; border-radius: 3px; }

  @keyframes tdm-slide-up {
    from { opacity: 0; transform: translateY(20px) scale(0.98) }
    to   { opacity: 1; transform: translateY(0) scale(1) }
  }

  /* ── Header ── */
  .tdm-header {
    padding: 28px 32px 24px;
    border-bottom: 1px solid #EAE7E1;
    display: flex; justify-content: space-between; align-items: flex-start;
    background: #FFFFFF;
    border-radius: 16px 16px 0 0;
    position: sticky; top: 0; z-index: 10;
  }
  .tdm-code {
    font-family: 'DM Mono', monospace;
    font-size: 11px; font-weight: 500;
    color: #9B8F80; letter-spacing: 0.06em;
    text-transform: uppercase;
    background: #F2EFE9; border-radius: 4px;
    padding: 3px 8px; display: inline-block;
    margin-bottom: 8px;
  }
  .tdm-title {
    font-size: 20px; font-weight: 600;
    color: #1C1A17; margin: 0; line-height: 1.3;
  }
  .tdm-meta-row {
    display: flex; gap: 8px; align-items: center; margin-top: 10px;
  }
  .tdm-close {
    background: #F2EFE9; border: none; border-radius: 8px;
    width: 36px; height: 36px; cursor: pointer;
    font-size: 18px; color: #7A6F63;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s, color 0.15s; flex-shrink: 0;
  }
  .tdm-close:hover { background: #EAE7E1; color: #1C1A17; }

  /* ── Badges ── */
  .tdm-badge {
    font-size: 11px; font-weight: 600; letter-spacing: 0.04em;
    text-transform: uppercase; border-radius: 6px;
    padding: 3px 9px; border: 1px solid transparent;
  }
  .tdm-badge.priority-low    { background:#EDF7ED; color:#2E7D32; border-color:#C8E6C9; }
  .tdm-badge.priority-medium { background:#FFF8E1; color:#E65100; border-color:#FFE082; }
  .tdm-badge.priority-high   { background:#FDE8E8; color:#C62828; border-color:#FFCDD2; }
  .tdm-badge.priority-urgent { background:#4A1942; color:#F8BBD0; border-color:#7B1FA2; }

  .tdm-status {
    font-size: 11px; font-weight: 600; letter-spacing: 0.04em;
    text-transform: uppercase; border-radius: 20px;
    padding: 4px 12px;
  }
  .tdm-status.todo        { background:#F2EFE9; color:#7A6F63; }
  .tdm-status.in_progress { background:#E3F2FD; color:#1565C0; }
  .tdm-status.in_review   { background:#F3E5F5; color:#6A1B9A; }
  .tdm-status.completed   { background:#E8F5E9; color:#2E7D32; }
  .tdm-status.cancelled   { background:#FAFAFA; color:#9E9E9E; }

  /* ── Body layout ── */
  .tdm-body {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 0; min-height: 520px;
  }
  .tdm-col { padding: 28px 32px; }
  .tdm-col-right {
    border-left: 1px solid #EAE7E1;
    display: flex; flex-direction: column;
  }

  /* ── Section label ── */
  .tdm-section-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.1em;
    text-transform: uppercase; color: #B0A699;
    margin: 0 0 10px; display: block;
  }

  /* ── Description box ── */
  .tdm-desc {
    background: #FFFFFF; border: 1px solid #EAE7E1;
    border-radius: 10px; padding: 14px 16px;
    min-height: 80px; color: #3D3830;
    font-size: 14px; line-height: 1.65;
  }

  /* ── Info grid ── */
  .tdm-info-grid { display: flex; gap: 24px; margin-top: 4px; }
  .tdm-info-item label { display: block; font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #B0A699; margin-bottom: 4px; }
  .tdm-info-item span  { font-size: 13px; font-weight: 500; color: #3D3830; }

  /* ── Divider ── */
  .tdm-divider { height: 1px; background: #EAE7E1; margin: 24px 0; }

  /* ── Rating stars ── */
  .tdm-stars { display: flex; gap: 2px; }
  .tdm-star-btn {
    background: none; border: none; cursor: pointer;
    font-size: 22px; padding: 2px;
    transition: transform 0.1s;
    line-height: 1;
  }
  .tdm-star-btn:hover { transform: scale(1.2); }

  /* ── Review panel ── */
  .tdm-review-panel {
    background: #FFFFFF; border: 1px solid #EAE7E1;
    border-radius: 12px; padding: 18px 20px;
    margin-bottom: 20px;
  }
  .tdm-review-panel h4 { margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #1C1A17; }
  .tdm-review-panel p  { margin: 0 0 14px; font-size: 12px; color: #9B8F80; line-height: 1.5; }

  .tdm-approve-btn {
    width: 100%; padding: 11px;
    background: #1C1A17; color: #FAFAF8;
    border: none; border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 600;
    cursor: pointer; margin-top: 14px;
    transition: background 0.15s, transform 0.1s;
    letter-spacing: 0.02em;
  }
  .tdm-approve-btn:hover:not(:disabled) { background: #2D2A26; transform: translateY(-1px); }
  .tdm-approve-btn:disabled { background: #D4CFC7; cursor: not-allowed; transform: none; }
  .tdm-approve-btn.green { background: #2E7D32; }
  .tdm-approve-btn.green:hover:not(:disabled) { background: #1B5E20; }

  /* ── Helpdesk context ── */
  .tdm-helpdesk-panel {
    background: #FFFBF5;
    border: 1px solid #F0D9B5;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 20px;
  }
  .tdm-helpdesk-header {
    padding: 12px 16px;
    background: #FFF3DC;
    border-bottom: 1px solid #F0D9B5;
    display: flex; align-items: center; gap: 8px;
  }
  .tdm-helpdesk-header span { font-size: 12px; font-weight: 600; color: #7C5109; letter-spacing: 0.04em; text-transform: uppercase; }
  .tdm-helpdesk-body { padding: 12px; max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
  .tdm-helpdesk-body::-webkit-scrollbar { width: 4px; }
  .tdm-helpdesk-body::-webkit-scrollbar-thumb { background: #F0D9B5; border-radius: 2px; }
  .tdm-ticket-comment {
    background: #FFFFFF; border: 1px solid #F0D9B5;
    border-radius: 8px; padding: 10px 12px;
  }
  .tdm-ticket-comment .author { font-size: 12px; font-weight: 600; color: #A0622A; }
  .tdm-ticket-comment .time   { font-size: 11px; color: #C49A5A; font-family: 'DM Mono', monospace; }
  .tdm-ticket-comment .body   { font-size: 13px; color: #5C3D1A; margin: 4px 0 0; line-height: 1.5; }

  /* ── Comments ── */
  .tdm-comments-list {
    flex: 1; overflow-y: auto; margin-bottom: 14px;
    max-height: 340px; padding-right: 4px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .tdm-comments-list::-webkit-scrollbar { width: 4px; }
  .tdm-comments-list::-webkit-scrollbar-thumb { background: #D4CFC7; border-radius: 2px; }
  .tdm-comment-bubble {
    padding: 12px 14px;
    background: #FFFFFF; border: 1px solid #EAE7E1;
    border-radius: 10px;
  }
  .tdm-comment-bubble .author { font-size: 13px; font-weight: 600; color: #1C1A17; }
  .tdm-comment-bubble .time   { font-size: 11px; color: #B0A699; font-family: 'DM Mono', monospace; }
  .tdm-comment-bubble .body   { font-size: 14px; color: #3D3830; margin: 5px 0 0; line-height: 1.55; }
  .tdm-comment-empty { font-size: 13px; color: #B0A699; font-style: italic; text-align: center; padding: 24px 0; }

  /* ── Comment input ── */
  .tdm-comment-form { display: flex; gap: 8px; margin-top: auto; }
  .tdm-comment-input {
    flex: 1; padding: 10px 14px;
    background: #FFFFFF; border: 1px solid #D4CFC7;
    border-radius: 8px; font-family: 'DM Sans', sans-serif;
    font-size: 14px; color: #1C1A17; outline: none;
    transition: border-color 0.15s;
  }
  .tdm-comment-input:focus { border-color: #1C1A17; }
  .tdm-comment-input::placeholder { color: #C4BEB7; }
  .tdm-send-btn {
    padding: 10px 18px;
    background: #1C1A17; color: #FAFAF8;
    border: none; border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 600;
    cursor: pointer; transition: background 0.15s;
    white-space: nowrap;
  }
  .tdm-send-btn:hover:not(:disabled) { background: #2D2A26; }
  .tdm-send-btn:disabled { background: #D4CFC7; cursor: not-allowed; }

  /* ── Evidence ── */
  .tdm-evidence-item {
    background: #FFFFFF; border: 1px solid #EAE7E1;
    border-radius: 10px; padding: 12px 14px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .tdm-evidence-row { display: flex; align-items: center; gap: 10px; }
  .tdm-evidence-icon {
    width: 36px; height: 36px; background: #F2EFE9;
    border-radius: 8px; display: flex; align-items: center;
    justify-content: center; font-size: 16px; flex-shrink: 0;
  }
  .tdm-evidence-name { font-size: 13px; font-weight: 500; color: #2563EB; text-decoration: none; }
  .tdm-evidence-name:hover { text-decoration: underline; }
  .tdm-evidence-date { font-size: 11px; color: #B0A699; font-family: 'DM Mono', monospace; }
  .tdm-evidence-status {
    font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
    text-transform: uppercase; border-radius: 4px; padding: 2px 7px;
  }
  .tdm-evidence-status.ACCEPTED { background:#E8F5E9; color:#2E7D32; }
  .tdm-evidence-status.REJECTED { background:#FDE8E8; color:#C62828; }
  .tdm-evidence-status.PENDING  { background:#F2EFE9; color:#9B8F80; }

  .tdm-ev-actions { display: flex; gap: 6px; margin-left: auto; }
  .tdm-ev-btn {
    padding: 4px 10px; font-size: 11px; font-weight: 600;
    border: none; border-radius: 5px; cursor: pointer;
    font-family: 'DM Sans', sans-serif; letter-spacing: 0.03em;
    transition: opacity 0.15s;
  }
  .tdm-ev-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .tdm-ev-btn.accept { background: #E8F5E9; color: #2E7D32; }
  .tdm-ev-btn.accept:hover:not(:disabled) { background: #C8E6C9; }
  .tdm-ev-btn.reject { background: #FDE8E8; color: #C62828; }
  .tdm-ev-btn.reject:hover:not(:disabled) { background: #FFCDD2; }

  .tdm-feedback-box {
    background: #F9F8F6; border: 1px dashed #D4CFC7;
    border-radius: 8px; padding: 12px;
  }
  .tdm-feedback-input {
    width: 100%; padding: 8px 12px; border: 1px solid #D4CFC7;
    border-radius: 6px; font-size: 13px; font-family: 'DM Sans', sans-serif;
    color: #1C1A17; background: #FFFFFF; outline: none; box-sizing: border-box;
  }
  .tdm-feedback-input:focus { border-color: #1C1A17; }
  .tdm-feedback-actions { display: flex; gap: 8px; margin-top: 8px; }
  .tdm-confirm-reject {
    padding: 6px 12px; font-size: 12px; font-weight: 600;
    background: #C62828; color: #fff; border: none; border-radius: 6px;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    transition: background 0.15s;
  }
  .tdm-confirm-reject:hover:not(:disabled) { background: #B71C1C; }
  .tdm-cancel-link {
    background: none; border: none; font-size: 12px; color: #9B8F80;
    cursor: pointer; font-family: 'DM Sans', sans-serif; padding: 6px 4px;
  }
  .tdm-rejection-reason {
    font-size: 12px; color: #C62828; background: #FDE8E8;
    padding: 8px 10px; border-radius: 6px;
  }

  /* ── Upload ── */
  .tdm-upload-zone {
    border: 1.5px dashed #D4CFC7; border-radius: 10px;
    padding: 20px; text-align: center; background: #FAFAF8;
    transition: border-color 0.15s, background 0.15s; cursor: pointer;
  }
  .tdm-upload-zone:hover { border-color: #B0A699; background: #F5F3EF; }
  .tdm-upload-hint { font-size: 12px; color: #B0A699; margin-top: 6px; }
  .tdm-select-btn {
    background: #FFFFFF; border: 1px solid #D4CFC7;
    border-radius: 7px; padding: 8px 16px;
    font-size: 13px; font-weight: 500; color: #3D3830;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    transition: border-color 0.15s, background 0.15s;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .tdm-select-btn:hover { border-color: #B0A699; background: #F5F3EF; }

  .tdm-upload-preview {
    display: flex; align-items: center;
    background: #FFFFFF; border: 1px solid #EAE7E1;
    border-radius: 10px; padding: 12px 14px; gap: 12px;
  }
  .tdm-upload-actions { display: flex; gap: 8px; margin-left: auto; }
  .tdm-confirm-upload {
    padding: 8px 16px; background: #1C1A17; color: #FAFAF8;
    border: none; border-radius: 7px; font-size: 13px; font-weight: 600;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    transition: background 0.15s;
  }
  .tdm-confirm-upload:hover:not(:disabled) { background: #2D2A26; }
  .tdm-confirm-upload:disabled { background: #D4CFC7; cursor: not-allowed; }

  /* ── Danger zone ── */
  .tdm-danger-zone {
    margin-top: 4px; padding: 14px 16px;
    background: #FFF5F5; border: 1px solid #FFCDD2;
    border-radius: 10px;
  }
  .tdm-danger-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #E53935; margin: 0 0 10px; display: block; }
  .tdm-cancel-task-btn {
    width: 100%; padding: 10px;
    background: transparent; color: #C62828;
    border: 1px solid #FFCDD2; border-radius: 7px;
    font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: background 0.15s;
  }
  .tdm-cancel-task-btn:hover:not(:disabled) { background: #FDE8E8; }
  .tdm-cancel-task-btn:disabled { opacity: 0.6; cursor: wait; }
  .tdm-danger-hint { font-size: 11px; color: #9B8F80; margin: 8px 0 0; line-height: 1.5; }

  /* ── Completed rating display ── */
  .tdm-rating-display {
    background: #FFFFFF; border: 1px solid #EAE7E1;
    border-radius: 10px; padding: 14px 16px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .tdm-rating-display h4 { margin: 0 0 2px; font-size: 13px; font-weight: 600; color: #1C1A17; }
  .tdm-rating-display p  { margin: 0; font-size: 11px; color: #9B8F80; }
  .tdm-rating-stars-display { display: flex; gap: 2px; font-size: 20px; color: #F59E0B; }

  .tdm-pending-rating {
    background: #FFFBF5; border: 1px solid #F0D9B5;
    border-radius: 10px; padding: 14px 16px;
  }
  .tdm-pending-rating h4 { margin: 0 0 2px; font-size: 13px; font-weight: 600; color: #7C5109; }
  .tdm-pending-rating p  { margin: 0 0 12px; font-size: 12px; color: #A0622A; }
  .tdm-submit-rating-btn {
    width: 100%; padding: 9px;
    background: #7C5109; color: #FFFBF5;
    border: none; border-radius: 7px; font-size: 13px; font-weight: 600;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    margin-top: 12px; transition: background 0.15s;
  }
  .tdm-submit-rating-btn:hover:not(:disabled) { background: #5C3D1A; }
  .tdm-submit-rating-btn:disabled { background: #D4CFC7; cursor: not-allowed; }

  .tdm-awaiting-rating {
    background: #F9F8F6; border: 1px dashed #D4CFC7;
    border-radius: 10px; padding: 14px 16px;
    text-align: center; font-size: 12px; color: #B0A699; font-style: italic;
  }

  /* ── Empty/loading states ── */
  .tdm-empty { color: #B0A699; font-style: italic; font-size: 13px; padding: 12px 0; }
  .tdm-loading { color: #B0A699; font-size: 13px; padding: 12px 0; }
`;

/* ─── inject styles once ─── */
if (!document.getElementById('tdm-styles')) {
  const el = document.createElement('style');
  el.id = 'tdm-styles';
  el.textContent = STYLES;
  document.head.appendChild(el);
}

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
const TaskDetailsModal = ({ task, onClose }) => {
  const storedRoles = JSON.parse(localStorage.getItem('roles') || '[]');
  const isManagerOrAdmin =
    storedRoles.includes('ROLE_MANAGER') ||
    storedRoles.includes('ROLE_SUPER_ADMIN');
  const currentUser = JSON.parse(localStorage.getItem('user')) || {
    id: localStorage.getItem('employeeId'),
  };

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [ticketComments, setTicketComments] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const [rating, setRating] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [activeReview, setActiveReview] = useState({
    id: null,
    status: null,
    feedback: '',
  });

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [reviewingEvidence, setReviewingEvidence] = useState(false);

  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (task?.id) loadData();
  }, [task]);

  const loadData = async () => {
    try {
      setLoading(true);
      const promises = [getTaskComments(task.id), getTaskEvidence(task.id)];
      if (task.sourceTicketId) {
        promises.push(
          axiosInstance
            .get(`/tasks/${task.id}/source-ticket/comments`)
            .then((r) => r.data)
            .catch(() => [])
        );
      }
      const results = await Promise.all(promises);
      setComments(results[0]);
      setEvidenceList(results[1]);
      if (task.sourceTicketId && results[2]) setTicketComments(results[2]);

      console.log('Full task object:', task);
      console.log('sourceTicketId:', task.sourceTicketId);
      console.log('Task comments:', results[0]);
      console.log('Evidence:', results[1]);
      if (task.sourceTicketId) console.log('Ticket comments:', results[2]);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Failed to load data',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      setSendingComment(true);
      const saved = await addTaskComment(task.id, newComment);
      setComments((prev) => [...prev, saved]);
      setNewComment('');
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Failed to post comment',
      });
    } finally {
      setSendingComment(false);
    }
  };

  const handleApproveAndComplete = async () => {
    if (rating === 0) {
      setAlert({
        type: 'error',
        message: 'Provide a 1–5 star rating before completing.',
      });
      return;
    }
    try {
      setIsCompleting(true);
      await axiosInstance.patch(`/tasks/${task.id}/status`, {
        status: 'COMPLETED',
      });
      await axiosInstance.post(`/tasks/${task.id}/rate`, { rating });
      setAlert({ type: 'success', message: 'Task completed and rated!' });
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
      setIsCompleting(true);
      await axiosInstance.post(`/tasks/${task.id}/rate`, { rating });
      setAlert({ type: 'success', message: 'Rating submitted!' });
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

  const handleCancelTask = async () => {
    if (
      !window.confirm(
        'Cancel this task? This removes it from the active workflow.'
      )
    )
      return;
    try {
      setIsCanceling(true);
      await axiosInstance.patch(`/tasks/${task.id}/status`, {
        status: 'CANCELLED',
      });
      setAlert({ type: 'success', message: 'Task cancelled.' });
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
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
      setAlert(null);
    }
  };
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const handleFileUpload = async () => {
    if (!selectedFile) return;
    try {
      setUploading(true);
      const newEvidence = await uploadTaskEvidence(task.id, selectedFile);
      setEvidenceList((prev) => [...prev, newEvidence]);
      setAlert({ type: 'success', message: 'Evidence uploaded!' });
      handleRemoveFile();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Upload failed' });
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
      const updated = await reviewTaskEvidence(
        evidenceId,
        status,
        status === 'REJECTED' ? activeReview.feedback : ''
      );
      setEvidenceList((prev) =>
        prev.map((e) => (e.id === evidenceId ? updated : e))
      );
      setAlert({
        type: 'success',
        message: `Evidence ${status.toLowerCase()}.`,
      });
      setActiveReview({ id: null, status: null, feedback: '' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Review failed' });
    } finally {
      setReviewingEvidence(false);
    }
  };

  const Stars = ({ value, onChange }) => (
    <div className="tdm-stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          className="tdm-star-btn"
          onClick={() => onChange(s)}
          style={{ color: value >= s ? '#F59E0B' : '#D4CFC7' }}
        >
          ★
        </button>
      ))}
    </div>
  );

  const statusClass = task.status?.toLowerCase().replace('_', '_') || 'todo';

  return (
    <div className="tdm-overlay" onClick={onClose}>
      <div className="tdm-modal" onClick={(e) => e.stopPropagation()}>
        {/* ALERT */}
        {alert && (
          <div style={{ padding: '12px 24px 0' }}>
            <AlertMessage
              error={alert.type === 'error' ? alert.message : null}
              success={alert.type === 'success' ? alert.message : null}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        {/* HEADER */}
        <div className="tdm-header">
          <div>
            <span className="tdm-code">{task.taskCode}</span>
            <h2 className="tdm-title">{task.title}</h2>
            <div className="tdm-meta-row">
              <span className={`tdm-status ${statusClass}`}>
                {task.status?.replace(/_/g, ' ')}
              </span>
              <span
                className={`tdm-badge priority-${task.priority?.toLowerCase()}`}
              >
                {task.priority}
              </span>
              {task.sourceTicketId && (
                <span
                  className="tdm-badge"
                  style={{
                    background: '#FFF3DC',
                    color: '#7C5109',
                    borderColor: '#F0D9B5',
                  }}
                >
                  Helpdesk
                </span>
              )}
            </div>
          </div>
          <button className="tdm-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="tdm-body">
          {/* ── LEFT COLUMN ── */}
          <div className="tdm-col">
            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <span className="tdm-section-label">Description</span>
              <div className="tdm-desc">
                {task.description || 'No description provided.'}
              </div>
            </div>

            {/* Info row */}
            <div className="tdm-info-grid" style={{ marginBottom: '20px' }}>
              <div className="tdm-info-item">
                <label>Due date</label>
                <span>
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : '—'}
                </span>
              </div>
              <div className="tdm-info-item">
                <label>Assigned to</label>
                <span>{task.assignedToName || '—'}</span>
              </div>
              <div className="tdm-info-item">
                <label>Assigned by</label>
                <span>{task.assignerName || '—'}</span>
              </div>
            </div>

            <div className="tdm-divider" />

            {/* COMPLETED rating display or late-rating */}
            {task.status === 'COMPLETED' && (
              <div style={{ marginBottom: '20px' }}>
                {task.managerRating ? (
                  <div className="tdm-rating-display">
                    <div>
                      <h4>Manager rating</h4>
                      <p>Final performance score</p>
                    </div>
                    <div className="tdm-rating-stars-display">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s}>
                          {task.managerRating >= s ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : isManagerOrAdmin ? (
                  <div className="tdm-pending-rating">
                    <h4>⚠ Rating required</h4>
                    <p>This task was completed without a performance rating.</p>
                    <Stars value={rating} onChange={setRating} />
                    <button
                      className="tdm-submit-rating-btn"
                      onClick={handleLateRating}
                      disabled={isCompleting || rating === 0}
                    >
                      {isCompleting ? 'Saving...' : 'Submit rating'}
                    </button>
                  </div>
                ) : (
                  <div className="tdm-awaiting-rating">
                    Awaiting manager rating…
                  </div>
                )}
              </div>
            )}

            {/* EVIDENCE */}
            <div>
              <span className="tdm-section-label">Proof of work</span>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginBottom: '14px',
                }}
              >
                {loading ? (
                  <p className="tdm-loading">Loading evidence…</p>
                ) : evidenceList.length === 0 ? (
                  <p className="tdm-empty">No files uploaded yet.</p>
                ) : (
                  evidenceList.map((file) => (
                    <div key={file.id} className="tdm-evidence-item">
                      <div className="tdm-evidence-row">
                        <div className="tdm-evidence-icon">📄</div>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            gap: '3px',
                          }}
                        >
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tdm-evidence-name"
                          >
                            {file.fileName || 'Unknown file'}
                          </a>
                          <div
                            style={{
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'center',
                            }}
                          >
                            <span className="tdm-evidence-date">
                              {file.createdAt
                                ? new Date(file.createdAt).toLocaleDateString()
                                : 'Just now'}
                            </span>
                            <span
                              className={`tdm-evidence-status ${file.status || 'PENDING'}`}
                            >
                              {file.status || 'PENDING'}
                            </span>
                          </div>
                        </div>
                        {isManagerOrAdmin &&
                          (file.status === 'PENDING' || !file.status) &&
                          activeReview.id !== file.id && (
                            <div className="tdm-ev-actions">
                              <button
                                className="tdm-ev-btn accept"
                                disabled={reviewingEvidence}
                                onClick={() =>
                                  handleEvidenceReview(file.id, 'ACCEPTED')
                                }
                              >
                                ✓ Accept
                              </button>
                              <button
                                className="tdm-ev-btn reject"
                                disabled={reviewingEvidence}
                                onClick={() =>
                                  handleEvidenceReview(file.id, 'REJECTED')
                                }
                              >
                                ✕ Reject
                              </button>
                            </div>
                          )}
                      </div>

                      {activeReview.id === file.id &&
                        activeReview.status === 'REJECTED' && (
                          <div className="tdm-feedback-box">
                            <input
                              className="tdm-feedback-input"
                              type="text"
                              placeholder="Reason for rejection (optional)"
                              value={activeReview.feedback}
                              onChange={(e) =>
                                setActiveReview({
                                  ...activeReview,
                                  feedback: e.target.value,
                                })
                              }
                              autoFocus
                            />
                            <div className="tdm-feedback-actions">
                              <button
                                className="tdm-confirm-reject"
                                disabled={reviewingEvidence}
                                onClick={() =>
                                  handleEvidenceReview(file.id, 'REJECTED')
                                }
                              >
                                Confirm rejection
                              </button>
                              <button
                                className="tdm-cancel-link"
                                onClick={() =>
                                  setActiveReview({
                                    id: null,
                                    status: null,
                                    feedback: '',
                                  })
                                }
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                      {file.status === 'REJECTED' && file.reviewFeedback && (
                        <div className="tdm-rejection-reason">
                          <strong>Reason:</strong> {file.reviewFeedback}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Upload */}
              {task.assignedToId === currentUser.id && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  {!selectedFile ? (
                    <div
                      className="tdm-upload-zone"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <button
                        className="tdm-select-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current.click();
                        }}
                      >
                        📎 Select evidence file
                      </button>
                      <p className="tdm-upload-hint">
                        Click to browse documents
                      </p>
                    </div>
                  ) : (
                    <div className="tdm-upload-preview">
                      <span style={{ fontSize: '20px' }}>📄</span>
                      <div>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#1C1A17',
                          }}
                        >
                          {selectedFile.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9B8F80' }}>
                          Ready to upload
                        </div>
                      </div>
                      <div className="tdm-upload-actions">
                        <button
                          className="tdm-cancel-link"
                          disabled={uploading}
                          onClick={handleRemoveFile}
                        >
                          Cancel
                        </button>
                        <button
                          className="tdm-confirm-upload"
                          disabled={uploading}
                          onClick={handleFileUpload}
                        >
                          {uploading ? 'Uploading…' : 'Confirm upload'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Danger zone */}
            {isManagerOrAdmin &&
              !['COMPLETED', 'CANCELLED'].includes(task.status) && (
                <div style={{ marginTop: '24px' }}>
                  <div className="tdm-danger-zone">
                    <span className="tdm-danger-label">Danger zone</span>
                    <button
                      className="tdm-cancel-task-btn"
                      disabled={isCanceling}
                      onClick={handleCancelTask}
                    >
                      {isCanceling ? 'Canceling…' : '🚫 Cancel this task'}
                    </button>
                    <p className="tdm-danger-hint">
                      Removes this task from the active workflow. This action is
                      difficult to reverse.
                    </p>
                  </div>
                </div>
              )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="tdm-col tdm-col-right">
            {/* Manager review panel */}
            {isManagerOrAdmin && task.status === 'IN_REVIEW' && (
              <div className="tdm-review-panel">
                <h4>Review & approval</h4>
                <p>
                  Rate the employee's performance to officially close this task.
                </p>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '14px' }}
                >
                  <Stars value={rating} onChange={setRating} />
                  <span
                    style={{
                      fontSize: '13px',
                      color: '#7A6F63',
                      fontWeight: 500,
                    }}
                  >
                    {rating > 0 ? `${rating} / 5` : 'Select a rating'}
                  </span>
                </div>
                <button
                  className="tdm-approve-btn green"
                  onClick={handleApproveAndComplete}
                  disabled={isCompleting || rating === 0}
                >
                  {isCompleting ? 'Processing…' : 'Approve & complete task'}
                </button>
              </div>
            )}

            {/* Helpdesk context */}
            {task.sourceTicketId && (
              <div
                className="tdm-helpdesk-panel"
                style={{ marginBottom: '20px' }}
              >
                <div className="tdm-helpdesk-header">
                  <span>🎧</span>
                  <span>Original helpdesk context</span>
                </div>
                <div className="tdm-helpdesk-body">
                  {loading ? (
                    <p className="tdm-loading">Loading ticket context…</p>
                  ) : ticketComments.length === 0 ? (
                    <p className="tdm-empty">No original comments found.</p>
                  ) : (
                    ticketComments.map((tc) => (
                      <div key={tc.id} className="tdm-ticket-comment">
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span className="author">{tc.authorName}</span>
                          <span className="time">
                            {new Date(tc.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="body">{tc.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Task comments */}
            <span className="tdm-section-label">Developer activity</span>
            <div className="tdm-comments-list">
              {loading ? (
                <p className="tdm-loading">Loading…</p>
              ) : comments.length === 0 ? (
                <p className="tdm-comment-empty">
                  No comments yet. Be the first.
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="tdm-comment-bubble">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                      }}
                    >
                      <span className="author">{c.authorName}</span>
                      <span className="time">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="body">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            <form className="tdm-comment-form" onSubmit={handleSendComment}>
              <input
                className="tdm-comment-input"
                type="text"
                placeholder="Write a comment…"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button
                className="tdm-send-btn"
                type="submit"
                disabled={sendingComment || !newComment.trim()}
              >
                {sendingComment ? '…' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
