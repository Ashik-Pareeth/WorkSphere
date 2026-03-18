import { useState, useEffect, useCallback } from 'react';
import {
  fetchAllTickets,
  assignTicket,
  resolveTicket,
  addTicketComment,
} from '../../api/hrApi';
import { getAllEmployees } from '../../api/employeeApi';

const STATUS_COLUMNS = ['OPEN', 'IN_PROGRESS', 'PENDING_INFO', 'RESOLVED'];

const statusColor = (s) =>
  ({
    OPEN: 'bg-blue-50 text-blue-700 border-blue-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
    PENDING_INFO: 'bg-purple-50 text-purple-700 border-purple-200',
    RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CLOSED: 'bg-gray-100 text-gray-500 border-gray-200',
  })[s] || 'bg-gray-50 text-gray-600 border-gray-200';

const priorityColor = (p) =>
  ({
    URGENT: 'bg-purple-50 text-purple-700 border-purple-200',
    HIGH: 'bg-red-50 text-red-600 border-red-100',
    MEDIUM: 'bg-amber-50 text-amber-600 border-amber-100',
    LOW: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  })[p] || 'bg-gray-50 text-gray-600 border-gray-200';

const categoryIcon = (c) =>
  ({
    PAYROLL: '💰',
    HR_POLICY: '📋',
    HARASSMENT: '🚨',
    IT_SUPPORT: '🔧',
    FACILITIES: '🏢',
    OTHER: '📝',
  })[c] || '📝';

const HelpdeskAdmin = () => {
  const [tickets, setTickets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [assignToId, setAssignToId] = useState('');

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAllTickets();
      setTickets(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEmployees = async () => {
    try {
      const res = await getAllEmployees();
      setEmployees(res);
    } catch (err) {
      console.error('Failed to load employees', err);
    }
  };

  useEffect(() => {
    loadTickets();
    loadEmployees();
  }, [loadTickets]);

  const getTicketsByStatus = (status) =>
    tickets.filter((t) => t.status === status);

  const handleAssign = async (ticketId) => {
    if (!assignToId) return;
    try {
      await assignTicket(ticketId, assignToId);
      setAssignToId('');
      loadTickets();
      // Also update selected ticket if it's open in drawer
      if (selectedTicket && selectedTicket.id === ticketId) {
        const res = await fetchAllTickets();
        const updated = res.data.find((t) => t.id === ticketId);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign ticket');
    }
  };

  const handleResolve = async (ticketId) => {
    if (!resolution) return;
    try {
      await resolveTicket(ticketId, resolution);
      setResolution('');
      setSelectedTicket(null);
      loadTickets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve ticket');
    }
  };

  const handleComment = async (ticketId) => {
    if (!comment.trim()) return;
    try {
      await addTicketComment(ticketId, { content: comment, isInternal });
      setComment('');
      setIsInternal(false);
      loadTickets();
      // Refresh selected ticket's comments
      const res = await fetchAllTickets();
      const updated = res.data.find((t) => t.id === ticketId);
      if (updated) setSelectedTicket(updated);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const daysSince = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-sm font-medium text-gray-500 animate-pulse">
        Loading Helpdesk...
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 font-sans w-full overflow-hidden">
      <header className="flex-none border-b border-gray-200 bg-white px-6 py-4 z-10">
        <div className="flex w-full items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Helpdesk Administration
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {tickets.length} total tickets ·{' '}
              {getTicketsByStatus('OPEN').length} open ·{' '}
              {getTicketsByStatus('IN_PROGRESS').length} in progress
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-50/50 p-6 w-full">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full min-w-250">
          {STATUS_COLUMNS.map((status) => (
            <div key={status} className="flex flex-col h-full min-w-60">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      status === 'OPEN'
                        ? 'bg-blue-500'
                        : status === 'IN_PROGRESS'
                          ? 'bg-amber-500'
                          : status === 'PENDING_INFO'
                            ? 'bg-purple-500'
                            : 'bg-emerald-500'
                    }`}
                  />
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-600">
                    {status.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-200/50 px-2 py-0.5 rounded-full">
                  {getTicketsByStatus(status).length}
                </span>
              </div>

              <div className="flex-1 min-h-0 rounded-xl border bg-gray-100/40 border-gray-200/60 p-2 overflow-y-auto">
                {getTicketsByStatus(status).map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="group mb-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {ticket.ticketNumber}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${priorityColor(ticket.priority)}`}
                      >
                        {ticket.priority}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold leading-snug mb-2 text-gray-900">
                      {ticket.subject}
                    </h4>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">
                        {categoryIcon(ticket.category)}
                      </span>
                      <span className="text-[10px] font-medium text-gray-500">
                        {ticket.category.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* NEW: Assignee display on the Kanban Card */}
                    {ticket.assignedToName && (
                      <div className="flex items-center gap-1.5 mb-2 mt-2 pt-2 border-t border-gray-50">
                        <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[8px] font-bold">
                          {ticket.assignedToName.charAt(0)}
                        </div>
                        <span className="text-[10px] font-medium text-gray-600 truncate">
                          Assigned: {ticket.assignedToName}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400 truncate max-w-[100px]">
                        {ticket.raisedByName}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {daysSince(ticket.createdAt)}d ago
                      </span>
                    </div>
                  </div>
                ))}
                {getTicketsByStatus(status).length === 0 && (
                  <div className="text-center py-8 text-[10px] text-gray-400">
                    No tickets
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Ticket Detail Sidebar */}
      {selectedTicket && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-end z-50"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <span className="font-mono text-xs font-semibold text-gray-500">
                  {selectedTicket.ticketNumber}
                </span>
                <h2 className="text-lg font-bold text-gray-900 mt-1">
                  {selectedTicket.subject}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">
                    Status
                  </span>
                  <div
                    className={`mt-1 text-xs font-bold px-2 py-1 rounded-full border inline-block ${statusColor(selectedTicket.status)}`}
                  >
                    {selectedTicket.status.replace(/_/g, ' ')}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">
                    Priority
                  </span>
                  <div
                    className={`mt-1 text-xs font-bold px-2 py-1 rounded-full border inline-block ${priorityColor(selectedTicket.priority)}`}
                  >
                    {selectedTicket.priority}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">
                    Category
                  </span>
                  <div className="mt-1 text-xs text-gray-700">
                    {categoryIcon(selectedTicket.category)}{' '}
                    {selectedTicket.category.replace(/_/g, ' ')}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">
                    Raised By
                  </span>
                  <div className="mt-1 text-xs text-gray-700">
                    {selectedTicket.raisedByName}
                  </div>
                </div>

                {/* NEW: Assignee display in the Meta Grid */}
                <div className="col-span-2 pt-2 border-t border-gray-100">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">
                    Assigned Handler
                  </span>
                  <div className="mt-1 text-xs font-medium text-gray-700">
                    {selectedTicket.assignedToName ? (
                      <span className="flex items-center gap-2 bg-blue-50/50 w-fit px-3 py-1.5 rounded-lg border border-blue-100">
                        <div className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-[10px] font-bold">
                          {selectedTicket.assignedToName.charAt(0)}
                        </div>
                        {selectedTicket.assignedToName}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 inline-block">
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase">
                  Description
                </span>
                <p className="mt-1 text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Assign (Only show if unassigned or open) */}
              {selectedTicket.status === 'OPEN' && (
                <div className="flex gap-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                  <select
                    value={assignToId}
                    onChange={(e) => setAssignToId(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  >
                    <option value="" disabled>
                      Select IT/HR/Admin Handler...
                    </option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}{' '}
                        {emp.department?.name ? `(${emp.department.name})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAssign(selectedTicket.id)}
                    className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Assign
                  </button>
                </div>
              )}

              {/* Comments */}
              <div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase">
                  Comments ({selectedTicket.comments?.length || 0})
                </span>
                <div className="mt-2 space-y-3 max-h-60 overflow-y-auto">
                  {(selectedTicket.comments || []).map((c) => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-lg border text-xs ${c.isInternal ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-gray-100'}`}
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-gray-700">
                          {c.authorName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {c.isInternal && (
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                              INTERNAL
                            </span>
                          )}
                          <span className="text-gray-400">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 whitespace-pre-wrap">
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                <div className="mt-3 space-y-2">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="Add a comment..."
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-[10px] text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      Internal note (hidden from employee)
                    </label>
                    <button
                      onClick={() => handleComment(selectedTicket.id)}
                      className="px-4 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>

              {/* Resolve */}
              {selectedTicket.status !== 'RESOLVED' &&
                selectedTicket.status !== 'CLOSED' && (
                  <div className="border-t border-gray-100 pt-4">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">
                      Resolve Ticket
                    </span>
                    <textarea
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      rows={2}
                      placeholder="Resolution note..."
                      className="w-full mt-2 px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                    />
                    <button
                      onClick={() => handleResolve(selectedTicket.id)}
                      className="w-full mt-2 px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Mark as Resolved
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpdeskAdmin;
