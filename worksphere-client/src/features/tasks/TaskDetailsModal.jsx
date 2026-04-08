import { useState, useEffect, useRef } from 'react';
import {
  getTaskComments,
  addTaskComment,
  uploadTaskEvidence,
  getTaskEvidence,
  reviewTaskEvidence,
  flagTask,
} from '../../api/taskApi';
import AlertMessage from '../../components/common/AlertMessage';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import axiosInstance from '../../api/axiosInstance';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../../components/ui/tabs';
import TaskInfoTab from './tabs/TaskInfoTab';
import CommentsTab from './tabs/CommentsTab';
import EvidenceTab from './tabs/EvidenceTab';

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
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', description: '', onConfirm: null });

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

  const [isFlagging, setIsFlagging] = useState(false);

  const handleFlagTask = async () => {
    // Using a native prompt for simplicity, but you could build a custom modal
    const reason = window.prompt(
      'Please enter the reason for flagging this task for audit:'
    );

    // Cancel if they click cancel or submit an empty string
    if (!reason || !reason.trim()) return;

    try {
      setIsFlagging(true);
      await flagTask(task.id, reason);
      setAlert({
        type: 'success',
        message: 'Task has been flagged for audit.',
      });

      // Reload the page to reflect the new flagged status on the board
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (err) {
      setAlert({
        type: 'error',
        message:
          err.response?.data?.message || err.message || 'Failed to flag task.',
      });
    } finally {
      setIsFlagging(false);
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

  const handleCancelTask = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Cancel Task',
      description: 'Cancel this task? This removes it from the active workflow.',
      onConfirm: async () => {
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
      }
    });
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
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className="text-xl transition-transform hover:scale-110"
          style={{ color: value >= s ? '#F59E0B' : '#D1D5DB' }}
        >
          ★
        </button>
      ))}
    </div>
  );

  const statusClass = task.status?.toLowerCase().replace('_', '_') || 'todo';

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="w-[920px] max-w-[95vw] max-h-[92vh] overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {alert && (
          <div className="px-6 pt-4">
            <AlertMessage
              error={alert.type === 'error' ? alert.message : null}
              success={alert.type === 'success' ? alert.message : null}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        {/* HEADER */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div>
            <div className="text-xs font-mono text-gray-500 mb-1">
              {task.taskCode}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {task.title}
            </h2>

            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="px-3 py-1 text-xs rounded-full bg-blue-50 text-blue-600">
                {task.status?.replace(/_/g, ' ')}
              </span>
              <span className="px-3 py-1 text-xs rounded-md bg-gray-100 text-gray-700">
                {task.priority}
              </span>
              {task.sourceTicketId && (
                <span className="px-3 py-1 text-xs rounded-md bg-amber-50 text-amber-700">
                  Helpdesk
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Show Flag button only to Auditors/Admins if task is NOT already flagged */}
            {(storedRoles.includes('ROLE_AUDITOR') ||
              storedRoles.includes('ROLE_SUPER_ADMIN')) &&
              !task.isFlagged && (
                <button
                  onClick={handleFlagTask}
                  disabled={isFlagging}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <span className="text-base">🚩</span>
                  {isFlagging ? 'Flagging...' : 'Flag Issue'}
                </button>
              )}

            {/* If it is already flagged, show a static badge here */}
            {task.isFlagged && (
              <span className="px-3 py-1.5 text-sm font-medium text-white bg-rose-500 rounded-lg flex items-center gap-1.5">
                <span className="text-base">🚩</span> Flagged
              </span>
            )}

            <button
              className="w-9 h-9 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center justify-center"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 flex-1 overflow-y-auto">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid grid-cols-3 bg-gray-50 p-1 rounded-xl border border-gray-200 mb-6">
              <TabsTrigger
                value="info"
                className="text-sm text-gray-600 rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                Task Info
              </TabsTrigger>
              <TabsTrigger
                value="evidence"
                className="text-sm text-gray-600 rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                Evidence & Review
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="text-sm text-gray-600 rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                Comments ({comments?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-0">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <TaskInfoTab task={task} />
              </div>
            </TabsContent>

            <TabsContent value="evidence" className="mt-0">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <EvidenceTab
                  task={task}
                  evidenceList={evidenceList}
                  loading={loading}
                  uploading={uploading}
                  selectedFile={selectedFile}
                  fileInputRef={fileInputRef}
                  handleFileSelect={handleFileSelect}
                  handleRemoveFile={handleRemoveFile}
                  handleFileUpload={handleFileUpload}
                  handleEvidenceReview={handleEvidenceReview}
                  activeReview={activeReview}
                  setActiveReview={setActiveReview}
                  reviewingEvidence={reviewingEvidence}
                  isManager={isManagerOrAdmin}
                  isAuditor={storedRoles.includes('ROLE_AUDITOR')}
                  rating={rating}
                  setRating={setRating}
                  handleLateRating={handleLateRating}
                  isCompleting={isCompleting}
                  handleApproveAndComplete={handleApproveAndComplete}
                  handleCancelTask={handleCancelTask}
                  isCanceling={isCanceling}
                />
              </div>
            </TabsContent>

            <TabsContent value="comments" className="mt-0">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <CommentsTab
                  comments={comments}
                  ticketComments={ticketComments}
                  newComment={newComment}
                  setNewComment={setNewComment}
                  handleSendComment={handleSendComment}
                  sendingComment={sendingComment}
                  sourceTicketId={task.sourceTicketId}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        onConfirm={() => {
          if (confirmConfig.onConfirm) confirmConfig.onConfirm();
          setConfirmConfig({ ...confirmConfig, isOpen: false });
        }}
        onCancel={() =>
          setConfirmConfig({ ...confirmConfig, isOpen: false })
        }
      />
    </div>
  );
};

export default TaskDetailsModal;
