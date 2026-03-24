import React, { useState } from 'react';
import { submitManagerReport } from '../../api/employeeActionApi';
import { X, Flag } from 'lucide-react';

const SUGGESTION_TYPES = [
  'Promotion Suggestion',
  'Demotion Suggestion',
  'Suspension Suggestion',
  'Performance Concern',
  'Behavioral Issue',
  'Attendance Problem',
  'Policy Violation',
  'Other',
];

export default function ManagerReportModal({ employee, onClose, onSubmitted }) {
  const [suggestedAction, setSuggestedAction] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!suggestedAction) return setError('Please select a report type.');
    if (!reason.trim()) return setError('Description is required.');
    setLoading(true);
    setError(null);
    try {
      await submitManagerReport({
        employeeId: employee.id,
        suggestedAction,
        reason,
      });
      setSuccess(true);
      onSubmitted?.();
      setTimeout(onClose, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to submit report.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50">
              <Flag size={16} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Report to HR
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {employee.firstName} {employee.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Your report will be sent to HR for review. They will decide on any
            action to take.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Report Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTION_TYPES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSuggestedAction(s);
                    setError(null);
                  }}
                  className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    suggestedAction === s
                      ? 'bg-amber-50 border-amber-400 text-amber-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Description *
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the situation in detail. Be specific about dates, incidents, and impact…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-4 py-2">
              Report submitted successfully. HR has been notified.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || success}
            className="px-5 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50 transition"
          >
            {loading ? 'Submitting…' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
