import React, { useState, useEffect } from 'react';
import {
  updateCandidateStatus,
  fetchInterviewsForCandidate,
  getCandidateResumeUrl,
  downloadCandidateResume,
} from '../../api/hiringApi';
import InterviewScheduleModal from './InterviewScheduleModal';
import InterviewFeedbackModal from './InterviewFeedbackModal';
import OfferGenerationModal from './OfferGenerationModal';
import FinalizeHireModal from './FinalizeHireModal';
import RejectionModal from './RejectionModal';
import { Button } from '@/components/ui/button';
import {
  X,
  Mail,
  Phone,
  FileText,
  ExternalLink,
  Calendar,
  CheckSquare,
  XCircle,
  FileSignature,
} from 'lucide-react';
import { toast } from 'sonner';

const CandidateDrawer = ({ candidate, onClose, onCandidateUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [interviews, setInterviews] = useState([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isGeneratingOffer, setIsGeneratingOffer] = useState(false);
  const [isFinalizingHire, setIsFinalizingHire] = useState(false);
  const [feedbackInterview, setFeedbackInterview] = useState(null);

  useEffect(() => {
    if (candidate) loadInterviews();
  }, [candidate]);

  const loadInterviews = async () => {
    try {
      const res = await fetchInterviewsForCandidate(candidate.id);
      setInterviews(res.data);
      console.log('Loaded interviews:', res.data);
    } catch (e) {
      console.error('Failed to load interviews', e);
    }
  };

  if (!candidate) return null;

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      await updateCandidateStatus(candidate.id, newStatus, null);
      toast.success('Candidate status updated');
      onCandidateUpdated();
      onClose();
    } catch (error) {
      console.error('Failed to update status', error);
      toast.error('Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResume = async () => {
    try {
      console.log('Fetching resume for candidate:', candidate.id);
      const response = await downloadCandidateResume(candidate.id);
      console.log('Response:', response);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to load resume', error);
      toast.error('Failed to load resume. Please try again.');
    }
  };

  const confirmRejection = async (reason) => {
    setShowRejectionModal(false);
    setLoading(true);
    try {
      await updateCandidateStatus(candidate.id, 'REJECTED', reason);
      toast.success('Candidate rejected');
      onCandidateUpdated();
      onClose();
    } catch (error) {
      console.error('Failed to reject candidate', error);
      toast.error('Failed to reject candidate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyRejected = candidate.status === 'REJECTED';
  const isAlreadyAccepted = candidate.status === 'ACCEPTED';

  return (
    <>
      {/* Rejection modal — rendered outside the drawer so it overlays everything */}
      {showRejectionModal && (
        <RejectionModal
          candidateName={candidate.fullName}
          onConfirm={confirmRejection}
          onCancel={() => setShowRejectionModal(false)}
        />
      )}

      <div className="fixed inset-y-0 right-0 w-full md:w-1/3 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 z-40 flex flex-col">
        {/* Drawer header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Candidate Details
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Header Info */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {candidate.fullName}
            </h3>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                {candidate.status}
              </span>
              <span>•</span>
              <span>Source: {candidate.source}</span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Contact Information
            </h4>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Mail className="h-4 w-4 text-gray-400" />
                <a
                  href={`mailto:${candidate.email}`}
                  className="hover:text-blue-500 transition-colors"
                >
                  {candidate.email}
                </a>
              </div>
              {candidate.phone && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{candidate.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Application Materials */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Application Materials
            </h4>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                onClick={handleViewResume}
              >
                <FileText className="mr-2 h-4 w-4 text-blue-500" />
                View Uploaded Resume
                <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
              </Button>

              {/* External resume URL — Google Drive, LinkedIn, etc. */}
              {candidate.resumeUrl ? (
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => window.open(candidate.resumeUrl, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4 text-blue-500" />
                  View Resume Link
                  <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
                </Button>
              ) : null}

              {/* Fallback if neither exists */}
              {!candidate.resumeFileUrl && !candidate.resumeUrl && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-400 dark:text-gray-500">
                  <FileText className="h-4 w-4" />
                  No resume provided
                </div>
              )}

              {candidate.coverNote && (
                <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
                  <h5 className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2 uppercase tracking-wider">
                    Cover Note
                  </h5>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {candidate.coverNote}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Rejection reason — shown if already rejected */}
          {isAlreadyRejected && candidate.rejectionReason && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-100 dark:border-red-800">
              <h5 className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1 uppercase tracking-wider">
                Rejection Reason
              </h5>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {candidate.rejectionReason}
              </p>
            </div>
          )}

          {/* Interviews Section */}
          {[
            'INTERVIEWING',
            'OFFERED',
            'ACCEPTED',
            'REJECTED',
            'DECLINED',
          ].includes(candidate.status) && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  Interviews
                </h4>
                {candidate.status === 'INTERVIEWING' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsScheduling(true)}
                    className="h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <Calendar className="mr-2 h-3 w-3" /> Schedule New
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {interviews.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    No interviews scheduled yet.
                  </p>
                ) : (
                  interviews.map((inv) => (
                    <div
                      key={inv.id}
                      className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 relative hover:shadow-sm transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          Round {inv.roundNumber}: {inv.mode}
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            inv.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-3 flex items-center justify-between">
                        <span>
                          {new Date(inv.scheduledAt).toLocaleString()}
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-300 ml-2">
                          with {inv.interviewerFirstName}
                        </span>
                      </div>
                      {inv.status === 'COMPLETED' ? (
                        <div className="text-xs bg-white dark:bg-gray-900 p-2 rounded border border-gray-100 dark:border-gray-700">
                          <div className="font-semibold text-amber-500 mb-1">
                            Score: {inv.score}/5
                          </div>
                          <div className="text-gray-600 dark:text-gray-400 italic">
                            "{inv.feedback}"
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full text-xs h-7 mt-1 bg-white hover:bg-gray-100 dark:bg-gray-800 border shadow-sm"
                          onClick={() => setFeedbackInterview(inv)}
                        >
                          Submit Feedback
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {!isAlreadyRejected && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                Quick Actions
              </h4>

              <div className="grid grid-cols-2 gap-3">
                {candidate.status === 'APPLIED' && (
                  <Button
                    onClick={() => handleStatusChange('SHORTLISTED')}
                    className="bg-blue-600 hover:bg-blue-700 w-full"
                    disabled={loading}
                  >
                    <CheckSquare className="mr-2 h-4 w-4" /> Shortlist
                  </Button>
                )}
                {candidate.status === 'SHORTLISTED' && (
                  <Button
                    onClick={() => handleStatusChange('INTERVIEWING')}
                    className="bg-amber-500 hover:bg-amber-600 text-white w-full"
                    disabled={loading}
                  >
                    <Calendar className="mr-2 h-4 w-4" /> Move to Interviews
                  </Button>
                )}
                {candidate.status === 'INTERVIEWING' && (
                  <Button
                    onClick={() => handleStatusChange('OFFERED')}
                    className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                    disabled={loading}
                  >
                    <CheckSquare className="mr-2 h-4 w-4" /> Move to Offer Stage
                  </Button>
                )}
                {candidate.status === 'OFFERED' && (
                  <Button
                    onClick={() => setIsGeneratingOffer(true)}
                    className="bg-green-600 hover:bg-green-700 text-white w-full"
                    disabled={loading}
                  >
                    <FileSignature className="mr-2 h-4 w-4" /> Generate Offer
                    Letter
                  </Button>
                )}
                {candidate.status === 'ACCEPTED' && (
                  <Button
                    onClick={() => setIsFinalizingHire(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white w-full"
                    disabled={loading}
                  >
                    <CheckSquare className="mr-2 h-4 w-4" /> Finalize Hire &
                    Invite
                  </Button>
                )}

                {/* Reject button — disabled if already accepted */}
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectionModal(true)}
                  className="w-full"
                  disabled={loading || isAlreadyAccepted}
                >
                  <XCircle className="mr-2 h-4 w-4" /> Reject
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sub-modals */}
        {isScheduling && (
          <InterviewScheduleModal
            candidate={candidate}
            onClose={() => setIsScheduling(false)}
            onScheduled={() => {
              loadInterviews();
              onCandidateUpdated();
            }}
          />
        )}

        {feedbackInterview && (
          <InterviewFeedbackModal
            interview={feedbackInterview}
            onClose={() => setFeedbackInterview(null)}
            onFeedbackSubmitted={() => {
              loadInterviews();
              onCandidateUpdated();
            }}
          />
        )}

        {isGeneratingOffer && (
          <OfferGenerationModal
            candidate={candidate}
            onClose={() => setIsGeneratingOffer(false)}
            onOfferGenerated={() => {
              onCandidateUpdated();
            }}
          />
        )}

        {isFinalizingHire && (
          <FinalizeHireModal
            isOpen={isFinalizingHire}
            onClose={() => setIsFinalizingHire(false)}
            candidate={candidate}
            onHireFinalized={() => {
              onCandidateUpdated();
            }}
          />
        )}
      </div>
    </>
  );
};

export default CandidateDrawer;
