import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { DatabaseManager } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

async function getDb() {
  return DatabaseManager.getInstance().getDatabase();
}

// GET /api/comments/:listingID - Get comments for a product
router.get('/:listingID', async (req: Request, res: Response) => {
  try {
    const { listingID } = req.params;
    const db = await getDb();
    const comments = await db.all(`
      SELECT c.*, u.name, u.profileImage
      FROM Comment c
      JOIN User u ON c.userID = u.userID
      WHERE c.listingID = ? AND c.parentID IS NULL
      ORDER BY c.createdAt DESC
    `, [listingID]);

    // Get replies for each comment
    const result = await Promise.all(comments.map(async (comment: any) => {
      const replies = await db.all(`
        SELECT c.*, u.name, u.profileImage
        FROM Comment c
        JOIN User u ON c.userID = u.userID
        WHERE c.parentID = ?
        ORDER BY c.createdAt ASC
      `, [comment.commentID]);
      return { ...comment, replies };
    }));

    res.json({ success: true, comments: result });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, error: 'Failed to get comments' });
  }
});

// POST /api/comments - Add a comment (logged in users only)
router.post('/',
  authenticateToken,
  [
    body('listingID').notEmpty(),
    body('content').trim().isLength({ min: 1, max: 1000 }),
    body('parentID').optional(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: 'Invalid input', details: errors.array() });
      }

      const user = (req as any).user;
      const { listingID, content, parentID } = req.body;
      const db = await getDb();

      // If replying, check that parent comment exists and user is the product seller
      if (parentID) {
        const product = await db.get('SELECT sellerID FROM ProductListing WHERE listingID = ?', [listingID]);
        if (!product || product.sellerID !== user.userID) {
          return res.status(403).json({ success: false, error: 'Only the seller can reply to comments' });
        }
      }

      const commentID = `cmt_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      const now = new Date().toISOString();

      await db.run(
        'INSERT INTO Comment (commentID, listingID, userID, content, parentID, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [commentID, listingID, user.userID, content, parentID || null, now]
      );

      const comment = await db.get(`
        SELECT c.*, u.name, u.profileImage
        FROM Comment c JOIN User u ON c.userID = u.userID
        WHERE c.commentID = ?
      `, [commentID]);

      res.status(201).json({ success: true, comment });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ success: false, error: 'Failed to add comment' });
    }
  }
);

// DELETE /api/comments/:commentID - Delete own comment
router.delete('/:commentID', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { commentID } = req.params;
    const db = await getDb();

    const comment = await db.get('SELECT * FROM Comment WHERE commentID = ?', [commentID]);
    if (!comment) return res.status(404).json({ success: false, error: 'Comment not found' });
    if (comment.userID !== user.userID && !user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    await db.run('DELETE FROM Comment WHERE commentID = ? OR parentID = ?', [commentID, commentID]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete comment' });
  }
});

export default router;
