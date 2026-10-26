import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportsApi, applicationsApi } from '../services/api';
import type { DashboardStats, Application } from '../types';
import { STATUS_LABELS, STATUS_CSS } from '../types';
import {
  FileText, AlertTriangle, Clock, CheckCircle, Shield,
  FilePlus, ArrowRight, Loader2, BarChart3
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isOfficer, isInstitution } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApps, setRecentApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, appsRes] = await Promise.all([
          reportsApi.overview(),
          applicationsApi.list({ limit: '5', sort: 'createdAt:desc' }),
        ]);
        setStats(statsRes.data);
        setRecentApps(appsRes.data.applications || []);
      } catch (err) {
        console.error('Dashboard fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gov-blue" size={28} />
      </div>
    );
  }

  const statCards = isOfficer
    ? [
        { label: 'Total Applications', value: stats?.totalApplications ?? 0, icon: FileText, color: 'text-gov-blue', bg: 'bg-info-bg' },
        { label: 'Pending Validation', value: stats?.pendingValidation ?? 0, icon: Clock, color: 'text-warning', bg: 'bg-warning-bg' },
        { label: 'Correction Required', value: stats?.correctionRequired ?? 0, icon: AlertTriangle, color: 'text-error', bg: 'bg-error-bg' },
        { label: 'Under Review', value: stats?.underReview ?? 0, icon: Shield, color: 'text-gov-blue', bg: 'bg-info-bg' },
        { label: 'Approaching Deadlines', value: stats?.approachingDeadlines ?? 0, icon: Clock, color: 'text-warning', bg: 'bg-warning-bg' },
        { label: 'Overdue Tasks', value: stats?.overdueTasks ?? 0, icon: AlertTriangle, color: 'text-error', bg: 'bg-error-bg' },
        { label: 'Ready for Decision', value: stats?.readyForDecision ?? 0, icon: CheckCircle, color: 'text-success', bg: 'bg-success-bg' },
        { label: 'Decisions Recorded', value: stats?.decisionsRecorded ?? 0, icon: BarChart3, color: 'text-success', bg: 'bg-success-bg' },
      ]
    : [
        { label: 'My Applications', value: stats?.totalApplications ?? 0, icon: FileText, color: 'text-gov-blue', bg: 'bg-info-bg' },
        { label: 'Under Review', value: stats?.underReview ?? 0, icon: Shield, color: 'text-gov-blue', bg: 'bg-info-bg' },
        { label: 'Corrections Needed', value: stats?.correctionRequired ?? 0, icon: AlertTriangle, color: 'text-error', bg: 'bg-error-bg' },
        { label: 'Decisions / Approved', value: stats?.decisionsRecorded ?? 0, icon: CheckCircle, color: 'text-success', bg: 'bg-success-bg' },
      ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-main">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Welcome back, {user?.name}
          </p>
        </div>
        {isInstitution && (
          <Link to="/applications/new" className="btn-primary">
            <FilePlus size={15} />
            New Application
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="card card-body">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${card.bg} rounded-md flex items-center justify-center`}>
                <card.icon size={18} className={card.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-main">{card.value}</p>
                <p className="text-xs text-text-secondary">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Applications */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-main">Recent Applications</h2>
          <Link to="/applications" className="text-xs text-gov-blue hover:underline flex items-center gap-1">
            View All <ArrowRight size={12} />
          </Link>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Application No</th>
                <th>Institution</th>
                <th>Category</th>
                <th>Status</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-text-secondary">
                    No applications found.
                    {isInstitution && (
                      <Link to="/applications/new" className="text-gov-blue hover:underline ml-1">
                        Create your first application
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                recentApps.map((app) => (
                  <tr key={app.id}>
                    <td className="font-mono text-sm font-medium">{app.applicationNo}</td>
                    <td>{app.institution?.name || '—'}</td>
                    <td>{app.category?.name || '—'}</td>
                    <td>
                      <div className="flex flex-col gap-1 items-start">
                        <span className={STATUS_CSS[app.status]}>
                          {STATUS_LABELS[app.status]}
                        </span>
                        {app.decisionOutcome && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            app.decisionOutcome === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            app.decisionOutcome === 'CONDITIONALLY_APPROVED' ? 'bg-blue-100 text-blue-800' :
                            app.decisionOutcome === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {app.decisionOutcome}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-text-secondary text-sm">
                      {app.submittedAt
                        ? new Date(app.submittedAt).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                    <td>
                      <Link
                        to={`/applications/${app.id}`}
                        className="text-xs text-gov-blue hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
