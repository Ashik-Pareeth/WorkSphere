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

  useEffect(() => {
    const loadActions = async () => {
      try {
        const res = await getAllActionRecords();
        setActions(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Failed to fetch action records:', error);
      } finally {
        setLoading(false);
      }
    };
    loadActions();
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <AlertCircle className="text-rose-600" />
          Disciplinary & Action Compliance
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Read-only audit overview of official employee actions.
        </p>
      </div>

      <div className="bg-white border rounded-lg shadow-sm w-full overflow-hidden">
        {actions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No action records found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Initiator</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((act) => (
                <TableRow key={act.id}>
                  <TableCell className="text-xs">
                    {new Date(act.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm font-semibold">
                    {act.employeeName}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded">
                      {act.actionType}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span 
                      className={`px-2 py-1 text-xs font-bold rounded ${
                         act.status === 'APPROVED' || act.status === 'APPLIED' ? 'bg-emerald-100 text-emerald-800' :
                         act.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                         'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {act.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {act.initiatedByName} 
                    <span className="text-xs text-gray-400 block">{act.initiatedByRole}</span>
                  </TableCell>
                  <TableCell className="text-sm max-w-xs truncate" title={act.reason}>
                    {act.reason}
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
