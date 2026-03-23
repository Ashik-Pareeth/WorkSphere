import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../api/hrApi';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Bell, Briefcase, CheckSquare, Calendar, CreditCard, ShieldAlert } from 'lucide-react';

function timeAgo(dateString) {
  if (!dateString) return '';
  const diff = Date.now() - new Date(dateString).getTime();
  if (diff < 60000) return 'Just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

const getRouteForNotification = (type, referenceId) => {
  switch (type) {
    case 'PAYSLIP_READY': return '/my-compensation';
    case 'APPRAISAL_DUE': 
    case 'APPRAISAL_RECEIVED': return '/my-appraisals';
    case 'TICKET_UPDATE': return '/helpdesk';
    case 'ASSET_ASSIGNED':
    case 'ASSET_RETURN_REQUEST': return '/my-assets';
    case 'OFFBOARDING_INITIATED': return '/profile';
    case 'LEAVE_APPROVED':
    case 'LEAVE_REJECTED':
    case 'LEAVE_REQUESTED': return '/my-leave';
    case 'TASK_ASSIGNED':
    case 'TASK_UPDATED':
    case 'TASK_OVERDUE': return `/tasks?open=${referenceId}`;
    default: return '/dashboard';
  }
};

const getCategoryForType = (type) => {
  if (!type) return 'System';
  if (type.includes('LEAVE')) return 'Leave';
  if (type.includes('TASK')) return 'Tasks';
  if (type.includes('PAYSLIP') || type.includes('PAYROLL')) return 'Payroll';
  return 'System';
};

const getIconForCategory = (category, isUnread) => {
  const color = isUnread ? "text-blue-600" : "text-gray-400";
  switch (category) {
    case 'Leave': return <Calendar className={`w-5 h-5 ${color}`} />;
    case 'Tasks': return <CheckSquare className={`w-5 h-5 ${color}`} />;
    case 'Payroll': return <CreditCard className={`w-5 h-5 ${color}`} />;
    case 'System': return <ShieldAlert className={`w-5 h-5 ${color}`} />;
    default: return <Bell className={`w-5 h-5 ${color}`} />;
  }
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await fetchNotifications();
      // Ensure sorted by newest first just in case
      const notifs = (res.data || []).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(notifs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notif) => {
    // Optimistic reading
    if (!notif.isRead) {
      markNotificationRead(notif.id).catch(err => console.error(err));
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    }
    navigate(getRouteForNotification(notif.type, notif.referenceId));
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  // Filtering
  const filteredNotifs = notifications.filter(n => {
    if (activeTab === 'All') return true;
    return getCategoryForType(n.type) === activeTab;
  });

  const displayedNotifs = filteredNotifs.slice(0, limit);
  const hasMore = limit < filteredNotifs.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Review your recent alerts and actionable items.</p>
        </div>
        <button 
          onClick={handleMarkAllRead}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          Mark all as read
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading notifications...</div>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setLimit(20); }} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="All">All</TabsTrigger>
            <TabsTrigger value="Leave">Leave</TabsTrigger>
            <TabsTrigger value="Tasks">Tasks</TabsTrigger>
            <TabsTrigger value="Payroll">Payroll</TabsTrigger>
            <TabsTrigger value="System">System</TabsTrigger>
          </TabsList>
          
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {displayedNotifs.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-500">
                You have no notifications in this category.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {displayedNotifs.map(notif => {
                  const category = getCategoryForType(notif.type);
                  return (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`group p-4 flex gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="pt-1 shrink-0">
                        {getIconForCategory(category, !notif.isRead)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-4">
                          <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {notif.title || category}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                              {timeAgo(notif.createdAt)}
                            </span>
                            {!notif.isRead && (
                              <div className="w-2 h-2 rounded-full bg-blue-600" />
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 pr-6">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {hasMore && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
                <button 
                  onClick={() => setLimit(prev => prev + 20)}
                  className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        </Tabs>
      )}
    </div>
  );
}
