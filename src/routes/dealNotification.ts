import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { DatabaseManager } from '../config/database';

const router = express.Router();
async function getDb() { return DatabaseManager.getInstance().getDatabase(); }

// GET /api/deal-notifications - Get notifications for current user
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userID = (req as any).user?.userID;
    const db = await getDb();
    const notifications = await db.all(
      'SELECT n.*, d.listingID, d.status as dealStatus, p.title as productTitle FROM DealNotification n LEFT JOIN Deal d ON n.dealID = d.dealID LEFT JOIN ProductListing p ON d.listingID = p.listingID WHERE n.userID = ? ORDER BY n.createdAt DESC LIMIT 50',
      [userID]
    );
    const unreadCount = await db.get('SELECT COUNT(*) as count FROM DealNotification WHERE userID = ? AND isRead = 0', [userID]);
    res.json({ success: true, notifications, unreadCount: unreadCount?.count || 0 });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

// PUT /api/deal-notifications/read-all - Mark all as read
router.put('/read-all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userID = (req as any).user?.userID;
    const db = await getDb();
    await db.run('UPDATE DealNotification SET isRead = 1 WHERE userID = ?', [userID]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

export default router;

// Helper to create notification
export async function createDealNotification(userID: string, dealID: string, type: string, message: string) {
  try {
    const db = DatabaseManager.getInstance().getDatabase();
    await db.run(
      'INSERT INTO DealNotification (userID, dealID, type, message, createdAt) VALUES (?, ?, ?, ?, ?)',
      [userID, dealID, type, message, new Date().toISOString()]
    );
  } catch (e) { console.error('Create notification error:', e); }
}
