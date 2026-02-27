/**
 * Report routes
 * Implements Requirements 10.3, 10.4, 10.5
 */

import express, { Request, Response } from 'express';
import { ReportModel, CreateReportData } from '../models/ReportModel';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const reportModel = new ReportModel();

/**
 * Create a new report
 * POST /api/reports
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      reported_user_id,
      product_id,
      chat_id,
      message_id,
      report_type,
      category,
      reason
    } = req.body;

    // Validate required fields
    if (!report_type || !category || !reason) {
      return res.status(400).json({
        error: 'Missing required fields: report_type, category, reason'
      });
    }

    // Validate report_type
    const validTypes = ['user', 'product', 'chat', 'message'];
    if (!validTypes.includes(report_type)) {
      return res.status(400).json({
        error: 'Invalid report_type. Must be one of: user, product, chat, message'
      });
    }

    // Validate category
    const validCategories = [
      'inappropriate_content',
      'spam',
      'fraud',
      'harassment',
      'fake_product',
      'other'
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: 'Invalid category'
      });
    }

    // Validate that appropriate ID is provided based on report_type
    if (report_type === 'user' && !reported_user_id) {
      return res.status(400).json({
        error: 'reported_user_id is required for user reports'
      });
    }
    if (report_type === 'product' && !product_id) {
      return res.status(400).json({
        error: 'product_id is required for product reports'
      });
    }
    if (report_type === 'chat' && !chat_id) {
      return res.status(400).json({
        error: 'chat_id is required for chat reports'
      });
    }
    if (report_type === 'message' && !message_id) {
      return res.status(400).json({
        error: 'message_id is required for message reports'
      });
    }

    // Check if user has already reported this item
    const hasReported = await reportModel.hasUserReported(userId, {
      reported_user_id,
      product_id,
      chat_id,
      message_id
    });

    if (hasReported) {
      return res.status(400).json({
        error: 'You have already reported this item'
      });
    }

    // Create report
    const reportData: CreateReportData = {
      reporter_id: userId,
      reported_user_id,
      product_id,
      chat_id,
      message_id,
      report_type,
      category,
      reason
    };

    const report = await reportModel.create(reportData);

    res.status(201).json({
      message: 'Report submitted successfully',
      report
    });
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
    if (!user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const {
      status,
      category,
      report_type,
      limit = '50',
      offset = '0'
    } = req.query;

    const reports = await reportModel.findAll({
      status: status as string,
      category: category as string,
      report_type: report_type as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

/**
 * Get report by ID (admin only)
 * GET /api/reports/:reportId
 */
router.get('/:reportId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const reportId = parseInt(req.params.reportId);
    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const report = await reportModel.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

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
    if (!user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const reportId = parseInt(req.params.reportId);
    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const { status, admin_notes } = req.body;

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending', 'under_review', 'resolved', 'dismissed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      updateData.reviewed_by = user.userId;
      updateData.reviewed_at = new Date().toISOString();
    }
    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes;
    }

    const report = await reportModel.update(reportId, updateData);

    res.json({
      message: 'Report updated successfully',
      report
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

/**
 * Get my reports (reports I submitted)
 * GET /api/reports/my/submitted
 */
router.get('/my/submitted', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const reports = await reportModel.findByReporter(userId);

    res.json({ reports });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

/**
 * Get report statistics (admin only)
 * GET /api/reports/stats/summary
 */
router.get('/stats/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const stats = await reportModel.getStatistics();

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching report statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * Delete report (admin only)
 * DELETE /api/reports/:reportId
 */
router.delete('/:reportId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const reportId = parseInt(req.params.reportId);
    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const deleted = await reportModel.delete(reportId);
    if (!deleted) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export default router;
