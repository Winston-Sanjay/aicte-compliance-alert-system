import { Bell, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { notificationsApi } from '../../services/api';

export default function Header() {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationsApi.list({ unreadOnly: 'true' });
        setUnreadCount(res.data.total || 0);
      } catch {
        // Notifications may not be available yet
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      {/* Demo Environment Banner */}
      <div className="demo-banner flex items-center justify-center gap-6">
        <span>⚠ DEMO ENVIRONMENT</span>
        <span className="w-px h-3 bg-warning/40" />
        <span>NO LIVE AICTE CONNECTION</span>
      </div>

      {/* Main Header */}
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo placeholder - no official emblems */}
          <div className="w-10 h-10 bg-navy rounded flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <h1 className="text-base font-semibold text-navy leading-tight">
              AICTE Approval Workflow Automation System
            </h1>
            <p className="text-xs text-text-secondary">
              Smart India Hackathon 2026 | SIH26262
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Link
            to="/notifications"
            className="relative p-2 text-text-secondary hover:text-text-main hover:bg-page-bg rounded transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* User Info */}
          <div className="flex items-center gap-2 pl-3 border-l border-border">
            <div className="w-8 h-8 bg-gov-blue/10 rounded-full flex items-center justify-center">
              <UserIcon size={14} className="text-gov-blue" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-text-main leading-tight">{user?.name}</p>
              <p className="text-xs text-text-secondary capitalize">{user?.role?.toLowerCase()}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-text-secondary hover:text-error hover:bg-error-bg rounded transition-colors ml-1"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
