import React, { useState } from 'react';
import { Check, Clock, X as XIcon, Edit2, Ban } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cancelLeaveRequest } from '@/api/leaveApi';
import { toast } from 'sonner';

import LeaveRequestForm from './LeaveRequestForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const MyLeaveRequestsTable = ({ requests, onRefresh, balances }) => {
  const [editingRequest, setEditingRequest] = useState(null);
  const [cancelingRequest, setCancelingRequest] = useState(null);
  const [isCanceling, setIsCanceling] = useState(false);

  if (!requests || requests.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
        You have no leave requests.
      </div>
    );
  }

  const LeaveStatusTimeline = ({ status = 'PENDING' }) => {
    const isApproved = status === 'APPROVED';
    const isRejected = status === 'REJECTED';
    const isCancelled = status === 'CANCELLED';
    const isPending = status === 'PENDING';

    return (
      <div className="flex items-center gap-1.5 w-max">
        {/* Step 1: Submitted */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex flex-col items-center justify-center w-5 h-5 rounded-full ring-2 ring-white cursor-help ${isCancelled ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
              <Check size={10} strokeWidth={3} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Request Submitted</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-4 h-[2px] bg-gray-200" />

        {/* Step 2: Pending/Reviewed */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`flex flex-col items-center justify-center w-5 h-5 rounded-full ring-2 ring-white cursor-help ${isPending ? 'bg-amber-100 text-amber-600' : isCancelled ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 text-gray-400'}`}
            >
              {isPending ? (
                <Clock size={10} strokeWidth={2.5} />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{isPending ? 'Pending Manager Review' : (isCancelled ? 'Cancelled' : 'Review Completed')}</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-4 h-[2px] bg-gray-200" />

        {/* Step 3: Final Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`flex flex-col items-center justify-center w-5 h-5 rounded-full ring-2 ring-white cursor-help ${isApproved ? 'bg-emerald-100 text-emerald-600' : isRejected ? 'bg-red-100 text-red-600' : isCancelled ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-300'}`}
            >
              {isApproved ? (
                <Check size={10} strokeWidth={3} />
              ) : isRejected ? (
                <XIcon size={10} strokeWidth={3} />
              ) : isCancelled ? (
                <Ban size={10} strokeWidth={3} />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>
              {isApproved
                ? 'Leave Approved'
                : isRejected
                  ? 'Leave Rejected'
                  : isCancelled
                    ? 'Leave Cancelled'
                    : 'Awaiting Final Decision'}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  };

  const handleCancelConfirm = async () => {
    if (!cancelingRequest) return;
    setIsCanceling(true);
    try {
      await cancelLeaveRequest(cancelingRequest.id);
      toast.success('Leave request cancelled successfully.');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to cancel leave request:', error);
      toast.error(error?.response?.data?.message || 'Error cancelling request.');
    } finally {
      setIsCanceling(false);
      setCancelingRequest(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600 uppercase tracking-wider">
              <th className="p-4">Date (Start - End)</th>
              <th className="p-4">Policy</th>
              <th className="p-4">Days</th>
              <th className="p-4">Status</th>
              <th className="p-4 max-w-xs">Reason</th>
              <th className="p-4 max-w-xs">Manager Comment</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.map((item) => {
              const canEdit = item.status === 'PENDING';
              const canCancel = item.status !== 'REJECTED' && item.status !== 'CANCELLED';

              return (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-900 whitespace-nowrap">
                    {new Date(item.startDate).toLocaleDateString()} -{' '}
                    {new Date(item.endDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm text-gray-900 font-medium">
                    {item.leavePolicy?.name || 'Standard PTO'}
                  </td>
                  <td className="p-4 text-sm font-semibold text-gray-900">
                    {item.requestedDays}
                  </td>
                  <td className="p-4">
                    <LeaveStatusTimeline status={item.status} />
                  </td>
                  <td className="p-4 text-sm text-gray-500 max-w-xs truncate" title={item.reason}>
                    {item.reason}
                  </td>
                  <td className="p-4 text-sm text-gray-500 italic max-w-xs truncate" title={item.reviewerComment}>
                    {item.reviewerComment || '--'}
                  </td>
                  <td className="p-4 text-sm text-gray-500 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canEdit && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setEditingRequest(item)}
                          className="h-8 shadow-none"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                          Edit
                        </Button>
                      )}
                      
                      {canCancel && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setCancelingRequest(item)}
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Form Dialog */}
      <Dialog open={!!editingRequest} onOpenChange={(open) => { if (!open) setEditingRequest(null); }}>
        <DialogContent className="sm:max-w-lg p-0 border-none bg-transparent shadow-none">
          {editingRequest && balances && (
            <div className="bg-white rounded-xl shadow-xl overflow-hidden pointer-events-auto">
              <DialogHeader className="px-6 py-4 border-b">
                <DialogTitle className="text-slate-800">Edit Time Off Request</DialogTitle>
              </DialogHeader>
              <LeaveRequestForm
                balances={balances}
                initialData={editingRequest}
                onSuccess={() => {
                  setEditingRequest(null);
                  if (onRefresh) onRefresh();
                }}
                onCancel={() => setEditingRequest(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelingRequest} onOpenChange={(open) => { if (!open) setCancelingRequest(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel your leave request for{' '}
              {cancelingRequest?.startDate && new Date(cancelingRequest.startDate).toLocaleDateString()} to{' '}
              {cancelingRequest?.endDate && new Date(cancelingRequest.endDate).toLocaleDateString()}.
              {cancelingRequest?.status === 'APPROVED' ? ' The approved days will be credited back to your balance.' : ''}
              {' '}This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCanceling}>Go Back</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={isCanceling}
            >
              {isCanceling ? 'Cancelling...' : 'Yes, Cancel Request'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default MyLeaveRequestsTable;
