import React, { useState, useEffect } from 'react';
import PendingLeaveTable from '../features/leave/PendingLeaveTable';
import LeaveActionModal from '../features/leave/LeaveActionModal';
import { getPendingLeaveRequests } from '../api/leaveApi';

const LeaveApprovalsPage = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await getPendingLeaveRequests();
      setPendingRequests(data);
    } catch (error) {
      console.error('Failed to load pending requests', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openModal = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setActionType(null);
  };

  const handleActionSuccess = () => {
    closeModal();
    fetchRequests(); // Refetch the table so the approved/rejected request disappears
  };

  return (
    <div className="max-w-7xl mx-auto p-6 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Team Leave Approvals
        </h1>
        <p className="text-gray-500 mt-1">
          Review and manage time-off requests from your team.
        </p>
      </div>

      {isLoading ? (
        <div className="p-10 flex justify-center text-gray-500">
          Loading requests...
        </div>
      ) : (
        <PendingLeaveTable
          requests={pendingRequests}
          onActionClick={openModal}
        />
      )}

      {selectedRequest && (
        <LeaveActionModal
          request={selectedRequest}
          action={actionType}
          onClose={closeModal}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
};

export default LeaveApprovalsPage;
