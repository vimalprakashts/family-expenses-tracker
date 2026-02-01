import { useState } from 'react';
import { Bell, AlertTriangle, CreditCard, TrendingUp, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '../hooks/useNotifications';
import type { Notification as DbNotification } from '../lib/supabase';

// Map database notification types to display types
const mapNotificationType = (type: string): 'payment' | 'alert' | 'update' | 'reminder' => {
  switch (type) {
    case 'emi':
    case 'card':
      return 'payment';
    case 'budget':
      return 'alert';
    case 'insurance':
    case 'reminder':
      return 'reminder';
    case 'system':
    default:
      return 'update';
  }
};

// Map priority to severity
const mapPriorityToSeverity = (priority: string): 'critical' | 'warning' | 'info' | 'success' => {
  switch (priority) {
    case 'high':
      return 'critical';
    case 'medium':
      return 'warning';
    default:
      return 'info';
  }
};

// Format relative time
const formatRelativeTime = (date: string): string => {
  const now = new Date();
  const notifDate = new Date(date);
  const diffMs = now.getTime() - notifDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return notifDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

const typeIcons = {
  payment: <CreditCard className="w-5 h-5" />,
  alert: <AlertTriangle className="w-5 h-5" />,
  update: <TrendingUp className="w-5 h-5" />,
  reminder: <Bell className="w-5 h-5" />,
};

const severityColors = {
  critical: 'bg-danger-50 border-danger-200 text-danger-700',
  warning: 'bg-warning-50 border-warning-200 text-warning-700',
  info: 'bg-primary-50 border-primary-200 text-primary-700',
  success: 'bg-success-50 border-success-200 text-success-700',
};

const severityIconBg = {
  critical: 'bg-danger-100',
  warning: 'bg-warning-100',
  info: 'bg-primary-100',
  success: 'bg-success-100',
};

export default function Notifications() {
  const { data: dbNotifications = [], isLoading } = useNotifications();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteMutation = useDeleteNotification();
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Transform database notifications to UI format
  const notifications = dbNotifications.map((n: DbNotification) => ({
    id: n.id,
    type: mapNotificationType(n.type),
    title: n.title,
    message: n.message,
    time: formatRelativeTime(n.created_at),
    read: n.is_read ?? false,
    actionLabel: n.action_url ? 'View' : undefined,
    actionUrl: n.action_url,
    severity: mapPriorityToSeverity(n.priority || 'low'),
  }));

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = notifications.filter(n => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Unread') return !n.read;
    return n.type === selectedFilter.toLowerCase();
  });

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'
            }
          </p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="btn-secondary flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['All', 'Unread', 'Payments', 'Alerts', 'Updates', 'Reminders'].map(filter => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              selectedFilter === filter
                ? 'text-primary-600 border-primary-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {filter}
            {filter === 'Unread' && unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-danger-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {/* Unread Section */}
        {filteredNotifications.filter(n => !n.read).length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Unread</h2>
            {filteredNotifications.filter(n => !n.read).map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Read Section */}
        {filteredNotifications.filter(n => n.read).length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Earlier</h2>
            {filteredNotifications.filter(n => n.read).map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface UiNotification {
  id: string;
  type: 'payment' | 'alert' | 'update' | 'reminder';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string | null;
  severity: 'critical' | 'warning' | 'info' | 'success';
}

function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: UiNotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const severity = notification.severity || 'info';

  return (
    <div className={`card border ${!notification.read ? 'border-primary-200 bg-primary-50/30' : ''}`}>
      <div className="flex gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${severityIconBg[severity]}`}>
          <span className={`${severityColors[severity].split(' ')[2]}`}>
            {typeIcons[notification.type]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                {notification.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
              <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
            </div>
            {!notification.read && (
              <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
            )}
          </div>
          <div className="flex items-center gap-3 mt-3">
            {notification.actionLabel && (
              <button className="btn-primary text-sm py-1.5 px-3">
                {notification.actionLabel}
              </button>
            )}
            {!notification.read && (
              <button 
                onClick={() => onMarkAsRead(notification.id)}
                className="btn-secondary text-sm py-1.5 px-3"
              >
                Mark as Read
              </button>
            )}
            <button 
              onClick={() => onDelete(notification.id)}
              className="text-gray-400 hover:text-danger-600 p-1.5 rounded-lg hover:bg-danger-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
