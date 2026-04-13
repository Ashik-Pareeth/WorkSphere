import React, { useState, useEffect } from 'react';
import PendingLeaveTable from '../features/leave/PendingLeaveTable';
import LeaveActionModal from '../features/leave/LeaveActionModal';
import { getAllPendingLeaveRequests } from '../api/leaveApi';

const GlobalLeaveApprovalsPage = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null);

  const fetchRequests = async () => {
    setIsLoading(true);

    try {
      const data = await getAllPendingLeaveRequests();
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
    fetchRequests();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Global Leave Approvals
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Review and approve or reject leave requests from across the company.
        </p>
      </div>

      {/* TABLE CARD */}
      <section className="bg-white border rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-slate-800">
            All Pending Requests
          </h2>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center text-slate-500 py-10">
              Loading requests...
            </div>
          ) : (
            <PendingLeaveTable
              requests={pendingRequests}
              onActionClick={openModal}
            />
          )}
        </div>
      </section>

      {/* ACTION MODAL */}
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

export default GlobalLeaveApprovalsPage;
