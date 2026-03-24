import React, { useEffect, useState } from 'react';
import { fetchPayrollSummary } from '../../api/hrApi';
import {
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  CalendarClock,
} from 'lucide-react';

export default function PayrollStatusBand({ onPayrollDataLoaded }) {
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadPayroll = async () => {
      try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // 1-12
        const currentYear = currentDate.getFullYear();

        const res = await fetchPayrollSummary(currentMonth, currentYear);
        // Backend returns List<PayrollRecordResponse> — an array of individual records
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];

        if (isMounted) {
          setRecords(data);
          // Sum netPay across all records for the total
          const total = data.reduce((sum, r) => sum + (r.netPay || 0), 0);
          onPayrollDataLoaded(total);
        }
      } catch (e) {
        console.error('Failed to load payroll summary for the band', e);
        if (isMounted) {
          setError(true);
          onPayrollDataLoaded(0);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadPayroll();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-center gap-3 min-h-[100px] shadow-sm animate-pulse">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        <span className="text-gray-500 text-sm font-medium">
          Calculating monthly payroll summary...
        </span>
      </div>
    );
  }

  if (error || !records) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-6 flex items-center justify-between gap-4 min-h-[100px]">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-red-500" size={20} />
          <span className="text-red-700 font-medium text-sm">
            Failed to load payroll data from server.
          </span>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex items-center gap-4 min-h-[100px]">
        <CalendarClock className="text-gray-400" size={24} />
        <span className="text-gray-500 font-medium text-sm">
          No payroll records found for this month. Generate payroll to see a
          summary.
        </span>
      </div>
    );
  }

  // Aggregate from the list
  const total = records.reduce((sum, r) => sum + (r.netPay || 0), 0);
  const totalCount = records.length;
  const paidCount = records.filter((r) => r.status === 'PAID').length;
  const processedCount = records.filter((r) => r.status === 'PROCESSED').length;

  // "Fully disbursed" only if all records are PAID
  const allPaid = paidCount === totalCount;
  // "Processed" if all are PROCESSED or PAID
  const allProcessed = paidCount + processedCount === totalCount;

  const processed = allPaid || allProcessed;

  const statusLabel = allPaid
    ? `${paidCount} of ${totalCount} employees paid`
    : allProcessed
      ? `${totalCount} records processed, awaiting disbursement`
      : `${paidCount + processedCount} of ${totalCount} records processed`;

  return (
    <div
      className={`rounded-xl p-5 sm:p-6 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors shadow-sm ${processed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'}`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`p-3.5 rounded-full ${processed ? 'bg-emerald-100 text-emerald-600' : 'bg-white shadow-sm border border-amber-100 text-amber-500'}`}
        >
          {processed ? (
            <CheckCircle2 size={24} strokeWidth={2.5} />
          ) : (
            <CalendarClock size={24} strokeWidth={2} />
          )}
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-lg tracking-tight">
            Payroll{' '}
            {new Date().toLocaleString('default', {
              month: 'short',
              year: 'numeric',
            })}
          </h3>
          <p className="text-sm text-gray-600 mt-0.5">{statusLabel}</p>
        </div>
      </div>
      <div className="text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0 pt-4 border-t sm:border-t-0 border-gray-200/50 sm:pt-0">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
          {allPaid ? 'Total Disbursed' : 'Total Net Pay'}
        </p>
        <p
          className={`text-3xl font-bold font-mono tracking-tighter ${processed ? 'text-emerald-700' : 'text-amber-600'}`}
        >
          $
          {total.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </p>
      </div>
    </div>
  );
}
