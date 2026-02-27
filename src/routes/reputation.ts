import express, { Request, Response } from 'express';
import { ReputationService } from '../services/ReputationService';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = express.Router();
const reputationService = new ReputationService();

/**
 * GET /api/reputation/:userId
 * Get basic reputation information for a user
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const reputation = await reputationService.calculateUserReputation(userId);
    const level = reputationService.getReputationLevel(reputation);
    const badge = reputationService.getReputationBadge(reputation);
    const hasGoodReputation = reputationService.hasGoodReputation(reputation);

    res.json({
      success: true,
      data: {
        reputation,
        level,
        badge,
        hasGoodReputation
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching reputation:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch reputation'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * GET /api/reputation/:userId/detailed
 * Get detailed reputation breakdown for a user
 */
router.get('/:userId/detailed', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const detailedReputation = await reputationService.getDetailedReputation(userId);
    const level = reputationService.getReputationLevel(detailedReputation.reputation);
    const badge = reputationService.getReputationBadge(detailedReputation.reputation);

    res.json({
      success: true,
      data: {
        ...detailedReputation,
        level,
        badge
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching detailed reputation:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch detailed reputation'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * GET /api/reputation/my-reputation
 * Get reputation for the current authenticated user
 */
router.get('/my/reputation', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userID = (req as any).user.userID;

    const reputation = await reputationService.calculateUserReputation(userID);
    const level = reputationService.getReputationLevel(reputation);
    const badge = reputationService.getReputationBadge(reputation);
    const hasGoodReputation = reputationService.hasGoodReputation(reputation);

    res.json({
      success: true,
      data: {
        reputation,
        level,
        badge,
        hasGoodReputation
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching user reputation:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch user reputation'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * POST /api/reputation/compare
 * Compare reputations of two users
 */
router.post('/compare', async (req: Request, res: Response) => {
  try {
    const { userId1, userId2 } = req.body;

    if (!userId1 || !userId2) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: userId1, userId2'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const rep1 = await reputationService.calculateUserReputation(userId1);
    const rep2 = await reputationService.calculateUserReputation(userId2);
    const comparison = reputationService.compareReputations(rep1, rep2);

    res.json({
      success: true,
      data: {
        user1: {
          userID: userId1,
          reputation: rep1,
          level: reputationService.getReputationLevel(rep1)
        },
        user2: {
          userID: userId2,
          reputation: rep2,
          level: reputationService.getReputationLevel(rep2)
        },
        comparison
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error comparing reputations:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to compare reputations'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * POST /api/reputation/:userId/update
 * Manually trigger reputation recalculation (admin only)
 */
router.post('/:userId/update', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const isAdmin = (req as any).user.isAdmin;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const reputation = await reputationService.calculateUserReputation(userId);

    res.json({
      success: true,
      data: {
        message: 'Reputation updated successfully',
        reputation
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error updating reputation:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to update reputation'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

export default router;
