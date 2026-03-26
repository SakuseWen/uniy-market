/**
 * Chat Service — Frontend API layer
 * 聊天服务 — 前端 API 封装层
 *
 * Wraps all chat-related HTTP calls so components never call apiClient directly.
 * 封装所有聊天相关 HTTP 请求，组件不直接调用 apiClient。
 */
import apiClient from './api';

// ─── Shared types / 共享类型 ──────────────────────────────────────────────────

/** Summary of a chat conversation shown in lists / 对话列表中展示的聊天摘要 */
export interface ChatSummary {
  chatID: string;
  buyerID: string;
  sellerID: string;
  listingID: string;
  productTitle: string;
  productPrice: number;
  productStatus: string;
  productImage?: string;
  buyerName: string;
  sellerName: string;
  buyerImage?: string;
  sellerImage?: string;
  unreadCount: number;
  lastMessageAt: string;
  status: 'active' | 'closed' | 'deleted';
  /** 最新消息预览文本（后端子查询补充）/ Latest message preview text (added via backend subquery) */
  lastMessageText?: string;
}

/** Full message detail including sender info / 包含发送者信息的完整消息详情 */
export interface MessageDetail {
  messageID: string;
  chatID: string;
  senderID: string;
  senderName: string;
  senderImage?: string;
  messageText: string;
  messageType: 'text' | 'image';
  isTranslated: boolean;
  originalLanguage?: string;
  translatedText?: string;
  timestamp: string;
  isRead: boolean;
}

// ─── Service object / 服务对象 ────────────────────────────────────────────────

export const chatService = {
  /**
   * Create or get an existing chat room
   * 创建或获取已有聊天房间
   */
  createOrGetChat: (listingID: string, sellerID: string) =>
    apiClient.post<{ success: boolean; data: ChatSummary }>('/chats', { listingID, sellerID }),

  /**
   * Get chat details by chatID
   * 通过 chatID 获取聊天详情
   */
  getChatById: (chatId: string) =>
    apiClient.get<{ success: boolean; data: ChatSummary }>(`/chats/${chatId}`),

  /**
   * Get all chats for the current user (paginated)
   * 获取当前用户的所有对话（分页）
   */
  getChats: (page = 1, limit = 20) =>
    apiClient.get<{ success: boolean; data: { data: ChatSummary[]; pagination: any } }>(
      `/chats?page=${page}&limit=${limit}`
    ),

  /**
   * Get messages for a chat (paginated)
   * 获取对话消息列表（分页）
   */
  getMessages: (chatId: string, page = 1, limit = 50) =>
    apiClient.get<{ success: boolean; data: { data: MessageDetail[]; pagination: any } }>(
      `/chats/${chatId}/messages?page=${page}&limit=${limit}`
    ),

  /**
   * Send a text message
   * 发送文本消息
   */
  sendTextMessage: (chatId: string, messageText: string) =>
    apiClient.post<{ success: boolean; data: MessageDetail }>(`/chats/${chatId}/messages`, {
      messageText,
      messageType: 'text',
    }),

  /**
   * Send an image message (multipart/form-data)
   * 发送图片消息（multipart/form-data）
   */
  sendImageMessage: (chatId: string, file: File) => {
    const form = new FormData();
    form.append('image', file);
    form.append('messageType', 'image');
    return apiClient.post<{ success: boolean; data: MessageDetail }>(
      `/chats/${chatId}/messages`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  /**
   * Mark all messages in a chat as read
   * 将对话中所有消息标记为已读
   */
  markAsRead: (chatId: string) =>
    apiClient.put(`/chats/${chatId}/read`),

  /**
   * Get total unread message count for the current user
   * 获取当前用户的未读消息总数
   */
  getUnreadCount: () =>
    apiClient.get<{ success: boolean; data: { unreadCount: number } }>('/chats/unread/count'),

  /**
   * Soft-delete (hide) a chat — keeps messages in DB
   * 软删除（隐藏）对话 — 保留数据库中的消息记录
   */
  hideChat: (chatId: string) =>
    apiClient.delete(`/chats/${chatId}`),

  /**
   * Hard-delete a chat — permanently removes all messages
   * 硬删除对话 — 永久清除所有消息记录
   */
  hardDeleteChat: (chatId: string) =>
    apiClient.delete(`/chats/${chatId}/hard`),

  /**
   * Translate a specific message to the target language
   * 将指定消息翻译为目标语言
   */
  translateMessage: (chatId: string, messageId: string, targetLanguage: string) =>
    apiClient.post<{
      success: boolean;
      data: { messageID: string; originalText: string; translatedText: string };
    }>(`/chats/${chatId}/messages/${messageId}/translate`, { targetLanguage }),
};
