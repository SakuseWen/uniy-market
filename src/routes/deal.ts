import express, { Request, Response } from 'express';
import { DealModel } from '../models/DealModel';
import { ProductModel } from '../models/ProductModel';
import { UserModel } from '../models/UserModel';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse } from '../types';
import { createDealNotification } from './dealNotification';

const router = express.Router();
const dealModel = new DealModel();
const productModel = new ProductModel();
const userModel = new UserModel();

/**
 * POST /api/deals
 * Create a new deal/transaction
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { listingID, buyerID, sellerID, finalPrice, notes } = req.body;
    const currentUserID = (req as any).user.userID;

    // Validate required fields
    if (!listingID || !buyerID || !sellerID) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: listingID, buyerID, sellerID'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    // Verify current user is either buyer or seller
    if (currentUserID !== buyerID && currentUserID !== sellerID) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'You must be either the buyer or seller to create this deal'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    // Verify product exists and is active
    const product = await productModel.getProductById(listingID);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Product not found'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    if (product.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Product is not available for purchase'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    // Verify seller owns the product
    if (product.sellerID !== sellerID) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Seller does not own this product'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    // Verify buyer and seller are different users
    if (buyerID === sellerID) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Buyer and seller cannot be the same user'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    // Verify users exist
    const buyer = await userModel.getUserById(buyerID);
    const seller = await userModel.getUserById(sellerID);

    if (!buyer || !seller) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Buyer or seller not found'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    // Create deal
    const deal = await dealModel.createDeal({
      listingID,
      buyerID,
      sellerID,
      transactionDate: new Date().toISOString(),
      status: 'pending',
      finalPrice: finalPrice || product.price,
      notes
    });

    // Notify seller about new purchase request
    await createDealNotification(sellerID, deal.dealID, 'new_request', `New purchase request for "${product.title}"`);

    res.status(201).json({
      success: true,
      data: deal,
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error creating deal:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to create deal'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * GET /api/deals
 * Get deals for current user (as buyer or seller)
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userID = (req as any).user.userID;
    const { role, status } = req.query;

    let deals;

    if (role === 'buyer') {
      deals = await dealModel.getDealsByBuyer(userID);
    } else if (role === 'seller') {
      deals = await dealModel.getDealsBySeller(userID);
    } else {
      deals = await dealModel.getDealsByUser(userID);
    }

    // Filter by status if provided
    if (status) {
      deals = deals.filter((deal: any) => deal.status === status);
    }

    // Enrich with product title and images
    const enriched = await Promise.all(deals.map(async (deal: any) => {
      const product = await productModel.getProductById(deal.listingID);
      const images = await productModel.getProductImages(deal.listingID);
      return { ...deal, title: product?.title || deal.listingID, images };
    }));

    res.json({
      success: true,
      data: enriched,
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch deals'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * GET /api/deals/history
 * Get transaction history with details
 */
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userID = (req as any).user.userID;

    const deals = await dealModel.getDealsWithDetails(userID);

    res.json({
      success: true,
      data: deals,
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch transaction history'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * GET /api/deals/:dealId
 * Get specific deal by ID
 */
router.get('/:dealId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const userID = (req as any).user.userID;

    const deal = await dealModel.getDealById(dealId);

    if (!deal) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Deal not found'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    // Verify user is part of the deal
    if (deal.buyerID !== userID && deal.sellerID !== userID) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'You do not have access to this deal'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: deal,
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching deal:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch deal'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * PUT /api/deals/:dealId/status
 * Update deal status
 */
router.put('/:dealId/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const { status } = req.body;
    const userID = (req as any).user.userID;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Status is required'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    // Validate status
    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid status. Must be: pending, completed, or cancelled'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const deal = await dealModel.getDealById(dealId);

    if (!deal) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Deal not found'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    // Verify user is part of the deal
    if (deal.buyerID !== userID && deal.sellerID !== userID) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'You do not have access to this deal'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    // Update deal status
    const updatedDeal = await dealModel.updateDealStatus(dealId, status);

    // If deal is completed, update product status to sold
    if (status === 'completed') {
      await productModel.updateProduct(deal.listingID, { status: 'sold' });
    }

    res.json({
      success: true,
      data: updatedDeal,
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error updating deal status:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to update deal status'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * PUT /api/deals/:dealId
 * Update deal details
 */
router.put('/:dealId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const { finalPrice, notes, status } = req.body;
    const userID = (req as any).user.userID;

    const deal = await dealModel.getDealById(dealId);

    if (!deal) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Deal not found'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    // Verify user is part of the deal
    if (deal.buyerID !== userID && deal.sellerID !== userID) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'You do not have access to this deal'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    // Build updates object
    const updates: any = {};
    if (finalPrice !== undefined) updates.finalPrice = finalPrice;
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) {
      if (!['pending', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid status'
          },
          timestamp: new Date().toISOString()
        } as ApiResponse);
      }
      updates.status = status;
    }

    const updatedDeal = await dealModel.updateDeal(dealId, updates);

    // If deal is completed, update product status
    if (status === 'completed') {
      await productModel.updateProduct(deal.listingID, { status: 'sold' });
    }

    res.json({
      success: true,
      data: updatedDeal,
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error updating deal:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to update deal'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * DELETE /api/deals/:dealId
 * Delete a deal (only if pending)
 */
router.delete('/:dealId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const userID = (req as any).user.userID;

    const deal = await dealModel.getDealById(dealId);

    if (!deal) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Deal not found'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    // Verify user is part of the deal
    if (deal.buyerID !== userID && deal.sellerID !== userID) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'You do not have access to this deal'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    // Only allow deletion of non-active deals
    if (deal.status === 'pending' && deal.notes === 'accepted') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot delete a deal that is in transaction'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const deleted = await dealModel.deleteDeal(dealId);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete deal'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: { message: 'Deal deleted successfully' },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error deleting deal:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to delete deal'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * GET /api/deals/stats/summary
 * Get transaction statistics for current user
 */
router.get('/stats/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userID = (req as any).user.userID;

    const allDeals = await dealModel.getDealsByUser(userID);
    const buyerDeals = await dealModel.getDealsByBuyer(userID);
    const sellerDeals = await dealModel.getDealsBySeller(userID);

    const stats = {
      total: allDeals.length,
      asBuyer: buyerDeals.length,
      asSeller: sellerDeals.length,
      completed: allDeals.filter((d: any) => d.status === 'completed').length,
      pending: allDeals.filter((d: any) => d.status === 'pending').length,
      cancelled: allDeals.filter((d: any) => d.status === 'cancelled').length,
      completedAsBuyer: buyerDeals.filter((d: any) => d.status === 'completed').length,
      completedAsSeller: sellerDeals.filter((d: any) => d.status === 'completed').length
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching deal statistics:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch deal statistics'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * PUT /api/deals/:dealId/accept
 * Seller accepts a pending deal request
 */
router.put('/:dealId/accept', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const userID = (req as any).user.userID;
    const deal = await dealModel.getDealById(dealId);
    if (!deal) return res.status(404).json({ success: false, error: { message: 'Deal not found' } });
    if (deal.sellerID !== userID) return res.status(403).json({ success: false, error: { message: 'Only the seller can accept' } });
    if (deal.status !== 'pending') return res.status(400).json({ success: false, error: { message: 'Deal is not pending' } });

    const updated = await dealModel.updateDeal(dealId, { status: 'pending', notes: 'accepted' });
    // Notify buyer that seller accepted
    await createDealNotification(deal.buyerID, dealId, 'accepted', 'The seller has accepted your purchase request');
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

/**
 * PUT /api/deals/:dealId/reject
 * Seller rejects a pending deal request
 */
router.put('/:dealId/reject', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const userID = (req as any).user.userID;
    const deal = await dealModel.getDealById(dealId);
    if (!deal) return res.status(404).json({ success: false, error: { message: 'Deal not found' } });
    if (deal.sellerID !== userID) return res.status(403).json({ success: false, error: { message: 'Only the seller can reject' } });
    if (deal.status !== 'pending') return res.status(400).json({ success: false, error: { message: 'Deal is not pending' } });

    const updated = await dealModel.updateDealStatus(dealId, 'cancelled');
    // Notify buyer about rejection
    await createDealNotification(deal.buyerID, dealId, 'rejected', 'The seller has rejected your purchase request');
    res.json({ success: true, data: updated, rejected: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

/**
 * PUT /api/deals/:dealId/confirm
 * Buyer or seller confirms deal completion (dual confirmation)
 */
router.put('/:dealId/confirm', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const userID = (req as any).user.userID;
    const db = (await import('../config/database')).DatabaseManager.getInstance().getDatabase();
    const deal = await dealModel.getDealById(dealId);
    if (!deal) return res.status(404).json({ success: false, error: { message: 'Deal not found' } });
    if (deal.buyerID !== userID && deal.sellerID !== userID) return res.status(403).json({ success: false, error: { message: 'Unauthorized' } });
    if (deal.status !== 'pending') return res.status(400).json({ success: false, error: { message: 'Deal is not in transaction' } });

    const isBuyer = deal.buyerID === userID;
    const field = isBuyer ? 'buyerConfirmed' : 'sellerConfirmed';
    await db.run(`UPDATE Deal SET ${field} = 1, updatedAt = ? WHERE dealID = ?`, [new Date().toISOString(), dealId]);

    // Check if both confirmed
    const updated = await db.get('SELECT * FROM Deal WHERE dealID = ?', [dealId]);
    if (updated.buyerConfirmed && updated.sellerConfirmed) {
      await dealModel.updateDealStatus(dealId, 'completed');
      await productModel.updateProduct(deal.listingID, { status: 'sold' });
      return res.json({ success: true, data: { ...updated, status: 'completed' }, completed: true });
    }

    res.json({ success: true, data: updated, completed: false });
  } catch (error: any) {
    console.error('Confirm deal error:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

/**
 * GET /api/deals/product/:listingID/status
 * Public - check if product is in transaction
 */
router.get('/product/:listingID/status', async (req: Request, res: Response) => {
  try {
    const { listingID } = req.params;
    const db = (await import('../config/database')).DatabaseManager.getInstance().getDatabase();
    const deal = await db.get(
      "SELECT dealID, status, notes FROM Deal WHERE listingID = ? AND status = 'pending' AND notes = 'accepted'",
      [listingID]
    );
    res.json({ success: true, inTransaction: !!deal });
  } catch (error: any) {
    res.status(500).json({ success: false, inTransaction: false });
  }
});

/**
 * GET /api/deals/product/:listingID
 * Get active deal for a product
 */
router.get('/product/:listingID', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { listingID } = req.params;
    const userID = (req as any).user.userID;
    const db = (await import('../config/database')).DatabaseManager.getInstance().getDatabase();
    const deal = await db.get(
      "SELECT * FROM Deal WHERE listingID = ? AND status = 'pending' AND (buyerID = ? OR sellerID = ?)",
      [listingID, userID, userID]
    );
    res.json({ success: true, data: deal || null });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

export default router;
