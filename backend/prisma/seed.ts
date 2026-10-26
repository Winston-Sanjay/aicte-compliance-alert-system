import process from 'node:process';
import { PrismaClient } from '@prisma/client';
import { UserRole, RuleSeverity, RuleType, ApplicationStatus } from '../src/types/enums';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[AICTE Seeder] Cleaning existing records...');
  // Clean in reverse dependency order
  await prisma.validationFinding.deleteMany();
  await prisma.validationRun.deleteMany();
  await prisma.ocrResult.deleteMany();
  await prisma.applicationDocument.deleteMany();
  await prisma.reviewComment.deleteMany();
  await prisma.reviewerAssignment.deleteMany();
  await prisma.workflowEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.checklistRule.deleteMany();
  await prisma.application.deleteMany();
  await prisma.applicationCategory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.institution.deleteMany();

  console.log('[AICTE Seeder] Creating Institution & Demo Users...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('demo123', salt);

  // 1. Institution
  const institution = await prisma.institution.create({
    data: {
      name: 'Delhi Institute of Technology & Engineering',
      institutionCode: 'DITE-10492',
      type: 'Engineering & Technology',
      state: 'Delhi',
      district: 'South West Delhi',
      address: 'Sector 16C, Dwarka, New Delhi 110078',
      contactPerson: 'Dr. Rajesh Kumar',
      contactEmail: 'institution@demo.aicte',
      contactPhone: '+91 98765 43210',
    },
  });

  // 2. Users
  const instUser = await prisma.user.create({
    data: {
      email: 'institution@demo.aicte',
      name: 'Dr. Rajesh Kumar (Principal)',
      passwordHash,
      role: UserRole.INSTITUTION,
      institutionId: institution.id,
    },
  });

  const officer1 = await prisma.user.create({
    data: {
      email: 'officer@demo.aicte',
      name: 'Ms. Priya Sharma (AICTE Scrutiny Officer)',
      passwordHash,
      role: UserRole.OFFICER,
    },
  });

  const officer2 = await prisma.user.create({
    data: {
      email: 'officer2@demo.aicte',
      name: 'Dr. Arvind Swaminathan (Regional Director)',
      passwordHash,
      role: UserRole.OFFICER,
    },
  });

  console.log('[AICTE Seeder] Creating Application Categories...');
  const catEoA = await prisma.applicationCategory.create({
    data: {
      code: 'EOA',
      name: 'Extension of Approval (EoA)',
      description: 'Annual extension of approval for running technical programmes in existing institutions.',
    },
  });

  const catNewProg = await prisma.applicationCategory.create({
    data: {
      code: 'NEW_PROG',
      name: 'New Programme / Course',
      description: 'Introduction of a new technical discipline, degree, or post-graduate specialization.',
    },
  });

  const catIntake = await prisma.applicationCategory.create({
    data: {
      code: 'INTAKE_INC',
      name: 'Increase in Intake / Additional Division',
      description: 'Expanding student intake capacity for accredited or high-demand courses.',
    },
  });

  console.log('[AICTE Seeder] Creating Checklist Rules (APH 2025-26)...');
  const rulesData = [
    // EoA Rules
    {
      categoryId: catEoA.id,
      ruleCode: 'APH-EOA-001',
      name: 'Programme & Discipline Identification',
      description: 'Programme title, level, and discipline must align with AICTE approved nomenclature.',
      severity: RuleSeverity.ERROR,
      ruleType: RuleType.FIELD_REQUIRED,
      isRequired: true,
      blocksSubmit: true,
      fieldPath: 'programmeName',
      correctiveAction: 'Select a valid technical programme name from the official APH nomenclature list.',
      ruleSource: 'AICTE APH 2025-26 Clause 3.1',
      sortOrder: 1,
    },
    {
      categoryId: catEoA.id,
      ruleCode: 'APH-EOA-002',
      name: 'Approved Student Intake Validation',
      description: 'Proposed intake must be within approved divisional multiples (60/120/180/240).',
      severity: RuleSeverity.ERROR,
      ruleType: RuleType.FIELD_RANGE,
      isRequired: true,
      blocksSubmit: true,
      fieldPath: 'proposedIntake',
      correctiveAction: 'Specify a valid divisional intake adhering to AICTE batch norms.',
      ruleSource: 'AICTE APH 2025-26 Clause 4.2',
      sortOrder: 2,
    },
    {
      categoryId: catEoA.id,
      ruleCode: 'APH-EOA-003',
      name: 'Fire Safety Certificate / NOC',
      description: 'Valid Fire Safety NOC issued by competent Municipal Fire Services department.',
      severity: RuleSeverity.ERROR,
      ruleType: RuleType.DOCUMENT_REQUIRED,
      isRequired: true,
      blocksSubmit: true,
      fieldPath: 'FIRE_NOC',
      correctiveAction: 'Upload renewed Fire Safety NOC stamped by the Chief Fire Officer.',
      ruleSource: 'Statutory Safety Mandate Section 5',
      sortOrder: 3,
    },
    {
      categoryId: catEoA.id,
      ruleCode: 'APH-EOA-004',
      name: 'Structural Stability Certificate',
      description: 'Certificate from Registered Structural Engineer certifying earthquake/load safety.',
      severity: RuleSeverity.ERROR,
      ruleType: RuleType.DOCUMENT_REQUIRED,
      isRequired: true,
      blocksSubmit: true,
      fieldPath: 'STRUCTURAL_STABILITY',
      correctiveAction: 'Submit structural stability audit report with engineer registration credentials.',
      ruleSource: 'AICTE Campus Norms Schedule II',
      sortOrder: 4,
    },
    {
      categoryId: catEoA.id,
      ruleCode: 'APH-EOA-005',
      name: 'Occupancy / Building Completion Certificate',
      description: 'Valid Occupancy certificate issued by local urban development authority.',
      severity: RuleSeverity.ERROR,
      ruleType: RuleType.DOCUMENT_REQUIRED,
      isRequired: true,
      blocksSubmit: true,
      fieldPath: 'OCCUPANCY_CERT',
      correctiveAction: 'Upload building completion certificate or lawful municipal occupancy permit.',
      ruleSource: 'AICTE APH Clause 5.4',
      sortOrder: 5,
    },
    {
      categoryId: catEoA.id,
      ruleCode: 'APH-EOA-006',
      name: 'Student-to-Faculty Ratio (1:20 Benchmark)',
      description: 'Faculty strength must satisfy mandatory 1:20 ratio with prescribed cadre distribution.',
      severity: RuleSeverity.WARNING,
      ruleType: RuleType.CROSS_FIELD,
      isRequired: true,
      blocksSubmit: false,
      fieldPath: 'totalFaculty',
      correctiveAction: 'Recruit qualified regular faculty with NET/GATE/Ph.D. to balance cadre ratio.',
      ruleSource: 'AICTE Regulations Gazette 2019/2024',
      sortOrder: 6,
    },
    {
      categoryId: catEoA.id,
      ruleCode: 'APH-EOA-007',
      name: 'Contiguous Campus Land Norms',
      description: 'Campus must possess continuous registered land (minimum 2.5 acres urban / 7.5 rural).',
      severity: RuleSeverity.ERROR,
      ruleType: RuleType.CUSTOM,
      isRequired: true,
      blocksSubmit: true,
      fieldPath: 'landAreaAcres',
      correctiveAction: 'Upload registered revenue demarcation showing contiguous campus perimeter.',
      ruleSource: 'AICTE Land Schedule IV',
      sortOrder: 7,
    },
  ];

  for (const r of rulesData) {
    await prisma.checklistRule.create({ data: r });
  }

  // Also duplicate for NEW_PROG & INTAKE_INC with different prefixes
  for (const r of rulesData) {
    await prisma.checklistRule.create({
      data: {
        ...r,
        categoryId: catNewProg.id,
        ruleCode: r.ruleCode.replace('EOA', 'NEW'),
      },
    });
    await prisma.checklistRule.create({
      data: {
        ...r,
        categoryId: catIntake.id,
        ruleCode: r.ruleCode.replace('EOA', 'INC'),
      },
    });
  }

  console.log('[AICTE Seeder] Creating 7 Detailed Applications with real workflows...');

  // Application 1: Under Review (B.Tech CSE)
  const app1Deadline = new Date();
  app1Deadline.setDate(app1Deadline.getDate() + 8);

  const app1 = await prisma.application.create({
    data: {
      applicationNo: 'AICTE/2025-26/10492/1001',
      categoryId: catEoA.id,
      institutionId: institution.id,
      status: ApplicationStatus.UNDER_REVIEW,
      programmeName: 'B.Tech in Computer Science & Engineering',
      discipline: 'Computer Science & Engineering',
      qualificationLevel: 'Undergraduate (UG)',
      academicYear: '2025-26',
      existingIntake: 120,
      proposedIntake: 120,
      affiliatingBody: 'Guru Gobind Singh Indraprastha University (GGSIPU), Delhi',
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      deadlineDate: app1Deadline,
      formData: {
        totalStudents: 480,
        totalFaculty: 26,
        landAreaAcres: 3.5,
        locationType: 'Urban',
      },
      currentStep: 4,
    },
  });

  // Assign officer1 to app1
  await prisma.reviewerAssignment.create({
    data: {
      applicationId: app1.id,
      officerId: officer1.id,
    },
  });

  // Add Comment on app1
  await prisma.reviewComment.create({
    data: {
      applicationId: app1.id,
      officerId: officer1.id,
      comment: 'Initial document scrutiny completed. Fire NOC and building plan validated against municipal records.',
      commentType: 'scrutiny',
    },
  });

  // Add Documents to app1
  const doc1 = await prisma.applicationDocument.create({
    data: {
      applicationId: app1.id,
      documentType: 'FIRE_NOC',
      documentName: 'Fire Safety Certificate 2024-2027',
      originalName: 'Delhi_Fire_NOC_DITE.pdf',
      storedFilename: 'seed-fire-noc.pdf',
      storagePath: 'uploads/seed-fire-noc.pdf',
      mimeType: 'application/pdf',
      fileSize: 2450000,
      status: 'PROCESSED',
      isRequired: true,
    },
  });

  await prisma.ocrResult.create({
    data: {
      documentId: doc1.id,
      status: 'COMPLETED',
      extractedText: 'DELHI FIRE SERVICE, HEADQUARTERS: CONNAUGHT PLACE, NEW DELHI\nNo. F.6/DFS/MS/2024/SZ/892\nDated: 12/10/2024\nFIRE SAFETY CERTIFICATE\nCertified that Delhi Institute of Technology & Engineering, Sector 16C Dwarka, New Delhi comprises Ground + 4 Upper Floors...',
      extractedFields: {
        docNo: 'F.6/DFS/MS/2024/SZ/892',
        issueDate: '2024-10-12',
        validity: '3 Years',
        authority: 'Delhi Fire Service',
      },
      confidence: 0.98,
      pageCount: 2,
      processingTime: 180,
      warnings: [],
    },
  });

  await prisma.applicationDocument.create({
    data: {
      applicationId: app1.id,
      documentType: 'STRUCTURAL_STABILITY',
      documentName: 'Structural Stability Audit Report',
      originalName: 'Structural_Audit_Report_2024.pdf',
      storedFilename: 'seed-structural-stability.pdf',
      storagePath: 'uploads/seed-structural-stability.pdf',
      mimeType: 'application/pdf',
      fileSize: 3100000,
      status: 'PROCESSED',
      isRequired: true,
    },
  });

  await prisma.applicationDocument.create({
    data: {
      applicationId: app1.id,
      documentType: 'OCCUPANCY_CERT',
      documentName: 'DDA Occupancy Permit',
      originalName: 'DDA_Occupancy_Certificate.pdf',
      storedFilename: 'seed-occupancy-cert.pdf',
      storagePath: 'uploads/seed-occupancy-cert.pdf',
      mimeType: 'application/pdf',
      fileSize: 1800000,
      status: 'PROCESSED',
      isRequired: true,
    },
  });

  // Workflow event for app1
  await prisma.workflowEvent.create({
    data: {
      applicationId: app1.id,
      fromStatus: ApplicationStatus.SUBMITTED,
      toStatus: ApplicationStatus.UNDER_REVIEW,
      actorId: officer1.id,
      actorType: 'OFFICER',
      comment: 'Application taken up for regional scrutiny committee review.',
    },
  });

  // Application 2: Correction Required (M.Tech AI & Data Science)
  const app2Deadline = new Date();
  app2Deadline.setDate(app2Deadline.getDate() + 2); // Approaching deadline!

  const app2 = await prisma.application.create({
    data: {
      applicationNo: 'AICTE/2025-26/10492/1002',
      categoryId: catNewProg.id,
      institutionId: institution.id,
      status: ApplicationStatus.CORRECTION_REQUIRED,
      programmeName: 'M.Tech in Artificial Intelligence & Data Science',
      discipline: 'Computer Science & Engineering',
      qualificationLevel: 'Postgraduate (PG)',
      academicYear: '2025-26',
      existingIntake: 0,
      proposedIntake: 30,
      affiliatingBody: 'Guru Gobind Singh Indraprastha University (GGSIPU), Delhi',
      submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      deadlineDate: app2Deadline,
      formData: {
        totalStudents: 30,
        totalFaculty: 2,
        landAreaAcres: 3.5,
        locationType: 'Urban',
      },
      currentStep: 3,
    },
  });

  await prisma.reviewComment.create({
    data: {
      applicationId: app2.id,
      officerId: officer1.id,
      comment: 'Mandatory Fire NOC uploaded has expired on 30-09-2024. Please upload latest renewal receipt or updated NOC certificate within 48 hours.',
      commentType: 'deficiency',
    },
  });

  await prisma.workflowEvent.create({
    data: {
      applicationId: app2.id,
      fromStatus: ApplicationStatus.SUBMITTED,
      toStatus: ApplicationStatus.CORRECTION_REQUIRED,
      actorId: officer1.id,
      actorType: 'OFFICER',
      comment: 'Deficiency noted: Expired Fire NOC requires renewal submission.',
    },
  });

  // Application 3: Ready for Decision (B.Tech ECE Intake Increase)
  const app3 = await prisma.application.create({
    data: {
      applicationNo: 'AICTE/2025-26/10492/1003',
      categoryId: catIntake.id,
      institutionId: institution.id,
      status: ApplicationStatus.READY_FOR_DECISION,
      programmeName: 'B.Tech in Electronics & Communication Engineering',
      discipline: 'Electronics & Communication',
      qualificationLevel: 'Undergraduate (UG)',
      academicYear: '2025-26',
      existingIntake: 60,
      proposedIntake: 120,
      affiliatingBody: 'Guru Gobind Singh Indraprastha University (GGSIPU), Delhi',
      submittedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      deadlineDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      formData: {
        totalStudents: 360,
        totalFaculty: 20,
        landAreaAcres: 3.5,
        locationType: 'Urban',
        nbaAccreditationValidTill: '2027-06-30',
      },
      currentStep: 5,
    },
  });

  await prisma.reviewComment.create({
    data: {
      applicationId: app3.id,
      officerId: officer1.id,
      comment: 'NBA accreditation verified (Valid till June 2027). Faculty and lab requirements satisfy Chapter IV norms. Recommended for approval.',
      commentType: 'recommendation',
    },
  });

  // Application 4: Decision Recorded (B.Tech Mechanical EoA) - APPROVED
  const app4 = await prisma.application.create({
    data: {
      applicationNo: 'AICTE/2025-26/10492/1004',
      categoryId: catEoA.id,
      institutionId: institution.id,
      status: ApplicationStatus.DECISION_RECORDED,
      programmeName: 'B.Tech in Mechanical Engineering',
      discipline: 'Mechanical Engineering',
      qualificationLevel: 'Undergraduate (UG)',
      academicYear: '2025-26',
      existingIntake: 60,
      proposedIntake: 60,
      affiliatingBody: 'Guru Gobind Singh Indraprastha University (GGSIPU), Delhi',
      submittedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      decisionOutcome: 'APPROVED',
      decisionNote: 'Extension of Approval granted for Academic Year 2025-26 with intake of 60 seats. All mandatory safety and infrastructure norms verified compliant.',
      decisionAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      formData: {
        totalStudents: 240,
        totalFaculty: 14,
        landAreaAcres: 3.5,
        locationType: 'Urban',
      },
      currentStep: 5,
    },
  });

  // Application 5: Draft (MBA Innovation)
  await prisma.application.create({
    data: {
      applicationNo: 'AICTE/2025-26/10492/1005',
      categoryId: catNewProg.id,
      institutionId: institution.id,
      status: ApplicationStatus.DRAFT,
      programmeName: 'MBA in Innovation, Entrepreneurship & Venture Development',
      discipline: 'Management',
      qualificationLevel: 'Postgraduate (PG)',
      academicYear: '2025-26',
      existingIntake: 0,
      proposedIntake: 60,
      affiliatingBody: 'Guru Gobind Singh Indraprastha University (GGSIPU), Delhi',
      formData: {
        locationType: 'Urban',
        landAreaAcres: 3.5,
      },
      currentStep: 2,
    },
  });

  // Application 6: Resubmitted (B.Tech IT)
  const app6 = await prisma.application.create({
    data: {
      applicationNo: 'AICTE/2025-26/10492/1006',
      categoryId: catEoA.id,
      institutionId: institution.id,
      status: ApplicationStatus.RESUBMITTED,
      programmeName: 'B.Tech in Information Technology',
      discipline: 'Information Technology',
      qualificationLevel: 'Undergraduate (UG)',
      academicYear: '2025-26',
      existingIntake: 120,
      proposedIntake: 120,
      affiliatingBody: 'Guru Gobind Singh Indraprastha University (GGSIPU), Delhi',
      submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      deadlineDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      formData: {
        totalStudents: 480,
        totalFaculty: 25,
        landAreaAcres: 3.5,
        locationType: 'Urban',
      },
      currentStep: 4,
    },
  });

  // Notifications
  await prisma.notification.create({
    data: {
      userId: instUser.id,
      applicationId: app2.id,
      type: 'CORRECTION_REQUIRED',
      title: 'Action Required: Renewed Fire Safety Certificate Needed',
      message: 'Scrutiny Officer requested renewal receipt or updated Fire Safety NOC for Application AICTE/2025-26/10492/1002.',
      relatedDeadline: app2Deadline,
    },
  });

  await prisma.notification.create({
    data: {
      userId: instUser.id,
      applicationId: app4.id,
      type: 'DECISION_RECORDED',
      title: 'Approval Granted: B.Tech Mechanical Engineering',
      message: 'Formal Approval Letter issued for AY 2025-26. Download official order from your dashboard.',
      isRead: true,
    },
  });

  await prisma.notification.create({
    data: {
      userId: officer1.id,
      applicationId: app6.id,
      type: 'APPLICATION_RESUBMITTED',
      title: 'Application Resubmitted: B.Tech IT',
      message: 'Delhi Institute of Technology & Engineering resubmitted application following deficiency rectification.',
    },
  });

  // Audit Logs
  await prisma.auditLog.create({
    data: {
      applicationId: app1.id,
      userId: instUser.id,
      action: 'APPLICATION_SUBMITTED',
      entityType: 'Application',
      entityId: app1.id,
      details: { applicationNo: app1.applicationNo },
    },
  });

  await prisma.auditLog.create({
    data: {
      applicationId: app1.id,
      userId: officer1.id,
      action: 'OFFICER_ASSIGNED',
      entityType: 'ReviewerAssignment',
      entityId: officer1.id,
      details: { officerName: officer1.name },
    },
  });

  console.log('[AICTE Seeder] Demo database successfully populated!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
