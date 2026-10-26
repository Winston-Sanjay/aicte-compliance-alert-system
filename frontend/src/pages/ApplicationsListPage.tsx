import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationsApi } from '../services/api';
import type { Application, ApplicationStatus } from '../types';
import { STATUS_LABELS, STATUS_CSS } from '../types';
import { Search, Filter, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ApplicationsListPage() {
  const { isInstitution } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  useEffect(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (categoryFilter) params.categoryId = categoryFilter;

    applicationsApi.list(params)
      .then(res => setApplications(res.data.applications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, statusFilter, categoryFilter]);

  const statuses: ApplicationStatus[] = [
    'DRAFT', 'SUBMITTED', 'VALIDATION_IN_PROGRESS', 'CORRECTION_REQUIRED',
    'RESUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFO_REQUESTED',
    'READY_FOR_DECISION', 'DECISION_RECORDED', 'CLOSED',
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-main">
            {isInstitution ? 'My Applications' : 'All Applications'}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">{applications.length} applications found</p>
        </div>
        {isInstitution && (
          <Link to="/applications/new" className="btn-primary">
            <FileText size={15} /> New Application
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card card-body mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              className="form-input pl-9"
              placeholder="Search by application no, institution..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="form-select w-48" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          {(search || statusFilter || categoryFilter) && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); }} className="btn-ghost btn-sm">
              <Filter size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-gov-blue" size={24} />
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application No</th>
                  <th>Institution</th>
                  <th>Category</th>
                  <th>Programme</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-text-secondary">
                      No applications match your filters.
                    </td>
                  </tr>
                ) : (
                  applications.map(app => (
                    <tr key={app.id}>
                      <td className="font-mono text-sm font-medium">{app.applicationNo}</td>
                      <td className="max-w-[200px] truncate">{app.institution?.name || '—'}</td>
                      <td>{app.category?.name || '—'}</td>
                      <td>{app.programmeName || '—'}</td>
                      <td>
                        <div className="flex flex-col gap-1 items-start">
                          <span className={STATUS_CSS[app.status]}>{STATUS_LABELS[app.status]}</span>
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
                      <td className="text-sm text-text-secondary">
                        {app.deadlineDate ? new Date(app.deadlineDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="text-sm text-text-secondary">
                        {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td>
                        <Link to={`/applications/${app.id}`} className="text-xs text-gov-blue hover:underline font-medium">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
