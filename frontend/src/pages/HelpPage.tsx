import { useState } from 'react';
import {
  HelpCircle, BookOpen, FileCheck, AlertCircle,
  ChevronDown, ChevronRight, Shield, Award, Building, Users
} from 'lucide-react';

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is the Approval Process Handbook (APH) compliance engine?',
      a: 'The engine automates regulatory validation against AICTE norms. It checks data consistency, verifies mandatory documentation, calculates student-to-faculty ratios, and ensures land and built-up area minimum requirements are met before institutional submissions reach reviewing officers.'
    },
    {
      q: 'What are the required documents for Extension of Approval (EoA)?',
      a: 'Standard EoA requires: (1) Fire Safety Certificate / NOC, (2) Structural Stability Certificate, (3) Occupancy Certificate, (4) Audited Financial Statements, (5) Faculty Cadre Ratio undertaking, and (6) Anti-Ragging affidavit.'
    },
    {
      q: 'How does the Deficiencies & Correction workflow operate?',
      a: 'If the automated validator or the Scrutiny Officer identifies missing documents or non-compliant metrics, the application transitions to CORRECTION_REQUIRED. The institution receives immediate in-app notifications and email alerts with specific remedy guidance, and can resubmit corrections within the assigned grace period.'
    },
    {
      q: 'Does this portal communicate directly with the live AICTE portal?',
      a: 'No. This application is configured strictly in DEMO MODE for Smart India Hackathon 2026. All approvals, notifications, and document validations are simulated locally using isolated sample databases and deterministic test runners.'
    },
    {
      q: 'What are the student-faculty ratio (SFR) requirements for engineering colleges?',
      a: 'As per AICTE norms for undergraduate engineering programmes, the mandatory SFR is 1:15 or 1:20 depending on accreditation status, with a cadre ratio of 1 Professor : 2 Associate Professors : 6 Assistant Professors.'
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-gov-blue rounded-lg flex items-center justify-center">
            <BookOpen size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-navy">AICTE Approval Process Handbook (APH) Guide</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Regulatory guidelines, checklist mandates, validation rules, and system usage instructions
            </p>
          </div>
        </div>
      </div>

      {/* 4 Pillars of Compliance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-border shadow-sm">
          <Building className="text-gov-blue mb-2" size={20} />
          <h3 className="text-sm font-bold text-navy">Land & Built-up Area</h3>
          <p className="text-xs text-text-secondary mt-1">
            Minimum 7.5 acres (rural) or 2.5 acres (metro). Instructional area, administrative area, and amenities must satisfy APH Schedule.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-border shadow-sm">
          <Users className="text-emerald-600 mb-2" size={20} />
          <h3 className="text-sm font-bold text-navy">Faculty & Staffing</h3>
          <p className="text-xs text-text-secondary mt-1">
            Cadre ratio 1:2:6 (Prof:Assoc:Asst). Valid Ph.D. for Professor and Associate Professor posts. Biometric attendance compliance.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-border shadow-sm">
          <Shield className="text-amber-600 mb-2" size={20} />
          <h3 className="text-sm font-bold text-navy">Safety & Statutory NOCs</h3>
          <p className="text-xs text-text-secondary mt-1">
            Fire NOC from competent municipal authority, structural stability certificate from registered civil engineer, barrier-free access.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-border shadow-sm">
          <Award className="text-purple-600 mb-2" size={20} />
          <h3 className="text-sm font-bold text-navy">Affiliation & Accreditation</h3>
          <p className="text-xs text-text-secondary mt-1">
            Affiliation letter from State Technical University/DTE and NBA/NAAC validity records where applicable for intake increases.
          </p>
        </div>
      </div>

      {/* Approval Lifecycle Workflow Steps */}
      <div className="bg-white p-6 rounded-lg border border-border shadow-sm space-y-4">
        <h2 className="text-base font-bold text-navy flex items-center gap-2">
          <FileCheck size={18} className="text-gov-blue" />
          <span>Application Processing Workflow</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { step: '01', title: 'Data Entry & Draft', desc: 'Fill institute, programme, faculty & land details.' },
            { step: '02', title: 'Automated Check', desc: 'System checks rules & flags deficiencies in real-time.' },
            { step: '03', title: 'Document Upload', desc: 'Upload mandatory PDFs with client & server validation.' },
            { step: '04', title: 'Officer Scrutiny', desc: 'AICTE officer reviews application & issues remarks.' },
            { step: '05', title: 'Final Decision', desc: 'Approval letter issued or resubmission requested.' },
          ].map((item) => (
            <div key={item.step} className="p-3 bg-gray-50 rounded border border-gray-200">
              <span className="text-xs font-mono font-bold text-gov-blue">{item.step}</span>
              <h4 className="text-xs font-bold text-navy mt-1">{item.title}</h4>
              <p className="text-[11px] text-text-secondary mt-1 leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Notice Alert */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
        <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
        <div>
          <h4 className="text-xs font-bold text-amber-900">Prototype Environment Notice</h4>
          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
            This deployment is developed strictly for SIH 2026 evaluation. It simulates all backend validation routines, state machine progression, deadline monitoring, and OCR processing without making actual external calls to Ministry of Education or AICTE centralized production servers.
          </p>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white p-6 rounded-lg border border-border shadow-sm space-y-4">
        <h2 className="text-base font-bold text-navy flex items-center gap-2">
          <HelpCircle size={18} className="text-gov-blue" />
          <span>Frequently Asked Questions</span>
        </h2>
        <div className="divide-y divide-border">
          {faqs.map((faq, index) => (
            <div key={index} className="py-3">
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex items-center justify-between text-left font-semibold text-sm text-navy hover:text-gov-blue transition"
              >
                <span>{faq.q}</span>
                {openFaq === index ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {openFaq === index && (
                <p className="mt-2 text-xs text-text-secondary leading-relaxed bg-gray-50 p-3 rounded border border-gray-100">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
