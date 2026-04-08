import React, { useState } from 'react';
import { setAnonymous } from '../../api/bulletinApi';
import { toast } from 'sonner';

export function AnonymousToggle({ user, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    const isAnon = e.target.value === 'anon';
    try {
      setLoading(true);
      await setAnonymous(isAnon);
      toast.success(isAnon ? 'You are now chatting anonymously.' : 'You are now chatting with your real name.');
      if (onUpdate) onUpdate(isAnon);
    } catch (err) {
      toast.error('Failed to update chat identity preference.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col gap-2 px-3 py-2">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
        Chat Identity
      </p>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="chatIdentity"
            value="real"
            checked={!user.chatAnonymous}
            onChange={handleChange}
            disabled={loading}
            className="text-indigo-600 focus:ring-indigo-500 border-gray-300"
          />
          <span className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="chatIdentity"
            value="anon"
            checked={user.chatAnonymous}
            onChange={handleChange}
            disabled={loading}
            className="text-indigo-600 focus:ring-indigo-500 border-gray-300"
          />
          <span className="text-sm font-medium text-gray-500">
            {user.anonymousAlias || 'anonymous_????'}
          </span>
        </label>
      </div>
    </div>
  );
}
