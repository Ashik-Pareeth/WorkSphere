import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  fetchCandidatesByJob,
  fetchJobById,
  updateCandidateStatus,
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
    color: 'border-l-4 border-gray-400',
  },
  SHORTLISTED: {
    id: 'SHORTLISTED',
    title: 'Shortlisted',
    color: 'border-l-4 border-blue-400',
  },
  INTERVIEWING: {
    id: 'INTERVIEWING',
    title: 'Interviewing',
    color: 'border-l-4 border-amber-400',
  },
  OFFERED: {
    id: 'OFFERED',
    title: 'Offered',
    color: 'border-l-4 border-purple-400',
  },
  ACCEPTED: {
    id: 'ACCEPTED',
    title: 'Offer Accepted',
    color: 'border-l-4 border-green-500',
  },
  REJECTED: {
    id: 'REJECTED',
    title: 'Rejected / Cancelled',
    color: 'border-l-4 border-red-400',
  },
};

const HiringPipelineBoard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showRejected, setShowRejected] = useState(false);
  const [pendingRejection, setPendingRejection] = useState(null);

  useEffect(() => {
    loadCandidates();
  }, [id]);

  const loadCandidates = async () => {
    try {
      const [candidatesRes, jobRes] = await Promise.all([
        fetchCandidatesByJob(id),
        fetchJobById(id),
      ]);
      setCandidates(candidatesRes.data);
      setJob(jobRes.data);
    } catch (error) {
      console.error('Failed to load candidates', error);
      toast.error('Failed to load candidates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const newStatus = destination.droppableId;

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
      <div className="p-8 text-center text-gray-500">Loading Pipeline...</div>
    );

  return (
    <div className="p-4 h-[calc(100vh-6rem)] flex flex-col">
      {pendingRejection && pendingCandidate && (
        <RejectionModal
          candidateName={pendingCandidate.fullName}
          onConfirm={confirmRejection}
          onCancel={cancelRejection}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/hiring/jobs')}
            className="px-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 leading-tight">
              {job?.title ?? 'Candidate Pipeline'}
            </h1>
            {job?.department?.name && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {job.department.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showRejected ? 'default' : 'outline'}
            onClick={() => setShowRejected((prev) => !prev)}
            size="sm"
            className={
              showRejected
                ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                : 'border-red-200 text-red-500 hover:bg-red-50'
            }
          >
            {showRejected ? (
              <EyeOff className="mr-2 h-4 w-4" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            Rejected
            {rejectedCount > 0 && (
              <span
                className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  showRejected
                    ? 'bg-red-400 text-white'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {rejectedCount}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => window.open(`/jobs/${id}/apply`, '_blank')}
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
            size="sm"
          >
            <Search className="mr-2 h-4 w-4" /> View Public Listing
          </Button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto min-h-0">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div
            className="grid h-full items-start pb-4 gap-3"
            style={{
              gridTemplateColumns: `repeat(${activeColumns.length}, minmax(0, 1fr))`,
              minWidth: `${activeColumns.length * 180}px`,
            }}
          >
            {activeColumns.map((columnId) => {
              const column = COLUMNS[columnId];
              const columnCandidates = getCandidatesByStatus(columnId);

              return (
                <div
                  key={columnId}
                  className="bg-gray-50/50 dark:bg-gray-900/50 rounded-xl flex flex-col h-full max-h-full border min-w-0"
                >
                  <div className="p-3 border-b flex items-center justify-between bg-white dark:bg-gray-800 rounded-t-xl">
                    <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm truncate">
                      {column.title}
                      <span className="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full">
                        {columnCandidates.length}
                      </span>
                    </h2>
                  </div>

                  <Droppable droppableId={columnId}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 p-2 overflow-y-auto space-y-2 transition-colors ${
                          snapshot.isDraggingOver
                            ? columnId === 'REJECTED'
                              ? 'bg-red-50/60 dark:bg-red-900/20'
                              : 'bg-blue-50/50 dark:bg-blue-900/20'
                            : ''
                        }`}
                      >
                        {columnCandidates.map((candidate, index) => (
                          <Draggable
                            key={candidate.id}
                            draggableId={candidate.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white dark:bg-gray-800 shadow-sm hover:shadow relative ${column.color} ${
                                  snapshot.isDragging
                                    ? 'shadow-lg ring-1 ring-blue-400'
                                    : ''
                                }`}
                                onClick={() => setSelectedCandidate(candidate)}
                              >
                                <CardContent className="p-2.5">
                                  <div className="flex justify-between items-start gap-1">
                                    <div className="min-w-0">
                                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                        {candidate.fullName}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-0.5 truncate">
                                        {candidate.source}
                                      </div>
                                    </div>
                                    {columnId !== 'REJECTED' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRejectClick(candidate.id);
                                        }}
                                        className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors mt-0.5"
                                        title="Reject candidate"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
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
  );
};

export default HiringPipelineBoard;
