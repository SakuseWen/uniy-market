/**
 * FavoriteModel handles user favorites data operations
 * Implements Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { BaseModel } from './BaseModel';

export interface Favorite {
  favID: string;
  userID: string;
  listingID: string;
  createdAt: string;
}

export interface FavoriteWithProduct {
  favID: string;
  userID: string;
  listingID: string;
  createdAt: string;
  // Product details
  title: string;
  description: string;
  price: number;
  condition: string;
  status: string;
  sellerID: string;
  categoryID: number;
  location: string;
}

export class FavoriteModel extends BaseModel {
  /**
   * Add a product to favorites
   */
  async addFavorite(userID: string, listingID: string): Promise<Favorite> {
    // Check if already favorited
    const existing = await this.findByUserAndListing(userID, listingID);
    if (existing) {
      return existing;
    }

    const favID = this.generateId('fav_');
    const now = new Date().toISOString();

    const query = `
      INSERT INTO Favorite (favID, userID, listingID, createdAt)
      VALUES (?, ?, ?, ?)
    `;

    await this.execute(query, [favID, userID, listingID, now]);

    const favorite = await this.findById(favID);
    if (!favorite) {
      throw new Error('Failed to create favorite');
    }

    return favorite;
  }

  /**
   * Remove a product from favorites
   */
  async removeFavorite(userID: string, listingID: string): Promise<boolean> {
    const query = `
      DELETE FROM Favorite
      WHERE userID = ? AND listingID = ?
    `;

    const result = await this.execute(query, [userID, listingID]);
    return (result.changes || 0) > 0;
  }

  /**
   * Find favorite by ID
   */
  async findById(favID: string): Promise<Favorite | null> {
    const query = `SELECT * FROM Favorite WHERE favID = ?`;
    const result = await this.queryOne(query, [favID]);
    return result || null;
  }

  /**
   * Find favorite by user and listing
   */
  async findByUserAndListing(userID: string, listingID: string): Promise<Favorite | null> {
    const query = `
      SELECT * FROM Favorite
      WHERE userID = ? AND listingID = ?
    `;
    const result = await this.queryOne(query, [userID, listingID]);
    return result || null;
  }

  /**
   * Get all favorites for a user
   */
  async findByUser(userID: string): Promise<Favorite[]> {
    const query = `
      SELECT * FROM Favorite
      WHERE userID = ?
      ORDER BY createdAt DESC
    `;
    return await this.query(query, [userID]);
  }

  /**
   * Get all favorites for a user with product details
   */
  async findByUserWithProducts(userID: string): Promise<FavoriteWithProduct[]> {
    const query = `
      SELECT 
        f.favID,
        f.userID,
        f.listingID,
        f.createdAt,
        p.title,
        p.description,
        p.price,
        p.condition,
        p.status,
        p.sellerID,
        p.categoryID,
        p.location
      FROM Favorite f
      INNER JOIN ProductListing p ON f.listingID = p.listingID
      WHERE f.userID = ?
      ORDER BY f.createdAt DESC
    `;
    return await this.query(query, [userID]);
  }

  /**
   * Get active favorites (products that are still available)
   */
  async findActiveByUser(userID: string): Promise<FavoriteWithProduct[]> {
    const query = `
      SELECT 
        f.favID,
        f.userID,
        f.listingID,
        f.createdAt,
        p.title,
        p.description,
        p.price,
        p.condition,
        p.status,
        p.sellerID,
        p.categoryID,
        p.location
      FROM Favorite f
      INNER JOIN ProductListing p ON f.listingID = p.listingID
      WHERE f.userID = ? AND p.status = 'active'
      ORDER BY f.createdAt DESC
    `;
    return await this.query(query, [userID]);
  }

  /**
   * Check if a user has favorited a product
   */
  async isFavorited(userID: string, listingID: string): Promise<boolean> {
    const favorite = await this.findByUserAndListing(userID, listingID);
    return favorite !== null;
  }

  /**
   * Get favorite count for a product
   */
  async getFavoriteCount(listingID: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM Favorite
      WHERE listingID = ?
    `;
    const result = await this.queryOne(query, [listingID]) as { count: number } | null;
    return result?.count || 0;
  }

  /**
   * Get total favorites count for a user
   */
  async getUserFavoriteCount(userID: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM Favorite
      WHERE userID = ?
    `;
    const result = await this.queryOne(query, [userID]) as { count: number } | null;
    return result?.count || 0;
  }

  /**
   * Remove all favorites for a product (when product is deleted)
   */
  async removeAllForProduct(listingID: string): Promise<number> {
    const query = `
      DELETE FROM Favorite
      WHERE listingID = ?
    `;
    const result = await this.execute(query, [listingID]);
    return result.changes || 0;
  }

  /**
   * Remove all favorites for a user
   */
  async removeAllForUser(userID: string): Promise<number> {
    const query = `
      DELETE FROM Favorite
      WHERE userID = ?
    `;
    const result = await this.execute(query, [userID]);
    return result.changes || 0;
  }

  /**
   * Get users who favorited a product
   */
  async getUsersWhoFavorited(listingID: string): Promise<string[]> {
    const query = `
      SELECT userID
      FROM Favorite
      WHERE listingID = ?
    `;
    const results = await this.query(query, [listingID]) as { userID: string }[];
    return results.map(r => r.userID);
  }

  /**
   * Batch check if products are favorited by user
   */
  async areFavorited(userID: string, listingIDs: string[]): Promise<Record<string, boolean>> {
    if (listingIDs.length === 0) {
      return {};
    }

    const placeholders = listingIDs.map(() => '?').join(',');
    const query = `
      SELECT listingID
      FROM Favorite
      WHERE userID = ? AND listingID IN (${placeholders})
    `;

    const results = await this.query(query, [userID, ...listingIDs]) as { listingID: string }[];
    const favoritedSet = new Set(results.map(r => r.listingID));

    const result: Record<string, boolean> = {};
    listingIDs.forEach(id => {
      result[id] = favoritedSet.has(id);
    });

    return result;
  }
}
