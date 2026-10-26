import { useEffect, useState } from 'react';
import { auditApi } from '../services/api';
import type { AuditLog } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  History, Search, Loader2, Filter, FileText, CheckCircle,
  ArrowRight, UserCheck, ShieldCheck
} from 'lucide-react';

export default function AuditTrailPage() {
  const { user } = useAuth();
  const isInstitution = user?.role === 'INSTITUTION';

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (actionFilter) params.action = actionFilter;
    auditApi.logs(params)
      .then(res => setLogs(res.data.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, actionFilter]);

  const actionTypes = [
    'application.created', 'application.submitted', 'application.resubmitted',
    'document.uploaded', 'validation.completed', 'status.changed',
    'reviewer.assigned', 'comment.added', 'correction.requested', 'decision.recorded',
  ];

  // Helper to format file sizes nicely
  const formatBytes = (bytes?: number) => {
    if (!bytes || isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Convert raw audit action strings into clean readable badges
  const renderActionBadge = (rawAction: string) => {
    const action = (rawAction || '').toUpperCase().replace(/\./g, '_');
    switch (action) {
      case 'APPLICATION_CREATED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">Draft Created</span>;
      case 'APPLICATION_UPDATED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">Details Saved</span>;
      case 'APPLICATION_SUBMITTED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-gov-blue border border-blue-200">Application Lodged</span>;
      case 'APPLICATION_RESUBMITTED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">Resubmitted</span>;
      case 'STATUS_CHANGED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">Status Changed</span>;
      case 'DOCUMENT_UPLOADED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">Document Upload</span>;
      case 'VALIDATION_EXECUTED':
      case 'VALIDATION_COMPLETED':
      case 'VALIDATION_RUN':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">Compliance Screening</span>;
      case 'COMMENT_ADDED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">Officer Note</span>;
      case 'CORRECTION_REQUESTED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">Deficiency Notice</span>;
      case 'DECISION_RECORDED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Council Order</span>;
      case 'OFFICER_ASSIGNED':
      case 'REVIEWER_ASSIGNED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">Officer Assigned</span>;
      default:
        return <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{rawAction.replace(/_/g, ' ')}</span>;
    }
  };

  // Convert technical entity types and IDs into human labels without raw UUIDs
  const renderEntity = (log: AuditLog) => {
    const type = (log.entityType || '').toLowerCase();
    const appNo = log.application?.applicationNo || (log.details as any)?.applicationNo;

    switch (type) {
      case 'application':
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 text-xs flex items-center gap-1">
              <FileText size={12} className="text-gov-blue" />
              <span>Application</span>
            </span>
            {appNo && (
              <span className="text-[11px] font-mono text-gov-blue font-medium mt-0.5">
                {appNo}
              </span>
            )}
          </div>
        );
      case 'validation':
      case 'validationrun':
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 text-xs flex items-center gap-1">
              <CheckCircle size={12} className="text-teal-600" />
              <span>Validation Run</span>
            </span>
            <span className="text-[10px] text-slate-500">APH Compliance Engine</span>
          </div>
        );
      case 'document':
      case 'applicationdocument':
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 text-xs flex items-center gap-1">
              <FileText size={12} className="text-amber-600" />
              <span>Document</span>
            </span>
            {(log.details as any)?.documentType && (
              <span className="text-[10px] text-slate-500 capitalize">
                {String((log.details as any).documentType).replace(/_/g, ' ')}
              </span>
            )}
          </div>
        );
      case 'comment':
      case 'reviewcomment':
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 text-xs flex items-center gap-1">
              <UserCheck size={12} className="text-purple-600" />
              <span>Review Note</span>
            </span>
            <span className="text-[10px] text-slate-500">Scrutiny Feedback</span>
          </div>
        );
      case 'decision':
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 text-xs flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" />
              <span>Council Decision</span>
            </span>
            <span className="text-[10px] text-slate-500">Official Order</span>
          </div>
        );
      default:
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 text-xs capitalize">
              {log.entityType || 'General'}
            </span>
            {!isInstitution && log.entityId && (
              <span className="text-[10px] text-slate-400 font-mono">
                ref: {log.entityId.slice(0, 8)}
              </span>
            )}
          </div>
        );
    }
  };

  // Turn raw JSON details into plain English, human-understandable descriptions
  const renderHumanDetails = (log: AuditLog) => {
    const d = (log.details || {}) as Record<string, any>;
    const action = (log.action || '').toUpperCase().replace(/\./g, '_');

    // 1. Status changes
    if (action === 'STATUS_CHANGED' || (d.fromStatus && d.toStatus)) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
              {String(d.fromStatus || 'DRAFT').replace(/_/g, ' ')}
            </span>
            <ArrowRight size={11} className="text-slate-400 shrink-0" />
            <span className="font-semibold text-gov-blue bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
              {String(d.toStatus).replace(/_/g, ' ')}
            </span>
          </div>
          {d.comment && (
            <p className="text-xs text-slate-600 italic">
              "{d.comment}"
            </p>
          )}
        </div>
      );
    }

    // 2. Application Created
    if (action === 'APPLICATION_CREATED') {
      return (
        <p className="text-xs text-slate-700">
          New application draft initiated for {d.academicYear || 'AY 2026-27'} Extension of Approval.
        </p>
      );
    }

    // 3. Application Updated
    if (action === 'APPLICATION_UPDATED') {
      return (
        <p className="text-xs text-slate-600">
          Application institutional and programme details saved.
        </p>
      );
    }

    // 4. Application Submitted
    if (action === 'APPLICATION_SUBMITTED') {
      return (
        <p className="text-xs text-slate-700">
          Application formally lodged with AICTE Regional Office for scrutiny inspection.
        </p>
      );
    }

    // 5. Application Resubmitted
    if (action === 'APPLICATION_RESUBMITTED') {
      return (
        <p className="text-xs text-slate-700">
          Institution rectified flagged deficiencies and resubmitted application for verification.
        </p>
      );
    }

    // 6. Document Uploaded
    if (action === 'DOCUMENT_UPLOADED') {
      const docName = d.documentName || d.originalName || d.documentType || 'Statutory Certificate';
      const sizeStr = formatBytes(d.fileSize || d.size);
      return (
        <div className="text-xs text-slate-700">
          <span>Uploaded: </span>
          <strong className="text-slate-900">{docName}</strong>
          {sizeStr && <span className="text-slate-500 ml-1">({sizeStr})</span>}
        </div>
      );
    }

    // 7. Validation / Compliance Screening
    if (action.includes('VALIDATION') || d.passed !== undefined || d.errors !== undefined) {
      const passed = d.passed ?? 0;
      const warnings = d.warnings ?? 0;
      const errors = d.errors ?? 0;
      return (
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {passed} Passed
          </span>
          {warnings > 0 && (
            <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {warnings} Warnings
            </span>
          )}
          {errors > 0 ? (
            <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {errors} Deficiencies
            </span>
          ) : (
            <span className="text-emerald-700 text-[11px] font-medium">0 Blocking Deficiencies</span>
          )}
        </div>
      );
    }

    // 8. Officer Assignment
    if (action === 'OFFICER_ASSIGNED' || action === 'REVIEWER_ASSIGNED') {
      return (
        <p className="text-xs text-slate-700">
          Assigned to Scrutiny Committee Officer: <strong>{d.officerName || 'Review Officer'}</strong>
        </p>
      );
    }

    // 9. Review Comment / Correction Requested
    if (action === 'COMMENT_ADDED' || action === 'CORRECTION_REQUESTED') {
      const commentText = d.comment || d.note || d.message || 'Scrutiny observations recorded';
      return (
        <div className="text-xs text-slate-700">
          <span className="font-semibold text-slate-900">
            {action === 'CORRECTION_REQUESTED' ? 'Deficiency Notice: ' : 'Officer Note: '}
          </span>
          <span className="italic text-slate-600">"{commentText}"</span>
        </div>
      );
    }

    // 10. Decision Recorded
    if (action === 'DECISION_RECORDED') {
      const outcome = d.decisionOutcome || d.outcome || 'APPROVED';
      const note = d.decisionNote || d.note;
      return (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              {outcome}
            </span>
            <span className="text-slate-700 font-medium">Extension of Approval Granted</span>
          </div>
          {note && <p className="text-slate-600 italic text-[11px]">"{note}"</p>}
        </div>
      );
    }

    // Fallback: If unknown JSON object, display readable key-value chips
    if (typeof d === 'object' && Object.keys(d).length > 0) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          {Object.entries(d).slice(0, 3).map(([k, v]) => (
            <span key={k} className="text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
              <strong>{k}:</strong> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
            </span>
          ))}
        </div>
      );
    }

    return <span className="text-xs text-slate-400">—</span>;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History size={20} className="text-gov-blue" />
            <span>AICTE Statutory Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable regulatory audit log of all application transitions, document submissions, and officer determinations.
          </p>
        </div>

        {/* User Context Tag */}
        <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Viewing as: <strong className="text-slate-900">{isInstitution ? 'Institution Principal' : 'AICTE Officer'}</strong></span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Recorded Events</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{logs.length}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status Transitions</p>
          <p className="text-xl font-bold text-gov-blue mt-1">
            {logs.filter(l => {
              const a = (l.action || '').toUpperCase();
              return a.includes('APPLICATION') || a.includes('STATUS');
            }).length}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Rule Screenings</p>
          <p className="text-xl font-bold text-teal-700 mt-1">
            {logs.filter(l => (l.action || '').toUpperCase().includes('VALIDATION')).length}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Uploaded Documents</p>
          <p className="text-xl font-bold text-amber-700 mt-1">
            {logs.filter(l => (l.action || '').toUpperCase().includes('DOCUMENT')).length}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card card-body mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[220px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="form-input pl-9 text-xs"
              placeholder="Search by action, user, or details..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select w-56 text-xs"
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
          >
            <option value="">All Action Types</option>
            {actionTypes.map(a => (
              <option key={a} value={a}>
                {a.replace(/\./g, ' ')}
              </option>
            ))}
          </select>
          {(search || actionFilter) && (
            <button
              onClick={() => { setSearch(''); setActionFilter(''); }}
              className="btn-ghost btn-sm text-xs"
            >
              <Filter size={13} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-gov-blue" size={26} />
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr className="bg-slate-50 text-slate-700 text-xs">
                  <th className="w-40 font-bold">Timestamp</th>
                  <th className="w-36 font-bold">Action</th>
                  <th className="w-36 font-bold">Entity</th>
                  <th className="w-44 font-bold">User</th>
                  <th className="font-bold">Details & Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                      No audit log records match the selected filters.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => {
                    const isExpanded = expandedRowId === log.id;
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Timestamp */}
                        <td className="text-xs text-slate-600 whitespace-nowrap align-top py-3">
                          <div className="font-medium">
                            {new Date(log.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {new Date(log.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit', minute: '2-digit', second: '2-digit'
                            })}
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td className="align-top py-3">
                          {renderActionBadge(log.action)}
                        </td>

                        {/* Entity (Clean badge without raw UUID numbers) */}
                        <td className="align-top py-3">
                          {renderEntity(log)}
                        </td>

                        {/* User */}
                        <td className="text-xs align-top py-3">
                          <div className="font-semibold text-slate-900">
                            {log.user?.name || 'AICTE Automated System'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {log.user?.role ? (log.user.role === 'INSTITUTION' ? 'Institution' : 'Officer') : 'System Event'}
                          </div>
                        </td>

                        {/* Details (Human-friendly descriptions) */}
                        <td className="align-top py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              {renderHumanDetails(log)}
                            </div>

                            {/* Optional Raw JSON view toggle for technical inspection */}
                            {log.details && (
                              <button
                                onClick={() => setExpandedRowId(isExpanded ? null : log.id)}
                                className="text-[10px] text-slate-400 hover:text-gov-blue px-1.5 py-0.5 rounded border border-slate-200 hover:border-gov-blue shrink-0 transition"
                                title="Inspect raw event JSON payload"
                              >
                                {isExpanded ? 'Hide Raw' : 'Raw JSON'}
                              </button>
                            )}
                          </div>

                          {/* Raw JSON expander */}
                          {isExpanded && log.details && (
                            <pre className="mt-2 p-2 bg-slate-900 text-slate-200 rounded text-[11px] font-mono overflow-x-auto max-w-xl">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
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
