import { BaseModel } from './BaseModel';
import { ProductListing, ProductImage, Category, SearchFilters, PaginatedResponse } from '../types';
import { notificationService } from '../services/NotificationService';

export class ProductModel extends BaseModel {
  /**
   * Create a new product listing
   */
  async createProduct(productData: Omit<ProductListing, 'listingID' | 'views' | 'createdAt' | 'updatedAt'>): Promise<ProductListing> {
    const listingID = this.generateId('product_');
    const now = new Date().toISOString();

    const result = await this.execute(
      `INSERT INTO ProductListing (
        listingID, title, description, price, stock, condition, location,
        categoryID, sellerID, status, views, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        listingID,
        productData.title,
        productData.description || null,
        productData.price,
        productData.stock,
        productData.condition,
        productData.location || null,
        productData.categoryID,
        productData.sellerID,
        productData.status,
        0, // initial views
        now,
        now
      ]
    );

    if (result.changes === 0) {
      throw new Error('Failed to create product');
    }

    const product = await this.getProductById(listingID);
    if (!product) {
      throw new Error('Failed to retrieve created product');
    }
    return product;
  }

  /**
   * Get product by ID
   */
  async getProductById(listingID: string): Promise<ProductListing | null> {
    return await this.queryOne('SELECT * FROM ProductListing WHERE listingID = ?', [listingID]);
  }

  /**
   * Update product information
   */
  async updateProduct(listingID: string, updates: Partial<ProductListing>): Promise<ProductListing> {
    // Get current product state before update
    const currentProduct = await this.getProductById(listingID);
    if (!currentProduct) {
      throw new Error('Product not found');
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'listingID' && key !== 'createdAt' && value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Add updatedAt timestamp
    updateFields.push('updatedAt = ?');
    updateValues.push(new Date().toISOString());
    updateValues.push(listingID);

    const sql = `UPDATE ProductListing SET ${updateFields.join(', ')} WHERE listingID = ?`;
    const result = await this.execute(sql, updateValues);

    if (result.changes === 0) {
      throw new Error('Product not found or no changes made');
    }

    const product = await this.getProductById(listingID);
    if (!product) {
      throw new Error('Failed to retrieve updated product');
    }

    // Send notification if status changed
    if (updates.status && updates.status !== currentProduct.status) {
      await notificationService.createStatusChangeNotification(
        currentProduct.sellerID,
        listingID,
        currentProduct.title,
        currentProduct.status,
        updates.status
      ).catch(err => {
        // Log error but don't fail the update
        console.error('Failed to send status change notification:', err);
      });
    }

    return product;
  }

  /**
   * Delete product (soft delete by setting status to 'inactive')
   */
  async deleteProduct(listingID: string): Promise<boolean> {
    const result = await this.execute(
      'UPDATE ProductListing SET status = ?, updatedAt = ? WHERE listingID = ?',
      ['inactive', new Date().toISOString(), listingID]
    );

    return result.changes > 0;
  }

  /**
   * Increment product view count
   */
  async incrementViews(listingID: string): Promise<void> {
    await this.execute(
      'UPDATE ProductListing SET views = views + 1 WHERE listingID = ?',
      [listingID]
    );
  }

  /**
   * Search products with filters and pagination
   */
  async searchProducts(
    query?: string,
    filters: SearchFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<ProductListing>> {
    const offset = (page - 1) * limit;
    const conditions: string[] = ["status = 'active'"];
    const params: any[] = [];

    // Add search query condition
    if (query && query.trim()) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      const searchTerm = `%${query.trim()}%`;
      params.push(searchTerm, searchTerm);
    }

    // Add filter conditions
    if (filters.category) {
      conditions.push('categoryID = ?');
      params.push(filters.category);
    }

    if (filters.minPrice !== undefined) {
      conditions.push('price >= ?');
      params.push(filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      conditions.push('price <= ?');
      params.push(filters.maxPrice);
    }

    if (filters.location) {
      conditions.push('location LIKE ?');
      params.push(`%${filters.location}%`);
    }

    if (filters.condition) {
      conditions.push('condition = ?');
      params.push(filters.condition);
    }

    // Build ORDER BY clause
    let orderBy = 'ORDER BY createdAt DESC';
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          orderBy = 'ORDER BY price ASC';
          break;
        case 'price_desc':
          orderBy = 'ORDER BY price DESC';
          break;
        case 'date_asc':
          orderBy = 'ORDER BY createdAt ASC';
          break;
        case 'date_desc':
          orderBy = 'ORDER BY createdAt DESC';
          break;
      }
    }

    // Get products
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const productsQuery = `
      SELECT * FROM ProductListing 
      ${whereClause} 
      ${orderBy} 
      LIMIT ? OFFSET ?
    `;
    
    const products = await this.query(productsQuery, [...params, limit, offset]);

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM ProductListing ${whereClause}`;
    const totalResult = await this.queryOne(countQuery, params);
    const total = totalResult?.count || 0;

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get products by seller ID
   */
  async getProductsBySeller(sellerID: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<ProductListing>> {
    const offset = (page - 1) * limit;

    const products = await this.query(
      'SELECT * FROM ProductListing WHERE sellerID = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
      [sellerID, limit, offset]
    );

    const totalResult = await this.queryOne(
      'SELECT COUNT(*) as count FROM ProductListing WHERE sellerID = ?',
      [sellerID]
    );

    const total = totalResult?.count || 0;

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Add product image
   */
  async addProductImage(imageData: Omit<ProductImage, 'imageID' | 'uploadedAt'>): Promise<ProductImage> {
    const imageID = this.generateId('img_');
    const now = new Date().toISOString();

    const result = await this.execute(
      'INSERT INTO ProductImage (imageID, listingID, imagePath, isPrimary, uploadedAt) VALUES (?, ?, ?, ?, ?)',
      [imageID, imageData.listingID, imageData.imagePath, imageData.isPrimary, now]
    );

    if (result.changes === 0) {
      throw new Error('Failed to add product image');
    }

    const image = await this.getProductImageById(imageID);
    if (!image) {
      throw new Error('Failed to retrieve created image');
    }
    return image;
  }

  /**
   * Get product image by ID
   */
  async getProductImageById(imageID: string): Promise<ProductImage | null> {
    return await this.queryOne('SELECT * FROM ProductImage WHERE imageID = ?', [imageID]);
  }

  /**
   * Get all images for a product
   */
  async getProductImages(listingID: string): Promise<ProductImage[]> {
    return await this.query(
      'SELECT * FROM ProductImage WHERE listingID = ? ORDER BY isPrimary DESC, uploadedAt ASC',
      [listingID]
    );
  }

  /**
   * Delete product image
   */
  async deleteProductImage(imageID: string): Promise<boolean> {
    const result = await this.execute('DELETE FROM ProductImage WHERE imageID = ?', [imageID]);
    return result.changes > 0;
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    return await this.query('SELECT * FROM Category WHERE isActive = 1 ORDER BY name ASC');
  }

  /**
   * Get category by ID
   */
  async getCategoryById(catID: number): Promise<Category | null> {
    return await this.queryOne('SELECT * FROM Category WHERE catID = ?', [catID]);
  }

  /**
   * Mark product as sold
   */
  async markAsSold(listingID: string): Promise<ProductListing> {
    return await this.updateProduct(listingID, { status: 'sold' });
  }

  /**
   * Get featured/popular products
   */
  async getFeaturedProducts(limit: number = 10): Promise<ProductListing[]> {
    return await this.query(
      `SELECT * FROM ProductListing 
       WHERE status = 'active' 
       ORDER BY views DESC, createdAt DESC 
       LIMIT ?`,
      [limit]
    );
  }
}