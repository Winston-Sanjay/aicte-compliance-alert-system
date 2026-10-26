export const UserRole = {
  INSTITUTION: 'INSTITUTION',
  OFFICER: 'OFFICER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ApplicationStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  VALIDATION_IN_PROGRESS: 'VALIDATION_IN_PROGRESS',
  CORRECTION_REQUIRED: 'CORRECTION_REQUIRED',
  RESUBMITTED: 'RESUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  ADDITIONAL_INFO_REQUESTED: 'ADDITIONAL_INFO_REQUESTED',
  READY_FOR_DECISION: 'READY_FOR_DECISION',
  DECISION_RECORDED: 'DECISION_RECORDED',
  CLOSED: 'CLOSED',
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export const RuleSeverity = {
  ERROR: 'ERROR',
  WARNING: 'WARNING',
  INFO: 'INFO',
} as const;
export type RuleSeverity = (typeof RuleSeverity)[keyof typeof RuleSeverity];

export const RuleType = {
  FIELD_REQUIRED: 'FIELD_REQUIRED',
  FIELD_FORMAT: 'FIELD_FORMAT',
  FIELD_RANGE: 'FIELD_RANGE',
  DOCUMENT_REQUIRED: 'DOCUMENT_REQUIRED',
  DOCUMENT_FORMAT: 'DOCUMENT_FORMAT',
  CROSS_FIELD: 'CROSS_FIELD',
  DOCUMENT_CONTENT: 'DOCUMENT_CONTENT',
  CUSTOM: 'CUSTOM',
} as const;
export type RuleType = (typeof RuleType)[keyof typeof RuleType];

export const FindingResult = {
  PASSED: 'PASSED',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  MANUAL_REVIEW: 'MANUAL_REVIEW',
} as const;
export type FindingResult = (typeof FindingResult)[keyof typeof FindingResult];
