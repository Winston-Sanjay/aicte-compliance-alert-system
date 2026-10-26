import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth.routes';
import categoriesRoutes from './routes/categories.routes';
import applicationsRoutes from './routes/applications.routes';
import documentsRoutes from './routes/documents.routes';
import notificationsRoutes from './routes/notifications.routes';
import reportsRoutes from './routes/reports.routes';
import auditRoutes from './routes/audit.routes';
import { startDeadlineMonitor } from './jobs/deadlineMonitor';

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Health Check & Integration Status
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    system: 'AICTE Approval Workflow Automation System',
    problemStatement: 'SIH26262',
    demoMode: true,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api', documentsRoutes); // Handles /api/applications/:id/documents and /api/documents/:id
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit-logs', auditRoutes);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Internal Error]:', err);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected internal error occurred',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 AICTE Workflow Server active on http://localhost:${PORT}`);
  console.log(`📡 Environment: DEMO MODE (Smart India Hackathon 2026)`);
  console.log(`=======================================================`);

  // Start background monitoring jobs
  startDeadlineMonitor();
});
