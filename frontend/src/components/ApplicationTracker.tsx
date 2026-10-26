import {
  Check, Clock, AlertTriangle, X, ShieldCheck,
  FileCheck2, UserCheck
} from 'lucide-react';
import type { Application, ValidationRun, WorkflowEvent } from '../types';

interface ApplicationTrackerProps {
  application: Application;
  validationRun?: ValidationRun | null;
  timeline?: WorkflowEvent[];
}

export default function ApplicationTracker({
  application,
  validationRun,
  timeline = [],
}: ApplicationTrackerProps) {
  const status = application.status;
  const decision = application.decisionOutcome;

  // Determine current active stage index (0 to 3)
  // Step 0: Lodged / Submitted
  // Step 1: Automated Validation Pre-screen
  // Step 2: Officer Scrutiny (Not Reviewed -> Under Review -> Reviewed)
  // Step 3: Final Decision (Accepted / Declined)

  const isSubmitted = status !== 'DRAFT';
  const hasValidationRun = !!validationRun;
  const isValidationPassing = validationRun ? validationRun.errors === 0 : false;

  let officerStage: 'not_reviewed' | 'under_review' | 'correction_required' | 'reviewed' = 'not_reviewed';
  if (['UNDER_REVIEW', 'ADDITIONAL_INFO_REQUESTED'].includes(status)) {
    officerStage = 'under_review';
  } else if (status === 'CORRECTION_REQUIRED') {
    officerStage = 'correction_required';
  } else if (['READY_FOR_DECISION', 'DECISION_RECORDED', 'CLOSED'].includes(status)) {
    officerStage = 'reviewed';
  }

  const isDecided = status === 'DECISION_RECORDED' || !!decision;
  const isApproved = decision === 'APPROVED' || decision === 'CONDITIONALLY_APPROVED';
  const isRejected = decision === 'REJECTED';

  // Compute progress line percentage
  let progressPercent = 10;
  if (isSubmitted) progressPercent = 33;
  if (hasValidationRun && isSubmitted) progressPercent = 55;
  if (officerStage === 'reviewed' || officerStage === 'under_review') progressPercent = 78;
  if (isDecided) progressPercent = 100;

  const steps = [
    {
      id: 'step-1',
      title: '1. Lodgement',
      label: isSubmitted ? 'Submitted' : 'Draft',
      statusText: application.submittedAt
        ? new Date(application.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
        : 'In Preparation',
      isComplete: isSubmitted,
      isActive: !isSubmitted,
      icon: isSubmitted ? <Check size={13} className="stroke-[3]" /> : <Clock size={13} />,
      color: isSubmitted ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-200 text-slate-600 border-slate-300',
    },
    {
      id: 'step-2',
      title: '2. Auto-Validation',
      label: hasValidationRun ? (isValidationPassing ? 'Verified' : 'Flagged') : 'Pending',
      statusText: hasValidationRun
        ? `${validationRun?.passed ?? 0} Checks Passed`
        : 'Pre-Screening',
      isComplete: hasValidationRun && isValidationPassing,
      isActive: isSubmitted && !hasValidationRun,
      icon: hasValidationRun ? (
        isValidationPassing ? <Check size={13} className="stroke-[3]" /> : <AlertTriangle size={13} />
      ) : (
        <FileCheck2 size={13} />
      ),
      color: hasValidationRun
        ? isValidationPassing
          ? 'bg-emerald-600 text-white border-emerald-600'
          : 'bg-amber-500 text-white border-amber-500'
        : 'bg-slate-100 text-slate-400 border-slate-300',
    },
    {
      id: 'step-3',
      title: '3. Scrutiny Review',
      label:
        officerStage === 'reviewed'
          ? 'Reviewed'
          : officerStage === 'under_review'
          ? 'Under Review'
          : officerStage === 'correction_required'
          ? 'Correction Req.'
          : 'Not Reviewed',
      statusText:
        officerStage === 'reviewed'
          ? 'Officer Scrutinized'
          : officerStage === 'under_review'
          ? 'Committee Active'
          : officerStage === 'correction_required'
          ? 'Deficiency Sent'
          : 'Awaiting Officer',
      isComplete: officerStage === 'reviewed',
      isActive: officerStage === 'under_review' || officerStage === 'correction_required',
      icon:
        officerStage === 'reviewed' ? (
          <Check size={13} className="stroke-[3]" />
        ) : officerStage === 'correction_required' ? (
          <AlertTriangle size={13} />
        ) : (
          <UserCheck size={13} />
        ),
      color:
        officerStage === 'reviewed'
          ? 'bg-emerald-600 text-white border-emerald-600'
          : officerStage === 'under_review'
          ? 'bg-gov-blue text-white border-gov-blue ring-4 ring-gov-blue/20 animate-pulse'
          : officerStage === 'correction_required'
          ? 'bg-amber-500 text-white border-amber-500 ring-4 ring-amber-200'
          : 'bg-slate-100 text-slate-400 border-slate-300',
    },
    {
      id: 'step-4',
      title: '4. AICTE Decision',
      label: isApproved ? 'Accepted' : isRejected ? 'Declined' : 'Pending',
      statusText: isApproved
        ? 'EoA Approval Granted'
        : isRejected
        ? 'Application Rejected'
        : 'Council Order Pending',
      isComplete: isDecided && isApproved,
      isRejected: isDecided && isRejected,
      isActive: officerStage === 'reviewed' && !isDecided,
      icon: isApproved ? (
        <Check size={13} className="stroke-[3]" />
      ) : isRejected ? (
        <X size={13} className="stroke-[3]" />
      ) : (
        <ShieldCheck size={13} />
      ),
      color: isApproved
        ? 'bg-emerald-600 text-white border-emerald-600 ring-4 ring-emerald-200'
        : isRejected
        ? 'bg-rose-600 text-white border-rose-600 ring-4 ring-rose-200'
        : 'bg-slate-100 text-slate-400 border-slate-300',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 mb-5">
      {/* Tracker Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Live Application Status Tracker
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            (Ref: {application.applicationNo})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            Current Stage:
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full font-mono ${
              isApproved
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : isRejected
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : officerStage === 'correction_required'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-blue-100 text-gov-blue border border-blue-200'
            }`}
          >
            {isApproved
              ? 'ACCEPTED / GRANTED'
              : isRejected
              ? 'DECLINED'
              : officerStage === 'reviewed'
              ? 'REVIEWED (READY FOR DECISION)'
              : officerStage === 'under_review'
              ? 'UNDER OFFICER REVIEW'
              : officerStage === 'correction_required'
              ? 'CORRECTION REQUIRED'
              : 'NOT REVIEWED (PENDING)'}
          </span>
        </div>
      </div>

      {/* Amazon Delivery-Style Progress Bar with Connecting Line & Dots */}
      <div className="relative pt-2 pb-2 px-2 sm:px-6">
        {/* Background Grey Line */}
        <div className="absolute top-6 left-6 right-6 sm:left-12 sm:right-12 h-1 bg-slate-200 -translate-y-1/2 z-0" />

        {/* Progress Filled Line */}
        <div
          className="absolute top-6 left-6 sm:left-12 h-1 bg-gradient-to-r from-emerald-600 via-sky-600 to-emerald-600 -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `calc(${progressPercent}% - 3rem)` }}
        />

        {/* Steps Grid */}
        <div className="grid grid-cols-4 relative z-10">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center text-center">
              {/* Circular Dot */}
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center shadow-sm transition-transform duration-300 ${step.color}`}
              >
                {step.icon}
              </div>

              {/* Step Labels */}
              <div className="mt-2 space-y-0.5">
                <p className="text-[10px] sm:text-xs font-bold text-slate-900 leading-tight">
                  {step.label}
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">
                  {step.statusText}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Workflow Event Footer */}
      {timeline.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="truncate max-w-[70%]">
            Latest Transition: <strong className="text-slate-700">{timeline[0].toStatus.replace(/_/g, ' ')}</strong>
            {timeline[0].comment && <span className="text-slate-500 italic ml-1.5">"{timeline[0].comment}"</span>}
          </span>
          <span className="shrink-0 text-slate-400 font-mono text-[10px]">
            {new Date(timeline[0].createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}
    </div>
  );
}
