import { useEffect, useState } from 'react';
import { reportsApi, applicationsApi } from '../services/api';
import type { ReportData, Application } from '../types';
import {
  BarChart3, Loader2, AlertCircle, RefreshCw, Printer, Sparkles
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import AicteCertificateModal from '../components/AicteCertificateModal';
import AiScrutinyBriefModal from '../components/AiScrutinyBriefModal';

const COLORS = ['#123B64', '#1F5F99', '#2A7BC8', '#247A43', '#A96800', '#B42318', '#5E6B78', '#7C3AED'];

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeCertApp, setActiveCertApp] = useState<Application | null>(null);
  const [activeAiApp, setActiveAiApp] = useState<Application | null>(null);

  const loadData = () => {
    setLoading(true);
    setError('');

    Promise.all([
      reportsApi.overview(),
      applicationsApi.list().catch(() => ({ data: { applications: [] } })),
    ])
      .then(([repRes, appRes]) => {
        setData(repRes.data.reports || repRes.data);
        const apps = appRes.data?.applications || [];
        setApplications(apps);
        if (apps.length > 0) {
          setSelectedAppId(apps[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load reports:', err);
        setError('Unable to fetch reports from the server. Please ensure the backend is running and you are logged in as an officer.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedApp = applications.find((a) => a.id === selectedAppId) || applications[0] || null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="animate-spin text-gov-blue" size={32} />
        <p className="text-sm text-text-secondary">Generating AICTE compliance analytics & reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-lg border border-border text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-base font-bold text-navy">Failed to Load Reports</h3>
        <p className="text-xs text-text-secondary leading-relaxed">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-gov-blue text-white rounded font-medium text-xs inline-flex items-center gap-2 hover:bg-gov-blue-dark transition cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  const hasStatusData = data?.applicationsByStatus && data.applicationsByStatus.length > 0;
  const hasCategoryData = data?.applicationsByCategory && data.applicationsByCategory.length > 0;
  const hasWorkloadData = data?.workloadByOfficer && data.workloadByOfficer.length > 0;
  const hasDeadlineData = data?.deadlineStatus && data.deadlineStatus.length > 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-lg border border-border shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy flex items-center gap-2">
            <BarChart3 size={22} className="text-gov-blue" />
            <span>AICTE Approval Reports, Certificates & Regulatory Analytics</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Real-time compliance distributions, executive GenAI synthesis, and official AICTE letterhead generation
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-3 py-1.5 border border-border rounded text-xs font-semibold text-text-main hover:bg-page-bg flex items-center gap-1.5 transition cursor-pointer"
        >
          <RefreshCw size={13} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* SPECIAL FEATURE CARDS: 1. Official AICTE Letterhead & 2. GenAI Executive Scrutiny Brief */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Official AICTE Letters & Certificates Generator */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Printer size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Official AICTE Letters & Certificates Generator</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Extension of Approval (EoA) Orders · AY 2026-27 Letterhead
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                GIS + QR Enabled
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Generates the authentic Government of India AICTE Extension of Approval (EoA) letter with an embedded <strong>irregular polygon GIS campus land map</strong> (P1-P6 GPS vertices) and a <strong>scannable QR verification code</strong>.
            </p>

            {applications.length > 0 && (
              <div className="mb-4">
                <label className="text-[11px] text-slate-400 font-medium block mb-1">
                  Select Technical Institution Dossier:
                </label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-sky-400"
                >
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.institution?.name || 'Technical Institute'} ({app.applicationNo})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => selectedApp && setActiveCertApp(selectedApp)}
              disabled={!selectedApp}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50"
            >
              <Printer size={14} />
              <span>Generate Official AICTE Letter (with GIS Land Map & QR)</span>
            </button>
          </div>
        </div>

        {/* Card 2: GenAI Executive Scrutiny Synthesis Dossier */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white rounded-xl border border-indigo-900/50 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-indigo-900/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Sparkles size={16} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>GenAI Executive Scrutiny Synthesis Dossier</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  </h3>
                  <p className="text-[11px] text-indigo-300">
                    Autonomous Multi-Pillar Regulatory Appraisal Engine
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700 font-semibold">
                AICTE GenAI v4.2
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Provides Scrutiny Committees with an instant 1-click executive brief assessing <strong>Contiguous Land</strong>, <strong>Student-Faculty Ratio (SFR 1:16.7 vs 1:20 norm)</strong>, statutory safety NOCs, and automated approval recommendation notes.
            </p>

            {applications.length > 0 && (
              <div className="mb-4">
                <label className="text-[11px] text-slate-400 font-medium block mb-1">
                  Target Application for Synthesis:
                </label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full bg-slate-900 border border-indigo-800/80 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400"
                >
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.institution?.name || 'Technical Institute'} ({app.applicationNo})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => selectedApp && setActiveAiApp(selectedApp)}
              disabled={!selectedApp}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={14} />
              <span>Open GenAI Executive Scrutiny Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications by Status */}
        <div className="bg-white rounded-lg border border-border shadow-sm p-5">
          <div className="border-b border-border pb-3 mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy">Applications by Workflow Stage</h3>
            <span className="text-[10px] font-mono bg-blue-50 text-gov-blue px-2 py-0.5 rounded font-semibold">
              Live Database
            </span>
          </div>
          {hasStatusData ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.applicationsByStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#5E6B78' }} />
                <YAxis dataKey="status" type="category" width={140} tick={{ fontSize: 10, fill: '#5E6B78' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #D6DDE5' }} />
                <Bar dataKey="count" fill="#1F5F99" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-20 text-center text-xs text-text-secondary">No status distribution data available.</div>
          )}
        </div>

        {/* Applications by Category */}
        <div className="bg-white rounded-lg border border-border shadow-sm p-5">
          <div className="border-b border-border pb-3 mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy">Applications by Category (APH 2026-27)</h3>
            <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-semibold">
              Distribution
            </span>
          </div>
          {hasCategoryData ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.applicationsByCategory}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  label={((entry: Record<string, unknown>) => `${entry.category ?? entry.name}: ${entry.count ?? entry.value}`) as any}
                >
                  {data.applicationsByCategory.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #D6DDE5' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-20 text-center text-xs text-text-secondary">No category records found.</div>
          )}
        </div>

        {/* Workload by Officer */}
        <div className="bg-white rounded-lg border border-border shadow-sm p-5">
          <div className="border-b border-border pb-3 mb-4">
            <h3 className="text-sm font-bold text-navy">Officer Scrutiny Caseload</h3>
          </div>
          {hasWorkloadData ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.workloadByOfficer}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="officer" tick={{ fontSize: 10, fill: '#5E6B78' }} />
                <YAxis tick={{ fontSize: 11, fill: '#5E6B78' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #D6DDE5' }} />
                <Bar dataKey="count" fill="#247A43" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-20 text-center text-xs text-text-secondary">No officer assignments recorded yet.</div>
          )}
        </div>

        {/* Deadline Status */}
        <div className="bg-white rounded-lg border border-border shadow-sm p-5">
          <div className="border-b border-border pb-3 mb-4">
            <h3 className="text-sm font-bold text-navy">Regulatory Deadlines & Compliance Status</h3>
          </div>
          {hasDeadlineData ? (
            <div className="space-y-3 pt-2">
              {data.deadlineStatus.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-xs font-semibold text-text-main">{item.type}</span>
                  <span
                    className={`text-base font-bold ${
                      item.type.includes('Overdue')
                        ? 'text-rose-600'
                        : item.type.includes('Approaching')
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-text-secondary">No deadline records found.</div>
          )}
        </div>
      </div>

      {/* Official AICTE Letter / Certificate Modal */}
      {activeCertApp && (
        <AicteCertificateModal
          application={activeCertApp}
          onClose={() => setActiveCertApp(null)}
        />
      )}

      {/* GenAI Executive Scrutiny Brief Modal */}
      {activeAiApp && (
        <AiScrutinyBriefModal
          application={activeAiApp}
          onClose={() => setActiveAiApp(null)}
        />
      )}
    </div>
  );
}
