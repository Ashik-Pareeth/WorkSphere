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
  const [expandedRow, setExpandedRow] = useState(null);

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

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr.split('.')[0]).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="w-full px-6 md:px-10 py-6 bg-slate-50 min-h-screen flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2 text-slate-800">
          <Search className="text-blue-500" size={20} />
          Grievance Audit
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Read-only audit of grievance workflows. Click a row to inspect full
          details.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {tickets.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No tickets found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100">
                <TableHead className="text-slate-600 font-semibold">
                  Ticket
                </TableHead>
                <TableHead className="text-slate-600 font-semibold">
                  Created
                </TableHead>
                <TableHead className="text-slate-600 font-semibold">
                  Category
                </TableHead>
                <TableHead className="text-slate-600 font-semibold">
                  Subject
                </TableHead>
                <TableHead className="text-slate-600 font-semibold">
                  Priority
                </TableHead>
                <TableHead className="text-slate-600 font-semibold">
                  Status
                </TableHead>
                <TableHead className="text-slate-600 font-semibold">
                  Assignee
                </TableHead>
                <TableHead className="text-slate-600 font-semibold">
                  Reporter
                </TableHead>
                <TableHead className="text-slate-600 font-semibold">
                  Comments
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {tickets.map((t, i) => (
                <React.Fragment key={t.id}>
                  {/* Main Row */}
                  <TableRow
                    onClick={() =>
                      setExpandedRow(expandedRow === t.id ? null : t.id)
                    }
                    className={`cursor-pointer transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    } hover:bg-blue-50`}
                  >
                    <TableCell className="text-sm font-mono text-slate-500">
                      {t.ticketNumber}
                    </TableCell>

                    <TableCell className="text-xs text-slate-500">
                      {formatDate(t.createdAt)}
                    </TableCell>

                    <TableCell className="text-sm font-medium text-slate-700">
                      {t.category.replace('_', ' ')}
                    </TableCell>

                    <TableCell
                      className="text-sm max-w-xs truncate text-slate-700"
                      title={t.subject}
                    >
                      {t.subject}
                    </TableCell>

                    <TableCell>
                      <span
                        className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                          t.priority === 'HIGH'
                            ? 'bg-red-100 text-red-700'
                            : t.priority === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span
                        className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                          t.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : t.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </TableCell>

                    <TableCell className="text-sm text-slate-600">
                      {t.assignedToName || 'Unassigned'}
                    </TableCell>

                    <TableCell className="text-sm text-slate-600">
                      {t.raisedByName || 'Anonymous'}
                    </TableCell>

                    <TableCell className="text-sm text-slate-600">
                      {t.comments?.length || 0}
                    </TableCell>
                  </TableRow>

                  {/* Expanded Row */}
                  {expandedRow === t.id && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-slate-50 p-5">
                        <div className="space-y-4">
                          {/* Description */}
                          <div>
                            <p className="text-sm font-semibold text-slate-700 mb-1">
                              Description
                            </p>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {t.description}
                            </p>
                          </div>

                          {/* Comments */}
                          {t.comments?.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold text-slate-700 mb-2">
                                Comments ({t.comments.length})
                              </p>
                              <div className="space-y-2">
                                {t.comments.map((c) => (
                                  <div
                                    key={c.id}
                                    className="text-sm text-slate-600 border-l-2 border-slate-300 pl-3"
                                  >
                                    <span className="font-medium text-slate-700">
                                      {c.authorName}:
                                    </span>{' '}
                                    {c.content}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Resolution */}
                          {t.resolution && (
                            <div>
                              <p className="text-sm font-semibold text-slate-700 mb-1">
                                Resolution
                              </p>
                              <p className="text-sm text-emerald-700">
                                {t.resolution}
                              </p>
                            </div>
                          )}
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
