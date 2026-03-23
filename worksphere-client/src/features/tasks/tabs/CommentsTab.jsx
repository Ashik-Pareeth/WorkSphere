import React from 'react';
import { Send } from 'lucide-react';

export default function CommentsTab({ 
  comments, 
  ticketComments, 
  newComment, 
  setNewComment, 
  handleSendComment, 
  sendingComment,
  sourceTicketId
}) {
  return (
    <div className="flex flex-col h-[500px] border border-gray-200 rounded-xl bg-gray-50 overflow-hidden mt-2">
      {/* Scrollable Comments List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Helpdesk Ticket Comments (if linked) */}
        {sourceTicketId && ticketComments?.length > 0 && (
          <div className="bg-orange-50/50 border border-orange-200 rounded-xl overflow-hidden mb-4">
            <div className="bg-orange-100/50 px-4 py-2 border-b border-orange-200 text-xs font-bold text-orange-800 uppercase tracking-widest">
              Linked Helpdesk Thread
            </div>
            <div className="p-4 flex flex-col gap-3">
              {ticketComments.map((tc, idx) => (
                <div key={idx} className="bg-white border border-orange-100 rounded-lg p-3 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-orange-800">{tc.authorName}</span>
                    <span className="text-[10px] text-orange-600/70 font-mono">
                      {new Date(tc.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{tc.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Standard Task Comments */}
        {comments?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 italic text-sm">
            No comments yet. Start the conversation below.
          </div>
        ) : (
          comments?.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold text-gray-900">{c.authorName}</span>
                <span className="text-xs text-gray-500 font-mono">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{c.body}</p>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSendComment} className="flex gap-3">
          <input
            type="text"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-gray-400"
            placeholder="Type your comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={sendingComment}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || sendingComment}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {sendingComment ? 'Sending...' : 'Send'}
            {!sendingComment && <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
