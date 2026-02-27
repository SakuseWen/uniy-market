import { BaseModel } from './BaseModel';
import { Chat, PaginatedResponse } from '../types';

export class ChatModel extends BaseModel {
  /**
   * Create a new chat between buyer and seller
   */
  async createChat(chatData: Omit<Chat, 'chatID' | 'createdAt' | 'lastMessageAt'>): Promise<Chat> {
    // Check if chat already exists between these users for this listing
    const existingChat = await this.queryOne(
      `SELECT * FROM Chat 
       WHERE buyerID = ? AND sellerID = ? AND listingID = ? AND status != 'deleted'`,
      [chatData.buyerID, chatData.sellerID, chatData.listingID]
    );

    if (existingChat) {
      // Reactivate if closed
      if (existingChat.status === 'closed') {
        return await this.updateChat(existingChat.chatID, { status: 'active' });
      }
      return existingChat;
    }

    const chatID = this.generateId('chat_');
    const now = new Date().toISOString();

    const result = await this.execute(
      `INSERT INTO Chat (chatID, buyerID, sellerID, listingID, status, createdAt, lastMessageAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [chatID, chatData.buyerID, chatData.sellerID, chatData.listingID, chatData.status, now, now]
    );

    if (result.changes === 0) {
      throw new Error('Failed to create chat');
    }

    const chat = await this.getChatById(chatID);
    if (!chat) {
      throw new Error('Failed to retrieve created chat');
    }
    return chat;
  }

  /**
   * Get chat by ID
   */
  async getChatById(chatID: string): Promise<Chat | null> {
    return await this.queryOne('SELECT * FROM Chat WHERE chatID = ?', [chatID]);
  }

  /**
   * Get chat with additional details (product info, user info)
   */
  async getChatWithDetails(chatID: string): Promise<any> {
    const query = `
      SELECT 
        c.*,
        p.title as productTitle,
        p.price as productPrice,
        p.status as productStatus,
        buyer.name as buyerName,
        buyer.profileImage as buyerImage,
        seller.name as sellerName,
        seller.profileImage as sellerImage
      FROM Chat c
      LEFT JOIN ProductListing p ON c.listingID = p.listingID
      LEFT JOIN User buyer ON c.buyerID = buyer.userID
      LEFT JOIN User seller ON c.sellerID = seller.userID
      WHERE c.chatID = ?
    `;
    
    return await this.queryOne(query, [chatID]);
  }

  /**
   * Get all chats for a user (as buyer or seller)
   */
  async getChatsByUser(userID: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<any>> {
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        c.*,
        p.title as productTitle,
        p.price as productPrice,
        p.status as productStatus,
        pi.imagePath as productImage,
        buyer.name as buyerName,
        buyer.profileImage as buyerImage,
        seller.name as sellerName,
        seller.profileImage as sellerImage,
        (SELECT COUNT(*) FROM Message WHERE chatID = c.chatID AND isRead = 0 AND senderID != ?) as unreadCount
      FROM Chat c
      LEFT JOIN ProductListing p ON c.listingID = p.listingID
      LEFT JOIN (SELECT listingID, imagePath FROM ProductImage WHERE isPrimary = 1) pi ON p.listingID = pi.listingID
      LEFT JOIN User buyer ON c.buyerID = buyer.userID
      LEFT JOIN User seller ON c.sellerID = seller.userID
      WHERE (c.buyerID = ? OR c.sellerID = ?) AND c.status != 'deleted'
      ORDER BY c.lastMessageAt DESC
      LIMIT ? OFFSET ?
    `;

    const chats = await this.query(query, [userID, userID, userID, limit, offset]);

    const countQuery = `
      SELECT COUNT(*) as count FROM Chat 
      WHERE (buyerID = ? OR sellerID = ?) AND status != 'deleted'
    `;
    const totalResult = await this.queryOne(countQuery, [userID, userID]);
    const total = totalResult?.count || 0;

    return {
      data: chats,
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
   * Update chat information
   */
  async updateChat(chatID: string, updates: Partial<Chat>): Promise<Chat> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'chatID' && key !== 'createdAt' && value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateValues.push(chatID);

    const sql = `UPDATE Chat SET ${updateFields.join(', ')} WHERE chatID = ?`;
    const result = await this.execute(sql, updateValues);

    if (result.changes === 0) {
      throw new Error('Chat not found or no changes made');
    }

    const chat = await this.getChatById(chatID);
    if (!chat) {
      throw new Error('Failed to retrieve updated chat');
    }
    return chat;
  }

  /**
   * Update last message timestamp
   */
  async updateLastMessageTime(chatID: string): Promise<void> {
    await this.execute(
      'UPDATE Chat SET lastMessageAt = ? WHERE chatID = ?',
      [new Date().toISOString(), chatID]
    );
  }

  /**
   * Delete chat (soft delete by setting status to 'deleted')
   */
  async deleteChat(chatID: string): Promise<boolean> {
    const result = await this.execute(
      'UPDATE Chat SET status = ? WHERE chatID = ?',
      ['deleted', chatID]
    );

    return result.changes > 0;
  }

  /**
   * Hard delete chat and all associated messages
   */
  async hardDeleteChat(chatID: string): Promise<boolean> {
    return await this.withTransaction(async () => {
      // Delete all messages first
      await this.execute('DELETE FROM Message WHERE chatID = ?', [chatID]);
      
      // Delete the chat
      const result = await this.execute('DELETE FROM Chat WHERE chatID = ?', [chatID]);
      
      return result.changes > 0;
    });
  }

  /**
   * Check if user is participant in chat
   */
  async isUserInChat(chatID: string, userID: string): Promise<boolean> {
    const chat = await this.queryOne(
      'SELECT chatID FROM Chat WHERE chatID = ? AND (buyerID = ? OR sellerID = ?)',
      [chatID, userID, userID]
    );

    return !!chat;
  }

  /**
   * Get chat by listing and users
   */
  async getChatByListingAndUsers(listingID: string, buyerID: string, sellerID: string): Promise<Chat | null> {
    return await this.queryOne(
      `SELECT * FROM Chat 
       WHERE listingID = ? AND buyerID = ? AND sellerID = ? AND status != 'deleted'`,
      [listingID, buyerID, sellerID]
    );
  }

  /**
   * Get active chats count for a user
   */
  async getActiveChatsCount(userID: string): Promise<number> {
    const result = await this.queryOne(
      `SELECT COUNT(*) as count FROM Chat 
       WHERE (buyerID = ? OR sellerID = ?) AND status = 'active'`,
      [userID, userID]
    );

    return result?.count || 0;
  }
}
