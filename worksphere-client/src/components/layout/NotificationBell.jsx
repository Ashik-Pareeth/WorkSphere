import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../api/hrApi';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const response = await fetchNotifications();
      const notifs = response.data || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotifications();

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, isCurrentlyRead) => {
    if (isCurrentlyRead) return;
    try {
      await markNotificationRead(id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  // Maps backend notification types to frontend routes
  const getRouteForNotification = (type, referenceId) => {
    switch (type) {
      // ── Tasks ────────────────────────────────────────────────
      case 'TASK_ASSIGNED':
      case 'TASK_STATUS_UPDATED':
      case 'TASK_COMPLETED':
      case 'TASK_RATED':
        return referenceId ? `/tasks?open=${referenceId}` : '/tasks';

      // ── Leave ────────────────────────────────────────────────
      case 'LEAVE_SUBMITTED':
      case 'LEAVE_APPROVED':
      case 'LEAVE_REJECTED':
      case 'LEAVE_CANCELLED':
        return '/leave';

      // ── Helpdesk ─────────────────────────────────────────────
      case 'TICKET_UPDATE':
        return referenceId ? `/helpdesk?ticket=${referenceId}` : '/helpdesk';

      // ── Payroll ──────────────────────────────────────────────
      case 'PAYSLIP_READY':
        return '/my-compensation';

      // ── Appraisals ───────────────────────────────────────────
      case 'APPRAISAL_DUE':
      case 'APPRAISAL_RECEIVED':
      case 'MANAGER_REPORT_SUBMITTED':
      case 'MANAGER_REPORT_REVIEWED':
        return '/my-appraisals';

      // ── Assets ───────────────────────────────────────────────
      case 'ASSET_ASSIGNED':
      case 'ASSET_RETURN_REQUEST':
        return '/my-assets';

      // ── Attendance ───────────────────────────────────────────
      case 'ATTENDANCE_LATE':
      case 'TIMESHEET_MANUALLY_ADJUSTED':
        return '/attendance-log';

      // ── Bulletin ─────────────────────────────────────────────
      case 'NEW_ANNOUNCEMENT':
        return '/bulletin';

      // ── Profile / HR Actions ─────────────────────────────────
      case 'OFFBOARDING_INITIATED':
      case 'EMPLOYEE_ACTION_APPLIED':
        return '/profile';

      // ── Hiring / Recruiting (HR-facing) ──────────────────────
      case 'INTERVIEW_SCHEDULED':
      case 'INTERVIEW_FEEDBACK_SUBMITTED':
      case 'CANDIDATE_APPLIED':
      case 'CANDIDATE_STATUS_CHANGED':
        return '/hiring/jobs';

      default:
        return '/dashboard';
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-full transition-colors focus:outline-none"
      >
        {/* Simple Bell SVG */}
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown List */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-center text-gray-500">
                You have no notifications.
              </div>
            ) : (
              notifications.map((notif) => (
                <Link
                  key={notif.id}
                  to={getRouteForNotification(notif.type, notif.referenceId)}
                  onClick={() => {
                    handleMarkAsRead(notif.id, notif.isRead);
                    setIsOpen(false);
                  }}
                  className={`block px-4 py-3 border-b border-gray-50 hover:bg-blue-50 transition-colors ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`text-sm font-semibold ${!notif.isRead ? 'text-gray-900' : 'text-gray-700'}`}
                    >
                      {notif.title}
                    </span>
                    {!notif.isRead && (
                      <span className="w-2 h-2 mt-1.5 bg-blue-600 rounded-full shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {notif.message}
                  </p>
                </Link>
              ))
            )}
          </div>
          
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5 text-center">
            <Link 
              to="/notifications" 
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              See all notifications &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
