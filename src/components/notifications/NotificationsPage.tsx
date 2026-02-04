import React from 'react';
import { useSales } from '@/contexts/SalesContext';
import { useTranslation } from 'react-i18next';
import {
    Bell,
    CheckCheck,
    Trash2,
    Search,
    Filter,
    Calendar,
    Clock,
    User,
    MoreVertical,
    CheckCircle2,
    AlertCircle,
    MessageSquare,
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

const NotificationsPage: React.FC = () => {
    const { t } = useTranslation();
    const {
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        deleteAllNotifications
    } = useSales();

    const getIcon = (type: string) => {
        switch (type) {
            case 'task': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'lead': return <Users className="w-5 h-5 text-indigo-500" />;
            case 'broadcast': return <MessageSquare className="w-5 h-5 text-purple-500" />;
            default: return <Bell className="w-5 h-5 text-slate-400" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'task': return 'bg-emerald-50';
            case 'lead': return 'bg-indigo-50';
            case 'broadcast': return 'bg-purple-50';
            default: return 'bg-slate-50';
        }
    };

    return (
        <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('notifications')}</h1>
                    <p className="text-slate-500">{t('notifications_desc', 'Stay updated with your latest sales activity')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl flex items-center gap-2"
                        onClick={markAllNotificationsRead}
                        disabled={notifications.every(n => n.read)}
                    >
                        <CheckCheck className="w-4 h-4" />
                        {t('mark_all_read', 'Mark all read')}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
                        onClick={deleteAllNotifications}
                    >
                        <Trash2 className="w-4 h-4" />
                        {t('clear_all', 'Clear all')}
                    </Button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-[24px] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100/60 overflow-hidden">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Bell className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">{t('no_notifications', 'All caught up!')}</h3>
                        <p className="text-slate-500 max-w-sm">
                            {t('no_notifications_desc', 'You have no new notifications. We\'ll let you know when something happens.')}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((notif) => (
                            <div
                                key={notif.id}
                                className={`group flex items-start gap-4 p-5 transition-all duration-300 hover:bg-slate-50/50 ${!notif.read ? 'bg-indigo-50/30' : ''}`}
                                onClick={() => !notif.read && markNotificationRead(notif.id)}
                            >
                                <div className={`p-2.5 rounded-xl ${getBgColor(notif.type)} flex-shrink-0 mt-1`}>
                                    {getIcon(notif.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className={`text-sm tracking-tight ${!notif.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                            {notif.title}
                                        </h4>
                                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                                        {notif.message}
                                    </p>

                                    <div className="flex items-center gap-4">
                                        {!notif.read && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markNotificationRead(notif.id);
                                                }}
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                                            >
                                                {t('mark_as_read', 'Mark as read')}
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notif.id);
                                            }}
                                            className="text-xs font-medium text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            {t('delete', 'Delete')}
                                        </button>
                                    </div>
                                </div>

                                {!notif.read && (
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-3 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Settings Hint */}
            <div className="flex items-center justify-center gap-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <AlertCircle className="w-4 h-4 text-slate-400" />
                <p className="text-xs text-slate-500">
                    {t('notification_settings_hint', 'You can customize your notification preferences in')}
                    <button className="text-indigo-600 font-bold ml-1 hover:underline">
                        {t('settings', 'Settings')}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default NotificationsPage;
