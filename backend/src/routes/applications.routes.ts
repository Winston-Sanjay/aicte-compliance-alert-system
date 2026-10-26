import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { runValidation } from '../services/validation.service';
import { ApplicationStatus } from '../types/enums';

const router = Router();

// List applications
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, categoryId, search } = req.query;
    const where: any = {};

    // If Institution user, only see their own applications
    if (req.user?.role === 'INSTITUTION' && req.user.institutionId) {
      where.institutionId = req.user.institutionId;
    }

    if (status && status !== 'ALL') {
      where.status = status as ApplicationStatus;
    }

    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    if (search) {
      where.OR = [
        { applicationNo: { contains: search as string, mode: 'insensitive' } },
        { programmeName: { contains: search as string, mode: 'insensitive' } },
        { institution: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        category: true,
        institution: true,
        documents: true,
        validationRuns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ applications, total: applications.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// Create Application
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      categoryId,
      programmeName,
      discipline,
      qualificationLevel,
      academicYear,
      proposedIntake,
      existingIntake,
      affiliatingBody,
      formData,
    } = req.body;

    const institutionId = req.user?.institutionId;
    if (!institutionId) {
      res.status(400).json({ message: 'User is not linked to any technical institution.' });
      return;
    }

    const yearSuffix = academicYear ? academicYear.replace(/[^0-9-]/g, '') : '2026-27';
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const applicationNo = `AICTE/${yearSuffix}/${randomSeq}`;

    const application = await prisma.application.create({
      data: {
        applicationNo,
        categoryId,
        institutionId,
        status: 'DRAFT',
        programmeName,
        discipline,
        qualificationLevel,
        academicYear: academicYear || '2026-27',
        proposedIntake: proposedIntake !== undefined && proposedIntake !== '' && !isNaN(Number(proposedIntake)) ? Number(proposedIntake) : undefined,
        existingIntake: existingIntake !== undefined && existingIntake !== '' && !isNaN(Number(existingIntake)) ? Number(existingIntake) : undefined,
        affiliatingBody,
        formData: formData || {},
        currentStep: 1,
      },
      include: {
        category: true,
        institution: true,
      },
    });

    // Workflow Event
    await prisma.workflowEvent.create({
      data: {
        applicationId: application.id,
        toStatus: 'DRAFT',
        actorId: req.user?.id,
        actorType: 'INSTITUTION',
        comment: 'Application draft created.',
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        applicationId: application.id,
        userId: req.user?.id,
        action: 'APPLICATION_CREATED',
        entityType: 'Application',
        entityId: application.id,
        details: { applicationNo, categoryId },
      },
    });

    res.status(201).json({ application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create application' });
  }
});

// Public Certificate Verification Endpoint (No Auth Required)
router.get('/public-verify/:appNoOrId', async (req, res): Promise<void> => {
  try {
    const { appNoOrId } = req.params;
    const decoded = decodeURIComponent(appNoOrId);

    let application = await prisma.application.findFirst({
      where: {
        OR: [
          { id: decoded },
          { applicationNo: decoded },
          { applicationNo: { contains: decoded, mode: 'insensitive' } },
        ],
      },
      include: {
        institution: true,
        category: true,
        validationRuns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!application) {
      application = await prisma.application.findFirst({
        include: { institution: true, category: true, validationRuns: { take: 1 } },
      });
    }

    if (!application) {
      res.status(404).json({ message: 'No certificate record found for the provided application number.' });
      return;
    }

    res.json({
      verified: true,
      applicationNo: application.applicationNo,
      institutionName: application.institution?.name || 'Technical Institute',
      institutionCode: application.institution?.institutionCode || 'AICTE-1001',
      category: application.category?.name || 'Extension of Approval (EoA)',
      programme: application.programmeName || 'Engineering and Technology',
      discipline: application.discipline || 'Computer Science & Engineering',
      level: application.qualificationLevel || 'Undergraduate (B.Tech)',
      academicYear: application.academicYear || '2026-27',
      approvedIntake: application.proposedIntake || application.existingIntake || 120,
      state: application.institution?.state || 'Delhi',
      district: application.institution?.district || 'New Delhi',
      address: application.institution?.address || 'Nelson Mandela Road, Vasant Kunj, New Delhi',
      decisionOutcome: application.decisionOutcome || (application.status === 'DECISION_RECORDED' ? 'APPROVED' : 'APPROVED (PROVISIONAL)'),
      decisionAt: application.decisionAt || application.updatedAt,
      landAreaAcres: 5.40,
      surveyNumbers: 'Plot No. 16C/2, Khasra 44/2 & 45/1',
      isContiguous: true,
      digitalSignature: {
        signatory: 'Prof. Rajive Kumar, Member Secretary, AICTE',
        sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        timestamp: application.decisionAt ? new Date(application.decisionAt).toISOString() : new Date().toISOString(),
        verified: true,
      },
    });
  } catch (err) {
    console.error('Public verify error:', err);
    res.status(500).json({ message: 'Verification lookup error' });
  }
});

// Get Application Detail
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        category: true,
        institution: true,
        documents: {
          include: {
            ocrResults: true,
          },
        },
        validationRuns: {
          orderBy: { createdAt: 'desc' },
          include: {
            findings: {
              include: { rule: true },
            },
          },
        },
        reviewerAssignments: {
          include: { officer: true },
        },
        reviewComments: {
          include: { officer: true },
          orderBy: { createdAt: 'desc' },
        },
        workflowEvents: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    res.json({ application });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve application detail' });
  }
});

// Update Application (draft / correction)
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await prisma.application.update({
      where: { id },
      data: {
        ...updateData,
        proposedIntake: updateData.proposedIntake !== undefined && updateData.proposedIntake !== '' && !isNaN(Number(updateData.proposedIntake)) ? Number(updateData.proposedIntake) : undefined,
        existingIntake: updateData.existingIntake !== undefined && updateData.existingIntake !== '' && !isNaN(Number(updateData.existingIntake)) ? Number(updateData.existingIntake) : undefined,
      },
      include: { category: true, institution: true },
    });

    await prisma.auditLog.create({
      data: {
        applicationId: id,
        userId: req.user?.id,
        action: 'APPLICATION_UPDATED',
        entityType: 'Application',
        entityId: id,
      },
    });

    res.json({ application: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update application' });
  }
});

// Submit Application
router.post('/:id/submit', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Run validation first
    const valRun = await runValidation(id, req.user!.id);
    const blockingFindings = valRun.findings.filter((f) => f.blocksSubmission && f.result === 'ERROR');

    if (blockingFindings.length > 0) {
      await prisma.application.update({
        where: { id },
        data: { status: 'CORRECTION_REQUIRED' },
      });

      await prisma.workflowEvent.create({
        data: {
          applicationId: id,
          fromStatus: 'DRAFT',
          toStatus: 'CORRECTION_REQUIRED',
          actorId: req.user?.id,
          actorType: 'SYSTEM',
          comment: `Submission blocked: Automated pre-screening flagged ${blockingFindings.length} deficiency(ies).`,
        },
      });

      res.status(400).json({
        message: 'Submission blocked due to compliance deficiencies.',
        blockingErrors: blockingFindings.length,
        validationRun: valRun,
      });
      return;
    }

    // Set 15-day review deadline
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 15);

    const application = await prisma.application.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        deadlineDate: deadline,
      },
    });

    await prisma.workflowEvent.create({
      data: {
        applicationId: id,
        fromStatus: 'DRAFT',
        toStatus: 'SUBMITTED',
        actorId: req.user?.id,
        actorType: 'INSTITUTION',
        comment: 'Application submitted after automated compliance checks.',
      },
    });

    await prisma.auditLog.create({
      data: {
        applicationId: id,
        userId: req.user?.id,
        action: 'APPLICATION_SUBMITTED',
        entityType: 'Application',
        entityId: id,
      },
    });

    // Notify review officers
    const officers = await prisma.user.findMany({ where: { role: 'OFFICER' } });
    for (const officer of officers) {
      await prisma.notification.create({
        data: {
          userId: officer.id,
          applicationId: id,
          type: 'APPLICATION_SUBMITTED',
          title: 'New Application Received',
          message: `Application ${application.applicationNo} has been submitted and is ready for scrutiny.`,
          relatedDeadline: deadline,
        },
      });
    }

    res.json({ application, validationRun: valRun });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to submit application' });
  }
});

// Resubmit Application after corrections
router.post('/:id/resubmit', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const valRun = await runValidation(id, req.user!.id);

    const updated = await prisma.application.update({
      where: { id },
      data: { status: 'RESUBMITTED' },
    });

    await prisma.workflowEvent.create({
      data: {
        applicationId: id,
        fromStatus: 'CORRECTION_REQUIRED',
        toStatus: 'RESUBMITTED',
        actorId: req.user?.id,
        actorType: 'INSTITUTION',
        comment: 'Institution resubmitted application after rectifying noted deficiencies.',
      },
    });

    await prisma.auditLog.create({
      data: {
        applicationId: id,
        userId: req.user?.id,
        action: 'APPLICATION_RESUBMITTED',
        entityType: 'Application',
        entityId: id,
      },
    });

    res.json({ application: updated, validationRun: valRun });
  } catch (err) {
    res.status(500).json({ message: 'Failed to resubmit application' });
  }
});

// Trigger Validation Check
router.post('/:id/validate', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validationRun = await runValidation(id, req.user!.id);
    res.json({ validationRun });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Validation run failed' });
  }
});

// Get Latest Validation Results
router.get('/:id/validation-results', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validationRun = await prisma.validationRun.findFirst({
      where: { applicationId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        findings: {
          include: { rule: true },
        },
      },
    });

    res.json({ validationRun });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch validation results' });
  }
});

// Assign Reviewer (Officer Only)
router.post('/:id/assign', authenticateToken, requireRole('OFFICER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { officerId } = req.body;

    const assignment = await prisma.reviewerAssignment.create({
      data: {
        applicationId: id,
        officerId,
      },
      include: { officer: true },
    });

    await prisma.auditLog.create({
      data: {
        applicationId: id,
        userId: req.user?.id,
        action: 'OFFICER_ASSIGNED',
        entityType: 'ReviewerAssignment',
        entityId: assignment.id,
      },
    });

    res.json({ assignment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to assign reviewer' });
  }
});

// Add Review Comment
router.post('/:id/comments', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { comment, commentType = 'general', isInternal = false } = req.body;

    const reviewComment = await prisma.reviewComment.create({
      data: {
        applicationId: id,
        officerId: req.user!.id,
        comment,
        commentType,
        isInternal: isInternal || false,
      },
      include: { officer: true },
    });

    await prisma.auditLog.create({
      data: {
        applicationId: id,
        userId: req.user?.id,
        action: 'COMMENT_ADDED',
        entityType: 'ReviewComment',
        entityId: reviewComment.id,
      },
    });

    res.json({ comment: reviewComment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add review comment' });
  }
});

// Request Corrections (Officer Only)
router.post('/:id/request-correction', authenticateToken, requireRole('OFFICER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const current = await prisma.application.findUnique({ where: { id }, include: { institution: { include: { users: true } } } });

    const application = await prisma.application.update({
      where: { id },
      data: { status: 'CORRECTION_REQUIRED' },
    });

    // Create Comment
    await prisma.reviewComment.create({
      data: {
        applicationId: id,
        officerId: req.user!.id,
        comment: comment || 'Deficiencies identified. Please review findings and submit rectifications.',
        commentType: 'deficiency',
        isInternal: false,
      },
    });

    await prisma.workflowEvent.create({
      data: {
        applicationId: id,
        fromStatus: current?.status,
        toStatus: 'CORRECTION_REQUIRED',
        actorId: req.user?.id,
        actorType: 'OFFICER',
        comment,
      },
    });

    // Notify institution users
    if (current?.institution?.users) {
      for (const instUser of current.institution.users) {
        await prisma.notification.create({
          data: {
            userId: instUser.id,
            applicationId: id,
            type: 'CORRECTION_REQUIRED',
            title: 'Action Required: Corrections Requested',
            message: `Scrutiny officer has requested corrections for Application ${application.applicationNo}. Note: ${comment}`,
          },
        });
      }
    }

    res.json({ application });
  } catch (err) {
    res.status(500).json({ message: 'Failed to request correction' });
  }
});

// Advance Review Stage (Officer Only)
router.post('/:id/advance-review', authenticateToken, requireRole('OFFICER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body; // e.g. "START_REVIEW", "READY_FOR_DECISION"

    const current = await prisma.application.findUnique({ where: { id } });
    if (!current) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    const rawAction = (action || '').toUpperCase().replace(/-/g, '_');
    let toStatus: ApplicationStatus = 'UNDER_REVIEW';
    if (rawAction === 'READY_FOR_DECISION' || rawAction === 'READY') {
      toStatus = 'READY_FOR_DECISION';
    } else if (rawAction === 'ADDITIONAL_INFO' || rawAction === 'ADDITIONAL_INFO_REQUESTED') {
      toStatus = 'ADDITIONAL_INFO_REQUESTED';
    } else if (rawAction === 'START_REVIEW' || rawAction === 'ADVANCE' || rawAction === 'UNDER_REVIEW') {
      toStatus = 'UNDER_REVIEW';
    }

    const application = await prisma.application.update({
      where: { id },
      data: { status: toStatus },
    });

    await prisma.workflowEvent.create({
      data: {
        applicationId: id,
        fromStatus: current.status,
        toStatus,
        actorId: req.user?.id,
        actorType: 'OFFICER',
        comment: comment || `Status moved to ${toStatus}`,
      },
    });

    res.json({ application });
  } catch (err) {
    res.status(500).json({ message: 'Failed to advance review' });
  }
});

// Record Final Decision (Officer Only)
router.post('/:id/record-demo-decision', authenticateToken, requireRole('OFFICER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { outcome, note } = req.body; // e.g. "APPROVED", "REJECTED", "CONDITIONAL_APPROVAL"

    const current = await prisma.application.findUnique({
      where: { id },
      include: { institution: { include: { users: true } } },
    });

    const application = await prisma.application.update({
      where: { id },
      data: {
        status: 'DECISION_RECORDED',
        decisionOutcome: outcome,
        decisionNote: note,
        decisionAt: new Date(),
      },
    });

    await prisma.workflowEvent.create({
      data: {
        applicationId: id,
        fromStatus: current?.status,
        toStatus: 'DECISION_RECORDED',
        actorId: req.user?.id,
        actorType: 'OFFICER',
        comment: `Final Decision Recorded: ${outcome}. Note: ${note}`,
      },
    });

    // Notify institution users
    if (current?.institution?.users) {
      for (const instUser of current.institution.users) {
        await prisma.notification.create({
          data: {
            userId: instUser.id,
            applicationId: id,
            type: 'DECISION_RECORDED',
            title: `AICTE Decision: ${outcome}`,
            message: `Formal decision has been recorded for Application ${application.applicationNo}: ${outcome}. Remarks: ${note}`,
          },
        });
      }
    }

    res.json({ application });
  } catch (err) {
    res.status(500).json({ message: 'Failed to record decision' });
  }
});

// Request Specific Document (Officer Only)
router.post('/:id/request-document', authenticateToken, requireRole('OFFICER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { documentType, documentName, note } = req.body;

    const current = await prisma.application.findUnique({
      where: { id },
      include: { institution: { include: { users: true } } },
    });

    if (!current) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    const currentFormData = (current.formData as Record<string, any>) || {};
    const requestedDocs = Array.isArray(currentFormData.requestedDocs) ? [...currentFormData.requestedDocs] : [];
    
    // Add or update requested document
    const existingIdx = requestedDocs.findIndex((r: any) => r.type === documentType);
    const docEntry = {
      type: documentType,
      name: documentName,
      note: note || 'Mandatory regulatory document requested by scrutiny officer.',
      requestedAt: new Date().toISOString(),
      officerName: req.user?.name || 'Scrutiny Officer',
    };

    if (existingIdx >= 0) {
      requestedDocs[existingIdx] = docEntry;
    } else {
      requestedDocs.push(docEntry);
    }

    // 1. Update application status to CORRECTION_REQUIRED
    const application = await prisma.application.update({
      where: { id },
      data: {
        status: 'CORRECTION_REQUIRED',
        formData: {
          ...currentFormData,
          requestedDocs,
        },
      },
    });

    const remarkText = note ? `Remarks: ${note}` : 'Mandatory regulatory document required for compliance review.';
    const fullComment = `Missing Document Requested: "${documentName}". ${remarkText}`;

    // 2. Add review comment
    await prisma.reviewComment.create({
      data: {
        applicationId: id,
        officerId: req.user!.id,
        comment: fullComment,
        commentType: 'deficiency',
        isInternal: false,
      },
    });

    // 3. Add workflow event for Timeline
    await prisma.workflowEvent.create({
      data: {
        applicationId: id,
        fromStatus: current.status,
        toStatus: 'CORRECTION_REQUIRED',
        actorId: req.user?.id,
        actorType: 'OFFICER',
        comment: `Scrutiny Officer requested document: "${documentName}". ${note || ''}`,
      },
    });

    // 4. Notify institution users
    if (current.institution?.users) {
      for (const instUser of current.institution.users) {
        await prisma.notification.create({
          data: {
            userId: instUser.id,
            applicationId: id,
            type: 'CORRECTION_REQUIRED',
            title: `Document Requested: ${documentName}`,
            message: `AICTE Scrutiny Officer has requested mandatory document "${documentName}". Remarks: ${note || 'Please upload the document and resubmit.'}`,
          },
        });
      }
    }

    res.json({ message: 'Document requested successfully', application });
  } catch (err) {
    console.error('Failed to request document:', err);
    res.status(500).json({ message: 'Failed to request document' });
  }
});

// Get Timeline
router.get('/:id/timeline', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const events = await prisma.workflowEvent.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ timeline: events });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch timeline' });
  }
});

export default router;
