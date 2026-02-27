/**
 * WebSocket Service Usage Examples
 * 
 * This file demonstrates how to use the WebSocket service for real-time chat functionality
 */

import { io, Socket } from 'socket.io-client';

/**
 * Example 1: Connecting to the WebSocket server
 */
export function connectToWebSocket(token: string): Socket {
  const socket = io('http://localhost:3000', {
    auth: {
      token: token // JWT token from authentication
    },
    transports: ['websocket', 'polling']
  });

  // Handle connection events
  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
    console.log('Socket ID:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
  });

  return socket;
}

/**
 * Example 2: Joining a chat room
 */
export function joinChatRoom(socket: Socket, chatId: string): void {
  // Emit join_chat event
  socket.emit('join_chat', { chatId });

  // Listen for confirmation
  socket.on('joined_chat', (data) => {
    console.log('Successfully joined chat:', data.chatId);
    console.log('Timestamp:', data.timestamp);
  });

  // Listen for other users joining
  socket.on('user_joined', (data) => {
    console.log(`${data.userName} joined the chat`);
  });
}

/**
 * Example 3: Sending a message
 */
export function sendMessage(
  socket: Socket,
  chatId: string,
  messageData: {
    messageID: string;
    senderID: string;
    senderName: string;
    messageText: string;
    messageType: 'text' | 'image';
  }
): void {
  socket.emit('send_message', {
    chatId,
    message: {
      ...messageData,
      isRead: false
    }
  });
}

/**
 * Example 4: Receiving messages
 */
export function listenForMessages(socket: Socket, callback: (message: any) => void): void {
  socket.on('new_message', (data) => {
    console.log('New message received:', data);
    callback(data);
  });
}

/**
 * Example 5: Typing indicators
 */
export function handleTypingIndicators(socket: Socket, chatId: string): {
  startTyping: () => void;
  stopTyping: () => void;
} {
  const startTyping = () => {
    socket.emit('typing_start', { chatId });
  };

  const stopTyping = () => {
    socket.emit('typing_stop', { chatId });
  };

  // Listen for other users typing
  socket.on('user_typing', (data) => {
    if (data.isTyping) {
      console.log(`${data.userName} is typing...`);
    } else {
      console.log(`${data.userName} stopped typing`);
    }
  });

  return { startTyping, stopTyping };
}

/**
 * Example 6: Marking messages as read
 */
export function markMessagesAsRead(
  socket: Socket,
  chatId: string,
  messageIds: string[]
): void {
  socket.emit('mark_read', { chatId, messageIds });

  // Listen for read receipts from others
  socket.on('messages_read', (data) => {
    console.log(`User ${data.userId} read messages:`, data.messageIds);
  });
}

/**
 * Example 7: Receiving notifications
 */
export function listenForNotifications(socket: Socket): void {
  socket.on('notification', (notification) => {
    console.log('Notification received:', notification);
    
    switch (notification.type) {
      case 'message':
        console.log('New message notification:', notification.message);
        break;
      case 'deal':
        console.log('Deal notification:', notification.message);
        break;
      case 'review':
        console.log('Review notification:', notification.message);
        break;
      case 'system':
        console.log('System notification:', notification.message);
        break;
    }
  });
}

/**
 * Example 8: Leaving a chat room
 */
export function leaveChatRoom(socket: Socket, chatId: string): void {
  socket.emit('leave_chat', { chatId });

  // Listen for other users leaving
  socket.on('user_left', (data) => {
    console.log(`${data.userName} left the chat`);
  });
}

/**
 * Example 9: Complete chat flow
 */
export async function completeChatExample(token: string, chatId: string): Promise<void> {
  // 1. Connect to WebSocket server
  const socket = connectToWebSocket(token);

  // Wait for connection
  await new Promise<void>((resolve) => {
    socket.on('connect', () => resolve());
  });

  // 2. Join chat room
  joinChatRoom(socket, chatId);

  // 3. Set up message listener
  listenForMessages(socket, (message) => {
    console.log('Received:', message.messageText);
  });

  // 4. Set up typing indicators
  const { startTyping, stopTyping } = handleTypingIndicators(socket, chatId);

  // 5. Simulate typing and sending a message
  startTyping();
  
  setTimeout(() => {
    stopTyping();
    
    sendMessage(socket, chatId, {
      messageID: 'msg-' + Date.now(),
      senderID: 'user-123',
      senderName: 'John Doe',
      messageText: 'Hello, World!',
      messageType: 'text'
    });
  }, 2000);

  // 6. Mark messages as read
  setTimeout(() => {
    markMessagesAsRead(socket, chatId, ['msg-1', 'msg-2']);
  }, 5000);

  // 7. Leave chat room after 10 seconds
  setTimeout(() => {
    leaveChatRoom(socket, chatId);
    socket.disconnect();
  }, 10000);
}

/**
 * Example 10: Error handling
 */
export function handleWebSocketErrors(socket: Socket): void {
  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
    
    // Handle specific error types
    if (error.code === 'AUTHENTICATION_ERROR') {
      console.error('Authentication failed, please login again');
      // Redirect to login page
    } else if (error.code === 'PERMISSION_DENIED') {
      console.error('You do not have permission to access this chat');
    } else {
      console.error('An unexpected error occurred:', error.message);
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error.message);
    
    // Implement reconnection logic
    setTimeout(() => {
      console.log('Attempting to reconnect...');
      socket.connect();
    }, 5000);
  });
}

/**
 * Example 11: React Hook for WebSocket (TypeScript)
 */
export function useWebSocket(token: string | null) {
  // This is a conceptual example for React applications
  // In a real React app, you would use useState and useEffect
  
  let socket: Socket | null = null;

  const connect = () => {
    if (!token) return;
    
    socket = connectToWebSocket(token);
    handleWebSocketErrors(socket);
    listenForNotifications(socket);
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  };

  const joinChat = (chatId: string) => {
    if (socket) {
      joinChatRoom(socket, chatId);
    }
  };

  const sendMsg = (chatId: string, text: string, userId: string, userName: string) => {
    if (socket) {
      sendMessage(socket, chatId, {
        messageID: 'msg-' + Date.now(),
        senderID: userId,
        senderName: userName,
        messageText: text,
        messageType: 'text'
      });
    }
  };

  return {
    connect,
    disconnect,
    joinChat,
    sendMsg,
    socket
  };
}

// Export all examples
export default {
  connectToWebSocket,
  joinChatRoom,
  sendMessage,
  listenForMessages,
  handleTypingIndicators,
  markMessagesAsRead,
  listenForNotifications,
  leaveChatRoom,
  completeChatExample,
  handleWebSocketErrors,
  useWebSocket
};
