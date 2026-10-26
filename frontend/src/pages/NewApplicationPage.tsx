import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { applicationsApi, categoriesApi, documentsApi } from '../services/api';
import type { ApplicationCategory, DocumentChecklistItem } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  ChevronLeft, ChevronRight, Save, Send, Upload, Check,
  AlertTriangle, FileText, Loader2, X, Info
} from 'lucide-react';

// ─── Form Schemas ───────────────────────────────────────────

const step1Schema = z.object({
  categoryId: z.string().min(1, 'Please select an application category'),
});

const step2Schema = z.object({
  institutionName: z.string().min(2, 'Institution name is required'),
  institutionCode: z.string().min(1, 'Institution ID is required'),
  institutionType: z.string().min(1, 'Institution type is required'),
  state: z.string().min(1, 'State is required'),
  district: z.string().min(1, 'District is required'),
  address: z.string().min(5, 'Full address is required'),
  contactPerson: z.string().min(2, 'Contact person name is required'),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile number required'),
});

const step3Schema = z.object({
  programmeName: z.string().min(1, 'Programme name is required'),
  discipline: z.string().min(1, 'Discipline is required'),
  qualificationLevel: z.string().min(1, 'Qualification level is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  existingIntake: z.coerce.number().int().min(0).optional(),
  proposedIntake: z.coerce.number().int().min(1, 'Proposed intake must be at least 1').optional(),
  affiliatingBody: z.string().optional(),
});

// ─── Document Checklists by Category ────────────────────────

const DOCUMENT_CHECKLISTS: Record<string, DocumentChecklistItem[]> = {
  EOA: [
    { documentType: 'FIRE_NOC', documentName: 'Fire Safety Certificate / NOC', isRequired: true, description: 'Valid Fire Safety NOC issued by competent Municipal Fire Services', acceptedFormats: ['pdf'], maxSizeMB: 10 },
    { documentType: 'STRUCTURAL_STABILITY', documentName: 'Structural Stability Certificate', isRequired: true, description: 'Certificate from Registered Structural Engineer certifying earthquake/load safety', acceptedFormats: ['pdf'], maxSizeMB: 10 },
    { documentType: 'OCCUPANCY_CERT', documentName: 'Occupancy / Building Completion Certificate', isRequired: true, description: 'Valid Occupancy certificate issued by local urban development authority', acceptedFormats: ['pdf'], maxSizeMB: 10 },
    { documentType: 'LAND_DOCS', documentName: 'Contiguous Campus Land Documents', isRequired: true, description: 'Registered land deed showing continuous contiguous campus boundaries', acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'], maxSizeMB: 15 },
    { documentType: 'FACULTY_LIST', documentName: 'Faculty Cadre & Ratio Register', isRequired: true, description: 'Approved regular faculty list with qualifications meeting 1:20 SFR norm', acceptedFormats: ['pdf'], maxSizeMB: 15 },
    { documentType: 'BALANCE_SHEET', documentName: 'Audited Financial Statements', isRequired: false, description: 'Balance sheet and income statement for previous financial year', acceptedFormats: ['pdf'], maxSizeMB: 10 },
  ],
  NEW_PROG: [
    { documentType: 'FIRE_NOC', documentName: 'Fire Safety Certificate / NOC', isRequired: true, description: 'Valid Fire Safety NOC issued by competent Municipal Fire Services', acceptedFormats: ['pdf'], maxSizeMB: 10 },
    { documentType: 'STRUCTURAL_STABILITY', documentName: 'Structural Stability Certificate', isRequired: true, description: 'Registered Structural Engineer safety compliance certificate', acceptedFormats: ['pdf'], maxSizeMB: 10 },
    { documentType: 'OCCUPANCY_CERT', documentName: 'Occupancy / Completion Certificate', isRequired: true, description: 'Municipal occupancy permit for proposed laboratories & classrooms', acceptedFormats: ['pdf'], maxSizeMB: 10 },
    { documentType: 'FACULTY_RECRUITMENT', documentName: 'Faculty Recruitment & Appointment Plan', isRequired: true, description: 'Qualified faculty recruitment schedule for the new discipline', acceptedFormats: ['pdf'], maxSizeMB: 10 },
    { documentType: 'LAB_EQUIPMENT', documentName: 'Laboratory & Equipment Inventory', isRequired: true, description: 'Specialized equipment and laboratory setup as per APH norms', acceptedFormats: ['pdf'], maxSizeMB: 15 },
    { documentType: 'MANAGEMENT_RESOLUTION', documentName: 'Governing Board Resolution', isRequired: true, description: 'Society / Trust resolution authorizing introduction of new course', acceptedFormats: ['pdf'], maxSizeMB: 10 },
  ],
  INTAKE_INC: [
    { documentType: 'FIRE_NOC', documentName: 'Fire Safety Certificate / NOC', isRequired: true, description: 'Valid Fire Safety NOC covering extended student capacity', acceptedFormats: ['pdf'], maxSizeMB: 10 },
    { documentType: 'STRUCTURAL_STABILITY', documentName: 'Structural Stability Certificate', isRequired: true, description: 'Structural certificate for extended division classrooms', acceptedFormats: ['pdf'], maxSizeMB: 10 },
    { documentType: 'OCCUPANCY_CERT', documentName: 'Occupancy / Completion Certificate', isRequired: true, description: 'Occupancy permit covering enhanced built-up area', acceptedFormats: ['pdf'], maxSizeMB: 10 },
    { documentType: 'NBA_ACCREDITATION', documentName: 'NBA Accreditation Order', isRequired: true, description: 'Valid NBA accreditation letter required for expansion above base intake', acceptedFormats: ['pdf'], maxSizeMB: 10 },
    { documentType: 'FACULTY_LIST', documentName: 'Enhanced Faculty Roster', isRequired: true, description: 'Cadre ratio and appointed faculty list for additional division', acceptedFormats: ['pdf'], maxSizeMB: 10 },
  ],
  INTAKE_INCREASE: [
    { documentType: 'FIRE_NOC', documentName: 'Fire Safety Certificate / NOC', isRequired: true, description: 'Valid Fire Safety NOC covering extended student capacity', acceptedFormats: ['pdf'], maxSizeMB: 10 },
    { documentType: 'STRUCTURAL_STABILITY', documentName: 'Structural Stability Certificate', isRequired: true, description: 'Structural certificate for extended division classrooms', acceptedFormats: ['pdf'], maxSizeMB: 10 },
    { documentType: 'OCCUPANCY_CERT', documentName: 'Occupancy / Completion Certificate', isRequired: true, description: 'Occupancy permit covering enhanced built-up area', acceptedFormats: ['pdf'], maxSizeMB: 10 },
    { documentType: 'NBA_ACCREDITATION', documentName: 'NBA Accreditation Order', isRequired: true, description: 'Valid NBA accreditation letter required for expansion above base intake', acceptedFormats: ['pdf'], maxSizeMB: 10 },
    { documentType: 'FACULTY_LIST', documentName: 'Enhanced Faculty Roster', isRequired: true, description: 'Cadre ratio and appointed faculty list for additional division', acceptedFormats: ['pdf'], maxSizeMB: 10 },
  ],
  NEW_INST: [
    { documentType: 'LAND_DOCS', documentName: 'Land Ownership / 30-Year Lease Deed', isRequired: true, description: 'Continuous registered land title in name of the Society/Trust', acceptedFormats: ['pdf'], maxSizeMB: 15 },
    { documentType: 'BUILDING_PLAN', documentName: 'Approved Building Master Plan', isRequired: true, description: 'Competent Town Planning authority sanctioned architectural plan', acceptedFormats: ['pdf'], maxSizeMB: 15 },
    { documentType: 'FIRE_NOC', documentName: 'Fire Safety Certificate / NOC', isRequired: true, description: 'Fire department NOC for the entire campus', acceptedFormats: ['pdf'], maxSizeMB: 10 },
    { documentType: 'STRUCTURAL_STABILITY', documentName: 'Structural Stability Certificate', isRequired: true, description: 'Structural audit certification', acceptedFormats: ['pdf'], maxSizeMB: 10 },
    { documentType: 'OCCUPANCY_CERT', documentName: 'Occupancy / Completion Certificate', isRequired: true, description: 'Lawful occupancy certificate', acceptedFormats: ['pdf'], maxSizeMB: 10 },
  ],
};

const STEPS = ['Category', 'Institution Details', 'Programme Details', 'Documents', 'Review & Submit'];

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Chandigarh', 'Puducherry',
];

const INSTITUTION_TYPES = ['Engineering & Technology', 'Polytechnic', 'Management', 'Pharmacy', 'Architecture', 'Applied Arts'];
const DISCIPLINES = ['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Artificial Intelligence & Data Science', 'Robotics & Automation', 'MBA', 'MCA', 'Pharmacy', 'Architecture'];
const QUALIFICATION_LEVELS = ['Diploma', 'Undergraduate (UG)', 'Postgraduate (PG)', 'Doctoral'];

export default function NewApplicationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<ApplicationCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { name: string; status: string }>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Step 1 form
  const step1Form = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: { categoryId: '' },
  });

  // Step 2 form
  const step2Form = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      institutionName: '',
      institutionCode: '',
      institutionType: 'Engineering & Technology',
      state: 'Delhi',
      district: 'South West Delhi',
      address: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '9876543210',
    },
  });

  // Step 3 form
  const step3Form = useForm({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      programmeName: 'B.Tech in Computer Science & Engineering',
      discipline: 'Computer Science & Engineering',
      qualificationLevel: 'Undergraduate (UG)',
      academicYear: '2026-27',
      existingIntake: 60,
      proposedIntake: 120,
      affiliatingBody: 'Guru Gobind Singh Indraprastha University (GGSIPU), Delhi',
    },
  });

  // Load categories and ensure it's always an array
  useEffect(() => {
    setLoadingCategories(true);
    categoriesApi.list()
      .then((res) => {
        const raw = res.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.categories)
          ? raw.categories
          : [];
        setCategories(list);

        if (list.length > 0) {
          const firstId = list[0].id;
          step1Form.setValue('categoryId', firstId);
          setSelectedCategory(firstId);
        }
      })
      .catch((err) => {
        console.error('Failed to load categories', err);
        setCategories([]);
      })
      .finally(() => {
        setLoadingCategories(false);
      });
  }, [step1Form]);

  // Pre-fill Institution details from logged-in user profile
  useEffect(() => {
    if (user?.institution) {
      const inst = user.institution;
      step2Form.reset({
        institutionName: inst.name || 'Delhi Institute of Technology & Engineering',
        institutionCode: inst.institutionCode || 'DITE-10492',
        institutionType: inst.type || 'Engineering & Technology',
        state: inst.state || 'Delhi',
        district: inst.district || 'South West Delhi',
        address: inst.address || 'Sector 16C, Dwarka, New Delhi 110078',
        contactPerson: inst.contactPerson || user.name || 'Dr. Rajesh Kumar',
        contactEmail: inst.contactEmail || user.email || 'institution@demo.aicte',
        contactPhone: inst.contactPhone && /^[6-9]\d{9}$/.test(inst.contactPhone.replace(/\D/g, '').slice(-10))
          ? inst.contactPhone.replace(/\D/g, '').slice(-10)
          : '9876543210',
      });
    }
  }, [user, step2Form]);

  const safeCategories = Array.isArray(categories) ? categories : [];

  const getCategoryCode = (): string => {
    const cat = safeCategories.find((c) => c.id === selectedCategory);
    return cat?.code || '';
  };

  const getChecklist = (): DocumentChecklistItem[] => {
    const code = getCategoryCode();
    return DOCUMENT_CHECKLISTS[code] || DOCUMENT_CHECKLISTS['EOA'] || [];
  };

  // Save or update draft
  const saveDraft = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const step1Vals = step1Form.getValues();
      const step2Vals = step2Form.getValues();
      const step3Vals = step3Form.getValues();

      const data = {
        categoryId: step1Vals.categoryId || selectedCategory,
        programmeName: step3Vals.programmeName || 'Technical Programme',
        discipline: step3Vals.discipline || 'Engineering',
        qualificationLevel: step3Vals.qualificationLevel || 'Undergraduate (UG)',
        academicYear: step3Vals.academicYear || '2025-26',
        proposedIntake: step3Vals.proposedIntake ? Number(step3Vals.proposedIntake) : 60,
        existingIntake: step3Vals.existingIntake ? Number(step3Vals.existingIntake) : 0,
        affiliatingBody: step3Vals.affiliatingBody || '',
        currentStep: step,
        formData: {
          institutionDetails: step2Vals,
          locationType: 'Urban',
          landAreaAcres: 3.5,
          totalStudents: (step3Vals.proposedIntake ? Number(step3Vals.proposedIntake) : 60) * 4,
          totalFaculty: 15,
        },
      };

      if (applicationId) {
        await applicationsApi.update(applicationId, data);
      } else {
        const res = await applicationsApi.create(data);
        const newId = res.data?.application?.id || res.data?.id;
        if (newId) {
          setApplicationId(newId);
        }
      }
    } catch (err: unknown) {
      console.error('Draft save failed:', err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save application draft';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    let valid = false;
    if (step === 1) {
      valid = await step1Form.trigger();
      if (valid) {
        setSelectedCategory(step1Form.getValues('categoryId'));
      }
    } else if (step === 2) {
      valid = await step2Form.trigger();
    } else if (step === 3) {
      valid = await step3Form.trigger();
    } else {
      valid = true;
    }

    if (valid) {
      await saveDraft();
      setStep((s) => Math.min(s + 1, 5));
    }
  };

  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleUpload = async (docItem: DocumentChecklistItem, file: File) => {
    if (!applicationId) {
      // Auto-save first
      await saveDraft();
    }
    setUploading(docItem.documentType);
    try {
      const activeId = applicationId || (await saveDraftAndGetId());
      if (!activeId) {
        setSaveError('Please save the application before uploading documents.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', docItem.documentType);
      formData.append('documentName', docItem.documentName);

      await documentsApi.upload(activeId, formData);
      setUploadedDocs((prev) => ({
        ...prev,
        [docItem.documentType]: { name: file.name, status: 'UPLOADED' },
      }));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Document upload failed';
      setSaveError(message);
    } finally {
      setUploading(null);
    }
  };

  const saveDraftAndGetId = async (): Promise<string | null> => {
    try {
      const step1Vals = step1Form.getValues();
      const step2Vals = step2Form.getValues();
      const step3Vals = step3Form.getValues();

      const data = {
        categoryId: step1Vals.categoryId || selectedCategory,
        programmeName: step3Vals.programmeName || 'Technical Programme',
        discipline: step3Vals.discipline || 'Engineering',
        qualificationLevel: step3Vals.qualificationLevel || 'Undergraduate (UG)',
        academicYear: step3Vals.academicYear || '2025-26',
        proposedIntake: step3Vals.proposedIntake ? Number(step3Vals.proposedIntake) : 60,
        existingIntake: step3Vals.existingIntake ? Number(step3Vals.existingIntake) : 0,
        affiliatingBody: step3Vals.affiliatingBody || '',
        currentStep: step,
        formData: { institutionDetails: step2Vals },
      };

      const res = await applicationsApi.create(data);
      const newId = res.data?.application?.id || res.data?.id;
      if (newId) {
        setApplicationId(newId);
        return newId;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleSubmit = async () => {
    let targetAppId = applicationId;
    if (!targetAppId) {
      targetAppId = await saveDraftAndGetId();
    }
    if (!targetAppId) {
      setSaveError('Could not initialize application. Please check form fields.');
      return;
    }

    setSubmitting(true);
    setSaveError('');
    try {
      await applicationsApi.submit(targetAppId);
      navigate(`/applications/${targetAppId}`);
    } catch (err: unknown) {
      const resData = (err as { response?: { data?: any } })?.response?.data;
      const message = resData?.message || 'Submission failed. Please check compliance findings.';
      setSaveError(message);
      if (targetAppId) {
        // Navigate to detail page where compliance findings are clearly shown
        setTimeout(() => {
          navigate(`/applications/${targetAppId}`);
        }, 1500);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const needsIntakeFields = ['EOA', 'INTAKE_INC', 'INTAKE_INCREASE'].includes(getCategoryCode());

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-lg border border-border shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy">New AICTE Approval Application</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Complete the 5-step regulatory submission as per AICTE Approval Process Handbook (APH 2025-26)
          </p>
        </div>
        <div className="text-xs px-3 py-1 bg-gov-blue/10 text-gov-blue font-semibold rounded">
          Step {step} of 5: {STEPS[step - 1]}
        </div>
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
        <Info size={16} className="mt-0.5 shrink-0 text-gov-blue" />
        <span>
          <strong>Prototype Environment Notice:</strong> Checklist rules, student-to-faculty norms (1:20), and land requirements are automatically validated by the internal APH Compliance Engine upon progression.
        </span>
      </div>

      {/* Progress Steps */}
      <div className="bg-white p-5 rounded-lg border border-border shadow-sm flex items-center justify-between">
        {STEPS.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = step === stepNum;
          const isCompleted = step > stepNum;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isActive
                      ? 'bg-gov-blue text-white ring-4 ring-gov-blue/20'
                      : 'bg-gray-100 text-text-secondary border border-gray-300'
                  }`}
                >
                  {isCompleted ? <Check size={14} /> : stepNum}
                </div>
                <span
                  className={`text-xs mt-1.5 font-medium hidden sm:block ${
                    isActive ? 'text-gov-blue font-bold' : isCompleted ? 'text-emerald-700' : 'text-text-secondary'
                  }`}
                >
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 transition ${
                    isCompleted ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Error Display */}
      {saveError && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          <AlertTriangle size={16} className="shrink-0 text-rose-600" />
          <span className="font-medium">{saveError}</span>
          <button onClick={() => setSaveError('')} className="ml-auto text-rose-500 hover:text-rose-700">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-lg border border-border shadow-sm">
        <div className="p-6">
          {/* Step 1: Category */}
          {step === 1 && (
            <div>
              <h2 className="text-base font-bold text-navy mb-1">Select Approval Category</h2>
              <p className="text-xs text-text-secondary mb-4">
                Choose the statutory category under which this technical programme approval is sought.
              </p>

              {loadingCategories ? (
                <div className="py-12 flex items-center justify-center gap-2 text-gov-blue text-sm">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Loading AICTE approval categories...</span>
                </div>
              ) : safeCategories.length === 0 ? (
                <div className="py-12 text-center text-text-secondary text-xs">
                  No approval categories found. Please contact support.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {safeCategories.map((cat) => {
                    const isSelected = (step1Form.watch('categoryId') || selectedCategory) === cat.id;
                    return (
                      <label
                        key={cat.id}
                        onClick={() => {
                          step1Form.setValue('categoryId', cat.id);
                          setSelectedCategory(cat.id);
                        }}
                        className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition ${
                          isSelected
                            ? 'border-gov-blue bg-blue-50/50 ring-2 ring-gov-blue/20'
                            : 'border-border hover:border-gov-blue/40 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          value={cat.id}
                          checked={isSelected}
                          onChange={() => {
                            step1Form.setValue('categoryId', cat.id);
                            setSelectedCategory(cat.id);
                          }}
                          className="mt-1 text-gov-blue focus:ring-gov-blue"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-sm text-navy">{cat.name}</p>
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-gray-100 rounded text-text-secondary">
                              {cat.code}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary mt-1 leading-relaxed">{cat.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {step1Form.formState.errors.categoryId && (
                <p className="text-xs text-rose-600 mt-2 font-medium">
                  {step1Form.formState.errors.categoryId.message}
                </p>
              )}
            </div>
          )}

          {/* Step 2: Institution Details */}
          {step === 2 && (
            <div>
              <h2 className="text-base font-bold text-navy mb-1">Institution Identification & Profile</h2>
              <p className="text-xs text-text-secondary mb-4">
                Verify institution credentials, campus address, and authorized contact information.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="inst-name" className="form-label">
                    Institution Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="inst-name"
                    className="form-input"
                    {...step2Form.register('institutionName')}
                  />
                  {step2Form.formState.errors.institutionName && (
                    <p className="form-error">{step2Form.formState.errors.institutionName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="inst-code" className="form-label">
                    Institution Permanent ID <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="inst-code"
                    className="form-input"
                    placeholder="e.g., DITE-10492"
                    {...step2Form.register('institutionCode')}
                  />
                  {step2Form.formState.errors.institutionCode && (
                    <p className="form-error">{step2Form.formState.errors.institutionCode.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="inst-type" className="form-label">
                    Institution Type <span className="text-rose-600">*</span>
                  </label>
                  <select id="inst-type" className="form-select" {...step2Form.register('institutionType')}>
                    {INSTITUTION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="state" className="form-label">
                    State / UT <span className="text-rose-600">*</span>
                  </label>
                  <select id="state" className="form-select" {...step2Form.register('state')}>
                    {STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="district" className="form-label">
                    District <span className="text-rose-600">*</span>
                  </label>
                  <input id="district" className="form-input" {...step2Form.register('district')} />
                  {step2Form.formState.errors.district && (
                    <p className="form-error">{step2Form.formState.errors.district.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="address" className="form-label">
                    Campus Address <span className="text-rose-600">*</span>
                  </label>
                  <textarea id="address" rows={2} className="form-input" {...step2Form.register('address')} />
                  {step2Form.formState.errors.address && (
                    <p className="form-error">{step2Form.formState.errors.address.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact-person" className="form-label">
                    Authorized Head / Principal <span className="text-rose-600">*</span>
                  </label>
                  <input id="contact-person" className="form-input" {...step2Form.register('contactPerson')} />
                  {step2Form.formState.errors.contactPerson && (
                    <p className="form-error">{step2Form.formState.errors.contactPerson.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact-email" className="form-label">
                    Official Email <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    className="form-input"
                    {...step2Form.register('contactEmail')}
                  />
                  {step2Form.formState.errors.contactEmail && (
                    <p className="form-error">{step2Form.formState.errors.contactEmail.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact-phone" className="form-label">
                    Official Mobile Contact <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="contact-phone"
                    className="form-input"
                    placeholder="10-digit mobile"
                    {...step2Form.register('contactPhone')}
                  />
                  {step2Form.formState.errors.contactPhone && (
                    <p className="form-error">{step2Form.formState.errors.contactPhone.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Programme Details */}
          {step === 3 && (
            <div>
              <h2 className="text-base font-bold text-navy mb-1">Programme & Curriculum Details</h2>
              <p className="text-xs text-text-secondary mb-4">
                Define the technical discipline, academic year, degree level, and proposed intake capacity.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="prog-name" className="form-label">
                    Programme Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="prog-name"
                    className="form-input"
                    placeholder="e.g., B.Tech in Computer Science & Engineering"
                    {...step3Form.register('programmeName')}
                  />
                  {step3Form.formState.errors.programmeName && (
                    <p className="form-error">{step3Form.formState.errors.programmeName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="discipline" className="form-label">
                    Discipline / Specialization <span className="text-rose-600">*</span>
                  </label>
                  <select id="discipline" className="form-select" {...step3Form.register('discipline')}>
                    {DISCIPLINES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="qual-level" className="form-label">
                    Level of Qualification <span className="text-rose-600">*</span>
                  </label>
                  <select id="qual-level" className="form-select" {...step3Form.register('qualificationLevel')}>
                    {QUALIFICATION_LEVELS.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="acad-year" className="form-label">
                    Academic Year <span className="text-rose-600">*</span>
                  </label>
                  <input id="acad-year" className="form-input" {...step3Form.register('academicYear')} />
                </div>

                {needsIntakeFields && (
                  <>
                    <div>
                      <label htmlFor="existing-intake" className="form-label">
                        Existing Approved Intake
                      </label>
                      <input
                        id="existing-intake"
                        type="number"
                        min="0"
                        className="form-input"
                        {...step3Form.register('existingIntake')}
                      />
                    </div>
                    <div>
                      <label htmlFor="proposed-intake" className="form-label">
                        Proposed Approved Intake <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="proposed-intake"
                        type="number"
                        min="1"
                        className="form-input"
                        {...step3Form.register('proposedIntake')}
                      />
                      {step3Form.formState.errors.proposedIntake && (
                        <p className="form-error">{step3Form.formState.errors.proposedIntake.message}</p>
                      )}
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label htmlFor="affiliating" className="form-label">
                    Affiliating University / State Board
                  </label>
                  <input
                    id="affiliating"
                    className="form-input"
                    placeholder="e.g., Guru Gobind Singh Indraprastha University (GGSIPU)"
                    {...step3Form.register('affiliatingBody')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {step === 4 && (
            <div>
              <h2 className="text-base font-bold text-navy mb-1">Mandatory Statutory Documents</h2>
              <p className="text-xs text-text-secondary mb-4">
                Upload self-attested documents conforming to AICTE Approval Process Handbook (APH 2026-27) specifications.
              </p>

              <div className="space-y-3">
                {getChecklist().map((docItem) => {
                  const uploaded = uploadedDocs[docItem.documentType];
                  return (
                    <div
                      key={docItem.documentType}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg transition gap-3 ${
                        uploaded
                          ? 'border-emerald-300 bg-emerald-50/30'
                          : docItem.isRequired
                          ? 'border-border bg-white'
                          : 'border-dashed border-gray-300 bg-gray-50/40'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText
                            size={16}
                            className={uploaded ? 'text-emerald-600' : 'text-text-secondary'}
                          />
                          <span className="text-sm font-semibold text-navy">{docItem.documentName}</span>
                          {docItem.isRequired ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded">
                              Required
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                              Optional
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary mt-1">{docItem.description}</p>
                        {uploaded && (
                          <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                            <Check size={13} /> Uploaded: {uploaded.name} (Simulated OCR Verified)
                          </p>
                        )}
                        <p className="text-[10px] text-text-secondary mt-0.5">
                          Allowed: {docItem.acceptedFormats.join(', ').toUpperCase()} • Max Size: {docItem.maxSizeMB}MB
                        </p>
                      </div>

                      <div className="shrink-0">
                        <label
                          className={`px-3 py-1.5 text-xs font-semibold rounded border transition inline-flex items-center gap-1.5 cursor-pointer ${
                            uploading === docItem.documentType
                              ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                              : uploaded
                              ? 'border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              : 'border-gov-blue text-gov-blue bg-blue-50/50 hover:bg-blue-100'
                          }`}
                        >
                          {uploading === docItem.documentType ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Upload size={13} />
                          )}
                          <span>{uploaded ? 'Replace Document' : 'Upload File'}</span>
                          <input
                            type="file"
                            className="hidden"
                            accept={docItem.acceptedFormats.map((f) => `.${f}`).join(',')}
                            disabled={uploading === docItem.documentType}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUpload(docItem, file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-navy mb-1">Review Application Summary</h2>
              <p className="text-xs text-text-secondary mb-4">
                Please verify all entered details before initiating automated regulatory compliance check and submission.
              </p>

              {/* Category */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold text-text-secondary uppercase">Approval Category</h3>
                  <button onClick={() => setStep(1)} className="text-xs text-gov-blue hover:underline font-semibold">
                    Edit
                  </button>
                </div>
                <p className="text-sm font-bold text-navy">
                  {safeCategories.find((c) => c.id === selectedCategory)?.name || 'Selected Category'}
                </p>
              </div>

              {/* Institution Summary */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-text-secondary uppercase">Institution Profile</h3>
                  <button onClick={() => setStep(2)} className="text-xs text-gov-blue hover:underline font-semibold">
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-text-secondary">Institution:</span>{' '}
                    <strong className="text-navy">{step2Form.getValues('institutionName')}</strong>
                  </div>
                  <div>
                    <span className="text-text-secondary">ID:</span>{' '}
                    <strong className="text-navy">{step2Form.getValues('institutionCode')}</strong>
                  </div>
                  <div>
                    <span className="text-text-secondary">Type:</span>{' '}
                    <strong className="text-navy">{step2Form.getValues('institutionType')}</strong>
                  </div>
                  <div>
                    <span className="text-text-secondary">State:</span>{' '}
                    <strong className="text-navy">{step2Form.getValues('state')}</strong>
                  </div>
                  <div>
                    <span className="text-text-secondary">Contact:</span>{' '}
                    <strong className="text-navy">{step2Form.getValues('contactPerson')}</strong>
                  </div>
                  <div>
                    <span className="text-text-secondary">Email:</span>{' '}
                    <strong className="text-navy">{step2Form.getValues('contactEmail')}</strong>
                  </div>
                </div>
              </div>

              {/* Programme Summary */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-text-secondary uppercase">Programme Specification</h3>
                  <button onClick={() => setStep(3)} className="text-xs text-gov-blue hover:underline font-semibold">
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-text-secondary">Programme:</span>{' '}
                    <strong className="text-navy">{step3Form.getValues('programmeName')}</strong>
                  </div>
                  <div>
                    <span className="text-text-secondary">Discipline:</span>{' '}
                    <strong className="text-navy">{step3Form.getValues('discipline')}</strong>
                  </div>
                  <div>
                    <span className="text-text-secondary">Level:</span>{' '}
                    <strong className="text-navy">{step3Form.getValues('qualificationLevel')}</strong>
                  </div>
                  <div>
                    <span className="text-text-secondary">Proposed Intake:</span>{' '}
                    <strong className="text-navy">{Number(step3Form.getValues('proposedIntake')) || 60} seats</strong>
                  </div>
                </div>
              </div>

              {/* Documents Summary */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-text-secondary uppercase">Checklist Compliance Status</h3>
                  <button onClick={() => setStep(4)} className="text-xs text-gov-blue hover:underline font-semibold">
                    Edit
                  </button>
                </div>
                <div className="space-y-1.5">
                  {getChecklist().map((doc) => {
                    const uploaded = uploadedDocs[doc.documentType];
                    return (
                      <div key={doc.documentType} className="flex items-center gap-2 text-xs">
                        {uploaded ? (
                          <Check size={14} className="text-emerald-600 shrink-0" />
                        ) : doc.isRequired ? (
                          <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                        ) : (
                          <span className="w-3.5" />
                        )}
                        <span className={uploaded ? 'text-navy font-medium' : doc.isRequired ? 'text-rose-700' : 'text-text-secondary'}>
                          {doc.documentName}
                        </span>
                        {!uploaded && doc.isRequired && (
                          <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">
                            Pending Upload
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 bg-gray-50 border-t border-border flex items-center justify-between rounded-b-lg">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2 border border-border bg-white text-navy font-semibold text-xs rounded hover:bg-gray-100 flex items-center gap-1.5 transition"
              >
                <ChevronLeft size={15} />
                <span>Previous Step</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving}
              className="px-4 py-2 border border-border bg-white text-text-main font-semibold text-xs rounded hover:bg-gray-100 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Save size={15} />
              <span>{saving ? 'Saving Draft...' : 'Save Draft'}</span>
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 bg-gov-blue text-white font-semibold text-xs rounded hover:bg-gov-blue-dark flex items-center gap-1.5 transition shadow-xs"
              >
                <span>Continue to Step {step + 1}</span>
                <ChevronRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 bg-emerald-600 text-white font-semibold text-xs rounded hover:bg-emerald-700 flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
              >
                <Send size={15} />
                <span>{submitting ? 'Submitting & Validating...' : 'Submit Application'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
