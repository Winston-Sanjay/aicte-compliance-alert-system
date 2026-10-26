import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files (.jpg, .jpeg, .png) are permitted.'));
    }
  },
});

// Upload Document to Application
router.post(
  '/applications/:applicationId/documents',
  authenticateToken,
  upload.single('file'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const { documentType, documentName } = req.body;
      const file = req.file;

      if (!file) {
        res.status(400).json({ message: 'No document file uploaded' });
        return;
      }

      // Check if document of this type already exists for application, if so remove/replace
      const existing = await prisma.applicationDocument.findUnique({
        where: {
          applicationId_documentType: {
            applicationId,
            documentType: documentType || 'SUPPORTING_DOC',
          },
        },
      });

      if (existing) {
        await prisma.ocrResult.deleteMany({ where: { documentId: existing.id } });
        await prisma.applicationDocument.delete({ where: { id: existing.id } });
      }

      const appDoc = await prisma.applicationDocument.create({
        data: {
          applicationId,
          documentType: documentType || 'SUPPORTING_DOC',
          documentName: documentName || file.originalname,
          originalName: file.originalname,
          storedFilename: file.filename,
          storagePath: path.resolve(uploadDir, file.filename),
          mimeType: file.mimetype,
          fileSize: file.size,
          status: 'UPLOADED',
          isRequired: true,
        },
      });

      // Generate simulated OCR extraction
      await prisma.ocrResult.create({
        data: {
          documentId: appDoc.id,
          status: 'COMPLETED',
          extractedText: `[AICTE OCR EXTRACT]\nDocument Type: ${documentType}\nRef No: AICTE/VERIF/${Math.floor(100000 + Math.random() * 900000)}\nDate of Issue: 2024-11-15\nIssuing Authority: Directorate of Fire & Emergency Services / Competent Municipal Body.\nStatus: VERIFIED VALID.`,
          extractedFields: {
            refNo: `NOC-${Math.floor(1000 + Math.random() * 9000)}`,
            issueDate: '2024-11-15',
            validTill: '2027-11-14',
            authority: 'Municipal Directorate',
          },
          confidence: 0.94,
          pageCount: 1,
          processingTime: 124,
          warnings: [],
        },
      });

      await prisma.auditLog.create({
        data: {
          applicationId,
          userId: req.user?.id,
          action: 'DOCUMENT_UPLOADED',
          entityType: 'ApplicationDocument',
          entityId: appDoc.id,
          details: { originalName: file.originalname, size: file.size },
        },
      });

      // Clear from requestedDocs if it was requested and log workflow event
      const parentApp = await prisma.application.findUnique({ where: { id: applicationId } });
      if (parentApp) {
        const formData = (parentApp.formData as Record<string, any>) || {};
        if (Array.isArray(formData.requestedDocs)) {
          formData.requestedDocs = formData.requestedDocs.filter((r: any) => r.type !== documentType);
          await prisma.application.update({
            where: { id: applicationId },
            data: { formData },
          });
        }

        await prisma.workflowEvent.create({
          data: {
            applicationId,
            toStatus: parentApp.status,
            actorId: req.user?.id,
            actorType: req.user?.role || 'INSTITUTION',
            comment: `Document uploaded: "${documentName || file.originalname}"`,
          },
        });
      }

      const updated = await prisma.applicationDocument.findUnique({
        where: { id: appDoc.id },
        include: { ocrResults: true },
      });

      res.status(201).json({ document: updated });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: err.message || 'Document upload failed' });
    }
  }
);

// List Documents for Application
router.get(
  '/applications/:applicationId/documents',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const documents = await prisma.applicationDocument.findMany({
        where: { applicationId },
        include: { ocrResults: true },
        orderBy: { uploadedAt: 'desc' },
      });
      res.json({ documents });
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch documents' });
    }
  }
);

// Download Document
router.get('/documents/:id/download', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const document = await prisma.applicationDocument.findUnique({ where: { id } });

    if (!document) {
      res.status(404).json({ message: 'Document record not found' });
      return;
    }

    if (document.storagePath && fs.existsSync(document.storagePath)) {
      res.download(document.storagePath, document.originalName);
      return;
    }

    // Provide fallback demo stream
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}.txt"`);
    res.send(`AICTE DEMO ARCHIVE\nDocument: ${document.documentName}\nOriginal Name: ${document.originalName}\nUploaded: ${document.uploadedAt}\nStatus: ${document.status}`);
  } catch (err) {
    res.status(500).json({ message: 'Failed to download document' });
  }
});

// Delete Document
router.delete('/documents/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const document = await prisma.applicationDocument.findUnique({ where: { id } });

    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    if (document.storagePath && fs.existsSync(document.storagePath)) {
      fs.unlinkSync(document.storagePath);
    }

    await prisma.ocrResult.deleteMany({ where: { documentId: id } });
    await prisma.applicationDocument.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        applicationId: document.applicationId,
        userId: req.user?.id,
        action: 'DOCUMENT_DELETED',
        entityType: 'ApplicationDocument',
        entityId: id,
      },
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete document' });
  }
});

export default router;
