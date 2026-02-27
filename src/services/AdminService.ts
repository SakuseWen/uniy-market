import { UserModel } from '../models/UserModel';
import { ProductModel } from '../models/ProductModel';
import { ReportModel } from '../models/ReportModel';
import { AuditLogModel } from '../models/AuditLogModel';

export interface UserManagementAction {
  action: 'suspend' | 'activate' | 'delete' | 'make_admin' | 'remove_admin';
  userId: string;
  reason?: string;
}

export interface ContentModerationAction {
  action: 'remove' | 'restore' | 'flag';
  productId: string;
  reason?: string;
}

export interface ReportResolutionAction {
  action: 'resolve' | 'dismiss';
  reportId: number;
  notes?: string;
}

export class AdminService {
  private userModel: UserModel;
  private productModel: ProductModel;
  private reportModel: ReportModel;
  private auditLogModel: AuditLogModel;

  constructor() {
    this.userModel = new UserModel();
    this.productModel = new ProductModel();
    this.reportModel = new ReportModel();
    this.auditLogModel = new AuditLogModel();
  }

  /**
   * Suspend a user account
   */
  async suspendUser(adminId: string, userId: string, reason?: string): Promise<void> {
    // Check if user exists
    const user = await this.userModel.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.status === 'suspended') {
      throw new Error('User is already suspended');
    }

    // Update user status
    await this.userModel.updateUser(userId, { status: 'suspended' });

    // Log the action
    await this.auditLogModel.create({
      adminID: adminId,
      action: 'suspend_user',
      targetType: 'user',
      targetID: userId,
      details: reason || 'User suspended by admin',
    });
  }

  /**
   * Activate a suspended user account
   */
  async activateUser(adminId: string, userId: string, reason?: string): Promise<void> {
    // Check if user exists
    const user = await this.userModel.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.status === 'active') {
      throw new Error('User is already active');
    }

    // Update user status
    await this.userModel.updateUser(userId, { status: 'active' });

    // Log the action
    await this.auditLogModel.create({
      adminID: adminId,
      action: 'activate_user',
      targetType: 'user',
      targetID: userId,
      details: reason || 'User activated by admin',
    });
  }

  /**
   * Delete a user account
   */
  async deleteUser(adminId: string, userId: string, reason?: string): Promise<void> {
    // Check if user exists
    const user = await this.userModel.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isAdmin) {
      throw new Error('Cannot delete admin users');
    }

    // Log the action before deletion
    await this.auditLogModel.create({
      adminID: adminId,
      action: 'delete_user',
      targetType: 'user',
      targetID: userId,
      details: reason || 'User deleted by admin',
    });

    // Delete user (cascade will handle related records)
    await this.userModel.deleteUser(userId);
  }

  /**
   * Grant admin privileges to a user
   */
  async makeAdmin(adminId: string, userId: string, reason?: string): Promise<void> {
    // Check if user exists
    const user = await this.userModel.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isAdmin) {
      throw new Error('User is already an admin');
    }

    // Update user to admin
    await this.userModel.updateUser(userId, { isAdmin: true });

    // Log the action
    await this.auditLogModel.create({
      adminID: adminId,
      action: 'grant_admin',
      targetType: 'user',
      targetID: userId,
      details: reason || 'Admin privileges granted',
    });
  }

  /**
   * Revoke admin privileges from a user
   */
  async removeAdmin(adminId: string, userId: string, reason?: string): Promise<void> {
    // Check if user exists
    const user = await this.userModel.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isAdmin) {
      throw new Error('User is not an admin');
    }

    // Prevent removing own admin privileges
    if (adminId === userId) {
      throw new Error('Cannot remove your own admin privileges');
    }

    // Update user to remove admin
    await this.userModel.updateUser(userId, { isAdmin: false });

    // Log the action
    await this.auditLogModel.create({
      adminID: adminId,
      action: 'revoke_admin',
      targetType: 'user',
      targetID: userId,
      details: reason || 'Admin privileges revoked',
    });
  }

  /**
   * Remove a product listing
   */
  async removeProduct(adminId: string, productId: string, reason?: string): Promise<void> {
    // Check if product exists
    const product = await this.productModel.getProductById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Update product status to reported/inactive
    await this.productModel.updateProduct(productId, { status: 'reported' });

    // Log the action
    await this.auditLogModel.create({
      adminID: adminId,
      action: 'remove_product',
      targetType: 'product',
      targetID: productId,
      details: reason || 'Product removed by admin',
    });
  }

  /**
   * Restore a removed product listing
   */
  async restoreProduct(adminId: string, productId: string, reason?: string): Promise<void> {
    // Check if product exists
    const product = await this.productModel.getProductById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Update product status to active
    await this.productModel.updateProduct(productId, { status: 'active' });

    // Log the action
    await this.auditLogModel.create({
      adminID: adminId,
      action: 'restore_product',
      targetType: 'product',
      targetID: productId,
      details: reason || 'Product restored by admin',
    });
  }

  /**
   * Resolve a report
   */
  async resolveReport(adminId: string, reportId: number, notes?: string): Promise<void> {
    // Check if report exists
    const report = await this.reportModel.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    if (report.status === 'resolved') {
      throw new Error('Report is already resolved');
    }

    // Update report status
    await this.reportModel.update(reportId, {
      status: 'resolved',
      reviewed_by: parseInt(adminId),
      ...(notes && { admin_notes: notes }),
    });

    // Log the action
    await this.auditLogModel.create({
      adminID: adminId,
      action: 'resolve_report',
      targetType: 'report',
      targetID: reportId.toString(),
      details: notes || 'Report resolved by admin',
    });
  }

  /**
   * Dismiss a report
   */
  async dismissReport(adminId: string, reportId: number, notes?: string): Promise<void> {
    // Check if report exists
    const report = await this.reportModel.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    if (report.status === 'dismissed') {
      throw new Error('Report is already dismissed');
    }

    // Update report status
    await this.reportModel.update(reportId, {
      status: 'dismissed',
      reviewed_by: parseInt(adminId),
      ...(notes && { admin_notes: notes }),
    });

    // Log the action
    await this.auditLogModel.create({
      adminID: adminId,
      action: 'dismiss_report',
      targetType: 'report',
      targetID: reportId.toString(),
      details: notes || 'Report dismissed by admin',
    });
  }

  /**
   * Get system statistics
   */
  async getSystemStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    totalProducts: number;
    activeProducts: number;
    reportedProducts: number;
    pendingReports: number;
    resolvedReports: number;
  }> {
    // Get user statistics using raw query
    const userStats = await this.userModel['query'](
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended
      FROM User`
    );
    const totalUsers = userStats[0]?.total || 0;
    const activeUsers = userStats[0]?.active || 0;
    const suspendedUsers = userStats[0]?.suspended || 0;

    // Get product statistics using raw query
    const productStats = await this.productModel['query'](
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'reported' THEN 1 ELSE 0 END) as reported
      FROM ProductListing`
    );
    const totalProducts = productStats[0]?.total || 0;
    const activeProducts = productStats[0]?.active || 0;
    const reportedProducts = productStats[0]?.reported || 0;

    // Get report statistics
    const allReports = await this.reportModel.findAll();
    const pendingReports = allReports.filter((r) => r.status === 'pending').length;
    const resolvedReports = allReports.filter((r) => r.status === 'resolved').length;

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalProducts,
      activeProducts,
      reportedProducts,
      pendingReports,
      resolvedReports,
    };
  }

  /**
   * Get audit log for a specific action
   */
  async getAuditLogs(
    filters?: {
      adminID?: string;
      targetType?: 'user' | 'product' | 'report' | 'system';
      targetID?: string;
      startDate?: string;
      endDate?: string;
    },
    limit: number = 50,
    offset: number = 0
  ) {
    return await this.auditLogModel.findWithFilters(filters || {}, limit, offset);
  }
}
