import express, { Request, Response } from 'express';
import { DealModel } from '../models/DealModel';
import { ProductModel } from '../models/ProductModel';
import { UserModel } from '../models/UserModel';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse } from '../types';

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

    res.json({
      success: true,
      data: deals,
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

    // Only allow deletion of pending deals
    if (deal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Only pending deals can be deleted'
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

export default router;
