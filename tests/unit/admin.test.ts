import { DatabaseManager } from '../../src/config/database';
import { UserModel } from '../../src/models/UserModel';
import { ProductModel } from '../../src/models/ProductModel';
import { ReportModel } from '../../src/models/ReportModel';
import { AuditLogModel } from '../../src/models/AuditLogModel';
import { AdminService } from '../../src/services/AdminService';

describe('Admin System', () => {
  let dbManager: DatabaseManager;
  let userModel: UserModel;
  let productModel: ProductModel;
  let reportModel: ReportModel;
  let auditLogModel: AuditLogModel;
  let adminService: AdminService;

  let adminUser: any;
  let regularUser: any;
  let testProduct: any;
  let testCounter = 0;

  beforeAll(async () => {
    dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();

    userModel = new UserModel();
    productModel = new ProductModel();
    reportModel = new ReportModel();
    auditLogModel = new AuditLogModel();
    adminService = new AdminService();
  });

  beforeEach(async () => {
    testCounter++;
    const timestamp = Date.now();
    const uniqueId = `${timestamp}-${testCounter}-${Math.random().toString(36).substring(7)}`;

    // Create admin user
    adminUser = await userModel.createUser({
      email: `admin-${uniqueId}@test.com`,
      name: 'Admin User',
      isAdmin: true,
      isVerified: true,
      preferredLanguage: 'en',
      status: 'active',
    });

    // Create regular user
    regularUser = await userModel.createUser({
      email: `user-${uniqueId}@test.com`,
      name: 'Regular User',
      isAdmin: false,
      isVerified: true,
      preferredLanguage: 'en',
      status: 'active',
    });

    // Create test product
    testProduct = await productModel.createProduct({
      title: 'Test Product',
      description: 'Test Description',
      price: 100,
      condition: 'used',
      location: 'Test Location',
      categoryID: 1,
      sellerID: regularUser.userID,
      stock: 1,
      status: 'active',
    });
  });

  afterAll(async () => {
    await dbManager.close();
  });

  describe('AuditLogModel', () => {
    it('should create audit log entry', async () => {
      const log = await auditLogModel.create({
        adminID: adminUser.userID,
        action: 'test_action',
        targetType: 'user',
        targetID: regularUser.userID,
        details: 'Test audit log',
      });

      expect(log).toBeDefined();
      expect(log.logID).toBeDefined();
      expect(log.adminID).toBe(adminUser.userID);
      expect(log.action).toBe('test_action');
      expect(log.targetType).toBe('user');
      expect(log.targetID).toBe(regularUser.userID);
    });

    it('should find audit log by ID', async () => {
      const created = await auditLogModel.create({
        adminID: adminUser.userID,
        action: 'test_action',
        targetType: 'user',
        targetID: regularUser.userID,
      });

      const found = await auditLogModel.findById(created.logID);
      expect(found).toBeDefined();
      expect(found?.logID).toBe(created.logID);
    });

    it('should get audit logs with filters', async () => {
      await auditLogModel.create({
        adminID: adminUser.userID,
        action: 'suspend_user',
        targetType: 'user',
        targetID: regularUser.userID,
      });

      const result = await auditLogModel.findWithFilters({
        adminID: adminUser.userID,
        targetType: 'user',
      });

      expect(result.logs.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should get audit logs by admin ID', async () => {
      await auditLogModel.create({
        adminID: adminUser.userID,
        action: 'test_action',
        targetType: 'user',
      });

      const logs = await auditLogModel.findByAdminId(adminUser.userID);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]?.adminID).toBe(adminUser.userID);
    });

    it('should get audit logs by target', async () => {
      await auditLogModel.create({
        adminID: adminUser.userID,
        action: 'test_action',
        targetType: 'user',
        targetID: regularUser.userID,
      });

      const logs = await auditLogModel.findByTarget('user', regularUser.userID);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]?.targetID).toBe(regularUser.userID);
    });

    it('should get recent audit logs', async () => {
      await auditLogModel.create({
        adminID: adminUser.userID,
        action: 'test_action',
        targetType: 'system',
      });

      const logs = await auditLogModel.getRecent(10);
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should get audit log statistics', async () => {
      await auditLogModel.create({
        adminID: adminUser.userID,
        action: 'suspend_user',
        targetType: 'user',
      });

      const stats = await auditLogModel.getStatistics();
      expect(stats.totalLogs).toBeGreaterThan(0);
      expect(stats.logsByAdmin.length).toBeGreaterThan(0);
      expect(stats.logsByAction.length).toBeGreaterThan(0);
      expect(stats.logsByTargetType.length).toBeGreaterThan(0);
    });
  });

  describe('AdminService - User Management', () => {
    it('should suspend user', async () => {
      await adminService.suspendUser(adminUser.userID, regularUser.userID, 'Test suspension');

      const user = await userModel.getUserById(regularUser.userID);
      expect(user?.status).toBe('suspended');

      // Check audit log
      const logs = await auditLogModel.findByTarget('user', regularUser.userID);
      expect(logs.some((log) => log.action === 'suspend_user')).toBe(true);
    });

    it('should not suspend already suspended user', async () => {
      await adminService.suspendUser(adminUser.userID, regularUser.userID);

      await expect(
        adminService.suspendUser(adminUser.userID, regularUser.userID)
      ).rejects.toThrow('User is already suspended');
    });

    it('should activate suspended user', async () => {
      await adminService.suspendUser(adminUser.userID, regularUser.userID);
      await adminService.activateUser(adminUser.userID, regularUser.userID, 'Test activation');

      const user = await userModel.getUserById(regularUser.userID);
      expect(user?.status).toBe('active');

      // Check audit log
      const logs = await auditLogModel.findByTarget('user', regularUser.userID);
      expect(logs.some((log) => log.action === 'activate_user')).toBe(true);
    });

    it('should not activate already active user', async () => {
      await expect(
        adminService.activateUser(adminUser.userID, regularUser.userID)
      ).rejects.toThrow('User is already active');
    });

    it('should delete user', async () => {
      const userId = regularUser.userID;
      await adminService.deleteUser(adminUser.userID, userId, 'Test deletion');

      const user = await userModel.getUserById(userId);
      // User is marked as deleted, not actually removed from database
      expect(user?.status).toBe('deleted');
    });

    it('should not delete admin user', async () => {
      await expect(
        adminService.deleteUser(adminUser.userID, adminUser.userID)
      ).rejects.toThrow('Cannot delete admin users');
    });

    it('should grant admin privileges', async () => {
      await adminService.makeAdmin(adminUser.userID, regularUser.userID, 'Test grant admin');

      const user = await userModel.getUserById(regularUser.userID);
      // SQLite returns 0/1 for boolean
      expect(user?.isAdmin).toBeTruthy();

      // Check audit log
      const logs = await auditLogModel.findByTarget('user', regularUser.userID);
      expect(logs.some((log) => log.action === 'grant_admin')).toBe(true);
    });

    it('should not grant admin to already admin user', async () => {
      await adminService.makeAdmin(adminUser.userID, regularUser.userID);

      await expect(
        adminService.makeAdmin(adminUser.userID, regularUser.userID)
      ).rejects.toThrow('User is already an admin');
    });

    it('should revoke admin privileges', async () => {
      await adminService.makeAdmin(adminUser.userID, regularUser.userID);
      await adminService.removeAdmin(adminUser.userID, regularUser.userID, 'Test revoke admin');

      const user = await userModel.getUserById(regularUser.userID);
      // SQLite returns 0/1 for boolean
      expect(user?.isAdmin).toBeFalsy();

      // Check audit log
      const logs = await auditLogModel.findByTarget('user', regularUser.userID);
      expect(logs.some((log) => log.action === 'revoke_admin')).toBe(true);
    });

    it('should not revoke admin from non-admin user', async () => {
      await expect(
        adminService.removeAdmin(adminUser.userID, regularUser.userID)
      ).rejects.toThrow('User is not an admin');
    });

    it('should not allow admin to remove own admin privileges', async () => {
      await expect(
        adminService.removeAdmin(adminUser.userID, adminUser.userID)
      ).rejects.toThrow('Cannot remove your own admin privileges');
    });
  });

  describe('AdminService - Content Moderation', () => {
    it('should remove product', async () => {
      await adminService.removeProduct(
        adminUser.userID,
        testProduct.listingID,
        'Test removal'
      );

      const product = await productModel.getProductById(testProduct.listingID);
      expect(product?.status).toBe('reported');

      // Check audit log
      const logs = await auditLogModel.findByTarget('product', testProduct.listingID);
      expect(logs.some((log) => log.action === 'remove_product')).toBe(true);
    });

    it('should restore product', async () => {
      await adminService.removeProduct(adminUser.userID, testProduct.listingID);
      await adminService.restoreProduct(
        adminUser.userID,
        testProduct.listingID,
        'Test restore'
      );

      const product = await productModel.getProductById(testProduct.listingID);
      expect(product?.status).toBe('active');

      // Check audit log
      const logs = await auditLogModel.findByTarget('product', testProduct.listingID);
      expect(logs.some((log) => log.action === 'restore_product')).toBe(true);
    });

    it('should throw error when removing non-existent product', async () => {
      await expect(
        adminService.removeProduct(adminUser.userID, 'non-existent-id')
      ).rejects.toThrow('Product not found');
    });

    it('should throw error when restoring non-existent product', async () => {
      await expect(
        adminService.restoreProduct(adminUser.userID, 'non-existent-id')
      ).rejects.toThrow('Product not found');
    });
  });

  describe('AdminService - Report Management', () => {
    let testReport: any;

    beforeEach(async () => {
      testReport = await reportModel.create({
        reporter_id: regularUser.userID,
        reported_user_id: regularUser.userID,
        report_type: 'user',
        category: 'spam',
        reason: 'Test report',
      });
    });

    it('should resolve report', async () => {
      await adminService.resolveReport(
        adminUser.userID,
        testReport.report_id,
        'Test resolution'
      );

      const report = await reportModel.findById(testReport.report_id);
      expect(report?.status).toBe('resolved');

      // Check audit log
      const logs = await auditLogModel.findByTarget('report', testReport.report_id.toString());
      expect(logs.some((log) => log.action === 'resolve_report')).toBe(true);
    });

    it('should not resolve already resolved report', async () => {
      await adminService.resolveReport(adminUser.userID, testReport.report_id);

      await expect(
        adminService.resolveReport(adminUser.userID, testReport.report_id)
      ).rejects.toThrow('Report is already resolved');
    });

    it('should dismiss report', async () => {
      await adminService.dismissReport(
        adminUser.userID,
        testReport.report_id,
        'Test dismissal'
      );

      const report = await reportModel.findById(testReport.report_id);
      expect(report?.status).toBe('dismissed');

      // Check audit log
      const logs = await auditLogModel.findByTarget('report', testReport.report_id.toString());
      expect(logs.some((log) => log.action === 'dismiss_report')).toBe(true);
    });

    it('should not dismiss already dismissed report', async () => {
      await adminService.dismissReport(adminUser.userID, testReport.report_id);

      await expect(
        adminService.dismissReport(adminUser.userID, testReport.report_id)
      ).rejects.toThrow('Report is already dismissed');
    });

    it('should throw error when resolving non-existent report', async () => {
      await expect(adminService.resolveReport(adminUser.userID, 99999)).rejects.toThrow(
        'Report not found'
      );
    });

    it('should throw error when dismissing non-existent report', async () => {
      await expect(adminService.dismissReport(adminUser.userID, 99999)).rejects.toThrow(
        'Report not found'
      );
    });
  });

  describe('AdminService - System Statistics', () => {
    it('should get system statistics', async () => {
      const stats = await adminService.getSystemStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalUsers).toBeGreaterThan(0);
      expect(stats.activeUsers).toBeGreaterThan(0);
      expect(stats.totalProducts).toBeGreaterThan(0);
      expect(typeof stats.suspendedUsers).toBe('number');
      expect(typeof stats.reportedProducts).toBe('number');
      expect(typeof stats.pendingReports).toBe('number');
      expect(typeof stats.resolvedReports).toBe('number');
    });

    it('should reflect changes in statistics after user suspension', async () => {
      const statsBefore = await adminService.getSystemStatistics();
      await adminService.suspendUser(adminUser.userID, regularUser.userID);
      const statsAfter = await adminService.getSystemStatistics();

      expect(statsAfter.suspendedUsers).toBe(statsBefore.suspendedUsers + 1);
      expect(statsAfter.activeUsers).toBe(statsBefore.activeUsers - 1);
    });

    it('should reflect changes in statistics after product removal', async () => {
      const statsBefore = await adminService.getSystemStatistics();
      await adminService.removeProduct(adminUser.userID, testProduct.listingID);
      const statsAfter = await adminService.getSystemStatistics();

      expect(statsAfter.reportedProducts).toBe(statsBefore.reportedProducts + 1);
      expect(statsAfter.activeProducts).toBe(statsBefore.activeProducts - 1);
    });
  });

  describe('AdminService - Audit Logs', () => {
    it('should get audit logs with filters', async () => {
      await adminService.suspendUser(adminUser.userID, regularUser.userID);

      const result = await adminService.getAuditLogs({
        adminID: adminUser.userID,
      });

      expect(result.logs.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should get audit logs with pagination', async () => {
      // Create multiple audit logs
      for (let i = 0; i < 5; i++) {
        await auditLogModel.create({
          adminID: adminUser.userID,
          action: `test_action_${i}`,
          targetType: 'system',
        });
      }

      const result = await adminService.getAuditLogs({}, 2, 0);
      expect(result.logs.length).toBeLessThanOrEqual(2);
    });

    it('should filter audit logs by target type', async () => {
      await adminService.suspendUser(adminUser.userID, regularUser.userID);
      await adminService.removeProduct(adminUser.userID, testProduct.listingID);

      const userLogs = await adminService.getAuditLogs({
        targetType: 'user',
      });

      const productLogs = await adminService.getAuditLogs({
        targetType: 'product',
      });

      expect(userLogs.logs.every((log) => log.targetType === 'user')).toBe(true);
      expect(productLogs.logs.every((log) => log.targetType === 'product')).toBe(true);
    });

    it('should filter audit logs by date range', async () => {
      const startDate = new Date().toISOString();

      await adminService.suspendUser(adminUser.userID, regularUser.userID);

      const result = await adminService.getAuditLogs({
        startDate,
      });

      expect(result.logs.length).toBeGreaterThan(0);
      if (result.logs[0]) {
        expect(new Date(result.logs[0].timestamp) >= new Date(startDate)).toBe(true);
      }
    });
  });
});
