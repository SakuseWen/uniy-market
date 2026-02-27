/**
 * ReportModel handles report data operations
 * Implements Requirements 10.3, 10.4, 10.5
 */

import { BaseModel } from './BaseModel';

export interface Report {
  report_id: number;
  reporter_id: number;
  reported_user_id?: number;
  product_id?: number;
  chat_id?: number;
  message_id?: number;
  report_type: 'user' | 'product' | 'chat' | 'message';
  category: 'inappropriate_content' | 'spam' | 'fraud' | 'harassment' | 'fake_product' | 'other';
  reason: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  admin_notes?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReportData {
  reporter_id: number;
  reported_user_id?: number;
  product_id?: number;
  chat_id?: number;
  message_id?: number;
  report_type: 'user' | 'product' | 'chat' | 'message';
  category: 'inappropriate_content' | 'spam' | 'fraud' | 'harassment' | 'fake_product' | 'other';
  reason: string;
}

export interface UpdateReportData {
  status?: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  admin_notes?: string;
  reviewed_by?: number;
  reviewed_at?: string;
}

export class ReportModel extends BaseModel {
  /**
   * Create a new report
   */
  async create(data: CreateReportData): Promise<Report> {
    const query = `
      INSERT INTO reports (
        reporter_id, reported_user_id, product_id, chat_id, message_id,
        report_type, category, reason, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    const result = await this.db.run(query, [
      data.reporter_id,
      data.reported_user_id || null,
      data.product_id || null,
      data.chat_id || null,
      data.message_id || null,
      data.report_type,
      data.category,
      data.reason
    ]);

    if (!result.lastID) {
      throw new Error('Failed to create report - no ID returned');
    }

    const report = await this.findById(result.lastID);
    if (!report) {
      throw new Error('Failed to create report');
    }

    return report;
  }

  /**
   * Find report by ID
   */
  async findById(reportId: number): Promise<Report | null> {
    const query = `
      SELECT * FROM reports WHERE report_id = ?
    `;

    const report = await this.db.get<Report>(query, [reportId]);
    return report || null;
  }

  /**
   * Find all reports with optional filters
   */
  async findAll(filters?: {
    status?: string;
    category?: string;
    report_type?: string;
    reporter_id?: number;
    reported_user_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<Report[]> {
    let query = `SELECT * FROM reports WHERE 1=1`;
    const params: any[] = [];

    if (filters?.status) {
      query += ` AND status = ?`;
      params.push(filters.status);
    }

    if (filters?.category) {
      query += ` AND category = ?`;
      params.push(filters.category);
    }

    if (filters?.report_type) {
      query += ` AND report_type = ?`;
      params.push(filters.report_type);
    }

    if (filters?.reporter_id) {
      query += ` AND reporter_id = ?`;
      params.push(filters.reporter_id);
    }

    if (filters?.reported_user_id) {
      query += ` AND reported_user_id = ?`;
      params.push(filters.reported_user_id);
    }

    query += ` ORDER BY created_at DESC`;

    if (filters?.limit) {
      query += ` LIMIT ?`;
      params.push(filters.limit);
    }

    if (filters?.offset) {
      query += ` OFFSET ?`;
      params.push(filters.offset);
    }

    const results = await this.db.all<Report>(query, params);
    return Array.isArray(results) ? results : [];
  }

  /**
   * Update report
   */
  async update(reportId: number, data: UpdateReportData): Promise<Report> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }

    if (data.admin_notes !== undefined) {
      updates.push('admin_notes = ?');
      params.push(data.admin_notes);
    }

    if (data.reviewed_by !== undefined) {
      updates.push('reviewed_by = ?');
      params.push(data.reviewed_by);
    }

    if (data.reviewed_at !== undefined) {
      updates.push('reviewed_at = ?');
      params.push(data.reviewed_at);
    }

    if (updates.length === 0) {
      const report = await this.findById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }
      return report;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(reportId);

    const query = `
      UPDATE reports
      SET ${updates.join(', ')}
      WHERE report_id = ?
    `;

    await this.db.run(query, params);

    const report = await this.findById(reportId);
    if (!report) {
      throw new Error('Report not found after update');
    }

    return report;
  }

  /**
   * Delete report
   */
  async delete(reportId: number): Promise<boolean> {
    const query = `DELETE FROM reports WHERE report_id = ?`;
    const result = await this.db.run(query, [reportId]);
    return (result.changes || 0) > 0;
  }

  /**
   * Get reports by reported user
   */
  async findByReportedUser(userId: number): Promise<Report[]> {
    const query = `
      SELECT * FROM reports
      WHERE reported_user_id = ?
      ORDER BY created_at DESC
    `;

    const results = await this.db.all<Report>(query, [userId]);
    return Array.isArray(results) ? results : [];
  }

  /**
   * Get reports by reporter
   */
  async findByReporter(userId: number): Promise<Report[]> {
    const query = `
      SELECT * FROM reports
      WHERE reporter_id = ?
      ORDER BY created_at DESC
    `;

    const results = await this.db.all<Report>(query, [userId]);
    return Array.isArray(results) ? results : [];
  }

  /**
   * Get reports by product
   */
  async findByProduct(productId: number): Promise<Report[]> {
    const query = `
      SELECT * FROM reports
      WHERE product_id = ?
      ORDER BY created_at DESC
    `;

    const results = await this.db.all<Report>(query, [productId]);
    return Array.isArray(results) ? results : [];
  }

  /**
   * Get report statistics
   */
  async getStatistics(): Promise<{
    total: number;
    by_status: Record<string, number>;
    by_category: Record<string, number>;
    by_type: Record<string, number>;
  }> {
    const totalQuery = `SELECT COUNT(*) as count FROM reports`;
    const totalResult = await this.db.get<{ count: number }>(totalQuery);

    const statusQuery = `
      SELECT status, COUNT(*) as count
      FROM reports
      GROUP BY status
    `;
    const statusResults = await this.db.all<{ status: string; count: number }>(statusQuery);

    const categoryQuery = `
      SELECT category, COUNT(*) as count
      FROM reports
      GROUP BY category
    `;
    const categoryResults = await this.db.all<{ category: string; count: number }>(categoryQuery);

    const typeQuery = `
      SELECT report_type, COUNT(*) as count
      FROM reports
      GROUP BY report_type
    `;
    const typeResults = await this.db.all<{ report_type: string; count: number }>(typeQuery);

    const by_status: Record<string, number> = {};
    const statusArray = Array.isArray(statusResults) ? statusResults : [];
    statusArray.forEach(r => {
      by_status[r.status] = r.count;
    });

    const by_category: Record<string, number> = {};
    const categoryArray = Array.isArray(categoryResults) ? categoryResults : [];
    categoryArray.forEach(r => {
      by_category[r.category] = r.count;
    });

    const by_type: Record<string, number> = {};
    const typeArray = Array.isArray(typeResults) ? typeResults : [];
    typeArray.forEach(r => {
      by_type[r.report_type] = r.count;
    });

    return {
      total: totalResult?.count || 0,
      by_status,
      by_category,
      by_type
    };
  }

  /**
   * Check if user has already reported an item
   */
  async hasUserReported(reporterId: number, filters: {
    reported_user_id?: number;
    product_id?: number;
    chat_id?: number;
    message_id?: number;
  }): Promise<boolean> {
    let query = `SELECT COUNT(*) as count FROM reports WHERE reporter_id = ?`;
    const params: any[] = [reporterId];

    if (filters.reported_user_id) {
      query += ` AND reported_user_id = ?`;
      params.push(filters.reported_user_id);
    }

    if (filters.product_id) {
      query += ` AND product_id = ?`;
      params.push(filters.product_id);
    }

    if (filters.chat_id) {
      query += ` AND chat_id = ?`;
      params.push(filters.chat_id);
    }

    if (filters.message_id) {
      query += ` AND message_id = ?`;
      params.push(filters.message_id);
    }

    const result = await this.db.get<{ count: number }>(query, params);
    return (result?.count || 0) > 0;
  }
}

// Note: Do not export singleton instance to avoid initialization issues
// Create instances as needed: const reportModel = new ReportModel();
