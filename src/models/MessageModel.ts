import { BaseModel } from './BaseModel';
import { Message, PaginatedResponse } from '../types';

export class MessageModel extends BaseModel {
  /**
   * Create a new message
   */
  async createMessage(messageData: Omit<Message, 'messageID' | 'timestamp' | 'isRead'>): Promise<Message> {
    const messageID = this.generateId('msg_');
    const now = new Date().toISOString();

    const result = await this.execute(
      `INSERT INTO Message (
        messageID, chatID, senderID, messageText, messageType, 
        isTranslated, originalLanguage, translatedText, timestamp, isRead
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        messageID,
        messageData.chatID,
        messageData.senderID,
        messageData.messageText,
        messageData.messageType,
        messageData.isTranslated || false,
        messageData.originalLanguage || null,
        messageData.translatedText || null,
        now,
        false
      ]
    );

    if (result.changes === 0) {
      throw new Error('Failed to create message');
    }

    const message = await this.getMessageById(messageID);
    if (!message) {
      throw new Error('Failed to retrieve created message');
    }
    return message;
  }

  /**
   * Get message by ID
   */
  async getMessageById(messageID: string): Promise<Message | null> {
    return await this.queryOne('SELECT * FROM Message WHERE messageID = ?', [messageID]);
  }

  /**
   * Get message with sender details
   */
  async getMessageWithDetails(messageID: string): Promise<any> {
    const query = `
      SELECT 
        m.*,
        u.name as senderName,
        u.profileImage as senderImage
      FROM Message m
      LEFT JOIN User u ON m.senderID = u.userID
      WHERE m.messageID = ?
    `;
    
    return await this.queryOne(query, [messageID]);
  }

  /**
   * Get messages for a chat with pagination
   */
  async getMessagesByChat(
    chatID: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<PaginatedResponse<any>> {
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        m.*,
        u.name as senderName,
        u.profileImage as senderImage
      FROM Message m
      LEFT JOIN User u ON m.senderID = u.userID
      WHERE m.chatID = ?
      ORDER BY m.timestamp ASC
      LIMIT ? OFFSET ?
    `;

    const messages = await this.query(query, [chatID, limit, offset]);

    const countQuery = 'SELECT COUNT(*) as count FROM Message WHERE chatID = ?';
    const totalResult = await this.queryOne(countQuery, [chatID]);
    const total = totalResult?.count || 0;

    return {
      data: messages,
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
   * Get recent messages for a chat (most recent first)
   */
  async getRecentMessages(chatID: string, limit: number = 50): Promise<any[]> {
    const query = `
      SELECT 
        m.*,
        u.name as senderName,
        u.profileImage as senderImage
      FROM Message m
      LEFT JOIN User u ON m.senderID = u.userID
      WHERE m.chatID = ?
      ORDER BY m.timestamp DESC
      LIMIT ?
    `;

    const messages = await this.query(query, [chatID, limit]);
    
    // Return in chronological order (oldest first)
    return messages.reverse();
  }

  /**
   * Update message
   */
  async updateMessage(messageID: string, updates: Partial<Message>): Promise<Message> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'messageID' && key !== 'timestamp' && value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateValues.push(messageID);

    const sql = `UPDATE Message SET ${updateFields.join(', ')} WHERE messageID = ?`;
    const result = await this.execute(sql, updateValues);

    if (result.changes === 0) {
      throw new Error('Message not found or no changes made');
    }

    const message = await this.getMessageById(messageID);
    if (!message) {
      throw new Error('Failed to retrieve updated message');
    }
    return message;
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageID: string): Promise<void> {
    await this.execute(
      'UPDATE Message SET isRead = 1 WHERE messageID = ?',
      [messageID]
    );
  }

  /**
   * Mark all messages in a chat as read for a specific user
   */
  async markChatMessagesAsRead(chatID: string, userID: string): Promise<number> {
    const result = await this.execute(
      'UPDATE Message SET isRead = 1 WHERE chatID = ? AND senderID != ? AND isRead = 0',
      [chatID, userID]
    );

    return result.changes || 0;
  }

  /**
   * Delete message
   */
  async deleteMessage(messageID: string): Promise<boolean> {
    const result = await this.execute('DELETE FROM Message WHERE messageID = ?', [messageID]);
    return result.changes > 0;
  }

  /**
   * Delete all messages in a chat
   */
  async deleteMessagesByChat(chatID: string): Promise<number> {
    const result = await this.execute('DELETE FROM Message WHERE chatID = ?', [chatID]);
    return result.changes || 0;
  }

  /**
   * Get unread message count for a chat
   */
  async getUnreadCount(chatID: string, userID: string): Promise<number> {
    const result = await this.queryOne(
      'SELECT COUNT(*) as count FROM Message WHERE chatID = ? AND senderID != ? AND isRead = 0',
      [chatID, userID]
    );

    return result?.count || 0;
  }

  /**
   * Get total unread messages for a user across all chats
   */
  async getTotalUnreadCount(userID: string): Promise<number> {
    const result = await this.queryOne(
      `SELECT COUNT(*) as count FROM Message m
       INNER JOIN Chat c ON m.chatID = c.chatID
       WHERE (c.buyerID = ? OR c.sellerID = ?) 
       AND m.senderID != ? 
       AND m.isRead = 0
       AND c.status != 'deleted'`,
      [userID, userID, userID]
    );

    return result?.count || 0;
  }

  /**
   * Get last message for a chat
   */
  async getLastMessage(chatID: string): Promise<Message | null> {
    return await this.queryOne(
      'SELECT * FROM Message WHERE chatID = ? ORDER BY timestamp DESC LIMIT 1',
      [chatID]
    );
  }

  /**
   * Search messages in a chat
   */
  async searchMessages(chatID: string, searchTerm: string, limit: number = 50): Promise<any[]> {
    const query = `
      SELECT 
        m.*,
        u.name as senderName,
        u.profileImage as senderImage
      FROM Message m
      LEFT JOIN User u ON m.senderID = u.userID
      WHERE m.chatID = ? AND (m.messageText LIKE ? OR m.translatedText LIKE ?)
      ORDER BY m.timestamp DESC
      LIMIT ?
    `;

    const searchPattern = `%${searchTerm}%`;
    return await this.query(query, [chatID, searchPattern, searchPattern, limit]);
  }

  /**
   * Get message statistics for a chat
   */
  async getChatMessageStats(chatID: string): Promise<{
    totalMessages: number;
    textMessages: number;
    imageMessages: number;
    translatedMessages: number;
  }> {
    const stats = await this.queryOne(
      `SELECT 
        COUNT(*) as totalMessages,
        SUM(CASE WHEN messageType = 'text' THEN 1 ELSE 0 END) as textMessages,
        SUM(CASE WHEN messageType = 'image' THEN 1 ELSE 0 END) as imageMessages,
        SUM(CASE WHEN isTranslated = 1 THEN 1 ELSE 0 END) as translatedMessages
       FROM Message
       WHERE chatID = ?`,
      [chatID]
    );

    return {
      totalMessages: stats?.totalMessages || 0,
      textMessages: stats?.textMessages || 0,
      imageMessages: stats?.imageMessages || 0,
      translatedMessages: stats?.translatedMessages || 0
    };
  }
}
