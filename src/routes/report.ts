/**
 * Report routes
 */

import express, { Request, Response } from 'express';
import { ReportModel, CreateReportData } from '../models/ReportModel';
import { authenticateToken, requireActiveUser } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const reportModel = new ReportModel();

// Configure multer for report evidence images
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'reports');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'report-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

/**
 * Create a new report (with evidence images)
 * POST /api/reports
 */
router.post('/', authenticateToken, requireActiveUser, upload.array('images', 5), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userID;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { reported_user_id, product_id, chat_id, message_id, report_type, category, reason } = req.body;

    console.log('[Report] Body:', { reported_user_id, product_id, report_type, category, reason: reason?.substring(0, 20) });
    console.log('[Report] Files:', req.files ? (req.files as any[]).length : 0);

    if (!report_type || !category || !reason) {
      return res.status(400).json({ error: 'Missing required fields: report_type, category, reason' });
    }

    // Require at least one evidence image
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'At least one evidence image is required' });
    }

    const validTypes = ['user', 'product', 'chat', 'message'];
    if (!validTypes.includes(report_type)) return res.status(400).json({ error: 'Invalid report_type' });

    const validCategories = ['inappropriate_content', 'spam', 'fraud', 'harassment', 'fake_product', 'other'];
    if (!validCategories.includes(category)) return res.status(400).json({ error: 'Invalid category' });

    if (report_type === 'user' && !reported_user_id) return res.status(400).json({ error: 'reported_user_id is required' });
    if (report_type === 'product' && !product_id) return res.status(400).json({ error: 'product_id is required' });
    if (report_type === 'chat' && !chat_id) return res.status(400).json({ error: 'chat_id is required' });
    if (report_type === 'message' && !message_id) return res.status(400).json({ error: 'message_id is required' });

    const hasReported = await reportModel.hasUserReported(userId, {
      reported_user_id: reported_user_id || undefined,
      product_id: product_id || undefined,
      chat_id: chat_id || undefined,
      message_id: message_id || undefined,
    });
    if (hasReported) return res.status(400).json({ error: 'You have already reported this item' });

    // Build image paths
    const imagePaths = files.map(f => `/uploads/reports/${f.filename}`);

    const reportData: CreateReportData = {
      reporter_id: userId,
      reported_user_id, product_id, chat_id, message_id, report_type, category, reason,
      evidence_images: JSON.stringify(imagePaths),
    };

    const report = await reportModel.create(reportData);
    res.status(201).json({ success: true, message: 'Report submitted successfully', report });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

/**
 * Get all reports (admin only)
 * GET /api/reports
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userID) return res.status(401).json({ error: 'Unauthorized' });
    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admin access required' });

    const { status, category, report_type, limit = '50', offset = '0' } = req.query;
    const reports = await reportModel.findAll({
      status: status as string, category: category as string, report_type: report_type as string,
      limit: parseInt(limit as string), offset: parseInt(offset as string)
    });
    res.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

/**
 * Get my reports — MUST be before /:reportId
 * GET /api/reports/my/submitted
 */
router.get('/my/submitted', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userID;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const reports = await reportModel.findByReporter(userId);
    res.json({ reports });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

/**
 * Get report statistics (admin only) — MUST be before /:reportId
 * GET /api/reports/stats/summary
 */
router.get('/stats/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userID) return res.status(401).json({ error: 'Unauthorized' });
    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const stats = await reportModel.getStatistics();
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching report statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * Get report by ID (admin only)
 * GET /api/reports/:reportId
 */
router.get('/:reportId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userID) return res.status(401).json({ error: 'Unauthorized' });
    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const reportId = parseInt(req.params.reportId);
    if (isNaN(reportId)) return res.status(400).json({ error: 'Invalid report ID' });
    const report = await reportModel.findById(reportId);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json({ report });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

/**
 * Update report status (admin only)
 * PATCH /api/reports/:reportId
 */
router.patch('/:reportId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userID) return res.status(401).json({ error: 'Unauthorized' });
    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const reportId = parseInt(req.params.reportId);
    if (isNaN(reportId)) return res.status(400).json({ error: 'Invalid report ID' });

    const { status, admin_notes } = req.body;
    if (status) {
      const validStatuses = ['pending', 'under_review', 'resolved', 'dismissed'];
      if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData: any = {};
    if (status) { updateData.status = status; updateData.reviewed_by = user.userID; updateData.reviewed_at = new Date().toISOString(); }
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

    const report = await reportModel.update(reportId, updateData);
    res.json({ message: 'Report updated successfully', report });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

/**
 * Delete report (admin only)
 * DELETE /api/reports/:reportId
 */
router.delete('/:reportId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userID) return res.status(401).json({ error: 'Unauthorized' });
    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const reportId = parseInt(req.params.reportId);
    if (isNaN(reportId)) return res.status(400).json({ error: 'Invalid report ID' });
    const deleted = await reportModel.delete(reportId);
    if (!deleted) return res.status(404).json({ error: 'Report not found' });
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export default router;
