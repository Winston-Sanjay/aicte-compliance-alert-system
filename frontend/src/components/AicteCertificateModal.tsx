import { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Printer, X, ShieldCheck, CheckCircle, ExternalLink, MapPin } from 'lucide-react';
import GisLandPlot from './GisLandPlot';
import type { Application } from '../types';

interface AicteCertificateModalProps {
  application: Application;
  onClose: () => void;
}

export default function AicteCertificateModal({ application, onClose }: AicteCertificateModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [verificationUrl, setVerificationUrl] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  const cleanAppNo = application.applicationNo || 'AICTE-2026-001';
  const cleanAppSeq = cleanAppNo.replace(/[^a-zA-Z0-9]/g, '-');
  const refNo = `F.No. North-West/AICTE/2026-27/EOA-${cleanAppSeq}`;
  const issueDate = application.decisionAt
    ? new Date(application.decisionAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

  useEffect(() => {
    // Determine public verify URL
    const baseUrl = window.location.origin;
    const verifyTarget = `${baseUrl}/verify/${encodeURIComponent(cleanAppNo)}`;
    setVerificationUrl(verifyTarget);

    QRCode.toDataURL(verifyTarget, {
      width: 140,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [cleanAppNo]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Modal Container */}
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        {/* Action Header Bar (Hidden in Print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Official AICTE Extension of Approval (EoA) Order
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Ref: {refNo} · AY 2026-27
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-gov-blue hover:bg-gov-blue-dark text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close Letter"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Certificate / Official Letter Body */}
        <div
          ref={printRef}
          className="p-8 sm:p-12 overflow-y-auto flex-1 font-serif text-slate-900 bg-white print:p-0 print:overflow-visible"
          id="aicte-official-certificate"
        >
          {/* Government of India & AICTE Letterhead */}
          <div className="border-b-2 border-slate-800 pb-5 mb-6 text-center relative">
            <div className="flex items-center justify-between mb-2">
              {/* National Emblem Badge Placeholder */}
              <div className="w-16 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-amber-600 bg-amber-50 flex items-center justify-center text-[10px] font-bold text-amber-900">
                  सत्यमेव जयते
                </div>
              </div>

              {/* Title Header */}
              <div className="flex-1 px-4">
                <p className="text-[11px] uppercase tracking-widest text-slate-600 font-sans font-semibold">
                  भारत सरकार · Ministry of Education, Government of India
                </p>
                <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-gov-blue mt-0.5 font-sans">
                  अखिल भारतीय तकनीकी शिक्षा परिषद्
                </h1>
                <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-900 font-sans">
                  ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
                </h2>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                  (A Statutory Body under AICTE Act 1987, Ministry of Education, Govt. of India)
                </p>
                <p className="text-[9.5px] text-slate-600 font-sans mt-0.5">
                  Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070 | Tel: 011-29581000 | Website: www.aicte-india.org
                </p>
              </div>

              {/* AICTE Logo Emblem */}
              <div className="w-16 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-gov-blue bg-blue-50 flex items-center justify-center font-bold text-gov-blue text-xs font-sans">
                  AICTE
                </div>
              </div>
            </div>

            {/* Sub-bar */}
            <div className="bg-slate-100 py-1 px-3 rounded text-[10px] font-sans font-semibold text-slate-700 flex justify-between items-center border border-slate-200 mt-2">
              <span>APPROVAL PROCESS HANDBOOK (APH) 2026-27</span>
              <span className="text-emerald-700 uppercase font-bold tracking-wider">
                DIGITALLY VERIFIED OFFICIAL ORDER
              </span>
            </div>
          </div>

          {/* Letter Reference Metadata */}
          <div className="flex justify-between items-start text-xs font-sans mb-5 pb-3 border-b border-slate-200">
            <div>
              <p>
                <strong className="text-slate-700">Order Ref No:</strong>{' '}
                <span className="font-mono font-bold text-slate-900">{refNo}</span>
              </p>
              <p className="mt-0.5">
                <strong className="text-slate-700">Application Permanent ID:</strong>{' '}
                <span className="font-mono">{cleanAppNo}</span>
              </p>
            </div>
            <div className="text-right">
              <p>
                <strong className="text-slate-700">Date of Order:</strong>{' '}
                <span className="font-medium">{issueDate}</span>
              </p>
              <p className="mt-0.5">
                <strong className="text-slate-700">Academic Session:</strong>{' '}
                <span className="font-semibold text-gov-blue">2026-2027</span>
              </p>
            </div>
          </div>

          {/* Addressee */}
          <div className="text-xs font-sans leading-relaxed mb-4">
            <p className="font-bold text-slate-800">To,</p>
            <p className="font-semibold text-slate-900">{appRecipient(application)}</p>
            <p className="text-slate-600">{application.institution?.address || 'Institutional Campus'},</p>
            <p className="text-slate-600">
              {application.institution?.district || 'New Delhi'}, {application.institution?.state || 'Delhi'}
            </p>
          </div>

          {/* Subject Line */}
          <div className="mb-4 bg-slate-50 p-2.5 rounded border-l-4 border-gov-blue font-sans text-xs">
            <p className="font-bold text-slate-900">
              Sub: Extension of Approval (EoA) / Grant of Approval for Academic Year 2026-27
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Ref: Application of the Institution for Extension of Approval for the Academic Year 2026-27 submitted via AICTE National Portal.
            </p>
          </div>

          {/* Body Paragraphs */}
          <div className="text-xs font-sans text-slate-800 leading-relaxed space-y-2.5 text-justify mb-5">
            <p>
              Sir / Madam,
            </p>
            <p>
              In terms of the provisions under the <strong>All India Council for Technical Education (Grant of Approvals for Technical Institutions) Regulations 2026</strong> notified by the Council vide notification number F.No. AB/AICTE/REG/2026 and amended from time to time, and norms, standards, procedures, and conditions prescribed by the Council from time to time, I am directed to convey the approval to:
            </p>
          </div>

          {/* Institution & Programme Details Table */}
          <div className="mb-5 overflow-hidden border border-slate-300 rounded font-sans text-xs">
            <table className="w-full text-left border-collapse">
              <tbody>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <td className="p-2 font-bold w-1/3 text-slate-700">Permanent Institute ID</td>
                  <td className="p-2 font-mono font-semibold text-slate-900">{application.institution?.institutionCode || 'AICTE-1001'}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 font-bold text-slate-700">Name of the Technical Institution</td>
                  <td className="p-2 font-bold text-gov-blue">{application.institution?.name}</td>
                </tr>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <td className="p-2 font-bold text-slate-700">Institution Address / Campus</td>
                  <td className="p-2 text-slate-800">
                    {application.institution?.address || 'Campus Site'}, {application.institution?.district}, {application.institution?.state}
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 font-bold text-slate-700">Institution Type & Category</td>
                  <td className="p-2 text-slate-800">
                    {application.institution?.type || 'Government / Aided'} · {application.category?.name || 'Extension of Approval'}
                  </td>
                </tr>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <td className="p-2 font-bold text-slate-700">Affiliating University / Board</td>
                  <td className="p-2 text-slate-800">{application.affiliatingBody || 'Guru Gobind Singh Indraprastha University, Delhi'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Approved Courses and Intake Table */}
          <div className="mb-5 font-sans">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5 flex items-center justify-between">
              <span>Approved Programmes, Courses & Sanctioned Intake for AY 2026-27</span>
              <span className="text-[10px] text-emerald-700 font-semibold">VALIDITY: 1 YEAR (2026-27)</span>
            </h4>
            <div className="border border-slate-300 rounded overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 border-b border-slate-300">
                  <tr>
                    <th className="p-2">Programme</th>
                    <th className="p-2">Level</th>
                    <th className="p-2">Course / Discipline</th>
                    <th className="p-2 text-center">Affiliating Body</th>
                    <th className="p-2 text-center">Approved Intake</th>
                    <th className="p-2 text-center">Approval Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="hover:bg-slate-50">
                    <td className="p-2 font-medium">{application.programmeName || 'Engineering & Technology'}</td>
                    <td className="p-2">{application.qualificationLevel || 'Undergraduate'}</td>
                    <td className="p-2 font-semibold text-slate-900">{application.discipline || 'Computer Science & Engineering'}</td>
                    <td className="p-2 text-center text-[11px] text-slate-600">GGSIPU Delhi</td>
                    <td className="p-2 text-center font-bold text-emerald-800 font-mono">
                      {application.proposedIntake || application.existingIntake || 120} Seats
                    </td>
                    <td className="p-2 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                        APPROVED
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* MANDATORY GIS CADASTRAL LAND BOUNDARY SECTION */}
          <div className="mb-6 font-sans">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <MapPin size={14} className="text-emerald-700" />
                <span>Annexure I: GIS Spatial Land Boundary & Cadastral Verification</span>
              </h4>
              <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                100% CONTIGUOUS PARCEL · VERIFIED
              </span>
            </div>

            <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">
              As per AICTE Approval Process Handbook regulations, the land parcel of the technical institution must be a single undivided contiguous piece without any public road bisection. Below is the multi-point cadastral boundary polygon mapped via official coordinates:
            </p>

            {/* Embedded GisLandPlot in light/print variant */}
            <div className="border border-slate-300 rounded-xl overflow-hidden print:border-slate-400">
              <GisLandPlot
                institutionName={application.institution?.name}
                landAreaAcres={5.4}
                surveyNumbers="Plot No. 16C/2, Khasra 44/2 & 45/1"
                variant="print"
                isCompact={false}
              />
            </div>
          </div>

          {/* Standard Terms and Mandatory Conditions */}
          <div className="mb-6 font-sans text-[11px] text-slate-700 leading-relaxed space-y-1.5 bg-slate-50/80 p-3.5 rounded border border-slate-200">
            <h5 className="font-bold text-slate-900 uppercase text-[11px]">Key Terms & Regulatory Conditions:</h5>
            <ol className="list-decimal pl-4 space-y-1">
              <li>The institution shall strictly maintain the Student-to-Faculty Ratio (SFR 1:20) and Cadre Ratio as prescribed in AICTE norms throughout the academic year.</li>
              <li>Strict compliance with Anti-Ragging regulations and mandatory grievance redressal mechanisms (Ombudsperson & Internal Complaints Committee) must be enforced.</li>
              <li>No change in campus location, intake, or introduction of new courses shall be permitted without prior written approval of the AICTE Council.</li>
              <li>The Council reserves the right to conduct surprise physical or virtual Expert Visit Committee (EVC) inspections at any time to verify compliance.</li>
            </ol>
          </div>

          {/* Digital Signature & QR Code Verification Block */}
          <div className="pt-4 border-t-2 border-slate-800 font-sans flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Scannable QR Code */}
            <div className="flex items-center gap-3.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-w-sm">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="AICTE Digital Verification QR Code"
                  className="w-24 h-24 border border-slate-300 rounded-lg p-0.5 bg-white shrink-0 shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 bg-slate-200 rounded animate-pulse" />
              )}
              <div className="text-[10px] text-slate-600 leading-tight">
                <span className="font-bold text-slate-900 block mb-0.5 flex items-center gap-1">
                  <CheckCircle size={11} className="text-emerald-700" />
                  National AICTE QR Verification
                </span>
                <p className="text-[9px] text-slate-500 mb-1">
                  Scan to authenticate official validity on the Government of India National AICTE Portal.
                </p>
                <a
                  href={verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gov-blue hover:underline inline-flex items-center gap-0.5 font-bold font-mono text-[9px]"
                >
                  Verify URL <ExternalLink size={9} />
                </a>
              </div>
            </div>

            {/* Official Digital Signature */}
            <div className="text-right text-xs">
              <div className="inline-block text-left p-3 bg-emerald-50/70 border border-emerald-300 rounded-lg">
                <p className="text-[9px] uppercase tracking-wider text-emerald-900 font-bold mb-0.5">
                  ✓ Digitally Signed & Authenticated
                </p>
                <p className="font-bold text-slate-900 text-sm">Prof. Rajive Kumar</p>
                <p className="text-[11px] text-slate-700">Member Secretary, AICTE</p>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Digital Cert SHA-256: 9f86d081884c7d659a2feaa...
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Signed At: {issueDate} 11:42:18 IST
                </p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400 font-sans">
            This is a computer-generated official document issued under the AICTE Approval Process Handbook 2026-27. No physical ink signature is required.
          </div>
        </div>
      </div>
    </div>
  );
}

function appRecipient(app: Application): string {
  const name = app.institution?.name || 'The Principal / Director';
  return `The Principal / Director, ${name}`;
}
