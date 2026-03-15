import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  fetchCandidatesByJob,
  updateCandidateStatus,
} from '../../api/hiringApi';
import CandidateDrawer from './CandidateDrawer';
import { ArrowLeft, Search, XCircle } from 'lucide-react';
import { toast } from 'sonner';

// 1. Separate the base active columns from the optional ones
const BASE_DEPARTMENTS = [
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
  // 2. Define the Rejected column styling
  REJECTED: {
    id: 'REJECTED',
    title: 'Rejected',
    color: 'border-l-4 border-red-500',
  },
};

const HiringPipelineBoard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // 3. Add state for the toggle
  const [showRejected, setShowRejected] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, [id]);

  const loadCandidates = async () => {
    try {
      const response = await fetchCandidatesByJob(id);
      console.log('Fetched Candidates from API:', response.data);
      setCandidates(response.data);
    } catch (error) {
      console.error('Failed to load candidates', error);
      toast.error('Failed to load candidates. Please try again.');
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

    const candidateId = draggableId;
    const newStatus = destination.droppableId;

    if (newStatus === 'OFFERED' || newStatus === 'ACCEPTED') {
      toast.error('Status Change Not Allowed', {
        description: newStatus === 'OFFERED' 
          ? 'Use the candidate profile to move to Offer Stage (requires interview).'
          : 'Candidate is automatically moved to Accepted upon offer link visit.'
      });
      return;
    }

    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status: newStatus } : c))
    );

    try {
      await updateCandidateStatus(candidateId, newStatus, null);
      toast.success('Candidate moved successfully');
    } catch (error) {
      console.error('Failed to update candidate status', error);
      toast.error('Update Failed', {
        description:
          'There was a problem moving the candidate. Reverting changes.',
      });
      loadCandidates();
    }
  };

  // 4. Quick Reject Handler
  const handleQuickReject = async (e, candidate) => {
    e.stopPropagation(); // Prevent opening the CandidateDrawer when clicking the icon

    // Optimistic UI update
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidate.id ? { ...c, status: 'REJECTED' } : c
      )
    );

    try {
      await updateCandidateStatus(candidate.id, 'REJECTED', null);
      toast.success(`${candidate.fullName} has been rejected.`);
    } catch (error) {
      console.error('Failed to quick reject', error);
      toast.error('Failed to reject candidate.');
      loadCandidates(); // Revert on failure
    }
  };

  const getCandidatesByStatus = (status) => {
    return candidates.filter((c) => c.status === status);
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">Loading Pipeline...</div>
    );

  // 5. Calculate derivations for rendering
  const rejectedCount = getCandidatesByStatus('REJECTED').length;
  const visibleDepartments = showRejected
    ? [...BASE_DEPARTMENTS, 'REJECTED']
    : BASE_DEPARTMENTS;

  return (
    <div className="p-6 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/hiring/jobs')}
            className="px-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Candidate Pipeline
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* 6. The Toggle Button */}
          <Button
            variant={showRejected ? 'secondary' : 'outline'}
            onClick={() => setShowRejected(!showRejected)}
            className={`border-red-200 hover:bg-red-50 ${showRejected ? 'bg-red-50 text-red-700' : 'text-red-600'}`}
          >
            <XCircle className="mr-2 h-4 w-4" />
            {showRejected
              ? 'Hide Rejected'
              : `Show Rejected (${rejectedCount})`}
          </Button>

          <Button
            variant="outline"
            onClick={() => window.open(`/jobs/${id}/apply`, '_blank')}
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Search className="mr-2 h-4 w-4" /> View Public Listing
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto min-h-0">
        <DragDropContext onDragEnd={handleDragEnd}>
          {/* 1. Add w-full and reduce the gap slightly to fit more nicely */}
          <div className="flex gap-4 h-full items-start pb-4 w-full min-w-250">
            {visibleDepartments.map((columnId) => {
              const column = COLUMNS[columnId];
              const columnCandidates = getCandidatesByStatus(columnId);

              return (
                <div
                  key={columnId}
                  className="flex-1 min-w-50 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl flex flex-col h-full max-h-full border"
                >
                  <div className="p-4 border-b flex justify-between items-center bg-white dark:bg-gray-800 rounded-t-xl">
                    <h2 className="font-semibold text-gray-700 dark:text-gray-300">
                      {column.title}{' '}
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
                        className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
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
                                className={`bg-white dark:bg-gray-800 shadow-sm hover:shadow relative group ${column.color} ${snapshot.isDragging ? 'shadow-lg ring-1 ring-blue-400' : ''}`}
                                onClick={() => setSelectedCandidate(candidate)}
                              >
                                <CardContent className="p-3">
                                  <div className="flex justify-between items-start">
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                      {candidate.fullName}
                                    </div>

                                    {/* 8. Quick Reject Icon Button */}
                                    {candidate.status !== 'REJECTED' &&
                                      candidate.status !== 'ACCEPTED' && (
                                        <button
                                          onClick={(e) =>
                                            handleQuickReject(e, candidate)
                                          }
                                          className="text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all focus:opacity-100"
                                          title="Quick Reject"
                                        >
                                          <XCircle className="h-4 w-4" />
                                        </button>
                                      )}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {candidate.source}
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
