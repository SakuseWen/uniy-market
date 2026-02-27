// Set environment variables before importing app
process.env['NODE_ENV'] = 'test';
process.env['GOOGLE_CLIENT_ID'] = 'test-client-id';
process.env['GOOGLE_CLIENT_SECRET'] = 'test-client-secret';
process.env['GOOGLE_CALLBACK_URL'] = 'http://localhost:3000/api/auth/google/callback';

import request from 'supertest';
import { app } from '../../src/index';
import { DatabaseManager } from '../../src/config/database';
import { ProductModel } from '../../src/models/ProductModel';
import { UserModel } from '../../src/models/UserModel';
import { AuthService } from '../../src/services/AuthService';

describe('Product CRUD API Endpoints', () => {
  let dbManager: DatabaseManager;
  let productModel: ProductModel;
  let userModel: UserModel;
  let authService: AuthService;
  let testUser: any;
  let authToken: string;
  let testCategory: any;

  beforeAll(async () => {
    // Initialize database
    dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();
    
    productModel = new ProductModel();
    userModel = new UserModel();
    authService = new AuthService();

    // Create a test category
    const db = dbManager.getDatabase();
    const categoryResult = await db.run(
      'INSERT INTO Category (name, nameEn, nameTh, nameZh, isActive) VALUES (?, ?, ?, ?, ?)',
      ['Electronics', 'Electronics', 'อิเล็กทรอนิกส์', '电子产品', 1]
    );
    testCategory = { catID: categoryResult.lastID, name: 'Electronics' };

    // Create a verified test user
    testUser = await userModel.createUser({
      email: 'testuser@university.edu',
      name: 'Test User',
      isVerified: true,
      preferredLanguage: 'en',
      isAdmin: false,
      status: 'active'
    });

    // Create auth token
    const sessionToken = await authService.createSession(testUser);
    authToken = sessionToken.token;
  });

  afterAll(async () => {
    await dbManager.close();
  });

  describe('POST /api/products', () => {
    it('should create a new product listing with valid data', async () => {
      const productData = {
        title: 'Test Laptop',
        description: 'A great laptop for students',
        price: 500.00,
        stock: 1,
        condition: 'used',
        location: 'Campus Building A',
        categoryID: testCategory.catID
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product).toBeDefined();
      expect(response.body.data.product.title).toBe(productData.title);
      expect(response.body.data.product.price).toBe(productData.price);
      expect(response.body.data.product.sellerID).toBe(testUser.userID);
      expect(response.body.data.product.status).toBe('active');
    });

    it('should reject product creation without authentication', async () => {
      const productData = {
        title: 'Test Product',
        price: 100,
        stock: 1,
        condition: 'new',
        categoryID: testCategory.catID
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject product creation with invalid data', async () => {
      const invalidData = {
        title: '', // Empty title
        price: -10, // Negative price
        stock: 0, // Zero stock
        condition: 'invalid',
        categoryID: testCategory.catID
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject product creation with non-existent category', async () => {
      const productData = {
        title: 'Test Product',
        price: 100,
        stock: 1,
        condition: 'new',
        categoryID: 99999 // Non-existent category
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CATEGORY');
    });

    it('should reject product creation by unverified user', async () => {
      // Create unverified user
      const unverifiedUser = await userModel.createUser({
        email: 'unverified@university.edu',
        name: 'Unverified User',
        isVerified: false,
        preferredLanguage: 'en',
        isAdmin: false,
        status: 'active'
      });

      const unverifiedToken = (await authService.createSession(unverifiedUser)).token;

      const productData = {
        title: 'Test Product',
        price: 100,
        stock: 1,
        condition: 'new',
        categoryID: testCategory.catID
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .send(productData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_VERIFIED');
    });
  });

  describe('GET /api/products/:id', () => {
    let testProduct: any;

    beforeAll(async () => {
      // Create a test product
      testProduct = await productModel.createProduct({
        title: 'Test Product for Retrieval',
        description: 'Test description',
        price: 200,
        stock: 1,
        condition: 'new',
        location: 'Test Location',
        categoryID: testCategory.catID,
        sellerID: testUser.userID,
        status: 'active'
      });
    });

    it('should retrieve product with seller information', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct.listingID}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product).toBeDefined();
      expect(response.body.data.product.listingID).toBe(testProduct.listingID);
      expect(response.body.data.seller).toBeDefined();
      expect(response.body.data.seller.userID).toBe(testUser.userID);
      expect(response.body.data.seller.name).toBe(testUser.name);
      expect(response.body.data.seller.reputation).toBeDefined();
      expect(response.body.data.category).toBeDefined();
      expect(response.body.data.images).toBeDefined();
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/product_nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('PUT /api/products/:id', () => {
    let testProduct: any;

    beforeEach(async () => {
      // Create a fresh test product for each test
      testProduct = await productModel.createProduct({
        title: 'Product to Update',
        description: 'Original description',
        price: 150,
        stock: 1,
        condition: 'used',
        categoryID: testCategory.catID,
        sellerID: testUser.userID,
        status: 'active'
      });
    });

    it('should update product by owner', async () => {
      const updates = {
        title: 'Updated Product Title',
        price: 175,
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/products/${testProduct.listingID}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.title).toBe(updates.title);
      expect(response.body.data.product.price).toBe(updates.price);
      expect(response.body.data.product.description).toBe(updates.description);
    });

    it('should reject update without authentication', async () => {
      const updates = { title: 'Updated Title' };

      const response = await request(app)
        .put(`/api/products/${testProduct.listingID}`)
        .send(updates)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject update by non-owner', async () => {
      // Create another user
      const otherUser = await userModel.createUser({
        email: 'otheruser@university.edu',
        name: 'Other User',
        isVerified: true,
        preferredLanguage: 'en',
        isAdmin: false,
        status: 'active'
      });

      const otherToken = (await authService.createSession(otherUser)).token;

      const updates = { title: 'Unauthorized Update' };

      const response = await request(app)
        .put(`/api/products/${testProduct.listingID}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(updates)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject update with invalid data', async () => {
      const invalidUpdates = {
        price: -50, // Negative price
        condition: 'invalid_condition'
      };

      const response = await request(app)
        .put(`/api/products/${testProduct.listingID}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdates)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent product', async () => {
      const updates = { title: 'Updated Title' };

      const response = await request(app)
        .put('/api/products/product_nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('DELETE /api/products/:id', () => {
    let testProduct: any;

    beforeEach(async () => {
      // Create a fresh test product for each test
      testProduct = await productModel.createProduct({
        title: 'Product to Delete',
        price: 100,
        stock: 1,
        condition: 'new',
        categoryID: testCategory.catID,
        sellerID: testUser.userID,
        status: 'active'
      });
    });

    it('should delete product by owner (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct.listingID}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify product is soft deleted (status = inactive)
      const deletedProduct = await productModel.getProductById(testProduct.listingID);
      expect(deletedProduct).toBeDefined();
      expect(deletedProduct?.status).toBe('inactive');
    });

    it('should reject deletion without authentication', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct.listingID}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject deletion by non-owner', async () => {
      // Create another user
      const otherUser = await userModel.createUser({
        email: 'another@university.edu',
        name: 'Another User',
        isVerified: true,
        preferredLanguage: 'en',
        isAdmin: false,
        status: 'active'
      });

      const otherToken = (await authService.createSession(otherUser)).token;

      const response = await request(app)
        .delete(`/api/products/${testProduct.listingID}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .delete('/api/products/product_nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('GET /api/products (Search)', () => {
    beforeAll(async () => {
      // Create multiple test products for search
      await productModel.createProduct({
        title: 'Laptop Dell',
        description: 'Great laptop for programming',
        price: 800,
        stock: 1,
        condition: 'used',
        location: 'Building A',
        categoryID: testCategory.catID,
        sellerID: testUser.userID,
        status: 'active'
      });

      await productModel.createProduct({
        title: 'iPhone 12',
        description: 'Smartphone in excellent condition',
        price: 600,
        stock: 1,
        condition: 'like_new',
        location: 'Building B',
        categoryID: testCategory.catID,
        sellerID: testUser.userID,
        status: 'active'
      });

      await productModel.createProduct({
        title: 'Headphones',
        description: 'Noise cancelling headphones',
        price: 150,
        stock: 1,
        condition: 'new',
        location: 'Building A',
        categoryID: testCategory.catID,
        sellerID: testUser.userID,
        status: 'active'
      });
    });

    it('should search products by keyword', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ q: 'laptop' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBeDefined();
      expect(response.body.data.data.length).toBeGreaterThan(0);
      expect(response.body.data.data[0].title.toLowerCase()).toContain('laptop');
    });

    it('should filter products by price range', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ minPrice: 100, maxPrice: 200 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBeDefined();
      response.body.data.data.forEach((product: any) => {
        expect(product.price).toBeGreaterThanOrEqual(100);
        expect(product.price).toBeLessThanOrEqual(200);
      });
    });

    it('should filter products by condition', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ condition: 'new' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBeDefined();
      response.body.data.data.forEach((product: any) => {
        expect(product.condition).toBe('new');
      });
    });

    it('should sort products by price ascending', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ sortBy: 'price_asc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      const products = response.body.data.data;
      for (let i = 1; i < products.length; i++) {
        expect(products[i].price).toBeGreaterThanOrEqual(products[i - 1].price);
      }
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('POST /api/products/:id/mark-sold', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await productModel.createProduct({
        title: 'Product to Mark Sold',
        price: 100,
        stock: 1,
        condition: 'new',
        categoryID: testCategory.catID,
        sellerID: testUser.userID,
        status: 'active'
      });
    });

    it('should mark product as sold by owner', async () => {
      const response = await request(app)
        .post(`/api/products/${testProduct.listingID}/mark-sold`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.status).toBe('sold');
    });

    it('should reject marking as sold without authentication', async () => {
      const response = await request(app)
        .post(`/api/products/${testProduct.listingID}/mark-sold`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject marking as sold by non-owner', async () => {
      const otherUser = await userModel.createUser({
        email: 'yetanother@university.edu',
        name: 'Yet Another User',
        isVerified: true,
        preferredLanguage: 'en',
        isAdmin: false,
        status: 'active'
      });

      const otherToken = (await authService.createSession(otherUser)).token;

      const response = await request(app)
        .post(`/api/products/${testProduct.listingID}/mark-sold`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/products/categories/all', () => {
    it('should retrieve all active categories', async () => {
      const response = await request(app)
        .get('/api/products/categories/all')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toBeDefined();
      expect(Array.isArray(response.body.data.categories)).toBe(true);
      expect(response.body.data.categories.length).toBeGreaterThan(0);
    });
  });
});
