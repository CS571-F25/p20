import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import ClickOutsideWrapper from '../reusable/ClickOutsideWrapper';
import './NotificationBell.css';

function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
      setLoading(false);
    };

    fetchNotifications();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new, ...prev].slice(0, 10));
            setUnreadCount(prev => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(n => n.id === payload.new.id ? payload.new : n)
            );
            if (payload.new.read && !payload.old.read) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
  };

    const markAllAsRead = async () => {
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false);
        
        // Update local state to mark all as read
        setNotifications(prev => 
            prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
    };

    const clearAllNotifications = async () => {
        await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
        
        setNotifications([]);
        setUnreadCount(0);
    };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'budget_exceeded':
        return '🚨';
      case 'budget_warning':
        return '⚠️';
      case 'savings_goal_achieved':
        return '🎉';
      case 'budget_milestone':
        return '🎯'
      default:
        return '🔔';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return then.toLocaleDateString();
  };

  if (!user) return null;

  return (
    <div className="notification-bell-container">
      <button
        className="notification-bell-button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Notifications"
      >
        <span style={{ 
        fontSize: '20px',
        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
        }}>🔔</span>
        
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <ClickOutsideWrapper onClickOutside={() => setIsOpen(false)}>
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>Notifications</h3>
                {unreadCount > 0 ? (
                  <button onClick={markAllAsRead} className="mark-all-read">
                    Mark all read
                  </button>
                ): 
                notifications.length > 0 ? (
                  <button onClick={clearAllNotifications} className="clear-all-button">
                    Clear all
                  </button>
                ): null}
            </div>

            <div className="notification-list">
              {loading ? (
                <div className="notification-empty">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">
                  <span style={{ fontSize: '2rem' }}>🔔</span>
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">
                        {formatTimeAgo(notification.created_at)}
                      </div>
                    </div>
                    {!notification.read && <div className="notification-dot"></div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </ClickOutsideWrapper>
      )}
    </div>
  );
}

export default NotificationBell;