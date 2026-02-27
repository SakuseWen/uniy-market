import { BaseModel } from './BaseModel';
import { Review } from '../types';

export class ReviewModel extends BaseModel {
  /**
   * Create a new review
   */
  async createReview(reviewData: Omit<Review, 'reviewID' | 'createdAt'>): Promise<Review> {
    const reviewID = this.generateId('review_');
    const now = new Date().toISOString();

    // Validate rating is between 1 and 5
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Validate review type
    if (!['buyer_to_seller', 'seller_to_buyer'].includes(reviewData.reviewType)) {
      throw new Error('Invalid review type');
    }

    // Check if reviewer and target are different users
    if (reviewData.reviewerID === reviewData.targetUserID) {
      throw new Error('Cannot review yourself');
    }

    // Check if review already exists for this deal and reviewer
    if (reviewData.dealID) {
      const existingReview = await this.queryOne(
        `SELECT reviewID FROM Review 
         WHERE dealID = ? AND reviewerID = ? AND reviewType = ?`,
        [reviewData.dealID, reviewData.reviewerID, reviewData.reviewType]
      );

      if (existingReview) {
        throw new Error('Review already exists for this deal');
      }
    }

    const result = await this.execute(
      `INSERT INTO Review (
        reviewID, rating, comment, reviewerID, targetUserID, 
        dealID, reviewType, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reviewID,
        reviewData.rating,
        reviewData.comment || null,
        reviewData.reviewerID,
        reviewData.targetUserID,
        reviewData.dealID || null,
        reviewData.reviewType,
        now
      ]
    );

    if (result.changes === 0) {
      throw new Error('Failed to create review');
    }

    const review = await this.getReviewById(reviewID);
    if (!review) {
      throw new Error('Failed to retrieve created review');
    }
    return review;
  }

  /**
   * Get review by ID
   */
  async getReviewById(reviewID: string): Promise<Review | null> {
    return await this.queryOne('SELECT * FROM Review WHERE reviewID = ?', [reviewID]);
  }

  /**
   * Get reviews by target user ID
   */
  async getReviewsByTargetUser(
    targetUserID: string,
    reviewType?: 'buyer_to_seller' | 'seller_to_buyer'
  ): Promise<Review[]> {
    if (reviewType) {
      return await this.query(
        `SELECT * FROM Review 
         WHERE targetUserID = ? AND reviewType = ? 
         ORDER BY createdAt DESC`,
        [targetUserID, reviewType]
      );
    }

    return await this.query(
      'SELECT * FROM Review WHERE targetUserID = ? ORDER BY createdAt DESC',
      [targetUserID]
    );
  }

  /**
   * Get reviews by reviewer ID
   */
  async getReviewsByReviewer(reviewerID: string): Promise<Review[]> {
    return await this.query(
      'SELECT * FROM Review WHERE reviewerID = ? ORDER BY createdAt DESC',
      [reviewerID]
    );
  }

  /**
   * Get reviews by deal ID
   */
  async getReviewsByDeal(dealID: string): Promise<Review[]> {
    return await this.query(
      'SELECT * FROM Review WHERE dealID = ? ORDER BY createdAt DESC',
      [dealID]
    );
  }

  /**
   * Get reviews with user details
   */
  async getReviewsWithDetails(targetUserID: string): Promise<any[]> {
    return await this.query(
      `SELECT 
        r.*,
        u.name as reviewerName,
        u.profileImage as reviewerImage
       FROM Review r
       JOIN User u ON r.reviewerID = u.userID
       WHERE r.targetUserID = ?
       ORDER BY r.createdAt DESC`,
      [targetUserID]
    );
  }

  /**
   * Get average rating for a user
   */
  async getAverageRating(
    targetUserID: string,
    reviewType?: 'buyer_to_seller' | 'seller_to_buyer'
  ): Promise<{ averageRating: number; totalReviews: number }> {
    let query = `SELECT AVG(rating) as avgRating, COUNT(*) as count 
                 FROM Review WHERE targetUserID = ?`;
    const params: any[] = [targetUserID];

    if (reviewType) {
      query += ' AND reviewType = ?';
      params.push(reviewType);
    }

    const result = await this.queryOne(query, params);

    return {
      averageRating: Math.round((result?.avgRating || 0) * 100) / 100,
      totalReviews: result?.count || 0
    };
  }

  /**
   * Delete review
   */
  async deleteReview(reviewID: string): Promise<boolean> {
    const result = await this.execute('DELETE FROM Review WHERE reviewID = ?', [reviewID]);
    return result.changes > 0;
  }

  /**
   * Check if user can review another user for a specific deal
   */
  async canReview(
    reviewerID: string,
    targetUserID: string,
    dealID: string,
    reviewType: 'buyer_to_seller' | 'seller_to_buyer'
  ): Promise<boolean> {
    // Check if deal exists and is completed
    const deal = await this.queryOne(
      'SELECT * FROM Deal WHERE dealID = ? AND status = ?',
      [dealID, 'completed']
    );

    if (!deal) {
      return false;
    }

    // Verify reviewer is part of the deal
    if (reviewType === 'buyer_to_seller') {
      if (deal.buyerID !== reviewerID || deal.sellerID !== targetUserID) {
        return false;
      }
    } else {
      if (deal.sellerID !== reviewerID || deal.buyerID !== targetUserID) {
        return false;
      }
    }

    // Check if review already exists
    const existingReview = await this.queryOne(
      `SELECT reviewID FROM Review 
       WHERE dealID = ? AND reviewerID = ? AND reviewType = ?`,
      [dealID, reviewerID, reviewType]
    );

    return !existingReview;
  }

  /**
   * Get rating distribution for a user
   */
  async getRatingDistribution(targetUserID: string): Promise<Record<number, number>> {
    const results = await this.query(
      `SELECT rating, COUNT(*) as count 
       FROM Review 
       WHERE targetUserID = ? 
       GROUP BY rating 
       ORDER BY rating DESC`,
      [targetUserID]
    );

    const distribution: Record<number, number> = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    results.forEach((row: any) => {
      distribution[row.rating] = row.count;
    });

    return distribution;
  }
}
