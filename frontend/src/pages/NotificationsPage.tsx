import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '../services/api';
import type { Notification } from '../types';
import { Bell, Check, CheckCheck, Loader2, Clock, AlertTriangle, FileText, Shield } from 'lucide-react';

const ICON_MAP: Record<string, typeof Bell> = {
  deadline_approaching: Clock,
  correction_required: AlertTriangle,
  status_change: FileText,
  reviewer_assigned: Shield,
  resubmitted: FileText,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    try {
      const params: Record<string, string> = {};
      if (filter === 'unread') params.unreadOnly = 'true';
      const res = await notificationsApi.list(params);
      setNotifications(res.data.notifications || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, [filter]);

  const markRead = async (id: string) => {
    await notificationsApi.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-main flex items-center gap-2"><Bell size={20} className="text-gov-blue" /> Notifications</h1>
          <p className="text-sm text-text-secondary mt-0.5">{notifications.filter(n => !n.isRead).length} unread</p>
        </div>
        <div className="flex gap-2">
          <select className="form-select w-32" value={filter} onChange={e => setFilter(e.target.value as 'all' | 'unread')}>
            <option value="all">All</option>
            <option value="unread">Unread</option>
          </select>
          <button onClick={markAllRead} className="btn-secondary btn-sm"><CheckCheck size={13} /> Mark All Read</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-gov-blue" size={24} /></div>
      ) : (
        <div className="card divide-y divide-border">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">No notifications.</div>
          ) : (
            notifications.map(n => {
              const Icon = ICON_MAP[n.type] || Bell;
              return (
                <div key={n.id} className={`flex items-start gap-3 px-5 py-3.5 ${n.isRead ? '' : 'bg-info-bg/20'}`}>
                  <Icon size={16} className="text-gov-blue mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.isRead ? 'text-text-main' : 'font-medium text-text-main'}`}>{n.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{n.message}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-text-secondary">{new Date(n.createdAt).toLocaleString('en-IN')}</span>
                      {n.applicationId && (
                        <Link to={`/applications/${n.applicationId}`} className="text-xs text-gov-blue hover:underline">View Application</Link>
                      )}
                    </div>
                  </div>
                  {!n.isRead && (
                    <button onClick={() => markRead(n.id)} className="btn-ghost btn-sm shrink-0" title="Mark as read">
                      <Check size={13} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
