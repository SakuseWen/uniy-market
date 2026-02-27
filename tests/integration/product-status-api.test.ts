/**
 * Integration tests for Product Status Management API
 * Tests for task 4.7: Implement product status management
 * 
 * Requirements tested: 2.5
 * - Mark as sold API endpoint
 * - Status change notification endpoints
 * - Search filtering by status
 */

import request from 'supertest';
import express from 'express';
import { ProductModel } from '../../src/models/ProductModel';
import { UserModel } from '../../src/models/UserModel';
import { notificationService } from '../../src/services/NotificationService';
import productRoutes from '../../src/routes/product';
import jwt from 'jsonwebtoken';

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);

describe('Product Status Management API - Task 4.7', () => {
  let productModel: ProductModel;
  let userModel: UserModel;
  let testUser: any;
  let authToken: string;
  let testProduct: any;

  beforeAll(async () => {
    productModel = new ProductModel();
    userModel = new UserModel();

    // Create test user
    testUser = await userModel.createUser({
      email: 'api-status-test@university.edu',
      name: 'API Status Test User',
      isVerified: true,
      preferredLanguage: 'en',
      isAdmin: false,
      status: 'active'
    });

    // Generate auth token
    const jwtSecret = process.env['JWT_SECRET'] || 'test-secret-key-for-development';
    authToken = jwt.sign(
      { 
        userID: testUser.userID,
        email: testUser.email,
        isVerified: testUser.isVerified,
        isAdmin: testUser.isAdmin
      },
      jwtSecret,
      { expiresIn: '1h' }
    );
  });

  beforeEach(async () => {
    // Create fresh test product
    testProduct = await productModel.createProduct({
      title: 'API Test Product',
      description: 'Testing API endpoints',
      price: 100,
      stock: 1,
      condition: 'new',
      location: 'Test Campus',
      categoryID: 1,
      sellerID: testUser.userID,
      status: 'active'
    });

    // Clear notifications
    await notificationService.clearUserNotifications(testUser.userID);
  });

  describe('POST /api/products/:id/mark-sold', () => {
    test('should mark product as sold with valid authentication', async () => {
      const response = await request(app)
        .post(`/api/products/${testProduct.listingID}/mark-sold`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.status).toBe('sold');
      expect(response.body.message).toContain('marked as sold');
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .post(`/api/products/${testProduct.listingID}/mark-sold`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .post('/api/products/non_existent_id/mark-sold')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });

    test('should return 403 if user is not the product owner', async () => {
      // Create another user
      const otherUser = await userModel.createUser({
        email: 'other-user@university.edu',
        name: 'Other User',
        isVerified: true,
        preferredLanguage: 'en',
        isAdmin: false,
        status: 'active'
      });

      const jwtSecret = process.env['JWT_SECRET'] || 'test-secret-key-for-development';
      const otherToken = jwt.sign(
        { 
          userID: otherUser.userID,
          email: otherUser.email,
          isVerified: otherUser.isVerified,
          isAdmin: otherUser.isAdmin
        },
        jwtSecret,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post(`/api/products/${testProduct.listingID}/mark-sold`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    test('should create notification when marking as sold', async () => {
      await request(app)
        .post(`/api/products/${testProduct.listingID}/mark-sold`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Wait for async notification
      await new Promise(resolve => setTimeout(resolve, 50));

      const notifications = await notificationService.getUserNotifications(testUser.userID);
      expect(notifications.length).toBeGreaterThan(0);
      
      // Type guard to check if it's a StatusChangeNotification
      if ('newStatus' in notifications[0]!) {
        expect(notifications[0]!.newStatus).toBe('sold');
      }
    });
  });

  describe('GET /api/products/notifications/my', () => {
    test('should get user notifications with authentication', async () => {
      // Create a notification by marking product as sold
      await productModel.markAsSold(testProduct.listingID);
      await new Promise(resolve => setTimeout(resolve, 50));

      const response = await request(app)
        .get('/api/products/notifications/my')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toBeDefined();
      expect(Array.isArray(response.body.data.notifications)).toBe(true);
      expect(response.body.data.count).toBeDefined();
      expect(response.body.data.count.total).toBeGreaterThan(0);
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/products/notifications/my')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should return empty array when no notifications exist', async () => {
      const response = await request(app)
        .get('/api/products/notifications/my')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toEqual([]);
      expect(response.body.data.count.total).toBe(0);
    });
  });

  describe('GET /api/products/notifications/unread', () => {
    test('should get only unread notifications', async () => {
      // Create notifications
      await productModel.markAsSold(testProduct.listingID);
      await new Promise(resolve => setTimeout(resolve, 50));

      const response = await request(app)
        .get('/api/products/notifications/unread')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toBeDefined();
      expect(response.body.data.count).toBeGreaterThan(0);
      
      // All should be unread
      const allUnread = response.body.data.notifications.every((n: any) => !n.isRead);
      expect(allUnread).toBe(true);
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/products/notifications/unread')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/products/notifications/:notificationId/read', () => {
    test('should mark notification as read', async () => {
      // Create notification
      await productModel.markAsSold(testProduct.listingID);
      await new Promise(resolve => setTimeout(resolve, 50));

      const notifications = await notificationService.getUserNotifications(testUser.userID);
      const notificationId = notifications[0]!.notificationID;

      const response = await request(app)
        .put(`/api/products/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('marked as read');

      // Verify it's marked as read
      const updatedNotifications = await notificationService.getUserNotifications(testUser.userID);
      expect(updatedNotifications[0]!.isRead).toBe(true);
    });

    test('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .put('/api/products/notifications/non_existent_id/read')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOTIFICATION_NOT_FOUND');
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/products/notifications/some_id/read')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/products/notifications/read-all', () => {
    test('should mark all notifications as read', async () => {
      // Create multiple notifications
      await productModel.markAsSold(testProduct.listingID);
      
      const product2 = await productModel.createProduct({
        title: 'Second Product',
        price: 200,
        stock: 1,
        condition: 'used',
        categoryID: 1,
        sellerID: testUser.userID,
        status: 'active'
      });
      await productModel.updateProduct(product2.listingID, { status: 'inactive' });

      await new Promise(resolve => setTimeout(resolve, 50));

      const response = await request(app)
        .put('/api/products/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.markedCount).toBe(2);

      // Verify all are marked as read
      const count = await notificationService.getNotificationCount(testUser.userID);
      expect(count.unread).toBe(0);
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/products/notifications/read-all')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should return 0 when no unread notifications exist', async () => {
      const response = await request(app)
        .put('/api/products/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.markedCount).toBe(0);
    });
  });

  describe('GET /api/products - Search filtering by status', () => {
    test('should exclude sold products from search results', async () => {
      // Mark product as sold
      await productModel.markAsSold(testProduct.listingID);

      const response = await request(app)
        .get('/api/products')
        .query({ q: 'API Test Product' })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify sold product is not in results
      const foundProduct = response.body.data.data.find(
        (p: any) => p.listingID === testProduct.listingID
      );
      expect(foundProduct).toBeUndefined();
    });

    test('should exclude inactive products from search results', async () => {
      // Mark product as inactive
      await productModel.updateProduct(testProduct.listingID, { status: 'inactive' });

      const response = await request(app)
        .get('/api/products')
        .query({ q: 'API Test Product' })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify inactive product is not in results
      const foundProduct = response.body.data.data.find(
        (p: any) => p.listingID === testProduct.listingID
      );
      expect(foundProduct).toBeUndefined();
    });

    test('should include active products in search results', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ q: 'API Test Product' })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify active product is in results
      const foundProduct = response.body.data.data.find(
        (p: any) => p.listingID === testProduct.listingID
      );
      expect(foundProduct).toBeDefined();
      expect(foundProduct.status).toBe('active');
    });

    test('should only return active products', async () => {
      // Create products with different statuses
      const soldProduct = await productModel.createProduct({
        title: 'Sold Product',
        price: 50,
        stock: 1,
        condition: 'new',
        categoryID: 1,
        sellerID: testUser.userID,
        status: 'active'
      });
      await productModel.markAsSold(soldProduct.listingID);

      const inactiveProduct = await productModel.createProduct({
        title: 'Inactive Product',
        price: 60,
        stock: 1,
        condition: 'new',
        categoryID: 1,
        sellerID: testUser.userID,
        status: 'active'
      });
      await productModel.updateProduct(inactiveProduct.listingID, { status: 'inactive' });

      const response = await request(app)
        .get('/api/products')
        .query({ q: 'Product' })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify all returned products are active
      const allActive = response.body.data.data.every((p: any) => p.status === 'active');
      expect(allActive).toBe(true);
    });
  });
});
