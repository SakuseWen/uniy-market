import express, { Request, Response } from 'express';
import { ChatModel } from '../models/ChatModel';
import { MessageModel } from '../models/MessageModel';
import { ProductModel } from '../models/ProductModel';
import { UserModel } from '../models/UserModel';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse } from '../types';
import { notificationService } from '../services/NotificationService';
import translationService from '../services/TranslationService';
import { locationService } from '../services/LocationService';
import { moderateChatMessage, logFlaggedContent } from '../middleware/contentModeration';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const chatModel = new ChatModel();
const messageModel = new MessageModel();
const productModel = new ProductModel();
const userModel = new UserModel();

// WebSocket service will be injected
let webSocketService: any = null;

export function setWebSocketService(wsService: any): void {
  webSocketService = wsService;
}

// Configure multer for image uploads in messages
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'messages');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'msg-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

/**
 * GET /api/chats
 * Get all chats for the authenticated user
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 20;

    const result = await chatModel.getChatsByUser(user.userID, page, limit);

    const response: ApiResponse = {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    };

    return res.json(response);
  } catch (error) {
    console.error('Error fetching chats:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch chats'
      },
      timestamp: new Date().toISOString()
    };
    return res.status(500).json(response);
  }
});

/**
 * POST /api/chats
 * Create a new chat or get existing chat
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { listingID, sellerID } = req.body;

    // Validate required fields
    if (!listingID || !sellerID) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'listingID and sellerID are required'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    // Verify product exists
    const product = await productModel.getProductById(listingID);
    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Product not found'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(404).json(response);
    }

    // Prevent user from chatting with themselves
    if (user.userID === sellerID) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Cannot create chat with yourself'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    // Create or get existing chat
    const chat = await chatModel.createChat({
      buyerID: user.userID,
      sellerID,
      listingID,
      status: 'active'
    });

    // Get chat with details
    const chatWithDetails = await chatModel.getChatWithDetails(chat.chatID);

    const response: ApiResponse = {
      success: true,
      data: chatWithDetails,
      timestamp: new Date().toISOString()
    };

    return res.status(201).json(response);
  } catch (error) {
    console.error('Error creating chat:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to create chat'
      },
      timestamp: new Date().toISOString()
    };
    return res.status(500).json(response);
  }
});

/**
 * GET /api/chats/:chatId
 * Get chat details by ID
 */
router.get('/:chatId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { chatId } = req.params;

    if (!chatId) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Chat ID is required'
        },
        timestamp: new Date().toISOString()
      };
      res.status(400).json(response);
      return;
    }

    // Verify user is participant in chat
    const isParticipant = await chatModel.isUserInChat(chatId, user.userID);
    if (!isParticipant) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Access denied: You are not a participant in this chat'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(403).json(response);
    }

    const chat = await chatModel.getChatWithDetails(chatId);
    if (!chat) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Chat not found'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: chat,
      timestamp: new Date().toISOString()
    };

    return res.json(response);
  } catch (error) {
    console.error('Error fetching chat:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch chat'
      },
      timestamp: new Date().toISOString()
    };
    return res.status(500).json(response);
  }
});

/**
 * DELETE /api/chats/:chatId
 * Delete a chat with cascade cleanup and notifications
 */
router.delete('/:chatId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { chatId } = req.params;

    if (!chatId) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Chat ID is required'
        },
        timestamp: new Date().toISOString()
      };
      res.status(400).json(response);
      return;
    }

    // Verify user is participant in chat
    const isParticipant = await chatModel.isUserInChat(chatId, user.userID);
    if (!isParticipant) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Access denied: You are not a participant in this chat'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(403).json(response);
    }

    // Get chat details before deletion for notification
    const chatDetails = await chatModel.getChatWithDetails(chatId);
    
    // Perform soft delete
    const success = await chatModel.deleteChat(chatId);
    if (!success) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Chat not found'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(404).json(response);
    }

    // Notify the other participant via WebSocket
    if (webSocketService && chatDetails) {
      const otherUserId = chatDetails.buyerID === user.userID 
        ? chatDetails.sellerID 
        : chatDetails.buyerID;
      
      // Send real-time notification
      webSocketService.sendNotificationToUser(otherUserId, {
        type: 'chat_deleted',
        chatId,
        deletedBy: user.userID,
        deletedByName: user.name,
        productTitle: chatDetails.productTitle,
        timestamp: new Date().toISOString()
      });

      // Create notification record
      await notificationService.createChatDeletedNotification(
        otherUserId,
        chatId,
        user.userID,
        chatDetails.productTitle
      );
    }

    const response: ApiResponse = {
      success: true,
      data: { 
        message: 'Chat deleted successfully',
        chatId,
        deletedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    return res.json(response);
  } catch (error) {
    console.error('Error deleting chat:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to delete chat'
      },
      timestamp: new Date().toISOString()
    };
    return res.status(500).json(response);
  }
});

/**
 * GET /api/chats/:chatId/messages
 * Get messages for a chat
 */
router.get('/:chatId/messages', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { chatId } = req.params;
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 50;

    if (!chatId) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Chat ID is required'
        },
        timestamp: new Date().toISOString()
      };
      res.status(400).json(response);
      return;
    }

    // Verify user is participant in chat
    const isParticipant = await chatModel.isUserInChat(chatId, user.userID);
    if (!isParticipant) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Access denied: You are not a participant in this chat'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(403).json(response);
    }

    const result = await messageModel.getMessagesByChat(chatId, page, limit);

    const response: ApiResponse = {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    };

    return res.json(response);
  } catch (error) {
    console.error('Error fetching messages:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch messages'
      },
      timestamp: new Date().toISOString()
    };
    return res.status(500).json(response);
  }
});

/**
 * POST /api/chats/:chatId/messages
 * Send a message in a chat with real-time notifications and automatic translation
 */
router.post('/:chatId/messages', authenticateToken, upload.single('image'), moderateChatMessage, logFlaggedContent, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { chatId } = req.params;
    const { messageText, messageType = 'text', translateTo } = req.body;

    if (!chatId) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Chat ID is required'
        },
        timestamp: new Date().toISOString()
      };
      res.status(400).json(response);
      return;
    }

    // Verify user is participant in chat
    const isParticipant = await chatModel.isUserInChat(chatId, user.userID);
    if (!isParticipant) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Access denied: You are not a participant in this chat'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(403).json(response);
    }

    // Validate message content
    if (messageType === 'text' && !messageText) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'messageText is required for text messages'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    if (messageType === 'image' && !req.file) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Image file is required for image messages'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    // Prepare message data
    let finalMessageText = messageText || '';
    if (messageType === 'image' && req.file) {
      finalMessageText = `/uploads/messages/${req.file.filename}`;
    }

    // Handle automatic translation if requested
    let translatedText: string | undefined;
    let originalLanguage: string | undefined;
    let isTranslated = false;

    if (messageType === 'text' && translateTo && finalMessageText) {
      try {
        // Detect source language
        const detection = await translationService.detectLanguage(finalMessageText);
        originalLanguage = detection.language;

        // Only translate if source and target languages are different
        if (originalLanguage !== translateTo) {
          const translation = await translationService.translateText(
            finalMessageText,
            translateTo as any,
            originalLanguage as any
          );
          translatedText = translation.translatedText;
          isTranslated = true;
        }
      } catch (error) {
        console.error('Translation error:', error);
        // Continue without translation if it fails
      }
    }

    // Create message
    const message = await messageModel.createMessage({
      chatID: chatId,
      senderID: user.userID,
      messageText: finalMessageText,
      messageType: messageType as 'text' | 'image',
      isTranslated,
      originalLanguage,
      translatedText
    });

    // Update chat's last message time
    await chatModel.updateLastMessageTime(chatId);

    // Get message with sender details
    const messageWithDetails = await messageModel.getMessageWithDetails(message.messageID);

    // Get chat details for notification
    const chatDetails = await chatModel.getChatWithDetails(chatId);

    // Send real-time notification to the other participant
    if (webSocketService && chatDetails) {
      const recipientId = chatDetails.buyerID === user.userID 
        ? chatDetails.sellerID 
        : chatDetails.buyerID;

      // Get recipient's language preference for auto-translation
      const recipient = await userModel.getUserById(recipientId);
      let messageForRecipient = { ...messageWithDetails };

      // Auto-translate message to recipient's preferred language
      if (recipient && recipient.preferredLanguage && messageType === 'text' && finalMessageText) {
        try {
          const recipientLang = recipient.preferredLanguage as any;
          const senderLang = user.preferredLanguage as any;

          // Only translate if languages are different
          if (recipientLang !== senderLang) {
            const translation = await translationService.translateText(
              finalMessageText,
              recipientLang,
              senderLang
            );

            messageForRecipient = {
              ...messageWithDetails,
              translatedText: translation.translatedText,
              originalLanguage: senderLang,
              isTranslated: true
            };
          }
        } catch (error) {
          console.error('Auto-translation error:', error);
          // Continue without translation if it fails
        }
      }

      // Broadcast message via WebSocket
      webSocketService.broadcastToChat(chatId, 'new_message', messageForRecipient);

      // Send notification to recipient if they're not in the chat room
      webSocketService.sendNotificationToUser(recipientId, {
        type: 'new_message',
        chatId,
        senderId: user.userID,
        senderName: user.name,
        messagePreview: messageType === 'text' ? finalMessageText : '[Image]',
        productTitle: chatDetails.productTitle,
        timestamp: new Date().toISOString()
      });

      // Create notification record
      await notificationService.createNewMessageNotification(
        recipientId,
        chatId,
        user.userID,
        user.name,
        messageType === 'text' ? finalMessageText : '[Image]',
        chatDetails.productTitle
      );
    }

    const response: ApiResponse = {
      success: true,
      data: messageWithDetails,
      timestamp: new Date().toISOString()
    };

    return res.status(201).json(response);
  } catch (error) {
    console.error('Error sending message:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to send message'
      },
      timestamp: new Date().toISOString()
    };
    return res.status(500).json(response);
  }
});

/**
 * PUT /api/chats/:chatId/read
 * Mark messages as read in a chat with notifications
 */
router.put('/:chatId/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { chatId } = req.params;

    if (!chatId) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Chat ID is required'
        },
        timestamp: new Date().toISOString()
      };
      res.status(400).json(response);
      return;
    }

    // Verify user is participant in chat
    const isParticipant = await chatModel.isUserInChat(chatId, user.userID);
    if (!isParticipant) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Access denied: You are not a participant in this chat'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(403).json(response);
    }

    const updatedCount = await messageModel.markChatMessagesAsRead(chatId, user.userID);

    // Send read receipt notification via WebSocket
    if (webSocketService && updatedCount > 0) {
      const chatDetails = await chatModel.getChatWithDetails(chatId);
      if (chatDetails) {
        const senderId = chatDetails.buyerID === user.userID 
          ? chatDetails.sellerID 
          : chatDetails.buyerID;

        // Broadcast read status to chat room
        webSocketService.broadcastToChat(chatId, 'messages_read', {
          userId: user.userID,
          userName: user.name,
          chatId,
          count: updatedCount,
          timestamp: new Date().toISOString()
        });

        // Send notification to sender
        webSocketService.sendNotificationToUser(senderId, {
          type: 'messages_read',
          chatId,
          readBy: user.userID,
          readByName: user.name,
          count: updatedCount,
          timestamp: new Date().toISOString()
        });
      }
    }

    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Messages marked as read',
        updatedCount
      },
      timestamp: new Date().toISOString()
    };

    return res.json(response);
  } catch (error) {
    console.error('Error marking messages as read:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to mark messages as read'
      },
      timestamp: new Date().toISOString()
    };
    return res.status(500).json(response);
  }
});

/**
 * GET /api/chats/unread/count
 * Get total unread message count for user
 */
router.get('/unread/count', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const unreadCount = await messageModel.getTotalUnreadCount(user.userID);

    const response: ApiResponse = {
      success: true,
      data: { unreadCount },
      timestamp: new Date().toISOString()
    };

    return res.json(response);
  } catch (error) {
    console.error('Error fetching unread count:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch unread count'
      },
      timestamp: new Date().toISOString()
    };
    return res.status(500).json(response);
  }
});

/**
 * POST /api/chats/:chatId/messages/:messageId/translate
 * Translate a specific message to target language
 */
router.post('/:chatId/messages/:messageId/translate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { chatId, messageId } = req.params;
    const { targetLanguage } = req.body;

    if (!chatId || !messageId) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Chat ID and Message ID are required'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    if (!targetLanguage) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'targetLanguage is required'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    // Verify user is participant in chat
    const isParticipant = await chatModel.isUserInChat(chatId, user.userID);
    if (!isParticipant) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Access denied: You are not a participant in this chat'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(403).json(response);
    }

    // Get message
    const message = await messageModel.getMessageById(messageId);
    if (!message) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Message not found'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(404).json(response);
    }

    // Only translate text messages
    if (message.messageType !== 'text') {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Only text messages can be translated'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    // Translate message
    try {
      const translation = await translationService.translateText(
        message.messageText,
        targetLanguage as any,
        message.originalLanguage as any
      );

      const response: ApiResponse = {
        success: true,
        data: {
          messageID: message.messageID,
          originalText: message.messageText,
          translatedText: translation.translatedText,
          sourceLanguage: translation.sourceLanguage,
          targetLanguage: translation.targetLanguage
        },
        timestamp: new Date().toISOString()
      };

      return res.json(response);
    } catch (error) {
      console.error('Translation error:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to translate message'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(500).json(response);
    }
  } catch (error) {
    console.error('Error translating message:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to translate message'
      },
      timestamp: new Date().toISOString()
    };
    return res.status(500).json(response);
  }
});

/**
 * GET /api/chats/notifications
 * Get all chat notifications for user
 */
router.get('/notifications', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const notifications = await notificationService.getChatNotifications(user.userID);

    const response: ApiResponse = {
      success: true,
      data: notifications,
      timestamp: new Date().toISOString()
    };

    return res.json(response);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch notifications'
      },
      timestamp: new Date().toISOString()
    };
    return res.status(500).json(response);
  }
});

/**
 * GET /api/chats/notifications/unread/count
 * Get unread chat notifications count
 */
router.get('/notifications/unread/count', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const count = await notificationService.getUnreadChatNotificationsCount(user.userID);

    const response: ApiResponse = {
      success: true,
      data: { count },
      timestamp: new Date().toISOString()
    };

    return res.json(response);
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch unread notification count'
      },
      timestamp: new Date().toISOString()
    };
    return res.status(500).json(response);
  }
});

/**
 * PUT /api/chats/notifications/:notificationId/read
 * Mark a notification as read
 */
router.put('/notifications/:notificationId/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { notificationId } = req.params;

    const success = await notificationService.markAsRead(user.userID, notificationId);

    if (!success) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Notification not found'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: { message: 'Notification marked as read' },
      timestamp: new Date().toISOString()
    };

    return res.json(response);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to mark notification as read'
      },
      timestamp: new Date().toISOString()
    };
    return res.status(500).json(response);
  }
});

/**
 * POST /api/chats/:chatId/share-location
 * Share location in chat with privacy protection
 */
router.post('/:chatId/share-location', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { chatId } = req.params;
    const { generalArea, additionalInfo } = req.body;

    if (!chatId) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Chat ID is required'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    if (!generalArea) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'generalArea is required'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    // Verify user is participant in chat
    const isParticipant = await chatModel.isUserInChat(chatId, user.userID);
    if (!isParticipant) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Access denied: You are not a participant in this chat'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(403).json(response);
    }

    // Get chat details
    const chatDetails = await chatModel.getChatWithDetails(chatId);
    if (!chatDetails) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Chat not found'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(404).json(response);
    }

    // Determine user role
    const userRole = chatDetails.buyerID === user.userID ? 'buyer' : 'seller';

    // Check if location sharing is allowed
    const canShare = locationService.canShareLocation(chatDetails.status, userRole);
    if (!canShare.allowed) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: canShare.reason || 'Location sharing not allowed'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(403).json(response);
    }

    // Validate location
    const validation = locationService.validateGeneralLocation(generalArea);
    if (!validation.valid) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: validation.reason || 'Invalid location format',
          field: 'generalArea',
          guidelines: locationService.getLocationPrivacyGuidelines()
        },
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    // Sanitize location
    const sanitizedLocation = locationService.sanitizeLocation(generalArea);

    // Generate location share message
    const locationMessage = locationService.generateLocationShareMessage(
      sanitizedLocation,
      additionalInfo
    );

    // Create message with location
    const message = await messageModel.createMessage({
      chatID: chatId,
      senderID: user.userID,
      messageText: locationMessage,
      messageType: 'text',
      isTranslated: false
    });

    // Update chat's last message time
    await chatModel.updateLastMessageTime(chatId);

    // Get message with sender details
    const messageWithDetails = await messageModel.getMessageWithDetails(message.messageID);

    // Send real-time notification to the other participant
    if (webSocketService) {
      const recipientId = chatDetails.buyerID === user.userID 
        ? chatDetails.sellerID 
        : chatDetails.buyerID;

      // Broadcast message via WebSocket
      webSocketService.broadcastToChat(chatId, 'new_message', messageWithDetails);

      // Send notification to recipient
      webSocketService.sendNotificationToUser(recipientId, {
        type: 'location_shared',
        chatId,
        senderId: user.userID,
        senderName: user.name,
        productTitle: chatDetails.productTitle,
        timestamp: new Date().toISOString()
      });

      // Create notification record
      await notificationService.createNewMessageNotification(
        recipientId,
        chatId,
        user.userID,
        user.name,
        '📍 Shared location',
        chatDetails.productTitle
      );
    }

    const response: ApiResponse = {
      success: true,
      data: {
        message: messageWithDetails,
        locationPrivacyScore: locationService.getLocationPrivacyScore(sanitizedLocation)
      },
      timestamp: new Date().toISOString()
    };

    return res.status(201).json(response);
  } catch (error) {
    console.error('Error sharing location:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to share location'
      },
      timestamp: new Date().toISOString()
    };
    return res.status(500).json(response);
  }
});

/**
 * GET /api/chats/location/guidelines
 * Get location privacy guidelines
 */
router.get('/location/guidelines', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const guidelines = locationService.getLocationPrivacyGuidelines();

    const response: ApiResponse = {
      success: true,
      data: guidelines,
      timestamp: new Date().toISOString()
    };

    return res.json(response);
  } catch (error) {
    console.error('Error fetching location guidelines:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch location guidelines'
      },
      timestamp: new Date().toISOString()
    };
    return res.status(500).json(response);
  }
});

export default router;
