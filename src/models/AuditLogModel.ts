import { BaseModel } from './BaseModel';

export interface AuditLog {
  logID: string;
  adminID: string;
  action: string;
  targetType: 'user' | 'product' | 'report' | 'system';
  targetID: string | null;
  details: string | null;
  timestamp: string;
}

export interface CreateAuditLogInput {
  adminID: string;
  action: string;
  targetType: 'user' | 'product' | 'report' | 'system';
  targetID?: string;
  details?: string;
}

export interface AuditLogFilters {
  adminID?: string;
  targetType?: 'user' | 'product' | 'report' | 'system';
  targetID?: string;
  startDate?: string;
  endDate?: string;
  action?: string;
}

export class AuditLogModel extends BaseModel {
  constructor() {
    super();
  }

  /**
   * Create a new audit log entry
   */
  async create(input: CreateAuditLogInput): Promise<AuditLog> {
    const logID = this.generateId('log_');
    const timestamp = new Date().toISOString();

    const query = `
      INSERT INTO AuditLog (logID, adminID, action, targetType, targetID, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(query, [
      logID,
      input.adminID,
      input.action,
      input.targetType,
      input.targetID || null,
      input.details || null,
      timestamp,
    ]);

    const log = await this.findById(logID);
    if (!log) {
      throw new Error('Failed to create audit log');
    }

    return log;
  }

  /**
   * Find audit log by ID
   */
  async findById(logID: string): Promise<AuditLog | null> {
    const query = `SELECT * FROM AuditLog WHERE logID = ?`;
    const log = await this.db.get<AuditLog>(query, [logID]);
    return log || null;
  }

  /**
   * Get audit logs with filters and pagination
   */
  async findWithFilters(
    filters: AuditLogFilters,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.adminID) {
      conditions.push('adminID = ?');
      params.push(filters.adminID);
    }

    if (filters.targetType) {
      conditions.push('targetType = ?');
      params.push(filters.targetType);
    }

    if (filters.targetID) {
      conditions.push('targetID = ?');
      params.push(filters.targetID);
    }

    if (filters.action) {
      conditions.push('action LIKE ?');
      params.push(`%${filters.action}%`);
    }

    if (filters.startDate) {
      conditions.push('timestamp >= ?');
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push('timestamp <= ?');
      params.push(filters.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM AuditLog ${whereClause}`;
    const countResult = await this.db.get<{ count: number }>(countQuery, params);
    const total = countResult?.count || 0;

    // Get logs
    const query = `
      SELECT * FROM AuditLog
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `;

    const logs = await this.db.all<AuditLog[]>(query, [...params, limit, offset]);

    return { logs, total };
  }

  /**
   * Get audit logs by admin ID
   */
  async findByAdminId(adminID: string, limit: number = 50): Promise<AuditLog[]> {
    const query = `
      SELECT * FROM AuditLog
      WHERE adminID = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `;

    return await this.db.all<AuditLog[]>(query, [adminID, limit]);
  }

  /**
   * Get audit logs by target
   */
  async findByTarget(
    targetType: 'user' | 'product' | 'report' | 'system',
    targetID: string,
    limit: number = 50
  ): Promise<AuditLog[]> {
    const query = `
      SELECT * FROM AuditLog
      WHERE targetType = ? AND targetID = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `;

    return await this.db.all<AuditLog[]>(query, [targetType, targetID, limit]);
  }

  /**
   * Get recent audit logs
   */
  async getRecent(limit: number = 100): Promise<AuditLog[]> {
    const query = `
      SELECT * FROM AuditLog
      ORDER BY timestamp DESC
      LIMIT ?
    `;

    return await this.db.all<AuditLog[]>(query, [limit]);
  }

  /**
   * Get audit log statistics
   */
  async getStatistics(startDate?: string, endDate?: string): Promise<{
    totalLogs: number;
    logsByAdmin: { adminID: string; count: number }[];
    logsByAction: { action: string; count: number }[];
    logsByTargetType: { targetType: string; count: number }[];
  }> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (startDate) {
      conditions.push('timestamp >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('timestamp <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total logs
    const totalQuery = `SELECT COUNT(*) as count FROM AuditLog ${whereClause}`;
    const totalResult = await this.db.get<{ count: number }>(totalQuery, params);
    const totalLogs = totalResult?.count || 0;

    // Logs by admin
    const adminQuery = `
      SELECT adminID, COUNT(*) as count
      FROM AuditLog
      ${whereClause}
      GROUP BY adminID
      ORDER BY count DESC
    `;
    const logsByAdmin = await this.db.all<{ adminID: string; count: number }[]>(
      adminQuery,
      params
    );

    // Logs by action
    const actionQuery = `
      SELECT action, COUNT(*) as count
      FROM AuditLog
      ${whereClause}
      GROUP BY action
      ORDER BY count DESC
    `;
    const logsByAction = await this.db.all<{ action: string; count: number }[]>(
      actionQuery,
      params
    );

    // Logs by target type
    const targetTypeQuery = `
      SELECT targetType, COUNT(*) as count
      FROM AuditLog
      ${whereClause}
      GROUP BY targetType
      ORDER BY count DESC
    `;
    const logsByTargetType = await this.db.all<{ targetType: string; count: number }[]>(
      targetTypeQuery,
      params
    );

    return {
      totalLogs,
      logsByAdmin,
      logsByAction,
      logsByTargetType,
    };
  }

  /**
   * Delete old audit logs (for maintenance)
   */
  async deleteOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const query = `DELETE FROM AuditLog WHERE timestamp < ?`;
    const result = await this.db.run(query, [cutoffDate.toISOString()]);

    return result.changes || 0;
  }
}
