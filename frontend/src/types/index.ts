// ─── User & Auth Types ──────────────────────────────────────

export type UserRole = 'INSTITUTION' | 'OFFICER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  institutionId?: string;
  institution?: Institution;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── Institution ────────────────────────────────────────────

export interface Institution {
  id: string;
  name: string;
  institutionCode: string;
  type: string;
  state: string;
  district: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
}

// ─── Application ────────────────────────────────────────────

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VALIDATION_IN_PROGRESS'
  | 'CORRECTION_REQUIRED'
  | 'RESUBMITTED'
  | 'UNDER_REVIEW'
  | 'ADDITIONAL_INFO_REQUESTED'
  | 'READY_FOR_DECISION'
  | 'DECISION_RECORDED'
  | 'CLOSED';

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  VALIDATION_IN_PROGRESS: 'Validation in Progress',
  CORRECTION_REQUIRED: 'Correction Required',
  RESUBMITTED: 'Resubmitted',
  UNDER_REVIEW: 'Under Officer Review',
  ADDITIONAL_INFO_REQUESTED: 'Additional Info Requested',
  READY_FOR_DECISION: 'Ready for Decision',
  DECISION_RECORDED: 'Decision Recorded',
  CLOSED: 'Closed',
};

export const STATUS_CSS: Record<ApplicationStatus, string> = {
  DRAFT: 'status-draft',
  SUBMITTED: 'status-submitted',
  VALIDATION_IN_PROGRESS: 'status-validation',
  CORRECTION_REQUIRED: 'status-correction',
  RESUBMITTED: 'status-resubmitted',
  UNDER_REVIEW: 'status-review',
  ADDITIONAL_INFO_REQUESTED: 'status-additional-info',
  READY_FOR_DECISION: 'status-ready-decision',
  DECISION_RECORDED: 'status-decided',
  CLOSED: 'status-closed',
};

export interface ApplicationCategory {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface Application {
  id: string;
  applicationNo: string;
  categoryId: string;
  category?: ApplicationCategory;
  institutionId: string;
  institution?: Institution;
  status: ApplicationStatus;
  programmeName?: string;
  discipline?: string;
  qualificationLevel?: string;
  academicYear?: string;
  existingIntake?: number;
  proposedIntake?: number;
  affiliatingBody?: string;
  submittedAt?: string;
  deadlineDate?: string;
  decisionNote?: string;
  decisionOutcome?: string;
  decisionAt?: string;
  currentStep: number;
  formData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  documents?: ApplicationDocument[];
}

// ─── Documents ──────────────────────────────────────────────

export type DocumentStatus = 'PENDING' | 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'REJECTED';

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  documentType: string;
  documentName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  status: DocumentStatus;
  isRequired: boolean;
  uploadedAt: string;
  ocrResults?: OcrResult[];
}

export interface OcrResult {
  id: string;
  documentId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  extractedText?: string;
  extractedFields?: Record<string, string>;
  confidence?: number;
  pageCount?: number;
  processingTime?: number;
  warnings: string[];
  errorMessage?: string;
}

// ─── Validation ─────────────────────────────────────────────

export type FindingResult = 'PASSED' | 'WARNING' | 'ERROR' | 'MANUAL_REVIEW';

export interface ValidationRun {
  id: string;
  applicationId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  triggeredBy: string;
  totalChecks: number;
  passed: number;
  warnings: number;
  errors: number;
  manualReview: number;
  completedAt?: string;
  createdAt: string;
  findings: ValidationFinding[];
}

export interface ValidationFinding {
  id: string;
  validationRunId: string;
  ruleId: string;
  rule?: ChecklistRule;
  result: FindingResult;
  message: string;
  evidence?: string;
  fieldPath?: string;
  correctiveAction?: string;
  blocksSubmission: boolean;
  requiresReview: boolean;
  aiExplanation?: string;
  isAiAssisted: boolean;
}

export interface ChecklistRule {
  id: string;
  categoryId: string;
  ruleCode: string;
  name: string;
  description: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  ruleType: string;
  isRequired: boolean;
  blocksSubmit: boolean;
  fieldPath?: string;
  correctiveAction?: string;
  ruleSource?: string;
  isActive: boolean;
}

// ─── Review ─────────────────────────────────────────────────

export interface ReviewComment {
  id: string;
  applicationId: string;
  officerId: string;
  officer?: User;
  comment: string;
  commentType: string;
  isInternal: boolean;
  createdAt: string;
}

export interface ReviewerAssignment {
  id: string;
  applicationId: string;
  officerId: string;
  officer?: User;
  assignedAt: string;
  isActive: boolean;
}

// ─── Notifications ──────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  applicationId?: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  relatedDeadline?: string;
  createdAt: string;
}

// ─── Workflow & Audit ───────────────────────────────────────

export interface WorkflowEvent {
  id: string;
  applicationId: string;
  fromStatus?: ApplicationStatus;
  toStatus: ApplicationStatus;
  actorId?: string;
  actorType: string;
  comment?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  applicationId?: string;
  application?: {
    id: string;
    applicationNo: string;
  };
  userId?: string;
  user?: User;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

// ─── Reports ────────────────────────────────────────────────

export interface DashboardStats {
  totalApplications: number;
  pendingValidation: number;
  correctionRequired: number;
  underReview: number;
  approachingDeadlines: number;
  overdueTasks: number;
  readyForDecision: number;
  decisionsRecorded: number;
}

export interface ReportData {
  applicationsByStatus: { status: string; count: number }[];
  applicationsByCategory: { category: string; count: number }[];
  workloadByOfficer: { officer: string; count: number }[];
  deadlineStatus: { type: string; count: number }[];
}

// ─── Document Checklist Config ──────────────────────────────

export interface DocumentChecklistItem {
  documentType: string;
  documentName: string;
  isRequired: boolean;
  description: string;
  acceptedFormats: string[];
  maxSizeMB: number;
}
