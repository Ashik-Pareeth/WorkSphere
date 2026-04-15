import React, { useState, useEffect } from 'react';
import { getAllActionRecords } from '../../api/employeeActionApi';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { AlertCircle } from 'lucide-react';
import PageSkeleton from '../../components/common/PageSkeleton';

export default function ActionCompliance() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    const loadActions = async () => {
      try {
        const res = await getAllActionRecords();
        console.log('Fetched action records:', res);
        const extracted = res?.data || [];
        setActions(Array.isArray(extracted) ? extracted : []);
      } catch (error) {
        console.error('Failed to fetch action records:', error);
      } finally {
        setLoading(false);
      }
    };
    loadActions();
  }, []);

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusStyle = (status) => {
    if (
      status === 'APPROVED' ||
      status === 'APPLIED' ||
      status === 'COMPLETED'
    ) {
      return 'bg-emerald-100 text-emerald-700';
    }
    if (status === 'REJECTED') {
      return 'bg-rose-100 text-rose-700';
    }
    return 'bg-amber-100 text-amber-700';
  };

  const getTypeStyle = (type) => {
    if (
      type === 'EMERGENCY_SUSPENSION' ||
      type === 'SUSPENSION' ||
      type === 'TERMINATION'
    ) {
      return 'bg-rose-100 text-rose-700 font-semibold';
    }
    return 'bg-slate-100 text-slate-700';
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="w-full px-6 md:px-10 py-6 bg-slate-50 min-h-screen flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2 text-slate-800">
          <AlertCircle className="text-rose-500" size={20} />
          Disciplinary & Action Compliance
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Read-only audit overview of official employee actions.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {' '}
        {actions.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No action records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100">
                <TableHead className="text-slate-600 font-semibold">
                  Date
                </TableHead>
                <TableHead className="text-slate-600 font-semibold">
                  Employee
                </TableHead>
                <TableHead className="text-slate-600 font-semibold">
                  Type
                </TableHead>
                <TableHead className="text-slate-600 font-semibold">
                  Status
                </TableHead>
                <TableHead className="text-slate-600 font-semibold">
                  Initiator
                </TableHead>
                <TableHead className="text-slate-600 font-semibold">
                  Reason
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {actions.map((act, i) => (
                <React.Fragment key={act.id}>
                  {/* Main Row */}
                  <TableRow
                    onClick={() =>
                      setExpandedRow(expandedRow === act.id ? null : act.id)
                    }
                    className={`cursor-pointer transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    } hover:bg-blue-50`}
                  >
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(act.createdAt)}
                    </TableCell>

                    <TableCell className="text-sm font-medium text-slate-700">
                      {act.employeeName}
                    </TableCell>

                    <TableCell>
                      <span
                        className={`px-2.5 py-1 text-xs rounded-full font-medium ${getTypeStyle(act.actionType)}`}
                      >
                        {act.actionType.replace(/_/g, ' ')}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span
                        className={`px-2.5 py-1 text-xs rounded-full font-medium ${getStatusStyle(
                          act.status
                        )}`}
                      >
                        {act.status}
                      </span>
                    </TableCell>

                    <TableCell className="text-sm text-slate-600">
                      {act.initiatedByName}
                      <div className="text-xs text-slate-400">
                        {act.initiatedByRole}
                      </div>
                    </TableCell>

                    <TableCell
                      className="text-sm max-w-xs truncate text-slate-600"
                      title={act.reason}
                    >
                      {act.reason}
                    </TableCell>
                  </TableRow>

                  {/* Expanded Row */}
                  {expandedRow === act.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-slate-50 p-5">
                        <div className="space-y-5">
                          {/* Reason */}
                          <div>
                            <p className="text-sm font-semibold text-slate-700 mb-1">
                              Reason
                            </p>
                            <p className="text-sm text-slate-600">
                              {act.reason || '—'}
                            </p>
                          </div>

                          {/* Dates */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-slate-500">Effective:</span>
                              <div className="text-slate-700 font-medium">
                                {act.effectiveDate || '—'}
                              </div>
                            </div>

                            <div>
                              <span className="text-slate-500">End Date:</span>
                              <div className="text-slate-700 font-medium">
                                {act.endDate || '—'}
                              </div>
                            </div>

                            <div>
                              <span className="text-slate-500">
                                Reviewed By:
                              </span>
                              <div className="text-slate-700 font-medium">
                                {act.reviewedByName || '—'}
                              </div>
                            </div>
                          </div>

                          {/* Review Notes */}
                          {act.reviewNotes && (
                            <div>
                              <p className="text-sm font-semibold text-slate-700 mb-1">
                                Review Notes
                              </p>
                              <p className="text-sm text-slate-600">
                                {act.reviewNotes}
                              </p>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-slate-500">
                            <div>
                              <span className="font-medium">Action ID:</span>
                              <div className="font-mono break-all">
                                {act.id}
                              </div>
                            </div>

                            <div>
                              <span className="font-medium">Employee ID:</span>
                              <div className="font-mono">{act.employeeId}</div>
                            </div>

                            <div>
                              <span className="font-medium">Initiator ID:</span>
                              <div className="font-mono">
                                {act.initiatedById}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
