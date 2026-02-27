/**
 * Socket.IO event types and interfaces for type-safe WebSocket communication
 */

/**
 * Events that the server can emit to clients
 */
export interface ServerToClientEvents {
  // Chat room events
  user_joined: (data: UserJoinedData) => void;
  user_left: (data: UserLeftData) => void;
  user_disconnected: (data: UserDisconnectedData) => void;
  joined_chat: (data: JoinedChatData) => void;

  // Message events
  new_message: (data: NewMessageData) => void;
  messages_read: (data: MessagesReadData) => void;

  // Typing indicators
  user_typing: (data: UserTypingData) => void;

  // Notifications
  notification: (data: NotificationData) => void;

  // Error events
  error: (data: ErrorData) => void;
}

/**
 * Events that clients can emit to the server
 */
export interface ClientToServerEvents {
  // Chat room management
  join_chat: (data: JoinChatData) => void;
  leave_chat: (data: LeaveChatData) => void;

  // Message management
  send_message: (data: SendMessageData) => void;
  mark_read: (data: MarkReadData) => void;

  // Typing indicators
  typing_start: (data: TypingData) => void;
  typing_stop: (data: TypingData) => void;
}

/**
 * Socket data attached to each connection
 */
export interface SocketData {
  user: {
    userID: string;
    email: string;
    name: string;
    isVerified: boolean;
    isAdmin: boolean;
  };
}

// Event data interfaces

export interface UserJoinedData {
  userId: string;
  userName: string;
  chatId: string;
  timestamp: string;
}

export interface UserLeftData {
  userId: string;
  userName: string;
  chatId: string;
  timestamp: string;
}

export interface UserDisconnectedData {
  userId: string;
  userName: string;
  timestamp: string;
}

export interface JoinedChatData {
  chatId: string;
  timestamp: string;
}

export interface NewMessageData {
  messageID: string;
  chatId: string;
  senderID: string;
  senderName: string;
  messageText: string;
  messageType: 'text' | 'image';
  originalLanguage?: string;
  translatedText?: string;
  timestamp: string;
  isRead: boolean;
}

export interface MessagesReadData {
  userId: string;
  chatId: string;
  messageIds: string[];
  timestamp: string;
}

export interface UserTypingData {
  userId: string;
  userName: string;
  chatId: string;
  isTyping: boolean;
}

export interface NotificationData {
  type: 'message' | 'deal' | 'review' | 'system';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

export interface ErrorData {
  message: string;
  code?: string;
  details?: any;
}

export interface JoinChatData {
  chatId: string;
}

export interface LeaveChatData {
  chatId: string;
}

export interface SendMessageData {
  chatId: string;
  message: {
    messageID: string;
    senderID: string;
    senderName: string;
    messageText: string;
    messageType: 'text' | 'image';
    originalLanguage?: string;
    translatedText?: string;
    isRead: boolean;
  };
}

export interface MarkReadData {
  chatId: string;
  messageIds: string[];
}

export interface TypingData {
  chatId: string;
}
