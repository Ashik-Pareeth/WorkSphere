import React, { useEffect, useState } from 'react';
import { getPendingReports, reviewReport } from '../../api/employeeActionApi';
import {
  Flag,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Inbox,
} from 'lucide-react';

export default function PendingReportsPanel() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getPendingReports();
      setReports(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleReview = async (id, approve) => {
    setProcessing(id + (approve ? '_approve' : '_reject'));
    setError(null);
    try {
      await reviewReport(id, approve, reviewNotes[id] || '');
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process report.');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <div className="p-1.5 rounded-lg bg-amber-50">
          <Flag size={15} className="text-amber-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            Manager Reports
          </h3>
          <p className="text-xs text-gray-400">Pending HR review</p>
        </div>
        {reports.length > 0 && (
          <span className="ml-auto text-xs font-bold bg-rose-50 text-rose-600 rounded-full px-2.5 py-0.5">
            {reports.length}
          </span>
        )}
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-gray-300">
          <Inbox size={32} />
          <p className="text-sm">No pending reports</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {reports.map((r) => {
            const isExpanded = expanded === r.id;
            return (
              <div key={r.id} className="px-5 py-4">
                <div
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : r.id)}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {r.initiatedByName?.charAt(0) ?? 'M'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {r.initiatedByName}{' '}
                      <span className="text-gray-400 font-normal">
                        reported
                      </span>{' '}
                      {r.employeeName}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {r.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-gray-400">
                      {r.effectiveDate}
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={14} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={14} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 ml-11 space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                        Full Report
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {r.reason}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                        Your Review Notes
                      </label>
                      <textarea
                        rows={2}
                        value={reviewNotes[r.id] || ''}
                        onChange={(e) =>
                          setReviewNotes((prev) => ({
                            ...prev,
                            [r.id]: e.target.value,
                          }))
                        }
                        placeholder="Optional notes on your decision…"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(r.id, true)}
                        disabled={!!processing}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition"
                      >
                        <CheckCircle size={13} />
                        {processing === r.id + '_approve'
                          ? 'Processing…'
                          : 'Acknowledge'}
                      </button>
                      <button
                        onClick={() => handleReview(r.id, false)}
                        disabled={!!processing}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg disabled:opacity-50 transition"
                      >
                        <XCircle size={13} />
                        {processing === r.id + '_reject'
                          ? 'Processing…'
                          : 'Dismiss'}
                      </button>
                    </div>
                    {error && <p className="text-xs text-red-600">{error}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
