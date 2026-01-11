
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Palette,
  ShoppingBag,
  Headphones,
  ClipboardCheck,
  Bell,
  Search,
  Settings,
  FileText,
  LogOut
} from 'lucide-react';
import { Staff, Role } from '../types';
import NotificationPanel from './NotificationPanel';
import SettingsModal from './SettingsModal';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenSummary: () => void;
  currentUser: Staff;
  onUserLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, onOpenSummary, currentUser, onUserLogout }) => {
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [Role.MANAGER, Role.DESIGNER, Role.SELLER, Role.CS] },
    { id: 'users', label: 'Staff Management', icon: Settings, roles: [Role.MANAGER] },
    { id: 'designer', label: 'Design Board', icon: Palette, roles: [Role.MANAGER, Role.DESIGNER] },
    { id: 'seller', label: 'Seller Board', icon: ShoppingBag, roles: [Role.MANAGER, Role.SELLER] },
    { id: 'cs', label: 'CS Board', icon: Headphones, roles: [Role.MANAGER, Role.CS] },
    { id: 'reports', label: 'Daily Reports', icon: ClipboardCheck, roles: [Role.MANAGER] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(currentUser.role));

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('accessToken'); // Changed from 'token' to 'accessToken'

      const response = await fetch('http://localhost:3001/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        console.error('Failed to fetch notifications, status:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('accessToken'); // Changed from 'token' to 'accessToken'
      await fetch('http://localhost:3001/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setUnreadCount(0);
      setNotificationPanelOpen(false);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white italic">
            DTC
          </div>
          <span className="text-xl font-bold tracking-tight">TeamFlow</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 rounded-xl">
            <img src={currentUser.avatar} className="w-10 h-10 rounded-full bg-slate-700" alt={currentUser.name} />
            <div className="flex-1 truncate">
              <p className="text-sm font-semibold truncate">{currentUser.role} [{currentUser.name}]</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">{currentUser.role}</p>
            </div>
          </div>
          <button
            onClick={onUserLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-red-500/10 rounded-lg transition-all"
          >
            <LogOut size={14} />
            Switch Account
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 relative">
          <div className="flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-lg w-96">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, campaigns, designs..."
              className="bg-transparent border-none outline-none text-sm w-full text-slate-600"
            />
          </div>

          <div className="flex items-center gap-4">
            {currentUser.role === Role.MANAGER && (
              <button
                onClick={onOpenSummary}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-all border border-blue-100"
              >
                <FileText size={18} />
                Review Daily
              </button>
            )}
            <button
              onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
              className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>

          {/* Notification Panel */}
          <NotificationPanel
            isOpen={notificationPanelOpen}
            onClose={() => setNotificationPanelOpen(false)}
            notifications={notifications}
            onMarkAllRead={handleMarkAllRead}
          />
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </main>

      {/* Settings Modal */}
      {settingsModalOpen && (
        <SettingsModal onClose={() => setSettingsModalOpen(false)} />
      )}
    </div>
  );
};

export default Layout;
