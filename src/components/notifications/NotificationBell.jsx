import { useState, useEffect, useRef } from 'react';
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
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

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

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus management when dropdown opens
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const firstButton = dropdownRef.current.querySelector('button');
      if (firstButton) {
        firstButton.focus();
      }
    }
  }, [isOpen]);

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
        return '🎯';
      case 'transaction_alert':
        return '💰';
      default:
        return '🔔';
    }
  };

  const getNotificationIconLabel = (type) => {
    switch (type) {
      case 'budget_exceeded':
        return 'Alert';
      case 'budget_warning':
        return 'Warning';
      case 'savings_goal_achieved':
        return 'Celebration';
      case 'budget_milestone':
        return 'Milestone';
      case 'transaction_alert':
        return 'Transaction';
      default:
        return 'Notification';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return then.toLocaleDateString();
  };

  if (!user) return null;

  return (
    <div className="notification-bell-container">
      <button
        ref={buttonRef}
        className="notification-bell-button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span 
          style={{ 
            fontSize: '20px',
            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
          }}
          aria-hidden="true"
        >
          🔔
        </span>
        
        {unreadCount > 0 && (
          <span className="notification-badge" aria-hidden="true">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <ClickOutsideWrapper onClickOutside={() => setIsOpen(false)}>
          <div 
            ref={dropdownRef}
            className="notification-dropdown" 
            role="region"
            aria-label="Notifications panel"
          >
            <div className="notification-header">
              <h3 id="notification-heading">Notifications</h3>
              {unreadCount > 0 ? (
                <button 
                  onClick={markAllAsRead} 
                  className="mark-all-read"
                  aria-label="Mark all notifications as read"
                >
                  Mark all read
                </button>
              ) : notifications.length > 0 ? (
                <button 
                  onClick={clearAllNotifications} 
                  className="clear-all-button"
                  aria-label="Clear all notifications"
                >
                  Clear all
                </button>
              ) : null}
            </div>

            <div 
              className="notification-list" 
              role="list"
              aria-labelledby="notification-heading"
            >
              {loading ? (
                <div className="notification-empty" role="status" aria-live="polite">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty" role="status">
                  <span style={{ fontSize: '1rem', fontWeight: 700 }} aria-hidden="true">No alerts</span>
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                    }}
                    role="listitem"
                    aria-label={`${notification.title}. ${notification.message}. ${formatTimeAgo(notification.created_at)}${!notification.read ? '. Unread' : ''}`}
                  >
                    <div className="notification-icon" aria-label={getNotificationIconLabel(notification.type)}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">
                        {formatTimeAgo(notification.created_at)}
                      </div>
                    </div>
                    {!notification.read && (
                      <>
                        <div className="notification-dot" aria-hidden="true"></div>
                        <span className="sr-only">Unread</span>
                      </>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </ClickOutsideWrapper>
      )}
      
      {/* Live region for screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {unreadCount > 0 && `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
      </div>
    </div>
  );
}

export default NotificationBell;
