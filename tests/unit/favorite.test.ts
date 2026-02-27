/**
 * Favorite system tests
 * Tests Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { FavoriteModel } from '../../src/models/FavoriteModel';
import { DatabaseManager } from '../../src/config/database';

describe('FavoriteModel', () => {
  let favoriteModel: FavoriteModel;
  let db: any;
  const testUserID = 'user_test123';
  const testUserID2 = 'user_test456';
  const testListingID1 = 'listing_test456';
  const testListingID2 = 'listing_test789';

  beforeAll(async () => {
    await DatabaseManager.getInstance().initialize();
    favoriteModel = new FavoriteModel();
    db = DatabaseManager.getInstance().getDatabase();

    // Create test users
    await db.run(`
      INSERT OR IGNORE INTO User (userID, email, name, isVerified, preferredLanguage)
      VALUES (?, ?, ?, ?, ?)
    `, [testUserID, 'test@example.com', 'Test User', 1, 'en']);

    await db.run(`
      INSERT OR IGNORE INTO User (userID, email, name, isVerified, preferredLanguage)
      VALUES (?, ?, ?, ?, ?)
    `, [testUserID2, 'test2@example.com', 'Test User 2', 1, 'en']);

    // Create test category
    await db.run(`
      INSERT OR IGNORE INTO Category (catID, name) VALUES (1, 'Test Category')
    `);

    // Create test products
    await db.run(`
      INSERT OR IGNORE INTO ProductListing (listingID, title, description, price, categoryID, sellerID, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [testListingID1, 'Test Product 1', 'Description 1', 100, 1, testUserID, 'active']);

    await db.run(`
      INSERT OR IGNORE INTO ProductListing (listingID, title, description, price, categoryID, sellerID, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [testListingID2, 'Test Product 2', 'Description 2', 200, 1, testUserID, 'active']);
  });

  afterAll(async () => {
    await DatabaseManager.getInstance().close();
  });

  // Helper function to create test user
  async function createTestUser(userID: string, email: string) {
    await db.run(`
      INSERT OR IGNORE INTO User (userID, email, name, isVerified, preferredLanguage)
      VALUES (?, ?, ?, ?, ?)
    `, [userID, email, `User ${userID}`, 1, 'en']);
  }

  // Helper function to create test listing
  async function createTestListing(listingID: string, title: string) {
    await db.run(`
      INSERT OR IGNORE INTO ProductListing (listingID, title, description, price, categoryID, sellerID, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [listingID, title, `Description for ${title}`, 100, 1, testUserID, 'active']);
  }

  describe('addFavorite', () => {
    it('should add a product to favorites', async () => {
      const favorite = await favoriteModel.addFavorite(testUserID, testListingID1);

      expect(favorite).toBeDefined();
      expect(favorite.userID).toBe(testUserID);
      expect(favorite.listingID).toBe(testListingID1);
      expect(favorite.favID).toBeDefined();
      expect(favorite.createdAt).toBeDefined();
    });

    it('should return existing favorite if already added', async () => {
      const favorite1 = await favoriteModel.addFavorite(testUserID, testListingID2);
      const favorite2 = await favoriteModel.addFavorite(testUserID, testListingID2);

      expect(favorite1.favID).toBe(favorite2.favID);
    });

    it('should allow different users to favorite same product', async () => {
      await createTestUser('user_1', 'user1@test.com');
      await createTestUser('user_2', 'user2@test.com');

      const user1Fav = await favoriteModel.addFavorite('user_1', testListingID1);
      const user2Fav = await favoriteModel.addFavorite('user_2', testListingID1);

      expect(user1Fav.favID).not.toBe(user2Fav.favID);
      expect(user1Fav.listingID).toBe(user2Fav.listingID);
    });
  });

  describe('removeFavorite', () => {
    it('should remove a product from favorites', async () => {
      const uniqueListingID = `listing_remove_${Date.now()}`;
      await createTestListing(uniqueListingID, 'Remove Test 1');
      await favoriteModel.addFavorite(testUserID, uniqueListingID);
      const removed = await favoriteModel.removeFavorite(testUserID, uniqueListingID);

      expect(removed).toBe(true);

      const isFavorited = await favoriteModel.isFavorited(testUserID, uniqueListingID);
      expect(isFavorited).toBe(false);
    });

    it('should return false if favorite does not exist', async () => {
      const uniqueListingID = `nonexistent_listing_${Date.now()}`;
      const removed = await favoriteModel.removeFavorite(testUserID, uniqueListingID);
      expect(removed).toBe(false);
    });
  });

  describe('findById', () => {
    it('should find favorite by ID', async () => {
      const uniqueListingID = `listing_findbyid_${Date.now()}`;
      await createTestListing(uniqueListingID, 'Find By ID Test');
      const created = await favoriteModel.addFavorite(testUserID, uniqueListingID);
      const found = await favoriteModel.findById(created.favID);

      expect(found).toBeDefined();
      expect(found?.favID).toBe(created.favID);
      expect(found?.userID).toBe(testUserID);
    });

    it('should return null for non-existent favorite', async () => {
      const uniqueFavID = `nonexistent_fav_${Date.now()}`;
      const found = await favoriteModel.findById(uniqueFavID);
      expect(found).toBeNull();
    });
  });

  describe('findByUserAndListing', () => {
    it('should find favorite by user and listing', async () => {
      const uniqueListingID = `listing_findby_${Date.now()}`;
      await createTestListing(uniqueListingID, 'Find By Test');
      await favoriteModel.addFavorite(testUserID, uniqueListingID);
      const found = await favoriteModel.findByUserAndListing(testUserID, uniqueListingID);

      expect(found).toBeDefined();
      expect(found?.userID).toBe(testUserID);
      expect(found?.listingID).toBe(uniqueListingID);
    });

    it('should return null if not favorited', async () => {
      const uniqueListingID = `not_favorited_${Date.now()}`;
      const found = await favoriteModel.findByUserAndListing(testUserID, uniqueListingID);
      expect(found).toBeNull();
    });
  });

  describe('findByUser', () => {
    it('should find all favorites for a user', async () => {
      const userID = 'user_findall';
      await createTestUser(userID, 'findall@test.com');
      await createTestListing('listing_1', 'Listing 1');
      await createTestListing('listing_2', 'Listing 2');
      await createTestListing('listing_3', 'Listing 3');

      await favoriteModel.addFavorite(userID, 'listing_1');
      await favoriteModel.addFavorite(userID, 'listing_2');
      await favoriteModel.addFavorite(userID, 'listing_3');

      const favorites = await favoriteModel.findByUser(userID);

      expect(favorites.length).toBeGreaterThanOrEqual(3);
      expect(favorites.every(f => f.userID === userID)).toBe(true);
    });

    it('should return empty array if user has no favorites', async () => {
      await createTestUser('user_no_favorites', 'nofav@test.com');
      const favorites = await favoriteModel.findByUser('user_no_favorites');
      expect(favorites).toEqual([]);
    });
  });

  describe('isFavorited', () => {
    it('should return true if product is favorited', async () => {
      const uniqueListingID = `listing_check_${Date.now()}`;
      await createTestListing(uniqueListingID, 'Check Test 1');
      await favoriteModel.addFavorite(testUserID, uniqueListingID);
      const isFavorited = await favoriteModel.isFavorited(testUserID, uniqueListingID);

      expect(isFavorited).toBe(true);
    });

    it('should return false if product is not favorited', async () => {
      const uniqueListingID = `not_favorited_check_${Date.now()}`;
      const isFavorited = await favoriteModel.isFavorited(testUserID, uniqueListingID);
      expect(isFavorited).toBe(false);
    });
  });

  describe('getFavoriteCount', () => {
    it('should return favorite count for a product', async () => {
      const listingID = 'listing_count_test';
      await createTestListing(listingID, 'Count Test');
      await createTestUser('user_count1', 'count1@test.com');
      await createTestUser('user_count2', 'count2@test.com');
      await createTestUser('user_count3', 'count3@test.com');

      await favoriteModel.addFavorite('user_count1', listingID);
      await favoriteModel.addFavorite('user_count2', listingID);
      await favoriteModel.addFavorite('user_count3', listingID);

      const count = await favoriteModel.getFavoriteCount(listingID);

      expect(count).toBeGreaterThanOrEqual(3);
    });

    it('should return 0 for product with no favorites', async () => {
      const count = await favoriteModel.getFavoriteCount('listing_no_favorites');
      expect(count).toBe(0);
    });
  });

  describe('getUserFavoriteCount', () => {
    it('should return total favorites count for a user', async () => {
      const userID = 'user_total_count';
      await createTestUser(userID, 'totalcount@test.com');
      await createTestListing('listing_a', 'Listing A');
      await createTestListing('listing_b', 'Listing B');

      await favoriteModel.addFavorite(userID, 'listing_a');
      await favoriteModel.addFavorite(userID, 'listing_b');

      const count = await favoriteModel.getUserFavoriteCount(userID);

      expect(count).toBeGreaterThanOrEqual(2);
    });

    it('should return 0 for user with no favorites', async () => {
      await createTestUser('user_no_fav_count', 'nofavcount@test.com');
      const count = await favoriteModel.getUserFavoriteCount('user_no_fav_count');
      expect(count).toBe(0);
    });
  });

  describe('areFavorited', () => {
    it('should batch check if products are favorited', async () => {
      const userID = 'user_batch_check';
      await createTestUser(userID, 'batch@test.com');
      await createTestListing('listing_batch1', 'Batch 1');
      await createTestListing('listing_batch2', 'Batch 2');
      await createTestListing('listing_batch3', 'Batch 3');

      await favoriteModel.addFavorite(userID, 'listing_batch1');
      await favoriteModel.addFavorite(userID, 'listing_batch3');

      const result = await favoriteModel.areFavorited(userID, [
        'listing_batch1',
        'listing_batch2',
        'listing_batch3'
      ]);

      expect(result['listing_batch1']).toBe(true);
      expect(result['listing_batch2']).toBe(false);
      expect(result['listing_batch3']).toBe(true);
    });

    it('should return empty object for empty array', async () => {
      const result = await favoriteModel.areFavorited(testUserID, []);
      expect(result).toEqual({});
    });
  });
});
