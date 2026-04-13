import React, { useEffect, useState } from 'react';
import {
  getAnnouncements,
  postAnnouncement,
  postChat,
  togglePinRequest,
  getTeamFeed,
  postTeamMessage,
} from '../api/bulletinApi';
import { AnnouncementCard } from '../features/bulletin/AnnouncementCard';
import { ChatBubble } from '../features/bulletin/ChatBubble';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

export default function BulletinPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [announceInput, setAnnounceInput] = useState('');
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('global');

  const load = async () => {
    try {
      if (activeTab === 'global') {
        const res = await getAnnouncements(0);
        setPosts(res.data.content);
      } else {
        const res = await getTeamFeed(0);
        setPosts(res.data.content);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load posts');
    }
  };

  useEffect(() => {
    load();
  }, [activeTab]);

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    try {
      setLoading(true);
      if (activeTab === 'global') {
        await postChat(chatInput.trim());
      } else {
        await postTeamMessage(chatInput.trim());
      }
      setChatInput('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post message');
    } finally {
      setLoading(false);
    }
  };

  const handleAnnounce = async () => {
    if (!announceInput.trim()) return;
    try {
      setLoading(true);
      await postAnnouncement(announceInput.trim(), pinned);
      setAnnounceInput('');
      setPinned(false);
      load();
      toast.success('Announcement posted successfully');
    } catch (err) {
      toast.error(err.response.data.message || 'Failed to post announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (id, currentPinned) => {
    try {
      await togglePinRequest(id, !currentPinned);
      load();
      toast.success(
        currentPinned ? 'Announcement unpinned' : 'Announcement pinned'
      );
    } catch (err) {
      toast.error(err.response.data.message || 'Failed to update pin status');
    }
  };

  if (!user) return null;

  const isManager = user?.roles?.some((r) => r.replace('ROLE_', '').toUpperCase() === 'MANAGER');
  const hasTeam = isManager || !!user?.managerId;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6 px-4 md:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Company Bulletin
        </h1>
        <p className="text-gray-500 mt-1">
          Announcements and team communication.
        </p>
      </div>

      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('global')}
            className={`${
              activeTab === 'global'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Global Bulletin
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`${
              activeTab === 'team'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            My Team Chat
          </button>
        </nav>
      </div>

      {/* Announcement composer — privileged roles only (Global Tab Only) */}
      {activeTab === 'global' && (user.isGlobalAdmin || user.isHR || user.isAuditor) && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-5 space-y-4 shadow-sm">
          <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide">
            Post an Announcement
          </p>
          <textarea
            placeholder="Write an announcement..."
            value={announceInput}
            onChange={(e) => setAnnounceInput(e.target.value)}
            rows={3}
            className="w-full rounded-md border text-black border-yellow-300 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 placeholder:text-gray-400"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-600 h-4 w-4"
              />
              Pin this announcement
            </label>
            <button
              onClick={handleAnnounce}
              disabled={loading || !announceInput.trim()}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors disabled:opacity-50"
            >
              Send Announcement
            </button>
          </div>
        </div>
      )}

      {/* Chat logic check */}
      {activeTab === 'team' && !hasTeam ? (
        <div className="bg-white p-10 rounded-xl border border-gray-200 shadow-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
            <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Team Chat Unavailable</h3>
          <p className="text-gray-500 font-medium max-w-md mx-auto">
            You are not currently assigned to a specific team reporting structure.
          </p>
          <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
            Team chat unlocks automatically when you join a department under a manager, or become a manager yourself.
          </p>
        </div>
      ) : (
        <>
          {/* Chat composer — all roles */}
          <div className="flex gap-2 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <textarea
              placeholder={
                user.chatAnonymous
                  ? `Chatting as ${user.anonymousAlias || 'anonymous'}...`
                  : 'Write a message...'
              }
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              rows={2}
              className="flex-1 rounded-md border text-black border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-400 py-2 resize-none"
            />
            <button
              onClick={handleChat}
              disabled={loading || !chatInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-5 rounded-md text-sm transition-colors self-end disabled:opacity-50"
            >
              Send
            </button>
          </div>

          {/* Feed */}
          <div className="space-y-4 pt-4">
            {posts.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No posts yet. Be the first to say hello!
              </div>
            ) : (
              posts.map((post) =>
                post.type === 'ANNOUNCEMENT' ? (
                  <AnnouncementCard
                    key={post.id}
                    post={post}
                    user={user}
                    onTogglePin={handleTogglePin}
                  />
                ) : (
                  <ChatBubble key={post.id} post={post} />
                )
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
