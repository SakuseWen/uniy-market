/**
 * Favorite routes
 * Implements Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */

import express, { Request, Response } from 'express';
import { FavoriteModel } from '../models/FavoriteModel';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const favoriteModel = new FavoriteModel();

/**
 * Get all favorites for current user
 * GET /api/favorites
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userID = (req as any).user?.userId;
    if (!userID) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const includeProducts = req.query.include === 'products';
    const activeOnly = req.query.active === 'true';

    let favorites;
    if (includeProducts) {
      if (activeOnly) {
        favorites = await favoriteModel.findActiveByUser(userID);
      } else {
        favorites = await favoriteModel.findByUserWithProducts(userID);
      }
    } else {
      favorites = await favoriteModel.findByUser(userID);
    }

    res.json({ favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

/**
 * Add a product to favorites
 * POST /api/favorites
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userID = (req as any).user?.userId;
    if (!userID) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { listingID } = req.body;

    if (!listingID) {
      return res.status(400).json({ error: 'listingID is required' });
    }

    // Check if already favorited
    const existing = await favoriteModel.findByUserAndListing(userID, listingID);
    if (existing) {
      return res.status(200).json({
        message: 'Product already in favorites',
        favorite: existing
      });
    }

    const favorite = await favoriteModel.addFavorite(userID, listingID);

    res.status(201).json({
      message: 'Product added to favorites',
      favorite
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

/**
 * Remove a product from favorites
 * DELETE /api/favorites/:listingID
 */
router.delete('/:listingID', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userID = (req as any).user?.userId;
    if (!userID) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { listingID } = req.params;

    const removed = await favoriteModel.removeFavorite(userID, listingID);

    if (!removed) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Product removed from favorites' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

/**
 * Check if a product is favorited
 * GET /api/favorites/check/:listingID
 */
router.get('/check/:listingID', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userID = (req as any).user?.userId;
    if (!userID) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { listingID } = req.params;

    const isFavorited = await favoriteModel.isFavorited(userID, listingID);

    res.json({ isFavorited });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({ error: 'Failed to check favorite' });
  }
});

/**
 * Batch check if products are favorited
 * POST /api/favorites/check-batch
 */
router.post('/check-batch', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userID = (req as any).user?.userId;
    if (!userID) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { listingIDs } = req.body;

    if (!Array.isArray(listingIDs)) {
      return res.status(400).json({ error: 'listingIDs must be an array' });
    }

    const favorites = await favoriteModel.areFavorited(userID, listingIDs);

    res.json({ favorites });
  } catch (error) {
    console.error('Error checking favorites:', error);
    res.status(500).json({ error: 'Failed to check favorites' });
  }
});

/**
 * Get favorite count for a product
 * GET /api/favorites/count/:listingID
 */
router.get('/count/:listingID', async (req: Request, res: Response) => {
  try {
    const { listingID } = req.params;

    const count = await favoriteModel.getFavoriteCount(listingID);

    res.json({ count });
  } catch (error) {
    console.error('Error getting favorite count:', error);
    res.status(500).json({ error: 'Failed to get favorite count' });
  }
});

/**
 * Get user's total favorites count
 * GET /api/favorites/my/count
 */
router.get('/my/count', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userID = (req as any).user?.userId;
    if (!userID) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = await favoriteModel.getUserFavoriteCount(userID);

    res.json({ count });
  } catch (error) {
    console.error('Error getting user favorite count:', error);
    res.status(500).json({ error: 'Failed to get favorite count' });
  }
});

export default router;
