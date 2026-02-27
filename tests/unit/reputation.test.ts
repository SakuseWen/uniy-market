import { ReputationService } from '../../src/services/ReputationService';
import { UserModel } from '../../src/models/UserModel';
import { ReviewModel } from '../../src/models/ReviewModel';
import { ProductModel } from '../../src/models/ProductModel';
import { DatabaseManager } from '../../src/config/database';

describe('ReputationService', () => {
  let reputationService: ReputationService;
  let userModel: UserModel;
  let reviewModel: ReviewModel;
  let productModel: ProductModel;
  let testUser: any;
  let reviewer1: any;
  let reviewer2: any;

  beforeAll(async () => {
    const dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();
    
    reputationService = new ReputationService();
    userModel = new UserModel();
    reviewModel = new ReviewModel();
    productModel = new ProductModel();

    // Create test users
    testUser = await userModel.createUser({
      email: 'reputation@test.com',
      name: 'Reputation Test User',
      isVerified: true,
      preferredLanguage: 'en',
      isAdmin: false,
      status: 'active'
    });

    reviewer1 = await userModel.createUser({
      email: 'reviewer1@test.com',
      name: 'Reviewer 1',
      isVerified: true,
      preferredLanguage: 'en',
      isAdmin: false,
      status: 'active'
    });

    reviewer2 = await userModel.createUser({
      email: 'reviewer2@test.com',
      name: 'Reviewer 2',
      isVerified: true,
      preferredLanguage: 'en',
      isAdmin: false,
      status: 'active'
    });

    // Create a test product for reference
    await productModel.createProduct({
      title: 'Test Product',
      description: 'Test Description',
      price: 100,
      stock: 1,
      condition: 'new',
      categoryID: 1,
      sellerID: testUser.userID,
      status: 'active'
    });
  });

  afterAll(async () => {
    const dbManager = DatabaseManager.getInstance();
    await dbManager.close();
  });

  describe('calculateUserReputation', () => {
    it('should return zero reputation for new user', async () => {
      const newUser = await userModel.createUser({
        email: 'newuser@test.com',
        name: 'New User',
        isVerified: true,
        preferredLanguage: 'en',
        isAdmin: false,
        status: 'active'
      });

      const reputation = await reputationService.calculateUserReputation(newUser.userID);

      expect(reputation.userID).toBe(newUser.userID);
      expect(reputation.averageRating).toBe(0);
      expect(reputation.totalReviews).toBe(0);
      expect(reputation.completedTransactions).toBe(0);
      expect(reputation.buyerRating).toBe(0);
      expect(reputation.sellerRating).toBe(0);
    });

    it('should calculate reputation with seller reviews', async () => {
      // Create reviews for testUser as seller
      await reviewModel.createReview({
        rating: 5,
        comment: 'Great seller!',
        reviewerID: reviewer1.userID,
        targetUserID: testUser.userID,
        reviewType: 'buyer_to_seller'
      });

      await reviewModel.createReview({
        rating: 4,
        comment: 'Good seller',
        reviewerID: reviewer2.userID,
        targetUserID: testUser.userID,
        reviewType: 'buyer_to_seller'
      });

      const reputation = await reputationService.calculateUserReputation(testUser.userID);

      expect(reputation.sellerRating).toBe(4.5); // (5 + 4) / 2
      expect(reputation.totalReviews).toBe(2);
      expect(reputation.averageRating).toBe(4.5);
    });

    it('should calculate reputation with buyer reviews', async () => {
      const buyer = await userModel.createUser({
        email: 'buyer@test.com',
        name: 'Test Buyer',
        isVerified: true,
        preferredLanguage: 'en',
        isAdmin: false,
        status: 'active'
      });

      // Create reviews for buyer
      await reviewModel.createReview({
        rating: 5,
        reviewerID: testUser.userID,
        targetUserID: buyer.userID,
        reviewType: 'seller_to_buyer'
      });

      const reputation = await reputationService.calculateUserReputation(buyer.userID);

      expect(reputation.buyerRating).toBe(5);
      expect(reputation.totalReviews).toBe(1);
      expect(reputation.averageRating).toBe(5);
    });

    it('should calculate weighted average for mixed reviews', async () => {
      const mixedUser = await userModel.createUser({
        email: 'mixed@test.com',
        name: 'Mixed User',
        isVerified: true,
        preferredLanguage: 'en',
        isAdmin: false,
        status: 'active'
      });

      // Add seller reviews (5, 4)
      await reviewModel.createReview({
        rating: 5,
        reviewerID: reviewer1.userID,
        targetUserID: mixedUser.userID,
        reviewType: 'buyer_to_seller'
      });

      await reviewModel.createReview({
        rating: 4,
        reviewerID: reviewer2.userID,
        targetUserID: mixedUser.userID,
        reviewType: 'buyer_to_seller'
      });

      // Add buyer review (3)
      await reviewModel.createReview({
        rating: 3,
        reviewerID: testUser.userID,
        targetUserID: mixedUser.userID,
        reviewType: 'seller_to_buyer'
      });

      const reputation = await reputationService.calculateUserReputation(mixedUser.userID);

      // Weighted average: (5 + 4 + 3) / 3 = 4
      expect(reputation.averageRating).toBe(4);
      expect(reputation.totalReviews).toBe(3);
      expect(reputation.sellerRating).toBe(4.5); // (5 + 4) / 2
      expect(reputation.buyerRating).toBe(3);
    });
  });

  describe('getDetailedReputation', () => {
    it('should return detailed reputation breakdown', async () => {
      const detailed = await reputationService.getDetailedReputation(testUser.userID);

      expect(detailed.reputation).toBeDefined();
      expect(detailed.buyerStats).toBeDefined();
      expect(detailed.sellerStats).toBeDefined();
      expect(detailed.transactionStats).toBeDefined();

      expect(detailed.buyerStats.ratingDistribution).toBeDefined();
      expect(detailed.sellerStats.ratingDistribution).toBeDefined();
    });

    it('should include rating distribution', async () => {
      const detailed = await reputationService.getDetailedReputation(testUser.userID);

      // Check distribution structure
      expect(detailed.sellerStats.ratingDistribution).toHaveProperty('1');
      expect(detailed.sellerStats.ratingDistribution).toHaveProperty('2');
      expect(detailed.sellerStats.ratingDistribution).toHaveProperty('3');
      expect(detailed.sellerStats.ratingDistribution).toHaveProperty('4');
      expect(detailed.sellerStats.ratingDistribution).toHaveProperty('5');
    });
  });

  describe('getReputationLevel', () => {
    it('should return "new" for user with no reviews', () => {
      const reputation = {
        userID: 'test',
        averageRating: 0,
        totalReviews: 0,
        completedTransactions: 0,
        buyerRating: 0,
        sellerRating: 0
      };

      const level = reputationService.getReputationLevel(reputation);
      expect(level).toBe('new');
    });

    it('should return appropriate level based on reputation', () => {
      const platinumRep = {
        userID: 'test',
        averageRating: 4.8,
        totalReviews: 50,
        completedTransactions: 50,
        buyerRating: 4.8,
        sellerRating: 4.8
      };

      const level = reputationService.getReputationLevel(platinumRep);
      expect(['platinum', 'gold']).toContain(level);
    });

    it('should return lower level for poor reputation', () => {
      const lowRep = {
        userID: 'test',
        averageRating: 2.0,
        totalReviews: 5,
        completedTransactions: 2,
        buyerRating: 2.0,
        sellerRating: 2.0
      };

      const level = reputationService.getReputationLevel(lowRep);
      expect(['new', 'bronze']).toContain(level);
    });
  });

  describe('hasGoodReputation', () => {
    it('should return false for new user', () => {
      const reputation = {
        userID: 'test',
        averageRating: 0,
        totalReviews: 0,
        completedTransactions: 0,
        buyerRating: 0,
        sellerRating: 0
      };

      expect(reputationService.hasGoodReputation(reputation)).toBe(false);
    });

    it('should return true for user with good reputation', () => {
      const reputation = {
        userID: 'test',
        averageRating: 4.5,
        totalReviews: 10,
        completedTransactions: 5,
        buyerRating: 4.5,
        sellerRating: 4.5
      };

      expect(reputationService.hasGoodReputation(reputation)).toBe(true);
    });

    it('should return false if criteria not met', () => {
      const reputation = {
        userID: 'test',
        averageRating: 4.5,
        totalReviews: 3, // Less than 5
        completedTransactions: 5,
        buyerRating: 4.5,
        sellerRating: 4.5
      };

      expect(reputationService.hasGoodReputation(reputation)).toBe(false);
    });
  });

  describe('getReputationBadge', () => {
    it('should return badge information', () => {
      const reputation = {
        userID: 'test',
        averageRating: 4.5,
        totalReviews: 10,
        completedTransactions: 5,
        buyerRating: 4.5,
        sellerRating: 4.5
      };

      const badge = reputationService.getReputationBadge(reputation);

      expect(badge).toHaveProperty('level');
      expect(badge).toHaveProperty('color');
      expect(badge).toHaveProperty('icon');
      expect(badge).toHaveProperty('description');
    });

    it('should return new badge for new user', () => {
      const reputation = {
        userID: 'test',
        averageRating: 0,
        totalReviews: 0,
        completedTransactions: 0,
        buyerRating: 0,
        sellerRating: 0
      };

      const badge = reputationService.getReputationBadge(reputation);
      expect(badge.level).toBe('new');
      expect(badge.icon).toBe('🆕');
    });
  });

  describe('compareReputations', () => {
    it('should compare two reputations', () => {
      const rep1 = {
        userID: 'user1',
        averageRating: 4.5,
        totalReviews: 10,
        completedTransactions: 5,
        buyerRating: 4.5,
        sellerRating: 4.5
      };

      const rep2 = {
        userID: 'user2',
        averageRating: 3.5,
        totalReviews: 5,
        completedTransactions: 2,
        buyerRating: 3.5,
        sellerRating: 3.5
      };

      const comparison = reputationService.compareReputations(rep1, rep2);

      expect(comparison.betterUser).toBe('user1');
      expect(comparison.comparison).toBe('user1_better');
      expect(comparison.difference).toBeGreaterThan(0);
    });

    it('should handle equal reputations', () => {
      const rep1 = {
        userID: 'user1',
        averageRating: 4.0,
        totalReviews: 10,
        completedTransactions: 5,
        buyerRating: 4.0,
        sellerRating: 4.0
      };

      const rep2 = {
        userID: 'user2',
        averageRating: 4.0,
        totalReviews: 10,
        completedTransactions: 5,
        buyerRating: 4.0,
        sellerRating: 4.0
      };

      const comparison = reputationService.compareReputations(rep1, rep2);

      expect(comparison.betterUser).toBeNull();
      expect(comparison.comparison).toBe('equal');
      expect(comparison.difference).toBe(0);
    });
  });

  describe('updateReputationAfterReview', () => {
    it('should recalculate reputation after new review', async () => {
      const user = await userModel.createUser({
        email: 'update@test.com',
        name: 'Update Test',
        isVerified: true,
        preferredLanguage: 'en',
        isAdmin: false,
        status: 'active'
      });

      // Initial reputation
      const initialRep = await reputationService.calculateUserReputation(user.userID);
      expect(initialRep.totalReviews).toBe(0);

      // Add a review
      await reviewModel.createReview({
        rating: 5,
        reviewerID: testUser.userID,
        targetUserID: user.userID,
        reviewType: 'buyer_to_seller'
      });

      // Update reputation
      const updatedRep = await reputationService.updateReputationAfterReview(user.userID);
      expect(updatedRep.totalReviews).toBe(1);
      expect(updatedRep.averageRating).toBe(5);
    });
  });
});
