import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { applicationsApi, validationApi, officerApi, auditApi, documentsApi } from '../services/api';
import type { Application, ValidationRun, WorkflowEvent, ReviewComment } from '../types';
import { STATUS_LABELS, STATUS_CSS } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Loader2, FileText, CheckCircle, AlertTriangle, Clock,
  MessageSquare, Shield, Download, Play, Send, ArrowLeft, Info,
  Upload, X, Sparkles, Printer, UserCheck, ChevronDown, ChevronUp, CheckCircle2,
  FileCheck2, ShieldCheck
} from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';
import GisLandPlot from '../components/GisLandPlot';
import AicteCertificateModal from '../components/AicteCertificateModal';
import AiScrutinyBriefModal from '../components/AiScrutinyBriefModal';
import ApplicationTracker from '../components/ApplicationTracker';

const getStatusLabel = (status?: string | null) => {
  if (!status) return '';
  return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || String(status);
};

const formatEventDate = (dateVal?: string | Date | null) => {
  if (!dateVal) return 'Recorded';
  try {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? 'Recorded' : d.toLocaleString('en-IN');
  } catch {
    return 'Recorded';
  }
};

interface ChecklistDoc {
  type: string;
  name: string;
  description: string;
  isRequired: boolean;
}

const AICTE_MANDATORY_DOCS: ChecklistDoc[] = [
  {
    type: 'FIRE_NOC',
    name: 'Fire Safety Certificate / NOC',
    description: 'Valid Fire Safety NOC issued by competent Municipal Fire Services authority',
    isRequired: true,
  },
  {
    type: 'STRUCTURAL_STABILITY',
    name: 'Structural Stability Certificate',
    description: 'Certificate from Registered Structural Engineer certifying earthquake/load safety',
    isRequired: true,
  },
  {
    type: 'OCCUPANCY_CERT',
    name: 'Occupancy / Building Completion Certificate',
    description: 'Valid Occupancy certificate issued by local urban development authority',
    isRequired: true,
  },
  {
    type: 'LAND_DOCS',
    name: 'Campus Land & Ownership Documents',
    description: 'Registered title deed / lease deed showing contiguous campus boundaries',
    isRequired: true,
  },
  {
    type: 'FACULTY_LIST',
    name: 'Faculty Cadre & Ratio Register',
    description: 'Approved regular faculty list with qualifications meeting 1:20 SFR norm',
    isRequired: true,
  },
  {
    type: 'BALANCE_SHEET',
    name: 'Audited Financial Statements (Last 3 Years)',
    description: 'Balance sheet, income & expenditure audited by Chartered Accountant',
    isRequired: false,
  },
];

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isOfficer, isInstitution } = useAuth();
  const [app, setApp] = useState<Application | null>(null);
  const [validation, setValidation] = useState<ValidationRun | null>(null);
  const [timeline, setTimeline] = useState<WorkflowEvent[]>([]);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [decisionOutcome, setDecisionOutcome] = useState('');
  const [decisionNote, setDecisionNote] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'validation' | 'comments' | 'timeline'>('details');

  const [uploadingDoc, setUploadingDoc] = useState<string>('');
  const [requestingDoc, setRequestingDoc] = useState<ChecklistDoc | null>(null);
  const [requestDocNote, setRequestDocNote] = useState<string>('');
  const [docActionLoading, setDocActionLoading] = useState(false);

  const [showCertModal, setShowCertModal] = useState<boolean>(false);
  const [showAiBriefModal, setShowAiBriefModal] = useState<boolean>(false);
  const [showDetailedLogs, setShowDetailedLogs] = useState<boolean>(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      const [appRes, valRes, timelineRes] = await Promise.all([
        applicationsApi.get(id),
        validationApi.results(id).catch(() => ({ data: null })),
        auditApi.timeline(id).catch(() => ({ data: [] })),
      ]);

      const appData = appRes.data?.application || appRes.data;
      setApp(appData || null);

      const valData = valRes.data?.validationRun || valRes.data;
      setValidation(valData || null);

      const rawTimeline = timelineRes.data?.timeline || timelineRes.data || [];
      setTimeline(Array.isArray(rawTimeline) ? rawTimeline : []);

      if (appData?.reviewComments && Array.isArray(appData.reviewComments)) {
        setComments(appData.reviewComments);
      }
    } catch (err) {
      console.error('Error fetching application detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const runValidation = async () => {
    if (!id) return;
    setValidating(true);
    try {
      const res = await validationApi.run(id);
      setValidation(res.data?.validationRun || res.data);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setValidating(false);
    }
  };

  const handleAction = async (action: string, comment?: string) => {
    if (!id) return;
    setActionLoading(action);
    try {
      if (action === 'request-correction') {
        await officerApi.requestCorrection(id, comment || 'Correction required');
      } else if (action === 'advance-review') {
        await officerApi.advanceReview(id, 'START_REVIEW', comment);
      } else if (action === 'ready-for-decision') {
        await officerApi.advanceReview(id, 'READY_FOR_DECISION', comment);
      } else if (action === 'record-decision') {
        await officerApi.recordDecision(id, decisionOutcome, decisionNote);
      } else if (action === 'record-decision-approved') {
        await officerApi.recordDecision(
          id,
          'APPROVED',
          'Application scrutinized and approved for Extension of Approval (EoA) 2026-27 under AICTE Approval Process Handbook (APH) regulations.'
        );
      } else if (action === 'resubmit') {
        await applicationsApi.resubmit(id);
      }
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading('');
    }
  };

  const addComment = async (isCorrection = false) => {
    if (!id || !newComment.trim()) return;
    try {
      if (isCorrection) {
        await officerApi.requestCorrection(id, newComment);
      } else {
        await officerApi.addComment(id, newComment);
      }
      setNewComment('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const downloadDoc = async (docId: string, name: string) => {
    try {
      const res = await documentsApi.download(docId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadDocument = async (docType: string, docName: string, file: File) => {
    if (!id) return;
    setUploadingDoc(docType);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', docType);
      formData.append('documentName', docName);
      await documentsApi.upload(id, formData);
      fetchData();
    } catch (err) {
      console.error('Document upload failed:', err);
    } finally {
      setUploadingDoc('');
    }
  };

  const handleSendDocumentRequest = async () => {
    if (!id || !requestingDoc) return;
    setDocActionLoading(true);
    try {
      await officerApi.requestDocument(id, requestingDoc.type, requestingDoc.name, requestDocNote);
      setRequestingDoc(null);
      setRequestDocNote('');
      fetchData();
    } catch (err) {
      console.error('Request document failed:', err);
    } finally {
      setDocActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gov-blue" size={28} />
      </div>
    );
  }

  if (!app) {
    return <div className="text-center py-20 text-text-secondary">Application not found.</div>;
  }

  const tabs = [
    { key: 'details', label: 'Details', icon: FileText },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'validation', label: 'Validation', icon: CheckCircle },
    { key: 'comments', label: 'Comments', icon: MessageSquare },
    { key: 'timeline', label: 'Timeline', icon: Clock },
  ] as const;

  const canResubmit = isInstitution && ['CORRECTION_REQUIRED', 'ADDITIONAL_INFO_REQUESTED'].includes(app.status);
  const canRequestCorrection = isOfficer && ['UNDER_REVIEW', 'RESUBMITTED', 'SUBMITTED'].includes(app.status);
  const canAdvanceReview = isOfficer && ['SUBMITTED', 'RESUBMITTED'].includes(app.status);
  const canReadyForDecision = isOfficer && app.status === 'UNDER_REVIEW';
  const canRecordDecision = isOfficer && ['UNDER_REVIEW', 'READY_FOR_DECISION', 'SUBMITTED', 'RESUBMITTED'].includes(app.status);

  const safeTimeline = Array.isArray(timeline) ? timeline : [];
  const latestCorrection = safeTimeline.slice().reverse().find(e => e?.toStatus === 'CORRECTION_REQUIRED');
  const isSystemCorrection = String(latestCorrection?.actorType || '').toLowerCase() === 'system';
  const safeComments = Array.isArray(comments) ? comments : [];
  const safeDocs = Array.isArray(app.documents) ? app.documents : [];
  const safeFindings = Array.isArray(validation?.findings) ? validation.findings : [];

  const requestedDocs: Array<{ type: string; name: string; note: string; requestedAt: string; officerName?: string }> =
    (app?.formData as Record<string, any>)?.requestedDocs || [];

  const allDocuments = AICTE_MANDATORY_DOCS.map(item => {
    const uploaded = safeDocs.find(d =>
      d.documentType?.toUpperCase() === item.type.toUpperCase() ||
      d.documentName?.toLowerCase().includes(item.type.toLowerCase()) ||
      d.documentName?.toLowerCase().includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(d.documentName?.toLowerCase() || '')
    );
    const requested = requestedDocs.find(r =>
      r.type.toUpperCase() === item.type.toUpperCase() ||
      r.name.toLowerCase() === item.name.toLowerCase()
    );

    return {
      ...item,
      uploaded,
      isRequested: !!requested,
      requestNote: requested?.note,
      requestedAt: requested?.requestedAt,
    };
  });

  const customDocs = safeDocs
    .filter(d => !allDocuments.some(m => m.uploaded?.id === d.id))
    .map(d => ({
      type: d.documentType || 'OTHER',
      name: d.documentName,
      description: 'Uploaded institutional attachment',
      isRequired: false,
      uploaded: d,
      isRequested: false,
      requestNote: undefined,
      requestedAt: undefined,
    }));

  const combinedDocuments = [...allDocuments, ...customDocs];

  return (
    <div>
      {/* Back & Header */}
      <Link to={isOfficer ? '/officer/review' : '/applications'} className="inline-flex items-center gap-1 text-sm text-gov-blue hover:underline mb-4">
        <ArrowLeft size={14} /> Back to list
      </Link>

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-semibold text-text-main">
              {app.applicationNo}
            </h1>
            <span className={STATUS_CSS[app.status] || 'badge-neutral'}>{STATUS_LABELS[app.status] || app.status}</span>
            {app.decisionOutcome && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                app.decisionOutcome === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                app.decisionOutcome === 'CONDITIONALLY_APPROVED' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                app.decisionOutcome === 'REJECTED' ? 'bg-red-100 text-red-800 border border-red-300' :
                'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {app.decisionOutcome}
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary mt-0.5">
            {app.institution?.name} · {app.category?.name}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Official AICTE Letter / Certificate Generator Button */}
          <button
            onClick={() => setShowCertModal(true)}
            className="btn-secondary btn-sm inline-flex items-center gap-1.5 text-gov-blue border-gov-blue/30 hover:bg-gov-blue/5 shadow-sm font-semibold"
            title="Generate Official AICTE Approval Letter & Order with GIS Land Boundary"
          >
            <Printer size={13} className="text-gov-blue" />
            <span>Official AICTE Letter</span>
          </button>

          {/* GenAI Scrutiny Brief Button (for Scrutiny Officers) */}
          {isOfficer && (
            <button
              onClick={() => setShowAiBriefModal(true)}
              className="btn-sm inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200 hover:from-indigo-100 hover:to-purple-100 shadow-sm font-semibold transition"
              title="Open 1-Click GenAI Scrutiny Brief & Synthesis"
            >
              <Sparkles size={13} className="text-indigo-600 animate-pulse" />
              <span>GenAI Scrutiny Brief</span>
            </button>
          )}

          {app.status === 'DRAFT' && isInstitution && (
            <Link to={`/applications/new?edit=${app.id}`} className="btn-secondary btn-sm">Edit Draft</Link>
          )}
          {/* Validation trigger is strictly reserved for Scrutiny Officer */}
          {isOfficer && (
            <button onClick={runValidation} className="btn-secondary btn-sm" disabled={validating}>
              {validating ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
              Run Validation
            </button>
          )}
        </div>
      </div>

      {/* Prominent Decision / Approval Banner */}
      {app.decisionOutcome === 'APPROVED' && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 shadow-sm flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-emerald-950">
                AICTE Approval Granted: Extension of Approval (EoA)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white uppercase tracking-wider">
                APPROVED
              </span>
            </div>
            <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
              {app.decisionNote || 'This application has fulfilled AICTE Approval Process Handbook (APH) compliance norms and has been granted approval.'}
            </p>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-emerald-700 font-medium">
              <span>Decision Date: {app.decisionAt ? new Date(app.decisionAt).toLocaleDateString('en-IN') : 'Recent'}</span>
              <span>·</span>
              <span>Academic Year: {app.academicYear}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setShowCertModal(true)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                <Printer size={13} />
                <span>View & Print Official AICTE EoA Letter (with GIS Land Map & QR)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {app.decisionOutcome === 'CONDITIONALLY_APPROVED' && (
        <div className="mb-6 p-4 rounded-xl border border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-sm flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-full bg-gov-blue text-white flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-navy">
                AICTE Approval: Conditionally Approved
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gov-blue text-white uppercase tracking-wider">
                CONDITIONAL
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              {app.decisionNote || 'Approved subject to compliance conditions specified by the AICTE Regional Office.'}
            </p>
          </div>
        </div>
      )}

      {app.decisionOutcome === 'REJECTED' && (
        <div className="mb-6 p-4 rounded-xl border border-red-300 bg-gradient-to-r from-red-50 to-rose-50 shadow-sm flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-red-950">
                AICTE Approval Decision: Rejected
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white uppercase tracking-wider">
                REJECTED
              </span>
            </div>
            <p className="text-xs text-red-800 mt-1 leading-relaxed">
              {app.decisionNote || 'Application rejected due to non-fulfillment of mandatory AICTE regulatory requirements.'}
            </p>
          </div>
        </div>
      )}

      {app.status === 'CORRECTION_REQUIRED' && isOfficer && (
        <div className="mb-6 p-4 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-sm flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Clock size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-amber-950">
                {isSystemCorrection ? 'Automated Pre-Check Deficiencies Flagged' : 'Correction Request Dispatched to Institution'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-mono">
                {isSystemCorrection ? 'AUTOMATED PRE-SCREENING' : 'AWAITING APPLICANT RESUBMISSION'}
              </span>
            </div>
            <p className="text-xs text-amber-900 mt-1 leading-relaxed">
              {isSystemCorrection
                ? 'Automated compliance screening prevented draft lodgement due to missing mandatory attachments. Applicant must upload missing files and resubmit.'
                : `You have notified ${app.institution?.name || 'the institution'} of required corrections / missing documents. The institution must upload the requested files and resubmit their application before review can continue.`}
            </p>
          </div>
        </div>
      )}

      {app.status === 'CORRECTION_REQUIRED' && isInstitution && (
        <div className="mb-6 p-4 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-sm flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-amber-950">
                {isSystemCorrection ? 'Action Required: Automated Pre-Screening Deficiencies' : 'Action Required: Correction Requested by Scrutiny Officer'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-mono">
                RESUBMISSION REQUIRED
              </span>
            </div>
            <p className="text-xs text-amber-900 mt-1 leading-relaxed">
              {isSystemCorrection
                ? 'Your application submission was flagged by automated compliance pre-screening for missing mandatory documents or fields. Please upload all required files below and click "Resubmit Application".'
                : 'The AICTE Scrutiny Officer has requested corrections or missing documents. Please check the Documents and Comments tabs below, upload any requested files, and click "Resubmit Application" below once rectified.'}
            </p>
          </div>
        </div>
      )}

      {/* Amazon Delivery-Style Live Application Tracker */}
      <ApplicationTracker
        application={app}
        validationRun={validation}
        timeline={safeTimeline}
      />

      {/* Tabs */}
      <div className="flex border-b border-border mb-4 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-gov-blue text-gov-blue'
                : 'border-transparent text-text-secondary hover:text-text-main'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <ErrorBoundary fallbackTitle="Unable to display application section">
      <div className="animate-fade-in">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card card-body">
              <h3 className="text-xs font-semibold text-text-secondary uppercase mb-3">Institution Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex"><dt className="w-36 text-text-secondary shrink-0">Name</dt><dd className="font-medium">{app.institution?.name || '—'}</dd></div>
                <div className="flex"><dt className="w-36 text-text-secondary shrink-0">Code</dt><dd>{app.institution?.institutionCode || '—'}</dd></div>
                <div className="flex"><dt className="w-36 text-text-secondary shrink-0">Type</dt><dd>{app.institution?.type || '—'}</dd></div>
                <div className="flex"><dt className="w-36 text-text-secondary shrink-0">State</dt><dd>{app.institution?.state || '—'}</dd></div>
                <div className="flex"><dt className="w-36 text-text-secondary shrink-0">District</dt><dd>{app.institution?.district || '—'}</dd></div>
                <div className="flex"><dt className="w-36 text-text-secondary shrink-0">Address</dt><dd>{app.institution?.address || '—'}</dd></div>
                <div className="flex"><dt className="w-36 text-text-secondary shrink-0">Contact</dt><dd>{app.institution?.contactPerson || '—'} ({app.institution?.contactEmail || '—'})</dd></div>
              </dl>
            </div>
            <div className="card card-body">
              <h3 className="text-xs font-semibold text-text-secondary uppercase mb-3">Programme Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex"><dt className="w-36 text-text-secondary shrink-0">Programme</dt><dd className="font-medium">{app.programmeName || '—'}</dd></div>
                <div className="flex"><dt className="w-36 text-text-secondary shrink-0">Discipline</dt><dd>{app.discipline || '—'}</dd></div>
                <div className="flex"><dt className="w-36 text-text-secondary shrink-0">Level</dt><dd>{app.qualificationLevel || '—'}</dd></div>
                <div className="flex"><dt className="w-36 text-text-secondary shrink-0">Academic Year</dt><dd>{app.academicYear || '—'}</dd></div>
                {app.existingIntake != null && <div className="flex"><dt className="w-36 text-text-secondary shrink-0">Existing Intake</dt><dd>{app.existingIntake}</dd></div>}
                {app.proposedIntake != null && <div className="flex"><dt className="w-36 text-text-secondary shrink-0">Proposed Intake</dt><dd>{app.proposedIntake}</dd></div>}
                {app.affiliatingBody && <div className="flex"><dt className="w-36 text-text-secondary shrink-0">Affiliating Body</dt><dd>{app.affiliatingBody}</dd></div>}
              </dl>
            </div>

            {/* GIS Cadastral Campus Land & Boundary Verification */}
            <div className="card card-body lg:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-semibold text-text-secondary uppercase">
                    Campus Land & GIS Spatial Verification
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Multi-point irregular cadastral boundary coordinates (APH Chapter I Contiguity Norm)
                  </p>
                </div>
                <button
                  onClick={() => setShowCertModal(true)}
                  className="btn-secondary btn-sm inline-flex items-center gap-1 text-xs"
                >
                  <Printer size={12} />
                  <span>Preview in Letterhead</span>
                </button>
              </div>

              <GisLandPlot
                institutionName={app.institution?.name}
                landAreaAcres={5.4}
                surveyNumbers="Plot No. 16C/2, Khasra 44/2 & 45/1"
                variant="dark"
              />
            </div>

            <div className="card card-body lg:col-span-2">
              <h3 className="text-xs font-semibold text-text-secondary uppercase mb-3">Application Metadata</h3>
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><dt className="text-text-secondary">Created</dt><dd>{new Date(app.createdAt).toLocaleDateString('en-IN')}</dd></div>
                <div><dt className="text-text-secondary">Submitted</dt><dd>{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('en-IN') : '—'}</dd></div>
                <div><dt className="text-text-secondary">Deadline</dt><dd className={app.deadlineDate && new Date(app.deadlineDate) < new Date() ? 'text-error font-medium' : ''}>{app.deadlineDate ? new Date(app.deadlineDate).toLocaleDateString('en-IN') : '—'}</dd></div>
                <div><dt className="text-text-secondary">Decision</dt><dd>{app.decisionOutcome || '—'}</dd></div>
              </dl>
              {app.decisionNote && (
                <div className="mt-3 p-3 bg-page-bg rounded text-sm">
                  <p className="text-xs text-text-secondary mb-1">Decision Note (Simulated):</p>
                  <p>{app.decisionNote}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            {/* Institution Alert if documents requested */}
            {isInstitution && requestedDocs.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-300 flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                    Mandatory Action: Scrutiny Officer Requested {requestedDocs.length} Document(s)
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {requestedDocs.map((r, i) => (
                      <div key={i} className="text-xs text-amber-900 bg-white/80 p-2 rounded border border-amber-200">
                        <span className="font-bold text-amber-950">{r.name}</span>
                        {r.note && <span className="ml-1.5 text-amber-800">— {r.note}</span>}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-amber-800 mt-2 font-medium">
                    Upload the requested documents below and then click "Resubmit Application" once completed.
                  </p>
                </div>
              </div>
            )}

            {/* Officer Info Banner */}
            {isOfficer && (
              <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-gov-blue shrink-0" />
                  <span className="text-text-main font-medium">
                    Document Scrutiny: Inspect mandatory uploads, verify OCR status, or click "Request Document" to flag missing / deficient attachments.
                  </span>
                </div>
                {requestedDocs.length > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                    {requestedDocs.length} Requested
                  </span>
                )}
              </div>
            )}

            <div className="card">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-1/3">Regulatory Document</th>
                      <th>Uploaded File</th>
                      <th>Size</th>
                      <th>Status</th>
                      <th>OCR Verification</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedDocuments.map((item, idx) => {
                      const isUploaded = !!item.uploaded;
                      const isRequested = item.isRequested;

                      return (
                        <tr key={idx} className={isRequested ? 'bg-amber-50/40' : ''}>
                          <td>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-navy">{item.name}</span>
                                {item.isRequired && (
                                  <span className="text-[10px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                    Mandatory
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-text-secondary mt-0.5">{item.description}</p>
                              {isRequested && item.requestNote && (
                                <div className="mt-1.5 p-2 bg-amber-100/70 border border-amber-300 rounded text-xs text-amber-950 font-medium flex items-start gap-1.5">
                                  <AlertTriangle size={13} className="text-amber-700 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold">Officer Request:</span> {item.requestNote}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            {isUploaded ? (
                              <div>
                                <p className="text-sm font-medium text-text-main truncate max-w-[200px]" title={item.uploaded!.originalName}>
                                  {item.uploaded!.originalName}
                                </p>
                                <p className="text-[11px] text-text-secondary">
                                  {new Date(item.uploaded!.uploadedAt).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-text-secondary italic">Not uploaded</span>
                            )}
                          </td>
                          <td className="text-text-secondary text-sm">
                            {isUploaded ? `${(item.uploaded!.fileSize / 1024).toFixed(0)} KB` : '—'}
                          </td>
                          <td>
                            {isUploaded ? (
                              <span className={item.uploaded!.status === 'UPLOADED' || item.uploaded!.status === 'PROCESSED' ? 'badge-success' : 'badge-warning'}>
                                {item.uploaded!.status}
                              </span>
                            ) : isRequested ? (
                              <span className="badge-error animate-pulse flex items-center gap-1 font-bold">
                                <AlertTriangle size={11} /> REQUESTED
                              </span>
                            ) : (
                              <span className="badge-neutral">MISSING</span>
                            )}
                          </td>
                          <td>
                            {isUploaded ? (
                              item.uploaded!.ocrResults?.length ? (
                                <span className={item.uploaded!.ocrResults[0].status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}>
                                  {item.uploaded!.ocrResults[0].status === 'COMPLETED' ? 'VERIFIED VALID' : item.uploaded!.ocrResults[0].status}
                                </span>
                              ) : (
                                <span className="badge-neutral">Pending OCR</span>
                              )
                            ) : (
                              <span className="text-text-secondary text-xs">—</span>
                            )}
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isUploaded && (
                                <button
                                  type="button"
                                  onClick={() => downloadDoc(item.uploaded!.id, item.uploaded!.originalName)}
                                  className="btn-secondary btn-sm inline-flex items-center gap-1 text-xs"
                                  title="Download / Open Document"
                                >
                                  <Download size={12} /> Download
                                </button>
                              )}

                              {/* Institution: Upload action */}
                              {isInstitution && (!isUploaded || isRequested) && (
                                <label className="btn-primary btn-sm inline-flex items-center gap-1.5 cursor-pointer text-xs">
                                  <Upload size={12} />
                                  <span>{uploadingDoc === item.type ? 'Uploading...' : isRequested ? 'Upload Requested' : 'Upload'}</span>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    disabled={uploadingDoc === item.type}
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) {
                                        handleUploadDocument(item.type, item.name, e.target.files[0]);
                                      }
                                    }}
                                  />
                                </label>
                              )}

                              {/* Officer: Request document action */}
                              {isOfficer && !isUploaded && !isRequested && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRequestingDoc(item);
                                    setRequestDocNote(`Please upload valid ${item.name} as required by AICTE Approval Process Handbook (APH) norms.`);
                                  }}
                                  className="btn-danger btn-sm inline-flex items-center gap-1 text-xs"
                                >
                                  <AlertTriangle size={12} /> Request Document
                                </button>
                              )}

                              {isOfficer && isRequested && !isUploaded && (
                                <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded">
                                  Request Sent
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Validation Tab */}
        {activeTab === 'validation' && (
          <div>
            {!validation ? (
              <div className="card card-body text-center py-12">
                <CheckCircle size={32} className="text-text-secondary/60 mx-auto mb-3" />
                <p className="text-sm font-semibold text-navy mb-1">Automated Scrutiny Pending</p>
                {isOfficer ? (
                  <>
                    <p className="text-xs text-text-secondary mb-4 max-w-md mx-auto">
                      As an AICTE Scrutiny Officer, you can evaluate this application against Approval Process Handbook norms, faculty ratios, and mandatory uploads.
                    </p>
                    <button onClick={runValidation} className="btn-primary" disabled={validating}>
                      {validating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                      Run Automated Validation
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-text-secondary max-w-md mx-auto">
                    Official automated compliance scrutiny will be performed by the AICTE Scrutiny Officer upon review. Any findings or compliance results will appear here.
                  </p>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                      {isOfficer ? 'AICTE Regulatory Compliance Findings' : 'Official Scrutiny Findings (Applicant View)'}
                    </h3>
                  </div>
                  {isOfficer && (
                    <button
                      onClick={runValidation}
                      className="btn-secondary btn-sm"
                      disabled={validating}
                    >
                      {validating ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                      Re-run Validation
                    </button>
                  )}
                </div>

                {/* Summary */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="card card-body text-center">
                    <p className="text-2xl font-bold text-success">{validation.passed ?? 0}</p>
                    <p className="text-xs text-text-secondary">Passed</p>
                  </div>
                  <div className="card card-body text-center">
                    <p className="text-2xl font-bold text-warning">{validation.warnings ?? 0}</p>
                    <p className="text-xs text-text-secondary">Warnings</p>
                  </div>
                  <div className="card card-body text-center">
                    <p className="text-2xl font-bold text-error">{validation.errors ?? 0}</p>
                    <p className="text-xs text-text-secondary">Errors</p>
                  </div>
                  <div className="card card-body text-center">
                    <p className="text-2xl font-bold text-gov-blue">{validation.manualReview ?? 0}</p>
                    <p className="text-xs text-text-secondary">Manual Review</p>
                  </div>
                </div>

                {/* Officer Human Scrutiny Determination Action Bar */}
                {isOfficer && (
                  <div className="mb-4 p-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/80 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 mb-3 border-b border-indigo-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                          <UserCheck size={15} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Officer Human Scrutiny Determination
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Automated screening complete. Scrutiny Officer must exercise human discretion to Accept, Reject, or Request More Documents.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold border border-indigo-200 self-start sm:self-auto">
                        Action Required
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* 1. Accept Compliance */}
                      <button
                        onClick={() => handleAction('ready-for-decision', 'Scrutiny Officer reviewed and accepted automated validation findings.')}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                        disabled={!!actionLoading}
                      >
                        <CheckCircle size={14} />
                        <span>Accept Compliance (Mark Ready for Decision)</span>
                      </button>

                      {/* 2. Reject / Request Rectifications */}
                      <button
                        onClick={() => {
                          setActiveTab('comments');
                          setNewComment(
                            'Scrutiny Deficiencies Identified: Inspection of compliance findings indicates missing statutory criteria. Please rectify the flagged deficiencies and resubmit.'
                          );
                        }}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <X size={14} />
                        <span>Reject / Request Corrections</span>
                      </button>

                      {/* 3. Request More Documents */}
                      <button
                        onClick={() => {
                          if (AICTE_MANDATORY_DOCS.length > 0) {
                            setRequestingDoc(AICTE_MANDATORY_DOCS[0]);
                          }
                        }}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <FileText size={14} />
                        <span>Request Missing / More Documents</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Findings */}
                <div className="card">
                  <div className="card-header"><h3 className="text-sm font-semibold">Validation Findings</h3></div>
                  <div className="divide-y divide-border">
                    {safeFindings.length === 0 ? (
                      <p className="text-center py-6 text-xs text-text-secondary">No findings available.</p>
                    ) : (
                      safeFindings.map((f) => (
                        <div key={f.id} className="px-5 py-3">
                          <div className="flex items-start gap-3">
                            {f.result === 'PASSED' && <CheckCircle size={16} className="text-success mt-0.5" />}
                            {f.result === 'WARNING' && <AlertTriangle size={16} className="text-warning mt-0.5" />}
                            {f.result === 'ERROR' && <AlertTriangle size={16} className="text-error mt-0.5" />}
                            {f.result === 'MANUAL_REVIEW' && <Shield size={16} className="text-gov-blue mt-0.5" />}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-text-main">{f.rule?.name || f.message}</p>
                              <p className="text-xs text-text-secondary mt-0.5">{f.message}</p>
                              {f.evidence && <p className="text-xs text-text-secondary mt-1">Evidence: {f.evidence}</p>}
                              {f.correctiveAction && (
                                <p className="text-xs text-gov-blue mt-1 flex items-center gap-1">
                                  <Info size={11} /> {f.correctiveAction}
                                </p>
                              )}
                              {f.isAiAssisted && <span className="badge-info text-[10px] mt-1">AI-Assisted</span>}
                              <div className="flex gap-2 mt-1">
                                {f.blocksSubmission && <span className="badge-error text-[10px]">Blocks Submission</span>}
                                {f.requiresReview && <span className="badge-warning text-[10px]">Requires Review</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div>
            <div className="card divide-y divide-border mb-4">
              {safeComments.length === 0 ? (
                <div className="p-8 text-center text-text-secondary">No comments yet.</div>
              ) : (
                safeComments.map((c) => (
                  <div key={c.id} className="px-5 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{c.officer?.name || 'Officer'}</span>
                      <span className="text-xs text-text-secondary">{new Date(c.createdAt).toLocaleString('en-IN')}</span>
                      <span className={`badge-${c.commentType === 'correction' ? 'error' : c.commentType === 'approval' ? 'success' : 'neutral'} text-[10px]`}>
                        {c.commentType}
                      </span>
                    </div>
                    <p className="text-sm text-text-main">{c.comment}</p>
                  </div>
                ))
              )}
            </div>
            {isOfficer && (
              <div className="card card-body">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Scrutiny Officer Review & Deficiency Communication
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Sending deficiencies alerts the applicant immediately
                  </span>
                </div>
                <textarea
                  className="form-input mb-3"
                  rows={3}
                  placeholder="Enter scrutiny observations, deficiencies, or required rectification instructions..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <div className="flex items-center justify-end gap-2.5 flex-wrap">
                  <button
                    onClick={() => addComment(false)}
                    className="btn-secondary btn-sm"
                    disabled={!newComment.trim()}
                  >
                    <MessageSquare size={13} /> Add Internal Review Note
                  </button>
                  <button
                    onClick={() => addComment(true)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    disabled={!newComment.trim()}
                    title="Marks application as Correction Required and notifies institution users"
                  >
                    <Send size={13} /> Send Correction & Notify Applicant
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timeline Tab - Clean Amazon-style delivery progression without "kosa-kosa" clutter */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            {/* Key Milestones Minimalist Feed */}
            <div className="card card-body">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
                <Clock size={14} className="text-gov-blue" />
                <span>Application Lifecycle Milestones</span>
              </h3>

              <div className="space-y-3">
                {/* 1. Lodgement Milestone */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    app.status !== 'DRAFT' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">1. Application Lodged</h4>
                      <span className="text-[10px] font-mono text-slate-500">
                        {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('en-IN') : 'In Draft'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {app.status === 'DRAFT'
                        ? 'Application draft initiated by institution.'
                        : `Application ${app.applicationNo} formally submitted to AICTE for AY 2026-27.`}
                    </p>
                  </div>
                </div>

                {/* 2. Automated Validation Milestone */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    validation ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <FileCheck2 size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">2. Automated Compliance Screening</h4>
                      <span className="text-[10px] font-mono text-slate-500">
                        {validation?.completedAt ? new Date(validation.completedAt).toLocaleDateString('en-IN') : 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {validation
                        ? `Pre-screening executed. ${validation.passed} checks passed, ${validation.warnings} warnings, ${validation.errors} blocking errors.`
                        : 'Awaiting execution of automated Approval Process Handbook rules inspection.'}
                    </p>
                  </div>
                </div>

                {/* 3. Scrutiny Officer Review Milestone */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    ['READY_FOR_DECISION', 'DECISION_RECORDED'].includes(app.status)
                      ? 'bg-emerald-100 text-emerald-700'
                      : app.status === 'UNDER_REVIEW'
                      ? 'bg-blue-100 text-gov-blue animate-pulse'
                      : app.status === 'CORRECTION_REQUIRED'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    <UserCheck size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">3. Officer Scrutiny Determination</h4>
                      <span className="text-[10px] font-mono text-slate-500">
                        {['READY_FOR_DECISION', 'DECISION_RECORDED'].includes(app.status)
                          ? 'Reviewed'
                          : app.status === 'CORRECTION_REQUIRED'
                          ? 'Corrections Required'
                          : 'In Progress'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {['READY_FOR_DECISION', 'DECISION_RECORDED'].includes(app.status)
                        ? 'Scrutiny Officer reviewed and verified compliance. Marked ready for council decision.'
                        : app.status === 'CORRECTION_REQUIRED'
                        ? 'Deficiencies flagged during review. Awaiting institution rectification.'
                        : 'Under review by the AICTE Regional Scrutiny Committee.'}
                    </p>
                  </div>
                </div>

                {/* 4. Council Decision Milestone */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    app.decisionOutcome === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : app.decisionOutcome === 'REJECTED'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    <ShieldCheck size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">4. Official AICTE Council Decision</h4>
                      <span className="text-[10px] font-mono text-slate-500">
                        {app.decisionAt ? new Date(app.decisionAt).toLocaleDateString('en-IN') : 'Pending Order'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {app.decisionOutcome === 'APPROVED'
                        ? 'Extension of Approval (EoA) granted for AY 2026-27. Official digital certificate issued.'
                        : app.decisionOutcome === 'REJECTED'
                        ? 'Application rejected due to non-fulfillment of mandatory regulations.'
                        : 'Awaiting final order conveyance from the Member Secretary, AICTE.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Collapsible Deep-Dive Audit Event Trace */}
              <div className="mt-5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDetailedLogs(!showDetailedLogs)}
                  className="text-xs text-gov-blue hover:underline font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {showDetailedLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>
                    {showDetailedLogs
                      ? 'Hide Detailed Technical Log'
                      : `View Detailed Raw Event Logs (${safeTimeline.length} entries)`}
                  </span>
                </button>

                {showDetailedLogs && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                    {safeTimeline.map((event, idx) => (
                      <div key={event.id || idx} className="text-xs p-2.5 bg-white rounded border border-slate-200 flex items-start justify-between gap-3">
                        <div>
                          <span className="font-bold text-slate-900">{getStatusLabel(event.toStatus) || 'Updated'}</span>
                          {event.comment && <p className="text-slate-600 mt-0.5">{event.comment}</p>}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {formatEventDate(event.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Officer Request Document Modal */}
        {requestingDoc && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-amber-600" size={20} />
                  <h3 className="text-base font-bold text-navy">Request Missing Document</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRequestingDoc(null)}
                  className="text-text-secondary hover:text-navy cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-text-secondary uppercase">Document Requested</p>
                <p className="text-sm font-bold text-navy mt-0.5">{requestingDoc.name}</p>
                <p className="text-xs text-text-secondary mt-0.5">{requestingDoc.description}</p>
              </div>

              <div className="mb-4">
                <label className="form-label text-xs font-semibold text-text-main mb-1 block">
                  Deficiency Remarks / Instructions for Institution
                </label>
                <textarea
                  className="form-input text-xs w-full"
                  rows={3}
                  placeholder="Enter deficiency details or instructions..."
                  value={requestDocNote}
                  onChange={(e) => setRequestDocNote(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRequestingDoc(null)}
                  className="btn-secondary btn-sm"
                  disabled={docActionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendDocumentRequest}
                  className="btn-danger btn-sm inline-flex items-center gap-1.5"
                  disabled={docActionLoading}
                >
                  {docActionLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Send Request to Institution
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </ErrorBoundary>

      {/* Action Bar */}
      {(canResubmit || canRequestCorrection || canAdvanceReview || canReadyForDecision || canRecordDecision) && (
        <div className="card card-body mt-6">
          <h3 className="text-xs font-semibold text-text-secondary uppercase mb-3">Available Actions</h3>
          <div className="flex flex-wrap gap-2">
            {canResubmit && (
              <button onClick={() => handleAction('resubmit')} className="btn-primary btn-sm" disabled={!!actionLoading}>
                <Send size={13} /> Resubmit Application
              </button>
            )}
            {canAdvanceReview && (
              <button onClick={() => handleAction('advance-review', 'Moving to review')} className="btn-primary btn-sm" disabled={!!actionLoading}>
                <Shield size={13} /> Move to Review
              </button>
            )}
            {canRequestCorrection && (
              <button onClick={() => handleAction('request-correction', 'Please correct the identified issues')} className="btn-danger btn-sm" disabled={!!actionLoading}>
                <AlertTriangle size={13} /> Request Correction
              </button>
            )}
            {canReadyForDecision && (
              <button onClick={() => handleAction('ready-for-decision', 'Application is ready')} className="btn-success btn-sm" disabled={!!actionLoading}>
                <CheckCircle size={13} /> Mark Ready for Decision
              </button>
            )}
            {canRecordDecision && (
              <button
                onClick={() => handleAction('record-decision-approved')}
                className="btn-success btn-sm inline-flex items-center gap-1.5"
                disabled={!!actionLoading}
              >
                <CheckCircle size={13} /> Quick Approve (Grant EoA)
              </button>
            )}
            {canRecordDecision && (
              <div className="w-full mt-2 p-4 bg-page-bg rounded-md">
                <p className="text-xs font-semibold text-text-secondary uppercase mb-2">Record Simulated Decision</p>
                <p className="text-xs text-warning mb-3 flex items-center gap-1">
                  <AlertTriangle size={11} /> This is a simulated decision for prototype demonstration only.
                </p>
                <div className="flex gap-3 mb-3">
                  <select className="form-select w-48" value={decisionOutcome} onChange={(e) => setDecisionOutcome(e.target.value)}>
                    <option value="">Select outcome</option>
                    <option value="APPROVED">Approved (Simulated)</option>
                    <option value="CONDITIONALLY_APPROVED">Conditionally Approved (Simulated)</option>
                    <option value="DEFERRED">Deferred (Simulated)</option>
                    <option value="REJECTED">Rejected (Simulated)</option>
                  </select>
                  <input
                    className="form-input flex-1"
                    placeholder="Decision note..."
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAiBriefModal(true)}
                    className="btn-secondary btn-sm inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                    title="Populate with GenAI Scrutiny Synthesis"
                  >
                    <Sparkles size={12} className="text-indigo-600" />
                    <span>GenAI Note</span>
                  </button>
                  <button
                    onClick={() => handleAction('record-decision')}
                    className="btn-success btn-sm"
                    disabled={!decisionOutcome || !decisionNote || !!actionLoading}
                  >
                    Record Decision
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Official AICTE Letter / Certificate Modal with GIS Cadastral Map & QR */}
      {showCertModal && app && (
        <AicteCertificateModal
          application={app}
          onClose={() => setShowCertModal(false)}
        />
      )}

      {/* GenAI Executive Scrutiny Brief Modal */}
      {showAiBriefModal && app && (
        <AiScrutinyBriefModal
          application={app}
          onClose={() => setShowAiBriefModal(false)}
          onApplyRecommendation={(outcome, note) => {
            setDecisionOutcome(outcome);
            setDecisionNote(note);
          }}
        />
      )}
    </div>
  );
}
