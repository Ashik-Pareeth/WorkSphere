import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  fetchCandidatesByJob,
  fetchJobById,
  updateCandidateStatus,
  fetchInterviewsForCandidate,
} from '../../api/hiringApi';
import CandidateDrawer from './CandidateDrawer';
import RejectionModal from './RejectionModal';
import { ArrowLeft, Search, XCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const PIPELINE_STAGES = [
  'APPLIED',
  'SHORTLISTED',
  'INTERVIEWING',
  'OFFERED',
  'ACCEPTED',
];

const COLUMNS = {
  APPLIED: {
    id: 'APPLIED',
    title: 'Applied',
    accent: '#94a3b8',
    pill: 'bg-slate-100 text-slate-600',
  },
  SHORTLISTED: {
    id: 'SHORTLISTED',
    title: 'Shortlisted',
    accent: '#3b82f6',
    pill: 'bg-blue-50 text-blue-600',
  },
  INTERVIEWING: {
    id: 'INTERVIEWING',
    title: 'Interviewing',
    accent: '#f59e0b',
    pill: 'bg-amber-50 text-amber-700',
  },
  OFFERED: {
    id: 'OFFERED',
    title: 'Offered',
    accent: '#8b5cf6',
    pill: 'bg-violet-50 text-violet-700',
  },
  ACCEPTED: {
    id: 'ACCEPTED',
    title: 'Offer Accepted',
    accent: '#22c55e',
    pill: 'bg-emerald-50 text-emerald-700',
  },
  REJECTED: {
    id: 'REJECTED',
    title: 'Rejected',
    accent: '#ef4444',
    pill: 'bg-red-50 text-red-600',
  },
};

const getApiErrorMessage = (error, fallbackMessage) => {
  const responseData = error?.response?.data;

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData;
  }

  if (typeof responseData?.message === 'string' && responseData.message.trim()) {
    return responseData.message;
  }

  if (typeof responseData?.error === 'string' && responseData.error.trim()) {
    return responseData.error;
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
};

const HiringPipelineBoard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showRejected, setShowRejected] = useState(false);
  const [pendingRejection, setPendingRejection] = useState(null);

  useEffect(() => {
    loadCandidates();
  }, [id]);

  const loadCandidates = async () => {
    try {
      setLoadError('');

      const [candidatesRes, jobRes] = await Promise.all([
        fetchCandidatesByJob(id),
        fetchJobById(id),
      ]);

      const candidateList = Array.isArray(candidatesRes.data)
        ? candidatesRes.data
        : [];

      if (!Array.isArray(candidatesRes.data)) {
        console.error('Unexpected candidates payload', candidatesRes.data);
        setLoadError(
          'Candidates could not be loaded because the server returned an invalid response.'
        );
      }

      setCandidates(candidateList);
      setJob(jobRes.data);
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Failed to load candidates. Please try again.'
      );

      console.error('Failed to load candidates', error);
      setCandidates([]);
      setLoadError(message);
      toast.error('Failed to load candidates', {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const newStatus = destination.droppableId;
    const currentStatus = source.droppableId;

    if (newStatus === 'ACCEPTED') {
      toast.error('Action Not Allowed', {
        description:
          'The Accepted status is updated automatically when the candidate accepts the offer via email.',
      });
      return;
    }

    if (newStatus === 'OFFERED') {
      if (currentStatus !== 'INTERVIEWING') {
        toast.error('Invalid Transition', {
          description:
            'Candidates must be in the "Interviewing" stage before moving to "Offered".',
        });
        return;
      }

      try {
        const interviewRes = await fetchInterviewsForCandidate(draggableId);
        const interviews = Array.isArray(interviewRes.data)
          ? interviewRes.data
          : [];
        const hasPassedInterview = interviews.some(
          (interview) => interview.status === 'COMPLETED'
        );

        if (!hasPassedInterview) {
          toast.error('Incomplete Interview Process', {
            description:
              'The candidate must have at least one completed and evaluated interview before an offer can be generated.',
          });
          return;
        }
      } catch (error) {
        console.error('Validation failed', error);
        toast.error('Validation Error', {
          description:
            'Could not verify candidate interview status. Please check your connection and try again.',
        });
        return;
      }
    }

    if (newStatus === 'REJECTED') {
      setPendingRejection({ candidateId: draggableId });
      return;
    }

    setCandidates((prev) =>
      prev.map((c) => (c.id === draggableId ? { ...c, status: newStatus } : c))
    );

    updateCandidateStatus(draggableId, newStatus, null)
      .then(() => toast.success('Candidate moved successfully'))
      .catch((error) => {
        console.error('Failed to update candidate status', error);
        toast.error('Update Failed', {
          description:
            'There was a problem moving the candidate. Reverting changes.',
        });
        loadCandidates();
      });
  };

  const handleRejectClick = (candidateId) => {
    setPendingRejection({ candidateId });
  };

  const confirmRejection = async (reason) => {
    const { candidateId } = pendingRejection;
    setPendingRejection(null);

    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status: 'REJECTED' } : c))
    );
    setShowRejected(true);

    try {
      await updateCandidateStatus(candidateId, 'REJECTED', reason);
      toast.success('Candidate rejected');
    } catch (error) {
      console.error('Failed to reject candidate', error);
      toast.error('Failed to reject candidate. Reverting.');
      loadCandidates();
    }
  };

  const cancelRejection = () => setPendingRejection(null);

  const getCandidatesByStatus = (status) =>
    candidates.filter((c) => c.status === status);

  const activeColumns = showRejected
    ? [...PIPELINE_STAGES, 'REJECTED']
    : PIPELINE_STAGES;

  const rejectedCount = getCandidatesByStatus('REJECTED').length;

  const pendingCandidate = pendingRejection
    ? candidates.find((c) => c.id === pendingRejection.candidateId)
    : null;

  if (loading)
    return (
      <div
        style={{ fontFamily: "'Georgia', serif" }}
        className="p-8 text-center text-stone-400 text-sm tracking-wide"
      >
        Loading pipeline…
      </div>
    );

  return (
    <>
      {/* ── global page styles injected once ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Source+Sans+3:wght@400;500;600&display=swap');

        .pipeline-root {
          --cream: #faf9f6;
          --paper: #f3f1ec;
          --border: #e2ddd5;
          --border-strong: #ccc6bb;
          --text-primary: #1c1917;
          --text-secondary: #78716c;
          --text-muted: #a8a29e;
          font-family: 'Source Sans 3', sans-serif;
          background: var(--cream);
        }

        .pipeline-header-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--text-primary);
        }

        .pipeline-col {
          background: var(--paper);
          border: 1px solid var(--border);
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 100%;
          overflow: hidden;
          transition: box-shadow 0.15s ease;
        }

        .pipeline-col-header {
          padding: 10px 12px;
          border-bottom: 1px solid var(--border);
          background: #fff;
          border-radius: 10px 10px 0 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .pipeline-col-title {
          font-family: 'Source Sans 3', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .col-accent-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .col-count-badge {
          font-size: 11px;
          font-weight: 600;
          background: var(--paper);
          border: 1px solid var(--border);
          color: var(--text-muted);
          padding: 1px 7px;
          border-radius: 20px;
          line-height: 1.6;
        }

        .pipeline-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 11px;
          cursor: grab;
          transition: box-shadow 0.12s ease, border-color 0.12s ease;
          position: relative;
        }

        .pipeline-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.07);
          border-color: var(--border-strong);
        }

        .pipeline-card.dragging {
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          border-color: #a8a29e;
          cursor: grabbing;
        }

        .candidate-name {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .candidate-source {
          font-size: 11.5px;
          color: var(--text-muted);
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .reject-btn {
          color: #d4cfc9;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          transition: color 0.15s ease;
          flex-shrink: 0;
        }

        .reject-btn:hover {
          color: #ef4444;
        }

        .drop-zone {
          flex: 1;
          padding: 8px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 7px;
          transition: background 0.15s ease;
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }

        .drop-zone.over-normal {
          background: #edf4ff;
        }

        .drop-zone.over-reject {
          background: #fff1f1;
        }

        .drop-zone.disabled {
          background: #f8f7f4;
        }

        .btn-ghost-nav {
          background: none;
          border: 1px solid var(--border);
          border-radius: 7px;
          padding: 5px 9px;
          cursor: pointer;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          font-family: 'Source Sans 3', sans-serif;
          transition: background 0.12s, border-color 0.12s;
        }

        .btn-ghost-nav:hover {
          background: var(--paper);
          border-color: var(--border-strong);
        }

        .btn-outline-red {
          background: #fff;
          border: 1px solid #fca5a5;
          color: #dc2626;
          border-radius: 7px;
          padding: 5px 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-family: 'Source Sans 3', sans-serif;
          font-weight: 500;
          transition: background 0.12s, border-color 0.12s;
        }

        .btn-outline-red:hover {
          background: #fff5f5;
        }

        .btn-solid-red {
          background: #dc2626;
          border: 1px solid #dc2626;
          color: #fff;
          border-radius: 7px;
          padding: 5px 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-family: 'Source Sans 3', sans-serif;
          font-weight: 500;
          transition: background 0.12s;
        }

        .btn-solid-red:hover {
          background: #b91c1c;
        }

        .btn-outline-blue {
          background: #fff;
          border: 1px solid #bfdbfe;
          color: #2563eb;
          border-radius: 7px;
          padding: 5px 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-family: 'Source Sans 3', sans-serif;
          font-weight: 500;
          transition: background 0.12s;
        }

        .btn-outline-blue:hover {
          background: #eff6ff;
        }

        .rejected-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 20px;
          margin-left: 6px;
        }

        .col-automated-tag {
          font-size: 10px;
          color: var(--text-muted);
          font-weight: 400;
          letter-spacing: 0.04em;
          text-transform: none;
        }

        .left-accent-bar {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          border-radius: 8px 0 0 8px;
        }
      `}</style>

      <div
        className="pipeline-root"
        style={{
          padding: '20px 20px 16px',
          height: 'calc(100vh - 6rem)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {pendingRejection && pendingCandidate && (
          <RejectionModal
            candidateName={pendingCandidate.fullName}
            onConfirm={confirmRejection}
            onCancel={cancelRejection}
          />
        )}

        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn-ghost-nav"
              onClick={() => navigate('/hiring/jobs')}
            >
              <ArrowLeft size={15} />
            </button>
            <div>
              <h1
                className="pipeline-header-title"
                style={{ fontSize: '20px', margin: 0, lineHeight: 1.2 }}
              >
                {job?.title ?? 'Candidate Pipeline'}
              </h1>
              {job?.department?.name && (
                <p
                  style={{
                    fontSize: '12px',
                    color: '#a8a29e',
                    margin: '2px 0 0',
                    fontFamily: "'Source Sans 3', sans-serif",
                  }}
                >
                  {job.department.name}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {showRejected ? (
              <button
                className="btn-solid-red"
                onClick={() => setShowRejected(false)}
              >
                <EyeOff size={14} />
                Rejected
                {rejectedCount > 0 && (
                  <span
                    className="rejected-badge"
                    style={{
                      background: 'rgba(255,255,255,0.25)',
                      color: '#fff',
                    }}
                  >
                    {rejectedCount}
                  </span>
                )}
              </button>
            ) : (
              <button
                className="btn-outline-red"
                onClick={() => setShowRejected(true)}
              >
                <Eye size={14} />
                Rejected
                {rejectedCount > 0 && (
                  <span
                    className="rejected-badge"
                    style={{ background: '#fee2e2', color: '#dc2626' }}
                  >
                    {rejectedCount}
                  </span>
                )}
              </button>
            )}

            <button
              className="btn-outline-blue"
              onClick={() => window.open(`/jobs/${id}/apply`, '_blank')}
            >
              <Search size={14} />
              View Public Listing
            </button>
          </div>
        </div>

        {/* ── Board ── */}
        {loadError && (
          <div
            style={{
              marginBottom: '14px',
              border: '1px solid #fecaca',
              background: '#fff1f2',
              color: '#9f1239',
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            {loadError}
          </div>
        )}

        <div style={{ flex: 1, overflowX: 'auto', minHeight: 0 }}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${activeColumns.length}, minmax(0, 1fr))`,
                minWidth: `${activeColumns.length * 185}px`,
                gap: '10px',
                height: '100%',
                alignItems: 'start',
                paddingBottom: '12px',
              }}
            >
              {activeColumns.map((columnId) => {
                const column = COLUMNS[columnId];
                const columnCandidates = getCandidatesByStatus(columnId);
                const isDropDisabled = columnId === 'ACCEPTED';

                return (
                  <div
                    key={columnId}
                    className="pipeline-col"
                    style={{ opacity: isDropDisabled ? 0.85 : 1 }}
                  >
                    <div className="pipeline-col-header">
                      <span className="pipeline-col-title">
                        <span
                          className="col-accent-dot"
                          style={{ background: column.accent }}
                        />
                        {column.title}
                        {isDropDisabled && (
                          <span className="col-automated-tag">(Auto)</span>
                        )}
                      </span>
                      <span className="col-count-badge">
                        {columnCandidates.length}
                      </span>
                    </div>

                    <Droppable
                      droppableId={columnId}
                      isDropDisabled={isDropDisabled}
                    >
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`drop-zone ${
                            snapshot.isDraggingOver
                              ? columnId === 'REJECTED'
                                ? 'over-reject'
                                : 'over-normal'
                              : ''
                          } ${isDropDisabled ? 'disabled' : ''}`}
                        >
                          {columnCandidates.map((candidate, index) => (
                            <Draggable
                              key={candidate.id}
                              draggableId={candidate.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`pipeline-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                  onClick={() =>
                                    setSelectedCandidate(candidate)
                                  }
                                >
                                  {/* left accent bar */}
                                  <span
                                    className="left-accent-bar"
                                    style={{
                                      background: column.accent,
                                      opacity: 0.55,
                                    }}
                                  />

                                  <div
                                    style={{
                                      paddingLeft: '8px',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'flex-start',
                                      gap: '6px',
                                    }}
                                  >
                                    <div style={{ minWidth: 0 }}>
                                      <div className="candidate-name">
                                        {candidate.fullName}
                                      </div>
                                      <div className="candidate-source">
                                        {candidate.source}
                                      </div>
                                    </div>
                                    {columnId !== 'REJECTED' &&
                                      columnId !== 'ACCEPTED' && (
                                        <button
                                          className="reject-btn"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRejectClick(candidate.id);
                                          }}
                                          title="Reject candidate"
                                        >
                                          <XCircle size={15} />
                                        </button>
                                      )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>

        {selectedCandidate && (
          <CandidateDrawer
            candidate={selectedCandidate}
            onClose={() => setSelectedCandidate(null)}
            onCandidateUpdated={loadCandidates}
          />
        )}
      </div>
    </>
  );
};

export default HiringPipelineBoard;
