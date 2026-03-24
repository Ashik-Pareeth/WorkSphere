import React from 'react';
import { Check, Clock, X as XIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip';

const MyLeaveRequestsTable = ({ requests }) => {
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
    const isPending = status === 'PENDING';

    return (
      <div className="flex items-center gap-1.5 w-max">
        {/* Step 1: Submitted */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 ring-2 ring-white cursor-help">
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
              className={`flex flex-col items-center justify-center w-5 h-5 rounded-full ring-2 ring-white cursor-help ${isPending ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-400'}`}
            >
              {isPending ? (
                <Clock size={10} strokeWidth={2.5} />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{isPending ? 'Pending Manager Review' : 'Review Completed'}</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-4 h-[2px] bg-gray-200" />

        {/* Step 3: Final Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`flex flex-col items-center justify-center w-5 h-5 rounded-full ring-2 ring-white cursor-help ${isApproved ? 'bg-emerald-100 text-emerald-600' : isRejected ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-300'}`}
            >
              {isApproved ? (
                <Check size={10} strokeWidth={3} />
              ) : isRejected ? (
                <XIcon size={10} strokeWidth={3} />
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
                  : 'Awaiting Final Decision'}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
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
              <th className="p-4">Reason</th>
              <th className="p-4">Manager Comment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.map((item) => (
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
                <td className="p-4 text-sm text-gray-500 max-w-xs truncate">
                  {item.reason}
                </td>
                <td className="p-4 text-sm text-gray-500 italic max-w-xs truncate">
                  {item.reviewerComment || '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyLeaveRequestsTable;
