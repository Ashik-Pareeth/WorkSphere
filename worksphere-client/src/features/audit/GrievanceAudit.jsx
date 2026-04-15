import React, { useState, useEffect } from 'react';
import { fetchAllTicketsForAudit } from '../../api/hrApi';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Search } from 'lucide-react';
import PageSkeleton from '../../components/common/PageSkeleton';

export default function GrievanceAudit() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const response = await fetchAllTicketsForAudit();
        setTickets(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTickets();
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <Search className="text-blue-600" />
          Grievance Audit View
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Read-only view verifying ticketing workflows. Internal HR notes are omitted.
        </p>
      </div>

      <div className="bg-white border rounded-lg shadow-sm w-full overflow-hidden">
        {tickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No tickets found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Created</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Reporter</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {t.category.replace('_', ' ')}
                  </TableCell>
                  <TableCell className="text-sm max-w-sm truncate" title={t.subject}>
                    {t.subject}
                  </TableCell>
                  <TableCell>
                    <span 
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 
                        t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 
                        'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.assignToName || 'Unassigned'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.employeeName || 'Anonymous'}
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
