import React from 'react';
import { Bell, Pin } from 'lucide-react';
import { timeAgo } from '../../utils/dateUtils';

export function AnnouncementCard({ post, user, onTogglePin }) {
  return (
    <div
      className="border border-amber-200 rounded-r-lg p-4 relative"
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
      <p className="text-sm leading-relaxed text-amber-950 mb-2">
        {post.content}
      </p>
      <div className="flex items-center gap-1.5 text-[11px] text-amber-700">
        <span className="font-medium text-amber-900">
          {post.authorDisplayName}
        </span>
        <span className="opacity-40">·</span>
        <span>{timeAgo(post.createdAt)} ago</span>
      </div>
    </div>
  );
}
