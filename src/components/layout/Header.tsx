import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/contexts/SalesContext';
import { Menu, Search, Bell, X, Check } from 'lucide-react';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  const { user } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useSales();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task': return '📋';
      case 'lead': return '👤';
      case 'broadcast': return '📢';
      default: return '🔔';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
          
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500 hidden sm:block">
              Welcome back, {user?.name?.split(' ')[0]}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:flex items-center bg-slate-100 rounded-xl px-4 py-2 w-64">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-500">
                        No notifications
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationRead(notif.id)}
                          className={`
                            flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors
                            ${!notif.read && 'bg-indigo-50/50'}
                          `}
                        >
                          <span className="text-lg">{getNotificationIcon(notif.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notif.read ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{notif.message}</p>
                            <p className="text-xs text-slate-400 mt-1">{formatTime(notif.createdAt)}</p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="border-t border-slate-100 p-2">
                    <button className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium py-2 rounded-lg hover:bg-indigo-50 transition-colors">
                      View all notifications
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User avatar */}
          <div className="hidden sm:block">
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">{user?.name?.charAt(0)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
