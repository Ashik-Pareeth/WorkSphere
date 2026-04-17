import React, { useState, useEffect } from 'react';
import { fetchMyPayroll } from '../../api/hrApi';
import PayslipViewerModal from './PayslipViewerModal';

const MyCompensation = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingPayslipId, setViewingPayslipId] = useState(null);

  useEffect(() => {
    loadPayroll();
  }, []);

  const loadPayroll = async () => {
    try {
      setLoading(true);
      const res = await fetchMyPayroll();
      setRecords(res.data);
      console.log('Payroll data loaded:', res.data);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load compensation data'
      );
    } finally {
      setLoading(false);
    }
  };

  const fmt = (val) =>
    val != null
      ? Number(val).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '0.00';

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const statusBadge = (status) => {
    const colors = {
      DRAFT: 'bg-yellow-100 text-yellow-800',
      PROCESSED: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
    };
    return (
      <span
        className={`px-2 py-1 text-xs rounded-full font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}
      >
        {status}
      </span>
    );
  };

  if (loading) return <div className="p-6">Loading compensation data...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Compensation</h1>
        <p className="text-gray-500 text-sm mt-1">
          View your payroll history and download payslips.
        </p>
      </div>

      {error && (
        <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {records.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">💰</div>
          <p className="text-gray-500 text-lg">No payroll records yet.</p>
          <p className="text-gray-400 text-sm mt-1">
            Your payroll records will appear here once processed.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {records.map((r) => {
            const totalDeductions =
              Number(r.lopDeduction || 0) +
              Number(r.pfDeduction || 0) +
              Number(r.taxDeduction || 0) +
              Number(r.professionalTax || 0) +
              Number(r.otherDeductions || 0);
            const performanceBonus = Number(r.performanceBonus || 0);

            return (
              <div
                key={r.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {monthNames[r.month - 1]} {r.year}
                    </h3>
                    <p className="text-sm text-gray-500">{r.department}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusBadge(r.status)}
                    {r.payslipDownloadUrl && (
                      <button
                        onClick={() => setViewingPayslipId(r.id)}
                        className="px-3 py-1.5 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors font-medium cursor-pointer"
                      >
                        📄 View Payslip
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      Gross Pay
                    </p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      ₹{fmt(r.grossPay)}
                    </p>
                    {performanceBonus > 0 && (
                      <p className="text-xs text-indigo-600 mt-0.5">
                        +₹{fmt(performanceBonus)} bonus
                      </p>
                    )}
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-red-600 uppercase tracking-wider">
                      Deductions
                    </p>
                    <p className="text-lg font-semibold text-red-700 mt-1">
                      -₹{fmt(totalDeductions)}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-green-600 uppercase tracking-wider">
                      Net Pay
                    </p>
                    <p className="text-lg font-semibold text-green-700 mt-1">
                      ₹{fmt(r.netPay)}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600 uppercase tracking-wider">
                      Attendance
                    </p>
                    <p className="text-lg font-semibold text-blue-700 mt-1">
                      {r.presentDays}/{r.workingDays} days
                    </p>
                    {r.lopDays > 0 && (
                      <p className="text-xs text-red-500 mt-0.5">
                        {r.lopDays} LOP
                      </p>
                    )}
                  </div>
                </div>

                {/* Deduction Breakdown */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                    Deduction Breakdown
                  </p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    {Number(r.lopDeduction) > 0 && (
                      <span className="text-gray-600">
                        LOP: <strong>₹{fmt(r.lopDeduction)}</strong>
                      </span>
                    )}
                    {Number(r.pfDeduction) > 0 && (
                      <span className="text-gray-600">
                        PF: <strong>₹{fmt(r.pfDeduction)}</strong>
                      </span>
                    )}
                    {Number(r.taxDeduction) > 0 && (
                      <span className="text-gray-600">
                        TDS: <strong>₹{fmt(r.taxDeduction)}</strong>
                      </span>
                    )}
                    {Number(r.professionalTax) > 0 && (
                      <span className="text-gray-600">
                        PT: <strong>₹{fmt(r.professionalTax)}</strong>
                      </span>
                    )}
                    {Number(r.otherDeductions) > 0 && (
                      <span className="text-gray-600">
                        Other: <strong>₹{fmt(r.otherDeductions)}</strong>
                      </span>
                    )}
                  </div>
                </div>
                {performanceBonus > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                      Earnings Additions
                    </p>
                    <span className="text-sm text-gray-600">
                      Performance bonus:{' '}
                      <strong>₹{fmt(performanceBonus)}</strong>
                      {r.performanceScore && (
                        <span className="text-gray-400">
                          {' '}
                          ({Number(r.performanceScore).toFixed(2)}/5)
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Payslip Modal */}
      <PayslipViewerModal
        isOpen={!!viewingPayslipId}
        onClose={() => setViewingPayslipId(null)}
        payrollId={viewingPayslipId}
      />
    </div>
  );
};

export default MyCompensation;
