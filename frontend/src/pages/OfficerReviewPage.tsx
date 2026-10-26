import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationsApi, reportsApi } from '../services/api';
import type { Application, DashboardStats } from '../types';
import { STATUS_LABELS, STATUS_CSS } from '../types';
import { Shield, Search, Filter, Loader2, Clock, AlertTriangle, CheckCircle, Users } from 'lucide-react';

export default function OfficerReviewPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        const [appsRes, statsRes] = await Promise.all([
          applicationsApi.list(params),
          reportsApi.overview(),
        ]);
        setApps(appsRes.data.applications || []);
        setStats(statsRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [search, statusFilter]);

  const reviewStatuses = [
    'SUBMITTED', 'VALIDATION_IN_PROGRESS', 'CORRECTION_REQUIRED',
    'RESUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFO_REQUESTED',
    'READY_FOR_DECISION',
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-main flex items-center gap-2">
          <Shield size={20} className="text-gov-blue" /> Officer Review Dashboard
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">Manage and review application submissions</p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <div className="card card-body flex items-center gap-3">
            <Clock size={18} className="text-warning" />
            <div><p className="text-lg font-bold">{stats.pendingValidation}</p><p className="text-xs text-text-secondary">Pending</p></div>
          </div>
          <div className="card card-body flex items-center gap-3">
            <AlertTriangle size={18} className="text-error" />
            <div><p className="text-lg font-bold">{stats.correctionRequired}</p><p className="text-xs text-text-secondary">Corrections</p></div>
          </div>
          <div className="card card-body flex items-center gap-3">
            <Shield size={18} className="text-gov-blue" />
            <div><p className="text-lg font-bold">{stats.underReview}</p><p className="text-xs text-text-secondary">Under Review</p></div>
          </div>
          <div className="card card-body flex items-center gap-3">
            <CheckCircle size={18} className="text-success" />
            <div><p className="text-lg font-bold">{stats.readyForDecision}</p><p className="text-xs text-text-secondary">Ready</p></div>
          </div>
          <div className="card card-body flex items-center gap-3">
            <Users size={18} className="text-error" />
            <div><p className="text-lg font-bold">{stats.overdueTasks}</p><p className="text-xs text-text-secondary">Overdue</p></div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card card-body mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input className="form-input pl-9" placeholder="Search applications..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select w-52" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Review Statuses</option>
            {reviewStatuses.map(s => <option key={s} value={s}>{STATUS_LABELS[s as keyof typeof STATUS_LABELS]}</option>)}
          </select>
          {(search || statusFilter) && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); }} className="btn-ghost btn-sm"><Filter size={13} /> Clear</button>
          )}
        </div>
      </div>

      {/* Applications Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-gov-blue" size={24} /></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application No</th>
                  <th>Institution</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {apps.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-text-secondary">No applications in the review queue.</td></tr>
                ) : (
                  apps.map(app => {
                    const isOverdue = app.deadlineDate && new Date(app.deadlineDate) < new Date();
                    return (
                      <tr key={app.id} className={isOverdue ? 'bg-error-bg/30' : ''}>
                        <td className="font-mono text-sm font-medium">{app.applicationNo}</td>
                        <td className="max-w-[180px] truncate">{app.institution?.name || '—'}</td>
                        <td>{app.category?.name || '—'}</td>
                        <td><span className={STATUS_CSS[app.status]}>{STATUS_LABELS[app.status]}</span></td>
                        <td className={`text-sm ${isOverdue ? 'text-error font-medium' : 'text-text-secondary'}`}>
                          {app.deadlineDate ? new Date(app.deadlineDate).toLocaleDateString('en-IN') : '—'}
                          {isOverdue && <span className="ml-1 text-[10px]">OVERDUE</span>}
                        </td>
                        <td className="text-sm text-text-secondary">{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('en-IN') : '—'}</td>
                        <td>
                          <Link to={`/applications/${app.id}`} className="btn-primary btn-sm">Review</Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
