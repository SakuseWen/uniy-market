import { ReviewModel } from '../../src/models/ReviewModel';
import { UserModel } from '../../src/models/UserModel';
import { DatabaseManager } from '../../src/config/database';

describe('ReviewModel', () => {
  let reviewModel: ReviewModel;
  let userModel: UserModel;
  let testUser1: any;
  let testUser2: any;

  beforeAll(async () => {
    const dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();
    reviewModel = new ReviewModel();
    userModel = new UserModel();

    // Create test users
    testUser1 = await userModel.createUser({
      email: 'reviewer@test.com',
      name: 'Test Reviewer',
      isVerified: true,
      preferredLanguage: 'en',
      isAdmin: false,
      status: 'active'
    });

    testUser2 = await userModel.createUser({
      email: 'target@test.com',
      name: 'Test Target',
      isVerified: true,
      preferredLanguage: 'en',
      isAdmin: false,
      status: 'active'
    });
  });

  afterAll(async () => {
    const dbManager = DatabaseManager.getInstance();
    await dbManager.close();
  });

  describe('createReview', () => {
    it('should create a review with valid data', async () => {
      const reviewData = {
        rating: 5,
        comment: 'Great seller!',
        reviewerID: testUser1.userID,
        targetUserID: testUser2.userID,
        reviewType: 'buyer_to_seller' as const
      };

      const review = await reviewModel.createReview(reviewData);

      expect(review).toBeDefined();
      expect(review.reviewID).toBeDefined();
      expect(review.rating).toBe(5);
      expect(review.comment).toBe('Great seller!');
      expect(review.reviewerID).toBe(testUser1.userID);
      expect(review.targetUserID).toBe(testUser2.userID);
      expect(review.reviewType).toBe('buyer_to_seller');
      expect(review.createdAt).toBeDefined();
    });

    it('should create a review without comment', async () => {
      const reviewData = {
        rating: 4,
        reviewerID: testUser1.userID,
        targetUserID: testUser2.userID,
        reviewType: 'buyer_to_seller' as const
      };

      const review = await reviewModel.createReview(reviewData);

      expect(review).toBeDefined();
      expect(review.rating).toBe(4);
      expect(review.comment).toBeNull();
    });

    it('should reject rating below 1', async () => {
      const reviewData = {
        rating: 0,
        reviewerID: testUser1.userID,
        targetUserID: testUser2.userID,
        reviewType: 'buyer_to_seller' as const
      };

      await expect(reviewModel.createReview(reviewData)).rejects.toThrow(
        'Rating must be between 1 and 5'
      );
    });

    it('should reject rating above 5', async () => {
      const reviewData = {
        rating: 6,
        reviewerID: testUser1.userID,
        targetUserID: testUser2.userID,
        reviewType: 'buyer_to_seller' as const
      };

      await expect(reviewModel.createReview(reviewData)).rejects.toThrow(
        'Rating must be between 1 and 5'
      );
    });

    it('should reject invalid review type', async () => {
      const reviewData = {
        rating: 5,
        reviewerID: testUser1.userID,
        targetUserID: testUser2.userID,
        reviewType: 'invalid_type' as any
      };

      await expect(reviewModel.createReview(reviewData)).rejects.toThrow(
        'Invalid review type'
      );
    });

    it('should reject self-review', async () => {
      const reviewData = {
        rating: 5,
        reviewerID: testUser1.userID,
        targetUserID: testUser1.userID,
        reviewType: 'buyer_to_seller' as const
      };

      await expect(reviewModel.createReview(reviewData)).rejects.toThrow(
        'Cannot review yourself'
      );
    });
  });

  describe('getReviewById', () => {
    it('should retrieve a review by ID', async () => {
      const reviewData = {
        rating: 5,
        comment: 'Excellent!',
        reviewerID: testUser1.userID,
        targetUserID: testUser2.userID,
        reviewType: 'buyer_to_seller' as const
      };

      const created = await reviewModel.createReview(reviewData);
      const retrieved = await reviewModel.getReviewById(created.reviewID);

      expect(retrieved).toBeDefined();
      expect(retrieved?.reviewID).toBe(created.reviewID);
      expect(retrieved?.rating).toBe(5);
    });

    it('should return null for non-existent review', async () => {
      const review = await reviewModel.getReviewById('non_existent_id');
      expect(review).toBeFalsy();
    });
  });

  describe('getReviewsByTargetUser', () => {
    beforeAll(async () => {
      // Create multiple reviews for testUser2
      await reviewModel.createReview({
        rating: 5,
        reviewerID: testUser1.userID,
        targetUserID: testUser2.userID,
        reviewType: 'buyer_to_seller' as const
      });

      await reviewModel.createReview({
        rating: 4,
        reviewerID: testUser1.userID,
        targetUserID: testUser2.userID,
        reviewType: 'seller_to_buyer' as const
      });
    });

    it('should get all reviews for a user', async () => {
      const reviews = await reviewModel.getReviewsByTargetUser(testUser2.userID);
      expect(reviews.length).toBeGreaterThan(0);
    });

    it('should filter reviews by type', async () => {
      const buyerReviews = await reviewModel.getReviewsByTargetUser(
        testUser2.userID,
        'seller_to_buyer'
      );
      expect(buyerReviews.every((r: any) => r.reviewType === 'seller_to_buyer')).toBe(true);

      const sellerReviews = await reviewModel.getReviewsByTargetUser(
        testUser2.userID,
        'buyer_to_seller'
      );
      expect(sellerReviews.every((r: any) => r.reviewType === 'buyer_to_seller')).toBe(true);
    });
  });

  describe('getReviewsByReviewer', () => {
    it('should get all reviews written by a user', async () => {
      const reviews = await reviewModel.getReviewsByReviewer(testUser1.userID);
      expect(reviews.length).toBeGreaterThan(0);
      expect(reviews.every((r: any) => r.reviewerID === testUser1.userID)).toBe(true);
    });
  });

  describe('getAverageRating', () => {
    it('should calculate average rating correctly', async () => {
      // Create a new user for clean average calculation
      const newUser = await userModel.createUser({
        email: 'avgtest@test.com',
        name: 'Average Test',
        isVerified: true,
        preferredLanguage: 'en',
        isAdmin: false,
        status: 'active'
      });

      // Create reviews with known ratings
      await reviewModel.createReview({
        rating: 5,
        reviewerID: testUser1.userID,
        targetUserID: newUser.userID,
        reviewType: 'buyer_to_seller' as const
      });

      await reviewModel.createReview({
        rating: 3,
        reviewerID: testUser2.userID,
        targetUserID: newUser.userID,
        reviewType: 'buyer_to_seller' as const
      });

      const result = await reviewModel.getAverageRating(newUser.userID);
      expect(result.averageRating).toBe(4); // (5 + 3) / 2 = 4
      expect(result.totalReviews).toBe(2);
    });

    it('should calculate average rating by type', async () => {
      const newUser = await userModel.createUser({
        email: 'avgtype@test.com',
        name: 'Average Type Test',
        isVerified: true,
        preferredLanguage: 'en',
        isAdmin: false,
        status: 'active'
      });

      await reviewModel.createReview({
        rating: 5,
        reviewerID: testUser1.userID,
        targetUserID: newUser.userID,
        reviewType: 'buyer_to_seller' as const
      });

      await reviewModel.createReview({
        rating: 2,
        reviewerID: testUser2.userID,
        targetUserID: newUser.userID,
        reviewType: 'seller_to_buyer' as const
      });

      const sellerRating = await reviewModel.getAverageRating(newUser.userID, 'buyer_to_seller');
      expect(sellerRating.averageRating).toBe(5);
      expect(sellerRating.totalReviews).toBe(1);

      const buyerRating = await reviewModel.getAverageRating(newUser.userID, 'seller_to_buyer');
      expect(buyerRating.averageRating).toBe(2);
      expect(buyerRating.totalReviews).toBe(1);
    });

    it('should return 0 for user with no reviews', async () => {
      const newUser = await userModel.createUser({
        email: 'noreviews@test.com',
        name: 'No Reviews',
        isVerified: true,
        preferredLanguage: 'en',
        isAdmin: false,
        status: 'active'
      });

      const result = await reviewModel.getAverageRating(newUser.userID);
      expect(result.averageRating).toBe(0);
      expect(result.totalReviews).toBe(0);
    });
  });

  describe('getRatingDistribution', () => {
    it('should return rating distribution', async () => {
      const newUser = await userModel.createUser({
        email: 'distribution@test.com',
        name: 'Distribution Test',
        isVerified: true,
        preferredLanguage: 'en',
        isAdmin: false,
        status: 'active'
      });

      // Create reviews with different ratings
      await reviewModel.createReview({
        rating: 5,
        reviewerID: testUser1.userID,
        targetUserID: newUser.userID,
        reviewType: 'buyer_to_seller' as const
      });

      await reviewModel.createReview({
        rating: 5,
        reviewerID: testUser2.userID,
        targetUserID: newUser.userID,
        reviewType: 'buyer_to_seller' as const
      });

      await reviewModel.createReview({
        rating: 4,
        reviewerID: testUser1.userID,
        targetUserID: newUser.userID,
        reviewType: 'seller_to_buyer' as const
      });

      const distribution = await reviewModel.getRatingDistribution(newUser.userID);
      expect(distribution[5]).toBe(2);
      expect(distribution[4]).toBe(1);
      expect(distribution[3]).toBe(0);
      expect(distribution[2]).toBe(0);
      expect(distribution[1]).toBe(0);
    });
  });

  describe('deleteReview', () => {
    it('should delete a review', async () => {
      const review = await reviewModel.createReview({
        rating: 3,
        reviewerID: testUser1.userID,
        targetUserID: testUser2.userID,
        reviewType: 'buyer_to_seller' as const
      });

      const deleted = await reviewModel.deleteReview(review.reviewID);
      expect(deleted).toBe(true);

      const retrieved = await reviewModel.getReviewById(review.reviewID);
      expect(retrieved).toBeFalsy();
    });

    it('should return false for non-existent review', async () => {
      const deleted = await reviewModel.deleteReview('non_existent_id');
      expect(deleted).toBe(false);
    });
  });

  describe('getReviewsWithDetails', () => {
    it('should get reviews with reviewer details', async () => {
      const reviews = await reviewModel.getReviewsWithDetails(testUser2.userID);
      expect(reviews.length).toBeGreaterThan(0);
      
      // Check that reviewer details are included
      reviews.forEach((review: any) => {
        expect(review.reviewerName).toBeDefined();
      });
    });
  });
});
