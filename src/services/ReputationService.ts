import { ReviewModel } from '../models/ReviewModel';
import { DealModel } from '../models/DealModel';
import { UserReputation } from '../types';

/**
 * ReputationService handles user reputation calculation and management
 * Implements Requirements 5.3, 5.4, 5.5
 */
export class ReputationService {
  private reviewModel: ReviewModel;
  private dealModel: DealModel;

  constructor() {
    this.reviewModel = new ReviewModel();
    this.dealModel = new DealModel();
  }

  /**
   * Calculate comprehensive reputation for a user
   * Includes separate buyer and seller ratings, total reviews, and completed transactions
   */
  async calculateUserReputation(userID: string): Promise<UserReputation> {
    // Get buyer rating (reviews received as buyer from sellers)
    const buyerRating = await this.reviewModel.getAverageRating(userID, 'seller_to_buyer');

    // Get seller rating (reviews received as seller from buyers)
    const sellerRating = await this.reviewModel.getAverageRating(userID, 'buyer_to_seller');

    // Calculate overall average rating
    const totalReviews = buyerRating.totalReviews + sellerRating.totalReviews;
    let overallRating = 0;

    if (totalReviews > 0) {
      const buyerWeightedRating = buyerRating.averageRating * buyerRating.totalReviews;
      const sellerWeightedRating = sellerRating.averageRating * sellerRating.totalReviews;
      overallRating = (buyerWeightedRating + sellerWeightedRating) / totalReviews;
      overallRating = Math.round(overallRating * 100) / 100; // Round to 2 decimal places
    }

    // Get completed transactions count
    const completedTransactions = await this.dealModel.getCompletedDealsCount(userID);

    return {
      userID,
      averageRating: overallRating,
      totalReviews,
      completedTransactions,
      buyerRating: buyerRating.averageRating,
      sellerRating: sellerRating.averageRating
    };
  }

  /**
   * Get detailed reputation breakdown for a user
   */
  async getDetailedReputation(userID: string): Promise<{
    reputation: UserReputation;
    buyerStats: {
      averageRating: number;
      totalReviews: number;
      ratingDistribution: Record<number, number>;
    };
    sellerStats: {
      averageRating: number;
      totalReviews: number;
      ratingDistribution: Record<number, number>;
    };
    transactionStats: {
      totalCompleted: number;
      asBuyer: number;
      asSeller: number;
    };
  }> {
    // Get overall reputation
    const reputation = await this.calculateUserReputation(userID);

    // Get buyer statistics
    const buyerRating = await this.reviewModel.getAverageRating(userID, 'seller_to_buyer');
    const buyerReviews = await this.reviewModel.getReviewsByTargetUser(userID, 'seller_to_buyer');
    const buyerDistribution = this.calculateDistribution(buyerReviews);

    // Get seller statistics
    const sellerRating = await this.reviewModel.getAverageRating(userID, 'buyer_to_seller');
    const sellerReviews = await this.reviewModel.getReviewsByTargetUser(userID, 'buyer_to_seller');
    const sellerDistribution = this.calculateDistribution(sellerReviews);

    // Get transaction statistics
    const buyerDeals = await this.dealModel.getDealsByBuyer(userID);
    const sellerDeals = await this.dealModel.getDealsBySeller(userID);
    const completedBuyerDeals = buyerDeals.filter(d => d.status === 'completed').length;
    const completedSellerDeals = sellerDeals.filter(d => d.status === 'completed').length;

    return {
      reputation,
      buyerStats: {
        averageRating: buyerRating.averageRating,
        totalReviews: buyerRating.totalReviews,
        ratingDistribution: buyerDistribution
      },
      sellerStats: {
        averageRating: sellerRating.averageRating,
        totalReviews: sellerRating.totalReviews,
        ratingDistribution: sellerDistribution
      },
      transactionStats: {
        totalCompleted: completedBuyerDeals + completedSellerDeals,
        asBuyer: completedBuyerDeals,
        asSeller: completedSellerDeals
      }
    };
  }

  /**
   * Calculate rating distribution from reviews
   */
  private calculateDistribution(reviews: any[]): Record<number, number> {
    const distribution: Record<number, number> = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    reviews.forEach(review => {
      const rating = review.rating;
      if (rating >= 1 && rating <= 5 && distribution[rating] !== undefined) {
        distribution[rating] = (distribution[rating] || 0) + 1;
      }
    });

    return distribution;
  }

  /**
   * Get reputation level based on rating and transaction count
   * Returns a level string: 'new', 'bronze', 'silver', 'gold', 'platinum'
   */
  getReputationLevel(reputation: UserReputation): string {
    const { averageRating, totalReviews, completedTransactions } = reputation;

    // New user with no reviews
    if (totalReviews === 0) {
      return 'new';
    }

    // Calculate reputation score (weighted by reviews and transactions)
    const reviewWeight = 0.7;
    const transactionWeight = 0.3;
    const normalizedRating = averageRating / 5; // Normalize to 0-1
    const normalizedTransactions = Math.min(completedTransactions / 50, 1); // Cap at 50 transactions

    const reputationScore = 
      (normalizedRating * reviewWeight) + 
      (normalizedTransactions * transactionWeight);

    // Determine level based on score
    if (reputationScore >= 0.8) return 'platinum';
    if (reputationScore >= 0.6) return 'gold';
    if (reputationScore >= 0.4) return 'silver';
    if (reputationScore >= 0.2) return 'bronze';
    return 'new';
  }

  /**
   * Check if user has good reputation (for trust indicators)
   */
  hasGoodReputation(reputation: UserReputation): boolean {
    // Good reputation criteria:
    // - At least 5 reviews
    // - Average rating >= 4.0
    // - At least 3 completed transactions
    return (
      reputation.totalReviews >= 5 &&
      reputation.averageRating >= 4.0 &&
      reputation.completedTransactions >= 3
    );
  }

  /**
   * Get reputation badge information
   */
  getReputationBadge(reputation: UserReputation): {
    level: string;
    color: string;
    icon: string;
    description: string;
  } {
    const level = this.getReputationLevel(reputation);

    const badges: Record<string, { color: string; icon: string; description: string }> = {
      new: {
        color: '#gray',
        icon: '🆕',
        description: 'New member'
      },
      bronze: {
        color: '#CD7F32',
        icon: '🥉',
        description: 'Bronze member'
      },
      silver: {
        color: '#C0C0C0',
        icon: '🥈',
        description: 'Silver member'
      },
      gold: {
        color: '#FFD700',
        icon: '🥇',
        description: 'Gold member'
      },
      platinum: {
        color: '#E5E4E2',
        icon: '💎',
        description: 'Platinum member'
      }
    };

    const badge = badges[level];
    
    if (!badge) {
      // Fallback to 'new' badge if level not found
      return {
        level: 'new',
        color: '#gray',
        icon: '🆕',
        description: 'New member'
      };
    }

    return {
      level,
      color: badge.color,
      icon: badge.icon,
      description: badge.description
    };
  }

  /**
   * Update reputation after a new review is added
   * This can be called as a hook after review creation
   */
  async updateReputationAfterReview(targetUserID: string): Promise<UserReputation> {
    return await this.calculateUserReputation(targetUserID);
  }

  /**
   * Update reputation after a deal is completed
   * This can be called as a hook after deal completion
   */
  async updateReputationAfterDeal(userID: string): Promise<UserReputation> {
    return await this.calculateUserReputation(userID);
  }

  /**
   * Compare two users' reputations
   */
  compareReputations(rep1: UserReputation, rep2: UserReputation): {
    betterUser: string | null;
    difference: number;
    comparison: string;
  } {
    const score1 = this.calculateReputationScore(rep1);
    const score2 = this.calculateReputationScore(rep2);
    const difference = Math.abs(score1 - score2);

    let betterUser: string | null = null;
    let comparison = 'equal';

    if (score1 > score2) {
      betterUser = rep1.userID;
      comparison = 'user1_better';
    } else if (score2 > score1) {
      betterUser = rep2.userID;
      comparison = 'user2_better';
    }

    return {
      betterUser,
      difference: Math.round(difference * 100) / 100,
      comparison
    };
  }

  /**
   * Calculate a single reputation score for comparison
   */
  private calculateReputationScore(reputation: UserReputation): number {
    const ratingWeight = 0.5;
    const reviewCountWeight = 0.3;
    const transactionWeight = 0.2;

    const normalizedRating = reputation.averageRating / 5;
    const normalizedReviews = Math.min(reputation.totalReviews / 20, 1);
    const normalizedTransactions = Math.min(reputation.completedTransactions / 50, 1);

    return (
      normalizedRating * ratingWeight +
      normalizedReviews * reviewCountWeight +
      normalizedTransactions * transactionWeight
    );
  }
}
