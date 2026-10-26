import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { applicationsApi, validationApi } from '../services/api';
import type { Application, ValidationRun } from '../types';
import {
  CheckCircle, AlertTriangle, XCircle, Search, RefreshCw,
  FileText, ArrowRight, ShieldCheck, HelpCircle, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ValidationPage() {
  const { isOfficer } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedAppId = searchParams.get('appId') || '';

  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [validationRun, setValidationRun] = useState<ValidationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'ERROR' | 'WARNING' | 'MANUAL_REVIEW'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await applicationsApi.list();
      const list = res.data.applications || [];
      setApplications(list);

      const targetId = selectedAppId || (list.length > 0 ? list[0].id : '');
      if (targetId) {
        loadValidation(targetId, list);
      }
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  };

  const loadValidation = async (appId: string, currentApps = applications) => {
    const app = currentApps.find(a => a.id === appId) || null;
    setSelectedApp(app);
    setSearchParams({ appId });
    try {
      const res = await validationApi.results(appId);
      setValidationRun(res.data.validationRun || null);
    } catch (err) {
      console.error('Failed to load validation findings', err);
      setValidationRun(null);
    }
  };

  const handleRunValidation = async () => {
    if (!selectedApp) return;
    try {
      setValidating(true);
      const res = await validationApi.run(selectedApp.id);
      setValidationRun(res.data.validationRun);
    } catch (err) {
      console.error('Validation failed', err);
    } finally {
      setValidating(false);
    }
  };

  const findings = validationRun?.findings || [];
  const filteredFindings = findings.filter(f => {
    if (filterSeverity !== 'ALL' && f.result !== filterSeverity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        f.message.toLowerCase().includes(q) ||
        f.rule?.name.toLowerCase().includes(q) ||
        f.rule?.ruleCode.toLowerCase().includes(q) ||
        f.correctiveAction?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-lg border border-border shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-gov-blue" size={24} />
            <h1 className="text-xl font-bold text-navy">AICTE Automated Compliance & Validation Engine</h1>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Rules engine evaluates Approval Process Handbook (APH) compliance, mandatory uploads, faculty ratios, and land requirements.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedApp && isOfficer ? (
            <button
              onClick={handleRunValidation}
              disabled={validating}
              className="px-4 py-2 bg-gov-blue text-white rounded font-medium text-sm flex items-center gap-2 hover:bg-gov-blue-dark disabled:opacity-50 transition"
            >
              <RefreshCw size={15} className={validating ? 'animate-spin' : ''} />
              <span>{validating ? 'Evaluating Rules...' : 'Re-run Validation'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-border rounded text-xs font-medium text-text-secondary">
              <ShieldCheck size={14} className="text-gov-blue" />
              <span>Official Scrutiny Findings (Applicant View)</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Application Selector + Validation Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Applications selector */}
        <div className="lg:col-span-1 bg-white rounded-lg border border-border p-4 shadow-sm flex flex-col h-[750px]">
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-3">Applications</h2>
          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {applications.map((app) => {
              const isSelected = app.id === selectedApp?.id;
              return (
                <button
                  key={app.id}
                  onClick={() => loadValidation(app.id)}
                  className={`w-full text-left p-3 rounded border transition ${
                    isSelected
                      ? 'border-gov-blue bg-blue-50/50 text-navy font-semibold shadow-xs'
                      : 'border-border hover:border-gray-300 text-text-main bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-gov-blue">{app.applicationNo}</span>
                    <span className="text-[10px] text-text-secondary px-1.5 py-0.5 bg-gray-100 rounded">
                      {app.category?.code || 'APP'}
                    </span>
                  </div>
                  <p className="text-xs truncate text-text-main font-medium">{app.programmeName || 'Technical Programme'}</p>
                  <p className="text-[11px] text-text-secondary truncate mt-0.5">{app.institution?.name}</p>
                </button>
              );
            })}
            {applications.length === 0 && !loading && (
              <p className="text-xs text-text-secondary text-center py-8">No applications found</p>
            )}
          </div>
        </div>

        {/* Right 3 Columns: Validation Findings */}
        <div className="lg:col-span-3 space-y-6">
          {selectedApp ? (
            <>
              {/* Application Header Card */}
              <div className="bg-white p-5 rounded-lg border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-navy">{selectedApp.applicationNo}</h2>
                    <span className="text-xs px-2.5 py-0.5 bg-gov-blue/10 text-gov-blue font-semibold rounded">
                      {selectedApp.category?.name || 'Approval Request'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {selectedApp.institution?.name} • Academic Year {selectedApp.academicYear || '2025-26'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to={`/applications/${selectedApp.id}`}
                    className="px-3 py-1.5 text-xs font-semibold text-gov-blue border border-gov-blue rounded hover:bg-blue-50 flex items-center gap-1.5 transition"
                  >
                    <FileText size={14} />
                    <span>View Application</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>

              {/* Metric Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-border shadow-sm">
                  <p className="text-xs text-text-secondary uppercase">Total Checks</p>
                  <p className="text-2xl font-bold text-navy mt-1">{validationRun?.totalChecks || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-border shadow-sm">
                  <p className="text-xs text-emerald-700 uppercase">Passed</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{validationRun?.passed || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-border shadow-sm">
                  <p className="text-xs text-amber-700 uppercase">Warnings</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{validationRun?.warnings || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-border shadow-sm">
                  <p className="text-xs text-rose-700 uppercase">Errors (Blocking)</p>
                  <p className="text-2xl font-bold text-rose-600 mt-1">{validationRun?.errors || 0}</p>
                </div>
              </div>

              {/* Filters & Findings List */}
              <div className="bg-white rounded-lg border border-border shadow-sm">
                <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-secondary">Severity:</span>
                    {(['ALL', 'ERROR', 'WARNING', 'MANUAL_REVIEW'] as const).map(sev => (
                      <button
                        key={sev}
                        onClick={() => setFilterSeverity(sev)}
                        className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                          filterSeverity === sev
                            ? 'bg-navy text-white'
                            : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-2.5 text-text-secondary" />
                    <input
                      type="text"
                      placeholder="Search rules or findings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-xs pl-8 pr-3 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-gov-blue w-64"
                    />
                  </div>
                </div>

                <div className="divide-y divide-border">
                  {filteredFindings.map((finding) => {
                    const isError = finding.result === 'ERROR';
                    const isWarning = finding.result === 'WARNING';
                    const isPassed = finding.result === 'PASSED';

                    return (
                      <div key={finding.id} className="p-4 hover:bg-gray-50/50 transition">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {isError && <XCircle className="text-rose-600" size={18} />}
                            {isWarning && <AlertTriangle className="text-amber-500" size={18} />}
                            {isPassed && <CheckCircle className="text-emerald-500" size={18} />}
                            {!isError && !isWarning && !isPassed && <HelpCircle className="text-blue-500" size={18} />}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-semibold text-text-secondary">
                                {finding.rule?.ruleCode || 'RULE'}
                              </span>
                              <div className="flex items-center gap-2">
                                {finding.blocksSubmission && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-700 rounded">
                                    BLOCKS SUBMISSION
                                  </span>
                                )}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  isError ? 'bg-rose-100 text-rose-700' :
                                  isWarning ? 'bg-amber-100 text-amber-700' :
                                  isPassed ? 'bg-emerald-100 text-emerald-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {finding.result}
                                </span>
                              </div>
                            </div>

                            <p className="text-sm font-semibold text-navy mt-1">
                              {finding.rule?.name || finding.message}
                            </p>
                            <p className="text-xs text-text-secondary mt-0.5">
                              {finding.message}
                            </p>

                            {finding.evidence && (
                              <div className="mt-2 text-xs bg-gray-50 p-2.5 rounded border border-gray-200 font-mono text-gray-700">
                                <strong>Evidence / Data:</strong> {finding.evidence}
                              </div>
                            )}

                            {finding.correctiveAction && (
                              <div className="mt-2 text-xs text-gov-blue bg-blue-50/60 p-2 rounded border border-blue-100">
                                <strong>Recommended Action:</strong> {finding.correctiveAction}
                              </div>
                            )}

                            {finding.aiExplanation && (
                              <div className="mt-2 text-xs text-purple-900 bg-purple-50 p-2.5 rounded border border-purple-200 flex items-start gap-2">
                                <Sparkles size={14} className="text-purple-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-semibold">AI Regulatory Assistant:</span> {finding.aiExplanation}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredFindings.length === 0 && (
                    <div className="text-center py-12 text-text-secondary text-xs">
                      No validation findings match your criteria.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 text-center rounded-lg border border-border shadow-sm text-text-secondary text-sm">
              Select an application to view compliance check results.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
