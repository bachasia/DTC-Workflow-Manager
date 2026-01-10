import React, { useEffect, useRef } from 'react';
import { Bell, X, Check, Clock } from 'lucide-react';

interface Notification {
    id: string;
    type: string;
    message: string;
    createdAt: string;
    task?: {
        id: string;
        title: string;
    };
}

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
    onMarkAllRead: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
    isOpen,
    onClose,
    notifications,
    onMarkAllRead,
}) => {
    const panelRef = useRef<HTMLDivElement>(null);

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'TASK_ASSIGNED':
                return '📋';
            case 'STATUS_CHANGED':
                return '🔄';
            case 'DEADLINE_APPROACHING':
                return '⏰';
            case 'TASK_OVERDUE':
                return '🚨';
            case 'DAILY_REPORT_REMINDER':
                return '📝';
            default:
                return '🔔';
        }
    };

    return (
        <div
            ref={panelRef}
            className="absolute right-0 top-16 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200"
        >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                    <Bell size={18} className="text-blue-600" />
                    <h3 className="font-bold text-slate-900">Notifications</h3>
                    {notifications.length > 0 && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                            {notifications.length}
                        </span>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
                >
                    <X size={18} className="text-slate-400" />
                </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                        <Bell size={48} className="mx-auto mb-3 text-slate-300" />
                        <p className="text-sm font-medium text-slate-500">No notifications yet</p>
                        <p className="text-xs text-slate-400 mt-1">
                            You'll see updates about your tasks here
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                <div className="flex gap-3">
                                    <div className="text-2xl flex-shrink-0">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            {notification.message}
                                        </p>
                                        {notification.task && (
                                            <p className="text-xs text-blue-600 font-medium mt-1 truncate">
                                                📌 {notification.task.title}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                                            <Clock size={12} />
                                            <span>{getTimeAgo(notification.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="p-3 border-t border-slate-100 bg-slate-50">
                    <button
                        onClick={onMarkAllRead}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <Check size={16} />
                        Mark all as read
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;
