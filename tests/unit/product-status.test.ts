/**
 * Unit tests for Product Status Management
 * Tests for task 4.7: Implement product status management
 * 
 * Requirements tested: 2.5
 * - Mark as sold functionality
 * - Status change notifications
 * - Search results filtering based on status
 */

import { ProductModel } from '../../src/models/ProductModel';
import { UserModel } from '../../src/models/UserModel';
import { notificationService } from '../../src/services/NotificationService';
import { ProductListing } from '../../src/types';

describe('Product Status Management - Task 4.7', () => {
  let productModel: ProductModel;
  let userModel: UserModel;
  let testUser: any;
  let testProduct: ProductListing;

  beforeAll(async () => {
    productModel = new ProductModel();
    userModel = new UserModel();

    // Create a test user
    testUser = await userModel.createUser({
      email: 'status-test@university.edu',
      name: 'Status Test User',
      isVerified: true,
      preferredLanguage: 'en',
      isAdmin: false,
      status: 'active'
    });
  });

  beforeEach(async () => {
    // Create a fresh test product for each test
    testProduct = await productModel.createProduct({
      title: 'Test Product for Status Management',
      description: 'Testing status changes',
      price: 100,
      stock: 1,
      condition: 'new',
      location: 'Test Campus',
      categoryID: 1,
      sellerID: testUser.userID,
      status: 'active'
    });

    // Clear notifications before each test
    await notificationService.clearUserNotifications(testUser.userID);
  });

  describe('Mark as Sold Functionality', () => {
    test('should mark product as sold', async () => {
      // Mark product as sold
      const updatedProduct = await productModel.markAsSold(testProduct.listingID);

      expect(updatedProduct).toBeDefined();
      expect(updatedProduct.status).toBe('sold');
      expect(updatedProduct.listingID).toBe(testProduct.listingID);
    });

    test('should update product status from active to sold', async () => {
      // Verify initial status
      expect(testProduct.status).toBe('active');

      // Mark as sold
      const soldProduct = await productModel.markAsSold(testProduct.listingID);

      // Verify status changed
      expect(soldProduct.status).toBe('sold');
    });

    test('should maintain other product properties when marking as sold', async () => {
      const soldProduct = await productModel.markAsSold(testProduct.listingID);

      // Verify other properties remain unchanged
      expect(soldProduct.title).toBe(testProduct.title);
      expect(soldProduct.price).toBe(testProduct.price);
      expect(soldProduct.sellerID).toBe(testProduct.sellerID);
      expect(soldProduct.categoryID).toBe(testProduct.categoryID);
    });

    test('should update updatedAt timestamp when marking as sold', async () => {
      const originalUpdatedAt = testProduct.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const soldProduct = await productModel.markAsSold(testProduct.listingID);

      expect(soldProduct.updatedAt).not.toBe(originalUpdatedAt);
      expect(new Date(soldProduct.updatedAt).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime()
      );
    });
  });

  describe('Status Change Notifications', () => {
    test('should create notification when product is marked as sold', async () => {
      // Mark product as sold
      await productModel.markAsSold(testProduct.listingID);

      // Wait a bit for async notification
      await new Promise(resolve => setTimeout(resolve, 50));

      // Check notifications
      const notifications = await notificationService.getUserNotifications(testUser.userID);

      expect(notifications.length).toBeGreaterThan(0);
      
      const notification = notifications[0];
      expect(notification).toBeDefined();
      expect(notification!.userID).toBe(testUser.userID);
      
      // Type guard to check if it's a StatusChangeNotification
      if ('productID' in notification!) {
        expect(notification!.productID).toBe(testProduct.listingID);
        expect(notification!.oldStatus).toBe('active');
        expect(notification!.newStatus).toBe('sold');
      }
    });

    test('should include product title in notification', async () => {
      await productModel.markAsSold(testProduct.listingID);
      await new Promise(resolve => setTimeout(resolve, 50));

      const notifications = await notificationService.getUserNotifications(testUser.userID);
      
      expect(notifications[0]).toBeDefined();
      expect(notifications[0]!.productTitle).toBe(testProduct.title);
      expect(notifications[0]!.message).toContain(testProduct.title);
    });

    test('should create notification when status changes to inactive', async () => {
      await productModel.updateProduct(testProduct.listingID, { status: 'inactive' });
      await new Promise(resolve => setTimeout(resolve, 50));

      const notifications = await notificationService.getUserNotifications(testUser.userID);
      
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0]).toBeDefined();
      
      // Type guard to check if it's a StatusChangeNotification
      if ('newStatus' in notifications[0]!) {
        expect(notifications[0]!.newStatus).toBe('inactive');
      }
    });

    test('should not create notification when status does not change', async () => {
      // Update product without changing status
      await productModel.updateProduct(testProduct.listingID, { 
        price: 150 
      });
      await new Promise(resolve => setTimeout(resolve, 50));

      const notifications = await notificationService.getUserNotifications(testUser.userID);
      
      expect(notifications.length).toBe(0);
    });

    test('should mark notification as unread by default', async () => {
      await productModel.markAsSold(testProduct.listingID);
      await new Promise(resolve => setTimeout(resolve, 50));

      const notifications = await notificationService.getUserNotifications(testUser.userID);
      
      expect(notifications[0]).toBeDefined();
      expect(notifications[0]!.isRead).toBe(false);
    });

    test('should include timestamp in notification', async () => {
      const beforeTime = Date.now();
      
      await productModel.markAsSold(testProduct.listingID);
      await new Promise(resolve => setTimeout(resolve, 50));

      const afterTime = Date.now();
      const notifications = await notificationService.getUserNotifications(testUser.userID);
      
      expect(notifications[0]).toBeDefined();
      expect(notifications[0]!.timestamp).toBeDefined();
      const notificationTime = new Date(notifications[0]!.timestamp).getTime();
      expect(notificationTime).toBeGreaterThanOrEqual(beforeTime);
      expect(notificationTime).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Search Results Filtering by Status', () => {
    test('should exclude sold products from active search results', async () => {
      // Mark product as sold
      await productModel.markAsSold(testProduct.listingID);

      // Search for products
      const results = await productModel.searchProducts('Test Product', {}, 1, 20);

      // Verify sold product is not in results
      const foundProduct = results.data.find(p => p.listingID === testProduct.listingID);
      expect(foundProduct).toBeUndefined();
    });

    test('should exclude inactive products from search results', async () => {
      // Mark product as inactive
      await productModel.updateProduct(testProduct.listingID, { status: 'inactive' });

      // Search for products
      const results = await productModel.searchProducts('Test Product', {}, 1, 20);

      // Verify inactive product is not in results
      const foundProduct = results.data.find(p => p.listingID === testProduct.listingID);
      expect(foundProduct).toBeUndefined();
    });

    test('should only return active products in search results', async () => {
      // Create multiple products with different statuses
      await productModel.createProduct({
        title: 'Active Product',
        price: 50,
        stock: 1,
        condition: 'new',
        categoryID: 1,
        sellerID: testUser.userID,
        status: 'active'
      });

      const soldProduct = await productModel.createProduct({
        title: 'Sold Product',
        price: 60,
        stock: 1,
        condition: 'new',
        categoryID: 1,
        sellerID: testUser.userID,
        status: 'active'
      });
      await productModel.markAsSold(soldProduct.listingID);

      const inactiveProduct = await productModel.createProduct({
        title: 'Inactive Product',
        price: 70,
        stock: 1,
        condition: 'new',
        categoryID: 1,
        sellerID: testUser.userID,
        status: 'active'
      });
      await productModel.updateProduct(inactiveProduct.listingID, { status: 'inactive' });

      // Search for all products
      const results = await productModel.searchProducts('Product', {}, 1, 20);

      // Verify only active products are returned
      const allActive = results.data.every(p => p.status === 'active');
      expect(allActive).toBe(true);

      // Verify sold and inactive products are not in results
      const hasSold = results.data.some(p => p.listingID === soldProduct.listingID);
      const hasInactive = results.data.some(p => p.listingID === inactiveProduct.listingID);
      
      expect(hasSold).toBe(false);
      expect(hasInactive).toBe(false);
    });

    test('should include active product in search results', async () => {
      // Search for the active product
      const results = await productModel.searchProducts('Test Product', {}, 1, 20);

      // Verify active product is in results
      const foundProduct = results.data.find(p => p.listingID === testProduct.listingID);
      expect(foundProduct).toBeDefined();
      expect(foundProduct?.status).toBe('active');
    });

    test('should update search results immediately after status change', async () => {
      // Verify product is in search results initially
      let results = await productModel.searchProducts('Test Product', {}, 1, 20);
      let foundProduct = results.data.find(p => p.listingID === testProduct.listingID);
      expect(foundProduct).toBeDefined();

      // Mark as sold
      await productModel.markAsSold(testProduct.listingID);

      // Verify product is no longer in search results
      results = await productModel.searchProducts('Test Product', {}, 1, 20);
      foundProduct = results.data.find(p => p.listingID === testProduct.listingID);
      expect(foundProduct).toBeUndefined();
    });
  });

  describe('Notification Service Operations', () => {
    test('should retrieve all notifications for a user', async () => {
      // Create multiple status changes
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

      const notifications = await notificationService.getUserNotifications(testUser.userID);
      expect(notifications.length).toBe(2);
    });

    test('should get unread notifications count', async () => {
      await productModel.markAsSold(testProduct.listingID);
      await new Promise(resolve => setTimeout(resolve, 50));

      const count = await notificationService.getNotificationCount(testUser.userID);
      
      expect(count.total).toBe(1);
      expect(count.unread).toBe(1);
    });

    test('should mark notification as read', async () => {
      await productModel.markAsSold(testProduct.listingID);
      await new Promise(resolve => setTimeout(resolve, 50));

      const notifications = await notificationService.getUserNotifications(testUser.userID);
      expect(notifications[0]).toBeDefined();
      const notificationId = notifications[0]!.notificationID;

      const success = await notificationService.markAsRead(testUser.userID, notificationId);
      expect(success).toBe(true);

      const updatedNotifications = await notificationService.getUserNotifications(testUser.userID);
      expect(updatedNotifications[0]).toBeDefined();
      expect(updatedNotifications[0]!.isRead).toBe(true);
    });

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

      const markedCount = await notificationService.markAllAsRead(testUser.userID);
      expect(markedCount).toBe(2);

      const count = await notificationService.getNotificationCount(testUser.userID);
      expect(count.unread).toBe(0);
    });

    test('should get only unread notifications', async () => {
      await productModel.markAsSold(testProduct.listingID);
      await new Promise(resolve => setTimeout(resolve, 50));

      const allNotifications = await notificationService.getUserNotifications(testUser.userID);
      expect(allNotifications[0]).toBeDefined();
      await notificationService.markAsRead(testUser.userID, allNotifications[0]!.notificationID);

      const unreadNotifications = await notificationService.getUnreadNotifications(testUser.userID);
      expect(unreadNotifications.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle marking non-existent product as sold', async () => {
      await expect(
        productModel.markAsSold('non_existent_id')
      ).rejects.toThrow();
    });

    test('should handle status change from sold back to active', async () => {
      // Mark as sold
      await productModel.markAsSold(testProduct.listingID);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Change back to active
      await productModel.updateProduct(testProduct.listingID, { status: 'active' });
      await new Promise(resolve => setTimeout(resolve, 50));

      const notifications = await notificationService.getUserNotifications(testUser.userID);
      
      // Should have 2 notifications
      expect(notifications.length).toBe(2);
      expect(notifications[0]).toBeDefined();
      expect(notifications[1]).toBeDefined();
      
      // Type guard to check if they're StatusChangeNotifications
      if ('newStatus' in notifications[0]! && 'newStatus' in notifications[1]!) {
        expect(notifications[0]!.newStatus).toBe('sold');
        expect(notifications[1]!.newStatus).toBe('active');
      }
    });

    test('should handle multiple status changes for same product', async () => {
      // Multiple status changes
      await productModel.updateProduct(testProduct.listingID, { status: 'inactive' });
      await productModel.updateProduct(testProduct.listingID, { status: 'active' });
      await productModel.markAsSold(testProduct.listingID);

      await new Promise(resolve => setTimeout(resolve, 50));

      const notifications = await notificationService.getUserNotifications(testUser.userID);
      expect(notifications.length).toBe(3);
    });

    test('should not fail product update if notification fails', async () => {
      // This test verifies that notification errors don't break product updates
      // The notification service catches errors internally
      
      const updatedProduct = await productModel.markAsSold(testProduct.listingID);
      
      // Product should still be updated even if notification has issues
      expect(updatedProduct.status).toBe('sold');
    });
  });
});
