import { DatabaseManager } from '../../src/config/database';
import { UserModel, ProductModel } from '../../src/models';
import { User } from '../../src/types';

describe('Data Models', () => {
  let dbManager: DatabaseManager;
  let userModel: UserModel;
  let productModel: ProductModel;

  beforeEach(async () => {
    dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();
    userModel = new UserModel();
    productModel = new ProductModel();
  });

  afterEach(async () => {
    await dbManager.close();
  });

  describe('UserModel', () => {
    const testUserData = {
      email: 'test@student.mahidol.ac.th',
      name: 'Test User',
      phone: '+66123456789',
      isVerified: false,
      preferredLanguage: 'en' as const,
      isAdmin: false,
      status: 'active' as const
    };

    it('should create a new user', async () => {
      const user = await userModel.createUser(testUserData);

      expect(user).toBeDefined();
      expect(user.userID).toMatch(/^user_/);
      expect(user.email).toBe(testUserData.email);
      expect(user.name).toBe(testUserData.name);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should get user by ID', async () => {
      const createdUser = await userModel.createUser(testUserData);
      const foundUser = await userModel.getUserById(createdUser.userID);

      expect(foundUser).toBeDefined();
      expect(foundUser?.userID).toBe(createdUser.userID);
      expect(foundUser?.email).toBe(testUserData.email);
    });

    it('should get user by email', async () => {
      const createdUser = await userModel.createUser(testUserData);
      const foundUser = await userModel.getUserByEmail(testUserData.email);

      expect(foundUser).toBeDefined();
      expect(foundUser?.userID).toBe(createdUser.userID);
      expect(foundUser?.email).toBe(testUserData.email);
    });

    it('should update user information', async () => {
      const createdUser = await userModel.createUser(testUserData);
      
      // Add small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updates = { name: 'Updated Name', phone: '+66987654321' };
      const updatedUser = await userModel.updateUser(createdUser.userID, updates);

      expect(updatedUser.name).toBe(updates.name);
      expect(updatedUser.phone).toBe(updates.phone);
      expect(updatedUser.updatedAt).not.toBe(createdUser.updatedAt);
    });

    it('should check university email domain', async () => {
      const isUniversityEmail1 = await userModel.isUniversityEmail('test@student.mahidol.ac.th');
      const isUniversityEmail2 = await userModel.isUniversityEmail('test@gmail.com');
      const isUniversityEmail3 = await userModel.isUniversityEmail('test@invalid.com');

      expect(isUniversityEmail1).toBe(true);
      expect(isUniversityEmail2).toBe(true); // gmail.com is in test data
      expect(isUniversityEmail3).toBe(false);
    });

    it('should create student record', async () => {
      const user = await userModel.createUser(testUserData);
      const studentData = {
        userID: user.userID,
        schoolName: 'Mahidol University',
        grade: 'Undergraduate',
        studentEmail: 'test@student.mahidol.ac.th'
      };

      const student = await userModel.createStudent(studentData);

      expect(student).toBeDefined();
      expect(student.studentID).toMatch(/^student_/);
      expect(student.userID).toBe(user.userID);
      expect(student.schoolName).toBe(studentData.schoolName);
    });

    it('should get user reputation', async () => {
      const user = await userModel.createUser(testUserData);
      const reputation = await userModel.getUserReputation(user.userID);

      expect(reputation).toBeDefined();
      expect(reputation.userID).toBe(user.userID);
      expect(reputation.averageRating).toBe(0);
      expect(reputation.totalReviews).toBe(0);
      expect(reputation.completedTransactions).toBe(0);
    });
  });

  describe('ProductModel', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await userModel.createUser({
        email: 'seller@student.mahidol.ac.th',
        name: 'Test Seller',
        isVerified: true,
        preferredLanguage: 'en',
        isAdmin: false,
        status: 'active'
      });
    });

    const testProductData = {
      title: 'Test Product',
      description: 'A test product for sale',
      price: 100.50,
      stock: 1,
      condition: 'used' as const,
      location: 'Bangkok',
      categoryID: 1,
      status: 'active' as const
    };

    it('should create a new product', async () => {
      const productData = { ...testProductData, sellerID: testUser.userID };
      const product = await productModel.createProduct(productData);

      expect(product).toBeDefined();
      expect(product.listingID).toMatch(/^product_/);
      expect(product.title).toBe(testProductData.title);
      expect(product.price).toBe(testProductData.price);
      expect(product.sellerID).toBe(testUser.userID);
      expect(product.views).toBe(0);
    });

    it('should get product by ID', async () => {
      const productData = { ...testProductData, sellerID: testUser.userID };
      const createdProduct = await productModel.createProduct(productData);
      const foundProduct = await productModel.getProductById(createdProduct.listingID);

      expect(foundProduct).toBeDefined();
      expect(foundProduct?.listingID).toBe(createdProduct.listingID);
      expect(foundProduct?.title).toBe(testProductData.title);
    });

    it('should update product information', async () => {
      const productData = { ...testProductData, sellerID: testUser.userID };
      const createdProduct = await productModel.createProduct(productData);
      
      // Add small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updates = { title: 'Updated Product', price: 150.75 };
      const updatedProduct = await productModel.updateProduct(createdProduct.listingID, updates);

      expect(updatedProduct.title).toBe(updates.title);
      expect(updatedProduct.price).toBe(updates.price);
      expect(updatedProduct.updatedAt).not.toBe(createdProduct.updatedAt);
    });

    it('should increment product views', async () => {
      const productData = { ...testProductData, sellerID: testUser.userID };
      const createdProduct = await productModel.createProduct(productData);
      
      await productModel.incrementViews(createdProduct.listingID);
      const updatedProduct = await productModel.getProductById(createdProduct.listingID);

      expect(updatedProduct?.views).toBe(1);
    });

    it('should search products with filters', async () => {
      // Create multiple test products
      const product1Data = { ...testProductData, title: 'Laptop Computer', price: 500, sellerID: testUser.userID };
      const product2Data = { ...testProductData, title: 'Mobile Phone', price: 200, sellerID: testUser.userID };
      
      await productModel.createProduct(product1Data);
      await productModel.createProduct(product2Data);

      // Search by keyword
      const searchResult1 = await productModel.searchProducts('Laptop');
      expect(searchResult1.data.length).toBe(1);
      expect(searchResult1.data[0]?.title).toBe('Laptop Computer');

      // Search with price filter
      const searchResult2 = await productModel.searchProducts('', { minPrice: 300 });
      expect(searchResult2.data.length).toBe(1);
      expect(searchResult2.data[0]?.price).toBe(500);

      // Search with pagination
      const searchResult3 = await productModel.searchProducts('', {}, 1, 1);
      expect(searchResult3.data.length).toBe(1);
      expect(searchResult3.pagination.total).toBe(2);
      expect(searchResult3.pagination.hasNext).toBe(true);
    });

    it('should get products by seller', async () => {
      const productData = { ...testProductData, sellerID: testUser.userID };
      await productModel.createProduct(productData);
      await productModel.createProduct({ ...productData, title: 'Another Product' });

      const result = await productModel.getProductsBySeller(testUser.userID);

      expect(result.data.length).toBe(2);
      expect(result.pagination.total).toBe(2);
      result.data.forEach(product => {
        expect(product.sellerID).toBe(testUser.userID);
      });
    });

    it('should get all categories', async () => {
      const categories = await productModel.getCategories();

      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty('catID');
      expect(categories[0]).toHaveProperty('name');
      expect(categories[0]?.isActive).toBe(1); // SQLite stores boolean as integer
    });

    it('should mark product as sold', async () => {
      const productData = { ...testProductData, sellerID: testUser.userID };
      const createdProduct = await productModel.createProduct(productData);
      
      const soldProduct = await productModel.markAsSold(createdProduct.listingID);

      expect(soldProduct.status).toBe('sold');
    });
  });
});