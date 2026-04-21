import React, { useState, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { timeAgo } from '../../utils/dateUtils';

export function ChatBubble({ post, user, onEditPost }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
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
      onEditPost(post.id, editContent.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 group">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
           <span className="text-sm font-medium text-gray-900">
             {post.authorDisplayName}
           </span>
           {post.isEdited && (
              <span className="text-[10px] text-gray-400 font-medium italic">(edited)</span>
           )}
        </div>
        <div className="flex items-center gap-2">
          {isEditable && !isEditing && (
             <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-indigo-600 rounded"
                title="Edit message (time limited)"
             >
                <Edit2 size={12} />
             </button>
          )}
          <span className="text-[11px] text-gray-400">
            {timeAgo(post.createdAt)} ago
          </span>
        </div>
      </div>
      {isEditing ? (
        <div className="mt-2 flex gap-2">
           <input
             type="text"
             value={editContent}
             onChange={(e) => setEditContent(e.target.value)}
             className="flex-1 rounded border border-indigo-300 p-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
             autoFocus
             onKeyDown={(e) => {
               if (e.key === 'Enter') handleSave();
               if (e.key === 'Escape') setIsEditing(false);
             }}
           />
           <button onClick={handleSave} className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100"><Check size={14} /></button>
           <button onClick={() => setIsEditing(false)} className="p-1.5 bg-gray-50 text-gray-600 rounded hover:bg-gray-100"><X size={14} /></button>
        </div>
      ) : (
        <p className="text-sm text-gray-500 leading-relaxed">{post.content}</p>
      )}
    </div>
  );
}
