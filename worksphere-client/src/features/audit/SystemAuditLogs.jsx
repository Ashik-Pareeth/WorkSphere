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

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await fetchAuditLogs();
        setLogs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <Shield className="text-slate-600" />
          System Audit Logs
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete read-only trail of all tracked system actions.
        </p>
      </div>

      <div className="bg-white border rounded-lg shadow-sm w-full overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No audit logs found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor IP</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-semibold text-gray-700">
                    {log.entityType}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg border">
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-400 font-mono">
                    {log.ipAddress || '—'}
                  </TableCell>
                  <TableCell className="text-sm max-w-xs truncate" title={log.remarks}>
                    {log.remarks || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
