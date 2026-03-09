import { useState, useEffect, useCallback } from 'react';
import { fetchMyTickets, createTicket, addTicketComment } from '../../api/hrApi';

const CATEGORIES = ['PAYROLL', 'HR_POLICY', 'HARASSMENT', 'IT_SUPPORT', 'FACILITIES', 'OTHER'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const statusColor = (s) => ({
  OPEN: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  PENDING_INFO: 'bg-purple-50 text-purple-700 border-purple-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-gray-100 text-gray-500 border-gray-200',
})[s] || 'bg-gray-50 text-gray-600 border-gray-200';

const priorityColor = (p) => ({
  URGENT: 'bg-purple-50 text-purple-700 border-purple-200',
  HIGH: 'bg-red-50 text-red-600 border-red-100',
  MEDIUM: 'bg-amber-50 text-amber-600 border-amber-100',
  LOW: 'bg-emerald-50 text-emerald-600 border-emerald-100',
})[p] || 'bg-gray-50 text-gray-600 border-gray-200';

const categoryIcon = (c) => ({
  PAYROLL: '💰', HR_POLICY: '📋', HARASSMENT: '🚨', IT_SUPPORT: '🔧', FACILITIES: '🏢', OTHER: '📝',
})[c] || '📝';

const Helpdesk = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comment, setComment] = useState('');

  const [newTicket, setNewTicket] = useState({
    category: 'IT_SUPPORT', priority: 'MEDIUM', subject: '', description: '',
  });

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchMyTickets();
      setTickets(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createTicket(newTicket);
      setShowCreateModal(false);
      setNewTicket({ category: 'IT_SUPPORT', priority: 'MEDIUM', subject: '', description: '' });
      loadTickets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit ticket');
    }
  };

  const handleComment = async (ticketId) => {
    if (!comment.trim()) return;
    try {
      await addTicketComment(ticketId, { content: comment, isInternal: false });
      setComment('');
      loadTickets();
      const res = await fetchMyTickets();
      const updated = res.data.find(t => t.id === ticketId);
      if (updated) setSelectedTicket(updated);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-sm font-medium text-gray-500 animate-pulse">
      Loading Your Tickets...
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 font-sans w-full overflow-hidden">
      <header className="flex-none border-b border-gray-200 bg-white px-6 py-4 z-10">
        <div className="flex w-full items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Helpdesk</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'} submitted
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            + New Ticket
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-gray-50/50 p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-bold">×</button>
          </div>
        )}

        {tickets.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-4xl mb-4 block">🎫</span>
            <h3 className="text-sm font-semibold text-gray-600">No Tickets Yet</h3>
            <p className="text-xs text-gray-400 mt-1">You haven't submitted any help requests.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Submit Your First Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {ticket.ticketNumber}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${priorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${statusColor(ticket.status)}`}>
                        {ticket.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">{ticket.subject}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{ticket.description}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <span className="text-base">{categoryIcon(ticket.category)}</span>
                    <div className="text-[10px] text-gray-400 mt-1">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Submit a Ticket</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Category</label>
                  <select value={newTicket.category} onChange={(e) => setNewTicket(p => ({...p, category: e.target.value}))}
                    className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Priority</label>
                  <select value={newTicket.priority} onChange={(e) => setNewTicket(p => ({...p, priority: e.target.value}))}
                    className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Subject *</label>
                <input type="text" required maxLength={200} value={newTicket.subject}
                  onChange={(e) => setNewTicket(p => ({...p, subject: e.target.value}))}
                  placeholder="Brief summary of your issue"
                  className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Description *</label>
                <textarea required maxLength={5000} value={newTicket.description}
                  onChange={(e) => setNewTicket(p => ({...p, description: e.target.value}))}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit"
                  className="flex-1 px-4 py-2 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Detail Sidebar */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-end z-50" onClick={() => setSelectedTicket(null)}>
          <div className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-semibold text-gray-500">{selectedTicket.ticketNumber}</span>
                <h2 className="text-lg font-bold text-gray-900 mt-1">{selectedTicket.subject}</h2>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Status</span>
                  <div className={`mt-1 text-xs font-bold px-2 py-1 rounded-full border inline-block ${statusColor(selectedTicket.status)}`}>
                    {selectedTicket.status.replace(/_/g, ' ')}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Priority</span>
                  <div className={`mt-1 text-xs font-bold px-2 py-1 rounded-full border inline-block ${priorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase">Description</span>
                <p className="mt-1 text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {selectedTicket.description}
                </p>
              </div>

              {selectedTicket.resolution && (
                <div>
                  <span className="text-[10px] font-semibold text-emerald-500 uppercase">Resolution</span>
                  <p className="mt-1 text-xs text-gray-700 whitespace-pre-wrap bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    {selectedTicket.resolution}
                  </p>
                </div>
              )}

              <div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase">Comments ({selectedTicket.comments?.length || 0})</span>
                <div className="mt-2 space-y-3 max-h-60 overflow-y-auto">
                  {(selectedTicket.comments || []).map((c) => (
                    <div key={c.id} className="p-3 rounded-lg border bg-white border-gray-100 text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-gray-700">{c.authorName}</span>
                        <span className="text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-600 whitespace-pre-wrap">{c.content}</p>
                    </div>
                  ))}
                </div>

                {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
                  <div className="mt-3 flex gap-2">
                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2}
                      placeholder="Add a reply..."
                      className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                    <button onClick={() => handleComment(selectedTicket.id)}
                      className="self-end px-4 py-2 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                      Reply
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Helpdesk;
