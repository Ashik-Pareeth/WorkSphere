import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const REJECTION_REASONS = [
  'Not enough experience',
  'Skills mismatch',
  'Failed technical assessment',
  'Failed interview',
  'Salary expectations too high',
  'Position filled by another candidate',
  'Candidate withdrew',
  'Other',
];

const RejectionModal = ({ candidateName, onConfirm, onCancel }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const finalReason =
    selectedReason === 'Other' ? customReason.trim() : selectedReason;
  const isValid =
    selectedReason &&
    (selectedReason !== 'Other' || customReason.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 dark:bg-red-950/40 px-6 py-4 border-b border-red-100 dark:border-red-900 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-base">
              Reject Candidate
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              You're rejecting{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {candidateName}
              </span>
              . Please select a reason.
            </p>
          </div>
        </div>

        {/* Reason list */}
        <div className="px-6 py-4 space-y-2 max-h-72 overflow-y-auto">
          {REJECTION_REASONS.map((reason) => (
            <label
              key={reason}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                selectedReason === reason
                  ? 'border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-500'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <input
                type="radio"
                name="rejection-reason"
                value={reason}
                checked={selectedReason === reason}
                onChange={() => setSelectedReason(reason)}
                className="accent-red-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {reason}
              </span>
            </label>
          ))}

          {selectedReason === 'Other' && (
            <textarea
              autoFocus
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Describe the reason..."
              rows={3}
              className="w-full mt-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} size="sm">
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!isValid}
            onClick={() => onConfirm(finalReason)}
            className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-40"
          >
            Confirm Rejection
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RejectionModal;
