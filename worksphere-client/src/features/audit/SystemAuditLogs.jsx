import React, { useState, useEffect } from 'react';
import { fetchAuditLogs } from '../../api/auditLogApi';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Shield } from 'lucide-react';
import PageSkeleton from '../../components/common/PageSkeleton';

export default function SystemAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const response = await fetchAuditLogs();
        const extracted = response?.data || [];
        setLogs(Array.isArray(extracted) ? extracted : []);
        console.log(extracted);
        console.log('Fetched audit logs:', response);
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const getActionStyle = (action) => {
    switch (action) {
      case 'CREATED':
        return 'bg-emerald-100 text-emerald-700';
      case 'UPDATED':
        return 'bg-blue-100 text-blue-700';
      case 'DELETED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-200 text-slate-700';
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="w-full px-6 md:px-10 py-6 bg-slate-50 min-h-screen flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2 text-slate-800">
          <Shield className="text-slate-600" size={20} />
          System Audit Logs
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Complete read-only trail of all tracked system actions.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No audit logs found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100">
                <TableHead className="text-slate-600 font-semibold">
                  Time
                </TableHead>
                <TableHead className="text-slate-600 font-semibold">
                  Entity
                </TableHead>
                <TableHead className="text-slate-600 font-semibold">
                  Action
                </TableHead>
                <TableHead className="text-slate-600 font-semibold">
                  Change
                </TableHead>
                <TableHead className="text-slate-600 font-semibold">
                  Actor
                </TableHead>
                <TableHead className="text-slate-600 font-semibold">
                  IP
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {logs.map((log, i) => (
                <React.Fragment key={log.id}>
                  {/* Main Row */}
                  <TableRow
                    onClick={() =>
                      setExpandedRow(expandedRow === log.id ? null : log.id)
                    }
                    className={`cursor-pointer transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    } hover:bg-blue-50`}
                  >
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(log.createdAt)}
                    </TableCell>

                    <TableCell className="text-sm font-medium text-slate-700">
                      {log.entityType}
                    </TableCell>

                    <TableCell>
                      <span
                        className={`px-2.5 py-1 text-xs rounded-full font-medium ${getActionStyle(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs font-mono text-slate-600">
                      {log.previousValue || '—'} → {log.newValue || '—'}
                    </TableCell>

                    <TableCell className="text-sm text-slate-600">
                      {log.createdBy || 'System'}
                    </TableCell>

                    <TableCell className="text-xs text-slate-400 font-mono">
                      {log.ipAddress || '—'}
                    </TableCell>
                  </TableRow>

                  {/* Expanded Row */}
                  {expandedRow === log.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-slate-50 p-5">
                        <div className="space-y-4">
                          {/* Remarks */}
                          {log.remarks && (
                            <div>
                              <p className="text-sm font-semibold text-slate-700 mb-1">
                                Remarks
                              </p>
                              <p className="text-sm text-slate-600">
                                {log.remarks}
                              </p>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-slate-500">
                            <div>
                              <span className="font-medium">Entity ID:</span>
                              <div className="font-mono break-all">
                                {log.entityId}
                              </div>
                            </div>

                            <div>
                              <span className="font-medium">Performed By:</span>
                              <div className="font-mono">{log.performedBy}</div>
                            </div>

                            <div>
                              <span className="font-medium">Log ID:</span>
                              <div className="font-mono break-all">
                                {log.id}
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
