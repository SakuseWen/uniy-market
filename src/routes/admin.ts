import express, { Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AdminService } from '../services/AdminService';
import { UserModel } from '../models/UserModel';
import { ProductModel } from '../models/ProductModel';
import { ReportModel } from '../models/ReportModel';
import { AuditLogModel } from '../models/AuditLogModel';

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/admin/statistics
 * Get system statistics
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const adminService = new AdminService();
    const statistics = await adminService.getSystemStatistics();

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATISTICS_ERROR',
        message: 'Failed to retrieve system statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users with filters
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { status, isAdmin, search, limit = '50', offset = '0' } = req.query;

    const userModel = new UserModel();
    let users = await userModel.findAll();

    // Apply filters
    if (status) {
      users = users.filter((u) => u.status === status);
    }

    if (isAdmin !== undefined) {
      const adminFilter = isAdmin === 'true';
      users = users.filter((u) => u.isAdmin === adminFilter);
    }

    if (search) {
      const searchLower = (search as string).toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const total = users.length;
    const paginatedUsers = users.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      data: {
        users: paginatedUsers,
        total,
        limit: limitNum,
        offset: offsetNum,
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_USERS_ERROR',
        message: 'Failed to retrieve users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/admin/users/:userId
 * Get user details
 */
router.get('/users/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const userModel = new UserModel();
    const user = await userModel.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_USER_ERROR',
        message: 'Failed to retrieve user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * POST /api/admin/users/:userId/suspend
 * Suspend a user
 */
router.post('/users/:userId/suspend', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user.userID;

    const adminService = new AdminService();
    await adminService.suspendUser(adminId, userId, reason);

    res.json({
      success: true,
      message: 'User suspended successfully',
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'SUSPEND_USER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to suspend user',
      },
    });
  }
});

/**
 * POST /api/admin/users/:userId/activate
 * Activate a suspended user
 */
router.post('/users/:userId/activate', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user.userID;

    const adminService = new AdminService();
    await adminService.activateUser(adminId, userId, reason);

    res.json({
      success: true,
      message: 'User activated successfully',
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'ACTIVATE_USER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to activate user',
      },
    });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete a user
 */
router.delete('/users/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user.userID;

    const adminService = new AdminService();
    await adminService.deleteUser(adminId, userId, reason);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'DELETE_USER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete user',
      },
    });
  }
});

/**
 * POST /api/admin/users/:userId/make-admin
 * Grant admin privileges
 */
router.post('/users/:userId/make-admin', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user.userID;

    const adminService = new AdminService();
    await adminService.makeAdmin(adminId, userId, reason);

    res.json({
      success: true,
      message: 'Admin privileges granted successfully',
    });
  } catch (error) {
    console.error('Make admin error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'MAKE_ADMIN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to grant admin privileges',
      },
    });
  }
});

/**
 * POST /api/admin/users/:userId/remove-admin
 * Revoke admin privileges
 */
router.post('/users/:userId/remove-admin', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user.userID;

    const adminService = new AdminService();
    await adminService.removeAdmin(adminId, userId, reason);

    res.json({
      success: true,
      message: 'Admin privileges revoked successfully',
    });
  } catch (error) {
    console.error('Remove admin error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'REMOVE_ADMIN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to revoke admin privileges',
      },
    });
  }
});

/**
 * GET /api/admin/products
 * Get all products with filters
 */
router.get('/products', async (req: Request, res: Response) => {
  try {
    const { status, search, limit = '50', offset = '0' } = req.query;

    const productModel = new ProductModel();
    let products = await productModel.findAll();

    // Apply filters
    if (status) {
      products = products.filter((p) => p.status === status);
    }

    if (search) {
      const searchLower = (search as string).toLowerCase();
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          (p.description && p.description.toLowerCase().includes(searchLower))
      );
    }

    // Pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const total = products.length;
    const paginatedProducts = products.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      data: {
        products: paginatedProducts,
        total,
        limit: limitNum,
        offset: offsetNum,
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PRODUCTS_ERROR',
        message: 'Failed to retrieve products',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * POST /api/admin/products/:productId/remove
 * Remove a product
 */
router.post('/products/:productId/remove', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user.userID;

    const adminService = new AdminService();
    await adminService.removeProduct(adminId, productId, reason);

    res.json({
      success: true,
      message: 'Product removed successfully',
    });
  } catch (error) {
    console.error('Remove product error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'REMOVE_PRODUCT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to remove product',
      },
    });
  }
});

/**
 * POST /api/admin/products/:productId/restore
 * Restore a removed product
 */
router.post('/products/:productId/restore', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user.userID;

    const adminService = new AdminService();
    await adminService.restoreProduct(adminId, productId, reason);

    res.json({
      success: true,
      message: 'Product restored successfully',
    });
  } catch (error) {
    console.error('Restore product error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'RESTORE_PRODUCT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to restore product',
      },
    });
  }
});

/**
 * GET /api/admin/reports
 * Get all reports with filters
 */
router.get('/reports', async (req: Request, res: Response) => {
  try {
    const { status, type, category, limit = '50', offset = '0' } = req.query;

    const reportModel = new ReportModel();
    const filters: any = {};

    if (status) filters.status = status;
    if (type) filters.report_type = type;
    if (category) filters.category = category;

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    const result = await reportModel.findWithFilters(filters, limitNum, offsetNum);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_REPORTS_ERROR',
        message: 'Failed to retrieve reports',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * POST /api/admin/reports/:reportId/resolve
 * Resolve a report
 */
router.post('/reports/:reportId/resolve', async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { notes } = req.body;
    const adminId = (req as any).user.userID;

    const adminService = new AdminService();
    await adminService.resolveReport(adminId, parseInt(reportId), notes);

    res.json({
      success: true,
      message: 'Report resolved successfully',
    });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'RESOLVE_REPORT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to resolve report',
      },
    });
  }
});

/**
 * POST /api/admin/reports/:reportId/dismiss
 * Dismiss a report
 */
router.post('/reports/:reportId/dismiss', async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { notes } = req.body;
    const adminId = (req as any).user.userID;

    const adminService = new AdminService();
    await adminService.dismissReport(adminId, parseInt(reportId), notes);

    res.json({
      success: true,
      message: 'Report dismissed successfully',
    });
  } catch (error) {
    console.error('Dismiss report error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'DISMISS_REPORT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to dismiss report',
      },
    });
  }
});

/**
 * GET /api/admin/audit-logs
 * Get audit logs
 */
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const { adminID, targetType, targetID, startDate, endDate, limit = '50', offset = '0' } =
      req.query;

    const adminService = new AdminService();
    const filters: any = {};

    if (adminID) filters.adminID = adminID;
    if (targetType) filters.targetType = targetType;
    if (targetID) filters.targetID = targetID;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    const result = await adminService.getAuditLogs(filters, limitNum, offsetNum);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_AUDIT_LOGS_ERROR',
        message: 'Failed to retrieve audit logs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/admin/audit-logs/statistics
 * Get audit log statistics
 */
router.get('/audit-logs/statistics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const auditLogModel = new AuditLogModel();
    const statistics = await auditLogModel.getStatistics(
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('Get audit log statistics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_AUDIT_STATISTICS_ERROR',
        message: 'Failed to retrieve audit log statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

export default router;
