import { DealModel } from '../../src/models/DealModel';
import { UserModel } from '../../src/models/UserModel';
import { ProductModel } from '../../src/models/ProductModel';
import { DatabaseManager } from '../../src/config/database';

describe('DealModel', () => {
  let dealModel: DealModel;
  let userModel: UserModel;
  let productModel: ProductModel;
  let buyer: any;
  let seller: any;
  let product: any;

  beforeAll(async () => {
    const dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();
    
    dealModel = new DealModel();
    userModel = new UserModel();
    productModel = new ProductModel();

    // Create test users
    buyer = await userModel.createUser({
      email: 'buyer@test.com',
      name: 'Test Buyer',
      isVerified: true,
      preferredLanguage: 'en',
      isAdmin: false,
      status: 'active'
    });

    seller = await userModel.createUser({
      email: 'seller@test.com',
      name: 'Test Seller',
      isVerified: true,
      preferredLanguage: 'en',
      isAdmin: false,
      status: 'active'
    });

    // Create test product
    product = await productModel.createProduct({
      title: 'Test Product',
      description: 'Test Description',
      price: 100,
      stock: 1,
      condition: 'new',
      categoryID: 1,
      sellerID: seller.userID,
      status: 'active'
    });
  });

  afterAll(async () => {
    const dbManager = DatabaseManager.getInstance();
    await dbManager.close();
  });

  describe('createDeal', () => {
    it('should create a deal with valid data', async () => {
      const dealData = {
        listingID: product.listingID,
        buyerID: buyer.userID,
        sellerID: seller.userID,
        transactionDate: new Date().toISOString(),
        status: 'pending' as const,
        finalPrice: 100
      };

      const deal = await dealModel.createDeal(dealData);

      expect(deal).toBeDefined();
      expect(deal.dealID).toBeDefined();
      expect(deal.listingID).toBe(product.listingID);
      expect(deal.buyerID).toBe(buyer.userID);
      expect(deal.sellerID).toBe(seller.userID);
      expect(deal.status).toBe('pending');
      expect(deal.finalPrice).toBe(100);
      expect(deal.createdAt).toBeDefined();
      expect(deal.updatedAt).toBeDefined();
    });

    it('should create a deal with default status', async () => {
      const dealData = {
        listingID: product.listingID,
        buyerID: buyer.userID,
        sellerID: seller.userID,
        transactionDate: new Date().toISOString()
      };

      const deal = await dealModel.createDeal(dealData as any);

      expect(deal.status).toBe('pending');
    });

    it('should create a deal with notes', async () => {
      const dealData = {
        listingID: product.listingID,
        buyerID: buyer.userID,
        sellerID: seller.userID,
        transactionDate: new Date().toISOString(),
        status: 'pending' as const,
        notes: 'Meet at campus'
      };

      const deal = await dealModel.createDeal(dealData);

      expect(deal.notes).toBe('Meet at campus');
    });
  });

  describe('getDealById', () => {
    it('should retrieve a deal by ID', async () => {
      const created = await dealModel.createDeal({
        listingID: product.listingID,
        buyerID: buyer.userID,
        sellerID: seller.userID,
        transactionDate: new Date().toISOString(),
        status: 'pending' as const
      });

      const retrieved = await dealModel.getDealById(created.dealID);

      expect(retrieved).toBeDefined();
      expect(retrieved?.dealID).toBe(created.dealID);
    });

    it('should return null for non-existent deal', async () => {
      const deal = await dealModel.getDealById('non_existent_id');
      expect(deal).toBeFalsy();
    });
  });

  describe('getDealsByBuyer', () => {
    it('should get all deals for a buyer', async () => {
      const deals = await dealModel.getDealsByBuyer(buyer.userID);
      expect(deals.length).toBeGreaterThan(0);
      expect(deals.every((d: any) => d.buyerID === buyer.userID)).toBe(true);
    });
  });

  describe('getDealsBySeller', () => {
    it('should get all deals for a seller', async () => {
      const deals = await dealModel.getDealsBySeller(seller.userID);
      expect(deals.length).toBeGreaterThan(0);
      expect(deals.every((d: any) => d.sellerID === seller.userID)).toBe(true);
    });
  });

  describe('getDealsByUser', () => {
    it('should get all deals for a user (as buyer or seller)', async () => {
      const buyerDeals = await dealModel.getDealsByUser(buyer.userID);
      expect(buyerDeals.length).toBeGreaterThan(0);

      const sellerDeals = await dealModel.getDealsByUser(seller.userID);
      expect(sellerDeals.length).toBeGreaterThan(0);
    });
  });

  describe('getDealsByListing', () => {
    it('should get all deals for a product listing', async () => {
      const deals = await dealModel.getDealsByListing(product.listingID);
      expect(deals.length).toBeGreaterThan(0);
      expect(deals.every((d: any) => d.listingID === product.listingID)).toBe(true);
    });
  });

  describe('updateDealStatus', () => {
    it('should update deal status to completed', async () => {
      const deal = await dealModel.createDeal({
        listingID: product.listingID,
        buyerID: buyer.userID,
        sellerID: seller.userID,
        transactionDate: new Date().toISOString(),
        status: 'pending' as const
      });

      const updated = await dealModel.updateDealStatus(deal.dealID, 'completed');

      expect(updated.status).toBe('completed');
      expect(updated.dealID).toBe(deal.dealID);
    });

    it('should update deal status to cancelled', async () => {
      const deal = await dealModel.createDeal({
        listingID: product.listingID,
        buyerID: buyer.userID,
        sellerID: seller.userID,
        transactionDate: new Date().toISOString(),
        status: 'pending' as const
      });

      const updated = await dealModel.updateDealStatus(deal.dealID, 'cancelled');

      expect(updated.status).toBe('cancelled');
    });

    it('should throw error for non-existent deal', async () => {
      await expect(
        dealModel.updateDealStatus('non_existent_id', 'completed')
      ).rejects.toThrow();
    });
  });

  describe('updateDeal', () => {
    it('should update deal details', async () => {
      const deal = await dealModel.createDeal({
        listingID: product.listingID,
        buyerID: buyer.userID,
        sellerID: seller.userID,
        transactionDate: new Date().toISOString(),
        status: 'pending' as const,
        finalPrice: 100
      });

      const updated = await dealModel.updateDeal(deal.dealID, {
        finalPrice: 90,
        notes: 'Negotiated price'
      });

      expect(updated.finalPrice).toBe(90);
      expect(updated.notes).toBe('Negotiated price');
    });

    it('should update only specified fields', async () => {
      const deal = await dealModel.createDeal({
        listingID: product.listingID,
        buyerID: buyer.userID,
        sellerID: seller.userID,
        transactionDate: new Date().toISOString(),
        status: 'pending' as const,
        finalPrice: 100
      });

      const updated = await dealModel.updateDeal(deal.dealID, {
        notes: 'Updated notes'
      });

      expect(updated.notes).toBe('Updated notes');
      expect(updated.finalPrice).toBe(100); // Should remain unchanged
    });
  });

  describe('deleteDeal', () => {
    it('should delete a deal', async () => {
      const deal = await dealModel.createDeal({
        listingID: product.listingID,
        buyerID: buyer.userID,
        sellerID: seller.userID,
        transactionDate: new Date().toISOString(),
        status: 'pending' as const
      });

      const deleted = await dealModel.deleteDeal(deal.dealID);
      expect(deleted).toBe(true);

      const retrieved = await dealModel.getDealById(deal.dealID);
      expect(retrieved).toBeFalsy();
    });

    it('should return false for non-existent deal', async () => {
      const deleted = await dealModel.deleteDeal('non_existent_id');
      expect(deleted).toBe(false);
    });
  });

  describe('getCompletedDealsCount', () => {
    it('should count completed deals for a user', async () => {
      // Create completed deals
      await dealModel.createDeal({
        listingID: product.listingID,
        buyerID: buyer.userID,
        sellerID: seller.userID,
        transactionDate: new Date().toISOString(),
        status: 'completed' as const
      });

      await dealModel.createDeal({
        listingID: product.listingID,
        buyerID: buyer.userID,
        sellerID: seller.userID,
        transactionDate: new Date().toISOString(),
        status: 'completed' as const
      });

      const count = await dealModel.getCompletedDealsCount(buyer.userID);
      expect(count).toBeGreaterThanOrEqual(2);
    });

    it('should return 0 for user with no completed deals', async () => {
      const newUser = await userModel.createUser({
        email: 'newuser@test.com',
        name: 'New User',
        isVerified: true,
        preferredLanguage: 'en',
        isAdmin: false,
        status: 'active'
      });

      const count = await dealModel.getCompletedDealsCount(newUser.userID);
      expect(count).toBe(0);
    });
  });

  describe('getDealsWithDetails', () => {
    it('should get deals with product and user details', async () => {
      const deals = await dealModel.getDealsWithDetails(buyer.userID);
      
      expect(deals.length).toBeGreaterThan(0);
      
      // Check that details are included
      deals.forEach((deal: any) => {
        expect(deal.buyerName).toBeDefined();
        expect(deal.sellerName).toBeDefined();
      });
    });
  });

  describe('Deal status workflow', () => {
    it('should support complete deal workflow', async () => {
      // Create pending deal
      const deal = await dealModel.createDeal({
        listingID: product.listingID,
        buyerID: buyer.userID,
        sellerID: seller.userID,
        transactionDate: new Date().toISOString(),
        status: 'pending' as const,
        finalPrice: 100
      });

      expect(deal.status).toBe('pending');

      // Update to completed
      const completed = await dealModel.updateDealStatus(deal.dealID, 'completed');
      expect(completed.status).toBe('completed');

      // Verify in completed deals count
      const count = await dealModel.getCompletedDealsCount(buyer.userID);
      expect(count).toBeGreaterThan(0);
    });

    it('should support deal cancellation', async () => {
      const deal = await dealModel.createDeal({
        listingID: product.listingID,
        buyerID: buyer.userID,
        sellerID: seller.userID,
        transactionDate: new Date().toISOString(),
        status: 'pending' as const
      });

      const cancelled = await dealModel.updateDealStatus(deal.dealID, 'cancelled');
      expect(cancelled.status).toBe('cancelled');
    });
  });
});
