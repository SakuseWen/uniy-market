import express, { Request, Response } from 'express';
import { ReviewModel } from '../models/ReviewModel';
import { UserModel } from '../models/UserModel';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse } from '../types';
import { moderateReviewContent, logFlaggedContent } from '../middleware/contentModeration';

const router = express.Router();
const reviewModel = new ReviewModel();
const userModel = new UserModel();

/**
 * POST /api/reviews
 * Create a new review
 */
router.post('/', authenticateToken, moderateReviewContent, logFlaggedContent, async (req: Request, res: Response) => {
  try {
    const { rating, comment, targetUserID, dealID, reviewType } = req.body;
    const reviewerID = (req as any).user.userID;

    // Validate required fields
    if (!rating || !targetUserID || !reviewType) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: rating, targetUserID, reviewType'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Rating must be between 1 and 5'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    // Validate review type
    if (!['buyer_to_seller', 'seller_to_buyer'].includes(reviewType)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid review type. Must be buyer_to_seller or seller_to_buyer'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    // Check if target user exists
    const targetUser = await userModel.getUserById(targetUserID);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Target user not found'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    // Check if user can review (if dealID is provided)
    if (dealID) {
      const canReview = await reviewModel.canReview(reviewerID, targetUserID, dealID, reviewType);
      if (!canReview) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Cannot review: deal not found, not completed, or review already exists'
          },
          timestamp: new Date().toISOString()
        } as ApiResponse);
      }
    }

    // Create review
    const review = await reviewModel.createReview({
      rating,
      comment,
      reviewerID,
      targetUserID,
      dealID,
      reviewType
    });

    res.status(201).json({
      success: true,
      data: review,
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to create review'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * GET /api/reviews/user/:userId
 * Get reviews for a specific user
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;

    // Validate review type if provided
    if (type && !['buyer_to_seller', 'seller_to_buyer'].includes(type as string)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid review type'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const reviews = await reviewModel.getReviewsWithDetails(userId);

    // Filter by type if specified
    const filteredReviews = type
      ? reviews.filter((r: any) => r.reviewType === type)
      : reviews;

    // Get average ratings
    const buyerRating = await reviewModel.getAverageRating(userId, 'seller_to_buyer');
    const sellerRating = await reviewModel.getAverageRating(userId, 'buyer_to_seller');
    const overallRating = await reviewModel.getAverageRating(userId);

    // Get rating distribution
    const distribution = await reviewModel.getRatingDistribution(userId);

    res.json({
      success: true,
      data: {
        reviews: filteredReviews,
        statistics: {
          overall: overallRating,
          asBuyer: buyerRating,
          asSeller: sellerRating,
          distribution
        }
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch reviews'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * GET /api/reviews/deal/:dealId
 * Get reviews for a specific deal
 */
router.get('/deal/:dealId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;

    const reviews = await reviewModel.getReviewsByDeal(dealId);

    res.json({
      success: true,
      data: reviews,
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching deal reviews:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch deal reviews'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * GET /api/reviews/my-reviews
 * Get reviews written by the current user
 */
router.get('/my-reviews', authenticateToken, async (req: Request, res: Response) => {
  try {
    const reviewerID = (req as any).user.userID;

    const reviews = await reviewModel.getReviewsByReviewer(reviewerID);

    res.json({
      success: true,
      data: reviews,
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch user reviews'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * GET /api/reviews/:reviewId
 * Get a specific review by ID
 */
router.get('/:reviewId', async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;

    const review = await reviewModel.getReviewById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Review not found'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: review,
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching review:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch review'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * DELETE /api/reviews/:reviewId
 * Delete a review (only by reviewer or admin)
 */
router.delete('/:reviewId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const userID = (req as any).user.userID;
    const isAdmin = (req as any).user.isAdmin;

    const review = await reviewModel.getReviewById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Review not found'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    // Check if user is the reviewer or an admin
    if (review.reviewerID !== userID && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to delete this review'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const deleted = await reviewModel.deleteReview(reviewId);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete review'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: { message: 'Review deleted successfully' },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to delete review'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * GET /api/reviews/can-review/:dealId
 * Check if current user can review for a specific deal
 */
router.get('/can-review/:dealId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const { targetUserID, reviewType } = req.query;
    const reviewerID = (req as any).user.userID;

    if (!targetUserID || !reviewType) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required query parameters: targetUserID, reviewType'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const canReview = await reviewModel.canReview(
      reviewerID,
      targetUserID as string,
      dealId,
      reviewType as 'buyer_to_seller' | 'seller_to_buyer'
    );

    res.json({
      success: true,
      data: { canReview },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error checking review permission:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to check review permission'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

export default router;
