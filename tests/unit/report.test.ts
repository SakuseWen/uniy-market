/**
 * Report system tests
 * Tests Requirements 10.3, 10.4, 10.5
 */

import { ReportModel, CreateReportData } from '../../src/models/ReportModel';
import { DatabaseManager } from '../../src/config/database';

describe('ReportModel', () => {
  let reportModel: ReportModel;
  const testUserId1 = 1;
  const testUserId2 = 2;
  const testProductId = 1;

  beforeAll(async () => {
    await DatabaseManager.getInstance().initialize();
    reportModel = new ReportModel();
  });

  afterAll(async () => {
    await DatabaseManager.getInstance().close();
  });

  describe('create', () => {
    it('should create a user report', async () => {
      const reportData: CreateReportData = {
        reporter_id: testUserId1,
        reported_user_id: testUserId2,
        report_type: 'user',
        category: 'harassment',
        reason: 'User is sending inappropriate messages'
      };

      const report = await reportModel.create(reportData);

      expect(report).toBeDefined();
      expect(report.reporter_id).toBe(testUserId1);
      expect(report.reported_user_id).toBe(testUserId2);
      expect(report.report_type).toBe('user');
      expect(report.category).toBe('harassment');
      expect(report.reason).toBe('User is sending inappropriate messages');
      expect(report.status).toBe('pending');
    });

    it('should create a product report', async () => {
      const reportData: CreateReportData = {
        reporter_id: testUserId1,
        product_id: testProductId,
        report_type: 'product',
        category: 'fake_product',
        reason: 'This product appears to be counterfeit'
      };

      const report = await reportModel.create(reportData);

      expect(report).toBeDefined();
      expect(report.reporter_id).toBe(testUserId1);
      expect(report.product_id).toBe(testProductId);
      expect(report.report_type).toBe('product');
      expect(report.category).toBe('fake_product');
      expect(report.status).toBe('pending');
    });

    it('should create a spam report', async () => {
      const reportData: CreateReportData = {
        reporter_id: testUserId1,
        reported_user_id: testUserId2,
        report_type: 'user',
        category: 'spam',
        reason: 'User is spamming the platform'
      };

      const report = await reportModel.create(reportData);

      expect(report).toBeDefined();
      expect(report.category).toBe('spam');
    });

    it('should create a fraud report', async () => {
      const reportData: CreateReportData = {
        reporter_id: testUserId1,
        product_id: testProductId,
        report_type: 'product',
        category: 'fraud',
        reason: 'This is a scam listing'
      };

      const report = await reportModel.create(reportData);

      expect(report).toBeDefined();
      expect(report.category).toBe('fraud');
    });

    it('should create an inappropriate content report', async () => {
      const reportData: CreateReportData = {
        reporter_id: testUserId1,
        product_id: testProductId,
        report_type: 'product',
        category: 'inappropriate_content',
        reason: 'Product contains offensive images'
      };

      const report = await reportModel.create(reportData);

      expect(report).toBeDefined();
      expect(report.category).toBe('inappropriate_content');
    });
  });

  describe('findById', () => {
    it('should find report by ID', async () => {
      const reportData: CreateReportData = {
        reporter_id: testUserId1,
        reported_user_id: testUserId2,
        report_type: 'user',
        category: 'other',
        reason: 'Test reason'
      };

      const created = await reportModel.create(reportData);
      const found = await reportModel.findById(created.report_id);

      expect(found).toBeDefined();
      expect(found?.report_id).toBe(created.report_id);
      expect(found?.reporter_id).toBe(testUserId1);
    });

    it('should return null for non-existent report', async () => {
      const found = await reportModel.findById(999999);
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // Create multiple reports for testing
      await reportModel.create({
        reporter_id: testUserId1,
        reported_user_id: testUserId2,
        report_type: 'user',
        category: 'spam',
        reason: 'Spam report 1'
      });

      await reportModel.create({
        reporter_id: testUserId1,
        product_id: testProductId,
        report_type: 'product',
        category: 'fraud',
        reason: 'Fraud report 1'
      });
    });

    it('should find all reports', async () => {
      const reports = await reportModel.findAll();
      expect(reports.length).toBeGreaterThan(0);
    });

    it('should filter reports by status', async () => {
      const reports = await reportModel.findAll({ status: 'pending' });
      expect(reports.length).toBeGreaterThan(0);
      expect(reports.every(r => r.status === 'pending')).toBe(true);
    });

    it('should filter reports by category', async () => {
      const reports = await reportModel.findAll({ category: 'spam' });
      expect(reports.length).toBeGreaterThan(0);
      expect(reports.every(r => r.category === 'spam')).toBe(true);
    });

    it('should filter reports by type', async () => {
      const reports = await reportModel.findAll({ report_type: 'user' });
      expect(reports.length).toBeGreaterThan(0);
      expect(reports.every(r => r.report_type === 'user')).toBe(true);
    });

    it('should support pagination', async () => {
      const page1 = await reportModel.findAll({ limit: 2, offset: 0 });
      const page2 = await reportModel.findAll({ limit: 2, offset: 2 });
      
      expect(page1.length).toBeLessThanOrEqual(2);
      expect(page2.length).toBeLessThanOrEqual(2);
    });
  });

  describe('update', () => {
    it('should update report status', async () => {
      const reportData: CreateReportData = {
        reporter_id: testUserId1,
        reported_user_id: testUserId2,
        report_type: 'user',
        category: 'harassment',
        reason: 'Test harassment'
      };

      const report = await reportModel.create(reportData);
      const updated = await reportModel.update(report.report_id, {
        status: 'under_review'
      });

      expect(updated.status).toBe('under_review');
    });

    it('should add admin notes', async () => {
      const reportData: CreateReportData = {
        reporter_id: testUserId1,
        reported_user_id: testUserId2,
        report_type: 'user',
        category: 'spam',
        reason: 'Test spam'
      };

      const report = await reportModel.create(reportData);
      const updated = await reportModel.update(report.report_id, {
        admin_notes: 'Reviewed and confirmed'
      });

      expect(updated.admin_notes).toBe('Reviewed and confirmed');
    });

    it('should mark report as resolved', async () => {
      const reportData: CreateReportData = {
        reporter_id: testUserId1,
        reported_user_id: testUserId2,
        report_type: 'user',
        category: 'other',
        reason: 'Test other'
      };

      const report = await reportModel.create(reportData);
      const updated = await reportModel.update(report.report_id, {
        status: 'resolved',
        reviewed_by: testUserId1,
        reviewed_at: new Date().toISOString()
      });

      expect(updated.status).toBe('resolved');
      expect(updated.reviewed_by).toBe(testUserId1);
      expect(updated.reviewed_at).toBeDefined();
    });

    it('should mark report as dismissed', async () => {
      const reportData: CreateReportData = {
        reporter_id: testUserId1,
        reported_user_id: testUserId2,
        report_type: 'user',
        category: 'other',
        reason: 'Test dismiss'
      };

      const report = await reportModel.create(reportData);
      const updated = await reportModel.update(report.report_id, {
        status: 'dismissed',
        admin_notes: 'Not a valid report'
      });

      expect(updated.status).toBe('dismissed');
      expect(updated.admin_notes).toBe('Not a valid report');
    });
  });

  describe('delete', () => {
    it('should delete report', async () => {
      const reportData: CreateReportData = {
        reporter_id: testUserId1,
        reported_user_id: testUserId2,
        report_type: 'user',
        category: 'other',
        reason: 'Test delete'
      };

      const report = await reportModel.create(reportData);
      const deleted = await reportModel.delete(report.report_id);

      expect(deleted).toBe(true);

      const found = await reportModel.findById(report.report_id);
      expect(found).toBeNull();
    });

    it('should return false for non-existent report', async () => {
      const deleted = await reportModel.delete(999999);
      expect(deleted).toBe(false);
    });
  });

  describe('findByReportedUser', () => {
    it('should find reports by reported user', async () => {
      await reportModel.create({
        reporter_id: testUserId1,
        reported_user_id: testUserId2,
        report_type: 'user',
        category: 'harassment',
        reason: 'Test harassment'
      });

      const reports = await reportModel.findByReportedUser(testUserId2);
      expect(reports.length).toBeGreaterThan(0);
      expect(reports.every(r => r.reported_user_id === testUserId2)).toBe(true);
    });
  });

  describe('findByReporter', () => {
    it('should find reports by reporter', async () => {
      const reports = await reportModel.findByReporter(testUserId1);
      expect(reports.length).toBeGreaterThan(0);
      expect(reports.every(r => r.reporter_id === testUserId1)).toBe(true);
    });
  });

  describe('findByProduct', () => {
    it('should find reports by product', async () => {
      await reportModel.create({
        reporter_id: testUserId1,
        product_id: testProductId,
        report_type: 'product',
        category: 'fake_product',
        reason: 'Test fake product'
      });

      const reports = await reportModel.findByProduct(testProductId);
      expect(reports.length).toBeGreaterThan(0);
      expect(reports.every(r => r.product_id === testProductId)).toBe(true);
    });
  });

  describe('getStatistics', () => {
    it('should return report statistics', async () => {
      const stats = await reportModel.getStatistics();

      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.by_status).toBeDefined();
      expect(stats.by_category).toBeDefined();
      expect(stats.by_type).toBeDefined();
    });

    it('should have correct status counts', async () => {
      const stats = await reportModel.getStatistics();
      
      const totalByStatus = Object.values(stats.by_status).reduce((a, b) => a + b, 0);
      expect(totalByStatus).toBe(stats.total);
    });
  });

  describe('hasUserReported', () => {
    it('should detect duplicate user reports', async () => {
      await reportModel.create({
        reporter_id: testUserId1,
        reported_user_id: testUserId2,
        report_type: 'user',
        category: 'spam',
        reason: 'Duplicate test'
      });

      const hasReported = await reportModel.hasUserReported(testUserId1, {
        reported_user_id: testUserId2
      });

      expect(hasReported).toBe(true);
    });

    it('should detect duplicate product reports', async () => {
      await reportModel.create({
        reporter_id: testUserId1,
        product_id: testProductId,
        report_type: 'product',
        category: 'fraud',
        reason: 'Duplicate product test'
      });

      const hasReported = await reportModel.hasUserReported(testUserId1, {
        product_id: testProductId
      });

      expect(hasReported).toBe(true);
    });

    it('should return false for new reports', async () => {
      const hasReported = await reportModel.hasUserReported(testUserId2, {
        reported_user_id: testUserId1
      });

      expect(hasReported).toBe(false);
    });
  });

  describe('Report categories', () => {
    it('should support all report categories', async () => {
      const categories = [
        'inappropriate_content',
        'spam',
        'fraud',
        'harassment',
        'fake_product',
        'other'
      ];

      for (const category of categories) {
        const report = await reportModel.create({
          reporter_id: testUserId1,
          reported_user_id: testUserId2,
          report_type: 'user',
          category: category as any,
          reason: `Test ${category}`
        });

        expect(report.category).toBe(category);
      }
    });
  });

  describe('Report types', () => {
    it('should support all report types', async () => {
      const types = ['user', 'product', 'chat', 'message'];

      for (const type of types) {
        const reportData: any = {
          reporter_id: testUserId1,
          report_type: type,
          category: 'other',
          reason: `Test ${type} report`
        };

        if (type === 'user') {
          reportData.reported_user_id = testUserId2;
        } else if (type === 'product') {
          reportData.product_id = testProductId;
        }

        const report = await reportModel.create(reportData);
        expect(report.report_type).toBe(type);
      }
    });
  });
});
