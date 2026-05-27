'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Package } from 'lucide-react';
import Badge from './Badge';
import api from '@/lib/api';
import { formatRelativeTime } from '@/utils/helpers';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="danger" size="sm">
                  {unreadCount}
                </Badge>
              )}
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No notifications</p>
                  <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notif, index) => (
                    <div
                      key={index}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          notif.severity === 'warning'
                            ? 'bg-orange-100'
                            : notif.severity === 'error'
                            ? 'bg-red-100'
                            : 'bg-blue-100'
                        }`}>
                          {notif.type === 'low_stock' || notif.type === 'out_of_stock' ? (
                            <AlertTriangle className={`w-5 h-5 ${
                              notif.severity === 'error' ? 'text-red-600' : 'text-orange-600'
                            }`} />
                          ) : (
                            <Package className="w-5 h-5 text-blue-600" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notif.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notif.message}
                          </p>
                          {notif.items && notif.items.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {notif.items.slice(0, 3).map((item: any, i: number) => (
                                <p key={i} className="text-xs text-gray-500">
                                  • {item.product_name} ({item.quantity} left)
                                </p>
                              ))}
                              {notif.items.length > 3 && (
                                <p className="text-xs text-gray-400">
                                  +{notif.items.length - 3} more items
                                </p>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {formatRelativeTime(notif.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to inventory page
                    window.location.href = '/owner/inventory';
                  }}
                  className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View Inventory
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}