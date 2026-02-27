import { BaseModel } from './BaseModel';
import { Deal } from '../types';

export class DealModel extends BaseModel {
  /**
   * Create a new deal
   */
  async createDeal(dealData: Omit<Deal, 'dealID' | 'createdAt' | 'updatedAt'>): Promise<Deal> {
    const dealID = this.generateId('deal_');
    const now = new Date().toISOString();

    const result = await this.execute(
      `INSERT INTO Deal (
        dealID, listingID, buyerID, sellerID, transactionDate,
        status, finalPrice, notes, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dealID,
        dealData.listingID,
        dealData.buyerID,
        dealData.sellerID,
        dealData.transactionDate || now,
        dealData.status || 'pending',
        dealData.finalPrice || null,
        dealData.notes || null,
        now,
        now
      ]
    );

    if (result.changes === 0) {
      throw new Error('Failed to create deal');
    }

    const deal = await this.getDealById(dealID);
    if (!deal) {
      throw new Error('Failed to retrieve created deal');
    }
    return deal;
  }

  /**
   * Get deal by ID
   */
  async getDealById(dealID: string): Promise<Deal | null> {
    return await this.queryOne('SELECT * FROM Deal WHERE dealID = ?', [dealID]);
  }

  /**
   * Get deals by buyer ID
   */
  async getDealsByBuyer(buyerID: string): Promise<Deal[]> {
    return await this.query(
      'SELECT * FROM Deal WHERE buyerID = ? ORDER BY createdAt DESC',
      [buyerID]
    );
  }

  /**
   * Get deals by seller ID
   */
  async getDealsBySeller(sellerID: string): Promise<Deal[]> {
    return await this.query(
      'SELECT * FROM Deal WHERE sellerID = ? ORDER BY createdAt DESC',
      [sellerID]
    );
  }

  /**
   * Get deals by user ID (as buyer or seller)
   */
  async getDealsByUser(userID: string): Promise<Deal[]> {
    return await this.query(
      'SELECT * FROM Deal WHERE buyerID = ? OR sellerID = ? ORDER BY createdAt DESC',
      [userID, userID]
    );
  }

  /**
   * Get deals by listing ID
   */
  async getDealsByListing(listingID: string): Promise<Deal[]> {
    return await this.query(
      'SELECT * FROM Deal WHERE listingID = ? ORDER BY createdAt DESC',
      [listingID]
    );
  }

  /**
   * Update deal status
   */
  async updateDealStatus(
    dealID: string,
    status: 'pending' | 'completed' | 'cancelled'
  ): Promise<Deal> {
    const now = new Date().toISOString();

    const result = await this.execute(
      'UPDATE Deal SET status = ?, updatedAt = ? WHERE dealID = ?',
      [status, now, dealID]
    );

    if (result.changes === 0) {
      throw new Error('Deal not found or no changes made');
    }

    const deal = await this.getDealById(dealID);
    if (!deal) {
      throw new Error('Failed to retrieve updated deal');
    }
    return deal;
  }

  /**
   * Update deal
   */
  async updateDeal(dealID: string, updates: Partial<Deal>): Promise<Deal> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'dealID' && key !== 'createdAt' && value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Add updatedAt timestamp
    updateFields.push('updatedAt = ?');
    updateValues.push(new Date().toISOString());
    updateValues.push(dealID);

    const sql = `UPDATE Deal SET ${updateFields.join(', ')} WHERE dealID = ?`;
    const result = await this.execute(sql, updateValues);

    if (result.changes === 0) {
      throw new Error('Deal not found or no changes made');
    }

    const deal = await this.getDealById(dealID);
    if (!deal) {
      throw new Error('Failed to retrieve updated deal');
    }
    return deal;
  }

  /**
   * Delete deal
   */
  async deleteDeal(dealID: string): Promise<boolean> {
    const result = await this.execute('DELETE FROM Deal WHERE dealID = ?', [dealID]);
    return result.changes > 0;
  }

  /**
   * Get completed deals count for a user
   */
  async getCompletedDealsCount(userID: string): Promise<number> {
    const result = await this.queryOne(
      `SELECT COUNT(*) as count FROM Deal 
       WHERE (buyerID = ? OR sellerID = ?) AND status = 'completed'`,
      [userID, userID]
    );

    return result?.count || 0;
  }

  /**
   * Get deals with product details
   */
  async getDealsWithDetails(userID: string): Promise<any[]> {
    return await this.query(
      `SELECT 
        d.*,
        p.title as productTitle,
        p.price as productPrice,
        buyer.name as buyerName,
        seller.name as sellerName
       FROM Deal d
       JOIN ProductListing p ON d.listingID = p.listingID
       JOIN User buyer ON d.buyerID = buyer.userID
       JOIN User seller ON d.sellerID = seller.userID
       WHERE d.buyerID = ? OR d.sellerID = ?
       ORDER BY d.createdAt DESC`,
      [userID, userID]
    );
  }
}
