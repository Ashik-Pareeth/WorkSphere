import React from 'react';
import { timeAgo } from '../../utils/dateUtils';

export function ChatBubble({ post }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-900">
          {post.authorDisplayName}
        </span>
        <span className="text-[11px] text-gray-400">
          {timeAgo(post.createdAt)} ago
        </span>
      </div>
      <p className="text-sm text-gray-500 leading-relaxed">{post.content}</p>
    </div>
  );
}
