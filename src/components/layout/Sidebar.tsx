import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/contexts/SalesContext';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  Kanban,
  MessageSquare,
  Mail,
  CheckSquare,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Bell
} from 'lucide-react';
import logo from '@/assets/logo.png';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onToggle }) => {
  const { t } = useTranslation();
  const { user, logout, hasRole } = useAuth();
  const { notifications } = useSales();

  const unreadCount = notifications.filter(n => !n.read).length;

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, roles: ['admin', 'manager', 'sales'] },
    { id: 'leads', label: t('leads'), icon: Users, roles: ['admin', 'manager', 'sales'] },
    { id: 'pipeline', label: t('pipeline'), icon: Kanban, roles: ['admin', 'manager', 'sales'] },
    { id: 'whatsapp', label: t('whatsapp'), icon: MessageSquare, roles: ['admin', 'manager', 'sales'] },
    { id: 'email', label: t('email'), icon: Mail, roles: ['admin', 'manager', 'sales'] },
    { id: 'tasks', label: t('tasks'), icon: CheckSquare, roles: ['admin', 'manager', 'sales'] },
    { id: 'analytics', label: t('analytics'), icon: BarChart3, roles: ['admin', 'manager'] },
    { id: 'settings', label: t('settings'), icon: Settings, roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    hasRole(item.roles as any[])
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full bg-slate-900 text-white transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-0 lg:w-20'}
        lg:relative
      `}>
        <div className={`flex flex-col h-full ${!isOpen && 'lg:items-center'} overflow-hidden`}>
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            {isOpen && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden p-1">
                  <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-semibold text-lg">{t('app_name')}</span>
              </div>
            )}
            <button
              onClick={onToggle}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors hidden lg:block"
            >
              <ChevronLeft className={`w-5 h-5 transition-transform ${!isOpen && 'rotate-180'}`} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 overflow-y-auto">
            <ul className="space-y-1 px-3">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onNavigate(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                        ${isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }
                        ${!isOpen && 'lg:justify-center lg:px-0'}
                      `}
                      title={!isOpen ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {isOpen && <span className="font-medium">{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Notifications */}
          <div className="px-3 py-2">
            <button
              onClick={() => onNavigate('notifications')}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                text-slate-400 hover:bg-slate-800 hover:text-white relative
                ${!isOpen && 'lg:justify-center lg:px-0'}
              `}
            >
              <Bell className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="font-medium">{t('notifications')}</span>}
              {unreadCount > 0 && (
                <span className={`
                  absolute bg-red-500 text-white text-xs font-bold rounded-full
                  ${isOpen ? 'right-3 px-2 py-0.5' : 'top-1 right-1 w-5 h-5 flex items-center justify-center'}
                `}>
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* User Profile */}
          <div className="border-t border-slate-700 p-4">
            <div className={`flex items-center gap-3 ${!isOpen && 'lg:justify-center'}`}>
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-700"
                />
              ) : (
                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">{user?.name?.charAt(0)}</span>
                </div>
              )}
              {isOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              className={`
                mt-4 w-full flex items-center gap-3 px-3 py-2 rounded-lg
                text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors
                ${!isOpen && 'lg:justify-center lg:px-0'}
              `}
            >
              <LogOut className="w-5 h-5" />
              {isOpen && <span className="text-sm">{t('logout')}</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
