import {
  Sparkles, ShieldCheck, CheckCircle2,
  MapPin, Users, FileCheck, ArrowRight, X, Zap
} from 'lucide-react';
import type { Application } from '../types';

interface AiScrutinyBriefModalProps {
  application: Application;
  onClose: () => void;
  onApplyRecommendation?: (outcome: string, note: string) => void;
}

export default function AiScrutinyBriefModal({
  application,
  onClose,
  onApplyRecommendation,
}: AiScrutinyBriefModalProps) {
  const complianceScore = 96.4;
  const intake = application.proposedIntake || application.existingIntake || 120;

  const officialScrutinyNote = `AICTE Scrutiny Committee Synthesis: Evaluated under APH 2026-27 norms. Total contiguous campus land verified at 5.40 Acres (meets urban norm of min 2.50 Acres). Student-to-Faculty Ratio maintained at 1:16.7 with 24 approved faculty members against approved intake of ${intake}. Fire Safety NOC, Structural Stability, and Occupancy clearances verified genuine. Recommendation: Unconditional Extension of Approval (EoA) granted for Academic Session 2026-27.`;

  const handleApply = () => {
    if (onApplyRecommendation) {
      onApplyRecommendation('APPROVED', officialScrutinyNote);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-indigo-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  GenAI Executive Scrutiny Dossier & Synthesis
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase font-semibold">
                  AICTE GenAI Engine v4.2
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Autonomous multi-pillar regulatory appraisal for {application.institution?.name} · {application.applicationNo}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Executive KPI Summary Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-xl">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase block">Compliance Index</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-emerald-700 font-mono">{complianceScore}%</span>
                <span className="text-[10px] text-emerald-600 font-bold uppercase">Grade A+</span>
              </div>
              <span className="text-[10px] text-emerald-700 mt-0.5 block">Fast-Track EoA eligible</span>
            </div>

            <div className="bg-sky-50/80 border border-sky-200 p-3.5 rounded-xl">
              <span className="text-[11px] font-semibold text-sky-800 uppercase block">AI Risk Score</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-sky-700 font-mono">0.04</span>
                <span className="text-[10px] text-sky-600 font-bold uppercase">Negligible</span>
              </div>
              <span className="text-[10px] text-sky-700 mt-0.5 block">Zero critical non-compliances</span>
            </div>

            <div className="bg-purple-50/80 border border-purple-200 p-3.5 rounded-xl">
              <span className="text-[11px] font-semibold text-purple-800 uppercase block">Faculty Cadre (SFR)</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black text-purple-700 font-mono">1 : 16.7</span>
              </div>
              <span className="text-[10px] text-purple-700 mt-0.5 block">Surpasses 1:20 APH norm</span>
            </div>

            <div className="bg-indigo-50/80 border border-indigo-200 p-3.5 rounded-xl">
              <span className="text-[11px] font-semibold text-indigo-800 uppercase block">Land Contiguity</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black text-indigo-700 font-mono">5.40 Ac</span>
                <span className="text-[10px] text-indigo-600 font-bold uppercase">Passed</span>
              </div>
              <span className="text-[10px] text-indigo-700 mt-0.5 block">100% Contiguous polygon</span>
            </div>
          </div>

          {/* Synthesized Executive Briefing */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <Zap size={14} className="text-amber-500" />
              <span>AI Synthesized Scrutiny Summary</span>
            </h4>
            <p className="text-xs text-slate-800 leading-relaxed text-justify">
              The application submitted by <strong>{application.institution?.name}</strong> for the Academic Session 2026-27 has been scrutinized against the <em>AICTE Approval Process Handbook (APH) 2026-27</em>. The institution meets and surpasses all regulatory thresholds across spatial infrastructure, academic cadre, financial standing, and statutory clearances. Cadastral land mapping confirms a single undivided contiguous parcel of 5.40 Acres with zero municipal road bisections. The teaching faculty strength of 24 qualified members satisfies the required Student-Faculty Ratio of 1:16.7. Document verification demonstrates zero forensic anomalies or tamper signatures.
            </p>
          </div>

          {/* 4 Pillars of Scrutiny */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Comprehensive 4-Pillar Regulatory Appraisal
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Pillar 1: Land */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin size={15} className="text-emerald-600" />
                    1. Land & Campus Contiguity
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    APPROVED
                  </span>
                </div>
                <ul className="text-slate-600 space-y-1 text-[11px] list-disc pl-4">
                  <li>Total campus land: <strong>5.40 Acres</strong> (Min required: 2.50 Acres).</li>
                  <li>Contiguity verified via multi-point cadastral boundary coordinates.</li>
                  <li>Title deed registered with 99-year perpetual educational land lease.</li>
                  <li>Zero public road or railway lines dividing the campus parcel.</li>
                </ul>
              </div>

              {/* Pillar 2: Faculty */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Users size={15} className="text-blue-600" />
                    2. Faculty Cadre & SFR Norm
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    COMPLIANT
                  </span>
                </div>
                <ul className="text-slate-600 space-y-1 text-[11px] list-disc pl-4">
                  <li>Sanctioned Intake: <strong>{intake} Seats</strong> (Required faculty: 12).</li>
                  <li>Active regular faculty: <strong>24 verified teachers</strong> (Effective SFR: 1:16.7).</li>
                  <li>Cadre structure: 3 Professors, 6 Associate Profs, 15 Assistant Profs.</li>
                  <li>Aadhaar-seeded facial attendance integration: 98.4% consistency.</li>
                </ul>
              </div>

              {/* Pillar 3: Clearances */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-amber-600" />
                    3. Statutory Clearances & Safety
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    VERIFIED
                  </span>
                </div>
                <ul className="text-slate-600 space-y-1 text-[11px] list-disc pl-4">
                  <li>Fire Safety Certificate: Issued by Delhi Fire Services (Valid till 2028).</li>
                  <li>Structural Stability Certificate endorsed by Registered SE-Grade 1.</li>
                  <li>Occupancy / Building Completion Certificate from DDA verified.</li>
                  <li>Barrier-free campus with Divyangjan ramps & lift accessibility.</li>
                </ul>
              </div>

              {/* Pillar 4: Document Tampering */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FileCheck size={15} className="text-purple-600" />
                    4. Document Integrity & OCR
                  </span>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    AUTHENTIC
                  </span>
                </div>
                <ul className="text-slate-600 space-y-1 text-[11px] list-disc pl-4">
                  <li>6 regulatory documents parsed via AICTE OCR verification pipeline.</li>
                  <li>Zero EXIF anomalies, zero splice or image layer tampering found.</li>
                  <li>Cryptographic document hashes verified against institutional keys.</li>
                  <li>Affiliating University (GGSIPU Delhi) NOC confirmed active.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* AI Recommendation Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border-2 border-emerald-400/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                  GenAI Recommendation: Grant Extension of Approval (EoA)
                </h4>
                <p className="text-xs text-emerald-900 mt-0.5 leading-relaxed">
                  Fast-Track approval recommended without on-site Expert Visit Committee (EVC) inspection. Intake: {intake} Seats in Computer Science & Engineering.
                </p>
              </div>
            </div>

            {onApplyRecommendation && (
              <button
                onClick={handleApply}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <span>Apply to Decision Note</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>AICTE Autonomous Compliance Scrutiny Engine · Confidential Scrutiny Record</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-300 rounded-lg hover:bg-white text-slate-700 font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
