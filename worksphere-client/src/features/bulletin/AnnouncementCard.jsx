import React, { useState, useEffect } from 'react';
import { Bell, Pin, Edit2, Check, X } from 'lucide-react';
import { timeAgo } from '../../utils/dateUtils';

export function AnnouncementCard({ post, user, onTogglePin, onEditPost }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    // Only author or admins/hr can edit (though for safety, we only allow frontend author checks. Admins can pin.)
    const isOwner = user && post.authorId === user.id;
    if (!isOwner) {
      setIsEditable(false);
      return;
    }
    const ageInMinutes = (new Date() - new Date(post.createdAt)) / 60000;
    setIsEditable(ageInMinutes <= 15);
  }, [post.createdAt, post.authorId, user]);

  const handleSave = () => {
    if (editContent.trim() && editContent.trim() !== post.content) {
      if (onEditPost) onEditPost(post.id, editContent.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className="border border-amber-200 rounded-r-lg p-4 relative group"
      style={{ background: '#FAEEDA', borderLeft: '3px solid #BA7517' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-widest uppercase text-amber-700">
          <Bell className="w-3 h-3" />
          Announcement
        </span>
        {post.pinned && (
          <span className="inline-flex items-center gap-1 bg-white text-amber-900 border border-amber-300 rounded-md text-[11px] font-medium px-2 py-0.5">
            <Pin className="w-2.5 h-2.5" /> Pinned
          </span>
        )}
        <div className="flex-1 h-px bg-amber-300 opacity-40" />

        {isEditable && !isEditing && (
           <button
             onClick={() => setIsEditing(true)}
             className="text-[11px] font-medium text-amber-700 hover:text-amber-900 transition-colors bg-white hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 hover:border-amber-300 mr-2 opacity-0 group-hover:opacity-100"
             title="Edit announcement (time limited)"
           >
             <Edit2 size={12} className="inline mr-1" /> Edit
           </button>
        )}

        {(user?.isGlobalAdmin || user?.isHR || user?.isAuditor) &&
          onTogglePin && (
            <button
              onClick={() => onTogglePin(post.id, post.pinned)}
              className="text-[11px] font-medium text-amber-700 hover:text-amber-900 transition-colors bg-white hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 hover:border-amber-300"
              title={post.pinned ? 'Unpin Announcement' : 'Pin Announcement'}
            >
              {post.pinned ? 'Unpin' : 'Pin'}
            </button>
          )}
      </div>

      {isEditing ? (
        <div className="mt-2 flex gap-2 mb-2">
           <input
             type="text"
             value={editContent}
             onChange={(e) => setEditContent(e.target.value)}
             className="flex-1 rounded border border-amber-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
             autoFocus
             onKeyDown={(e) => {
               if (e.key === 'Enter') handleSave();
               if (e.key === 'Escape') setIsEditing(false);
             }}
           />
           <button onClick={handleSave} className="p-2 bg-amber-600 text-white rounded hover:bg-amber-700"><Check size={16} /></button>
           <button onClick={() => setIsEditing(false)} className="p-2 bg-white text-gray-600 rounded border border-gray-300 hover:bg-gray-50"><X size={16} /></button>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-amber-950 mb-2">
          {post.content}
        </p>
      )}

      <div className="flex items-center gap-1.5 text-[11px] text-amber-700">
        <span className="font-medium text-amber-900">
          {post.authorDisplayName}
        </span>
        {post.isEdited && (
           <span className="italic font-medium text-amber-700/60">(edited)</span>
        )}
        <span className="opacity-40">·</span>
        <span>{timeAgo(post.createdAt)} ago</span>
      </div>
    </div>
  );
}
