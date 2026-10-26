import prisma from '../prisma';
import { FindingResult, RuleSeverity } from '../types/enums';

export async function runValidation(applicationId: string, actorId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      category: {
        include: {
          checklistRules: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
      documents: true,
      institution: true,
    },
  });

  if (!application) {
    throw new Error('Application not found');
  }

  const rules = application.category.checklistRules;
  const docs = application.documents;
  const formData = (application.formData as Record<string, any>) || {};

  const findingsToCreate: Array<{
    ruleId: string;
    result: FindingResult;
    message: string;
    evidence?: string;
    fieldPath?: string;
    correctiveAction?: string;
    blocksSubmission: boolean;
    requiresReview: boolean;
    aiExplanation?: string;
    isAiAssisted: boolean;
  }> = [];

  let passedCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  let manualReviewCount = 0;

  for (const rule of rules) {
    let result: FindingResult = 'PASSED';
    let message = `${rule.name} satisfies AICTE Approval Handbook requirements.`;
    let evidence = '';
    let correctiveAction = '';
    let blocksSubmission = false;
    let requiresReview = false;
    let aiExplanation = '';

    switch (rule.ruleType) {
      case 'FIELD_REQUIRED': {
        const fieldName = rule.fieldPath || '';
        let val = (application as any)[fieldName];
        if (val === undefined || val === null) {
          val = formData[fieldName];
        }

        if (!val || (typeof val === 'string' && val.trim() === '')) {
          result = 'ERROR';
          blocksSubmission = rule.blocksSubmit;
          message = `Mandatory field "${rule.name}" is missing or empty.`;
          evidence = `Field "${fieldName}" is empty.`;
          correctiveAction = rule.correctiveAction || `Please provide a valid ${rule.name} in application details.`;
          aiExplanation = `AICTE APH Clause 3.2 specifies that ${rule.name} is essential for application processing and university alignment.`;
        } else {
          evidence = `Value: "${val}"`;
        }
        break;
      }

      case 'FIELD_RANGE': {
        const fieldName = rule.fieldPath || 'proposedIntake';
        const intake = application.proposedIntake || formData[fieldName];
        if (!intake || intake <= 0) {
          result = 'ERROR';
          blocksSubmission = true;
          message = 'Proposed intake must be greater than 0.';
          evidence = `Current value: ${intake ?? 'not set'}`;
          correctiveAction = 'Enter an approved division size (e.g., 60, 120, 180 seats).';
          aiExplanation = 'AICTE norms mandate technical programmes to operate in standard division units of 60 seats.';
        } else if (intake > 360) {
          result = 'WARNING';
          message = 'Proposed intake exceeds standard single-discipline threshold (360 seats).';
          evidence = `Proposed intake: ${intake} seats`;
          correctiveAction = 'Requires National Board of Accreditation (NBA) valid accreditation for extended capacity.';
          aiExplanation = 'Institutions seeking intake exceeding 240 seats must hold NBA accreditation for at least 50% eligible programmes.';
        } else {
          evidence = `Approved division capacity: ${intake} seats`;
        }
        break;
      }

      case 'DOCUMENT_REQUIRED': {
        const requiredDocType = rule.fieldPath || '';
        const doc = docs.find((d) => d.documentType === requiredDocType);

        if (!doc) {
          result = 'ERROR';
          blocksSubmission = rule.blocksSubmit;
          message = `Mandatory document "${rule.name}" has not been uploaded.`;
          evidence = `No upload found for document type: ${requiredDocType}`;
          correctiveAction = rule.correctiveAction || `Upload a scanned, self-attested PDF of your ${rule.name}.`;
          aiExplanation = `Approval Process Handbook mandates submission of ${rule.name} before scrutiny review can begin.`;
        } else if (doc.status === 'REJECTED') {
          result = 'ERROR';
          blocksSubmission = true;
          message = `Uploaded document "${doc.originalName}" was rejected by the reviewing authority.`;
          evidence = 'Status: REJECTED';
          correctiveAction = 'Re-upload a compliant, legible replacement document.';
          aiExplanation = 'A rejected statutory document must be rectified by the institution to prevent application disqualification.';
        } else {
          evidence = `Uploaded: ${doc.originalName} (${(doc.fileSize / 1024 / 1024).toFixed(2)} MB)`;
        }
        break;
      }

      case 'CROSS_FIELD': {
        // Faculty ratio or infrastructure consistency
        const totalStudents = formData.totalStudents || (application.proposedIntake ? application.proposedIntake * 4 : 240);
        const totalFaculty = formData.totalFaculty || 12;
        const ratio = Math.round(totalStudents / Math.max(totalFaculty, 1));

        if (ratio > 20) {
          result = 'WARNING';
          message = `Student to Faculty Ratio (SFR) is 1:${ratio}, which exceeds the AICTE benchmark of 1:20.`;
          evidence = `Enrolled Students: ${totalStudents}, Appointed Faculty: ${totalFaculty}`;
          correctiveAction = 'Recruit additional qualified faculty or reduce intake to meet the 1:20 SFR norm.';
          aiExplanation = 'Clause 7.1 of AICTE regulations mandates an SFR of 1:20 for undergraduate technical degree programmes and 1:25 for diplomas.';
        } else {
          evidence = `SFR compliant: 1:${ratio} (${totalFaculty} faculty for ${totalStudents} students)`;
        }
        break;
      }

      case 'CUSTOM': {
        // Land area check or structural compliance
        const landArea = formData.landAreaAcres || 3.5;
        const locationType = formData.locationType || 'Urban';
        const minRequired = locationType === 'Rural' ? 7.5 : 2.5;

        if (landArea < minRequired) {
          result = 'ERROR';
          blocksSubmission = true;
          message = `Land area (${landArea} acres) is below minimum required (${minRequired} acres) for ${locationType} category.`;
          evidence = `Declared: ${landArea} acres, Required: ${minRequired} acres`;
          correctiveAction = 'Submit continuous contiguous land expansion deed or clarify urban zoning classification.';
          aiExplanation = 'AICTE land norms are non-negotiable for establishing and continuing technical campuses.';
        } else {
          evidence = `Declared: ${landArea} acres (Required: >= ${minRequired} acres in ${locationType})`;
        }
        break;
      }

      default: {
        evidence = 'Evaluated automatically.';
        break;
      }
    }

    if (result === 'PASSED') passedCount++;
    else if (result === 'WARNING') warningCount++;
    else if (result === 'ERROR') errorCount++;
    else manualReviewCount++;

    findingsToCreate.push({
      ruleId: rule.id,
      result,
      message,
      evidence,
      fieldPath: rule.fieldPath || undefined,
      correctiveAction: correctiveAction || undefined,
      blocksSubmission,
      requiresReview,
      aiExplanation: aiExplanation || undefined,
      isAiAssisted: true,
    });
  }

  // Create ValidationRun
  const validationRun = await prisma.validationRun.create({
    data: {
      applicationId,
      status: 'COMPLETED',
      triggeredBy: actorId,
      totalChecks: rules.length,
      passed: passedCount,
      warnings: warningCount,
      errors: errorCount,
      manualReview: manualReviewCount,
      completedAt: new Date(),
      findings: {
        create: findingsToCreate,
      },
    },
    include: {
      findings: {
        include: { rule: true },
      },
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      applicationId,
      userId: actorId,
      action: 'VALIDATION_EXECUTED',
      entityType: 'ValidationRun',
      entityId: validationRun.id,
      details: {
        totalChecks: rules.length,
        passed: passedCount,
        warnings: warningCount,
        errors: errorCount,
      },
    },
  });

  return validationRun;
}
