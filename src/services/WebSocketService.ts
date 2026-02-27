import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { AuthService } from './AuthService';

/**
 * WebSocket Service for real-time chat functionality
 * Implements Socket.IO server with authentication and room-based architecture
 */
export class WebSocketService {
  private io: SocketIOServer;
  private authService: AuthService;
  private userSockets: Map<string, Set<string>>; // userId -> Set of socketIds
  private socketUsers: Map<string, string>; // socketId -> userId

  constructor(httpServer: HTTPServer) {
    this.authService = new AuthService();
    this.userSockets = new Map();
    this.socketUsers = new Map();

    // Initialize Socket.IO with CORS configuration
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env['FRONTEND_URL'] || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * Set up authentication middleware for Socket.IO
   */
  private setupMiddleware(): void {
    this.io.use(async (socket: Socket, next) => {
      try {
        // Get token from handshake auth or query
        const token = socket.handshake.auth['token'] || socket.handshake.query['token'] as string;

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Validate token and get user
        const user = await this.authService.validateSession(token);

        if (!user) {
          return next(new Error('Invalid or expired token'));
        }

        // Attach user to socket
        (socket as any).user = user;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Set up Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const user = (socket as any).user;
      console.log(`User connected: ${user.userID} (${user.name}) - Socket: ${socket.id}`);

      // Track user socket connection
      this.addUserSocket(user.userID, socket.id);

      // Handle joining chat rooms
      socket.on('join_chat', (data: { chatId: string }) => {
        this.handleJoinChat(socket, data.chatId);
      });

      // Handle leaving chat rooms
      socket.on('leave_chat', (data: { chatId: string }) => {
        this.handleLeaveChat(socket, data.chatId);
      });

      // Handle sending messages
      socket.on('send_message', (data: any) => {
        this.handleSendMessage(socket, data);
      });

      // Handle typing indicators
      socket.on('typing_start', (data: { chatId: string }) => {
        this.handleTypingStart(socket, data.chatId);
      });

      socket.on('typing_stop', (data: { chatId: string }) => {
        this.handleTypingStop(socket, data.chatId);
      });

      // Handle message read status
      socket.on('mark_read', (data: { chatId: string; messageIds: string[] }) => {
        this.handleMarkRead(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for user ${user.userID}:`, error);
      });
    });
  }

  /**
   * Handle user joining a chat room
   */
  private handleJoinChat(socket: Socket, chatId: string): void {
    const user = (socket as any).user;
    
    // Join the Socket.IO room
    socket.join(`chat:${chatId}`);
    
    console.log(`User ${user.userID} joined chat room: ${chatId}`);
    
    // Notify other users in the room
    socket.to(`chat:${chatId}`).emit('user_joined', {
      userId: user.userID,
      userName: user.name,
      chatId,
      timestamp: new Date().toISOString()
    });

    // Send confirmation to the user
    socket.emit('joined_chat', {
      chatId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle user leaving a chat room
   */
  private handleLeaveChat(socket: Socket, chatId: string): void {
    const user = (socket as any).user;
    
    // Leave the Socket.IO room
    socket.leave(`chat:${chatId}`);
    
    console.log(`User ${user.userID} left chat room: ${chatId}`);
    
    // Notify other users in the room
    socket.to(`chat:${chatId}`).emit('user_left', {
      userId: user.userID,
      userName: user.name,
      chatId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle sending a message (broadcast to room)
   */
  private handleSendMessage(socket: Socket, data: any): void {
    const user = (socket as any).user;
    const { chatId, message } = data;

    if (!chatId || !message) {
      socket.emit('error', { message: 'Invalid message data' });
      return;
    }

    console.log(`User ${user.userID} sending message to chat ${chatId}`);

    // Broadcast message to all users in the chat room (including sender)
    this.io.to(`chat:${chatId}`).emit('new_message', {
      ...message,
      chatId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle typing indicator start
   */
  private handleTypingStart(socket: Socket, chatId: string): void {
    const user = (socket as any).user;
    
    // Broadcast typing indicator to other users in the room
    socket.to(`chat:${chatId}`).emit('user_typing', {
      userId: user.userID,
      userName: user.name,
      chatId,
      isTyping: true
    });
  }

  /**
   * Handle typing indicator stop
   */
  private handleTypingStop(socket: Socket, chatId: string): void {
    const user = (socket as any).user;
    
    // Broadcast typing stop to other users in the room
    socket.to(`chat:${chatId}`).emit('user_typing', {
      userId: user.userID,
      userName: user.name,
      chatId,
      isTyping: false
    });
  }

  /**
   * Handle marking messages as read
   */
  private handleMarkRead(socket: Socket, data: { chatId: string; messageIds: string[] }): void {
    const user = (socket as any).user;
    const { chatId, messageIds } = data;

    // Broadcast read status to other users in the room
    socket.to(`chat:${chatId}`).emit('messages_read', {
      userId: user.userID,
      chatId,
      messageIds,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle user disconnection
   */
  private handleDisconnect(socket: Socket): void {
    const user = (socket as any).user;
    console.log(`User disconnected: ${user.userID} - Socket: ${socket.id}`);

    // Remove socket from tracking
    this.removeUserSocket(user.userID, socket.id);

    // Notify all rooms this user was in
    const rooms = Array.from(socket.rooms).filter(room => room.startsWith('chat:'));
    rooms.forEach(room => {
      socket.to(room).emit('user_disconnected', {
        userId: user.userID,
        userName: user.name,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Track user socket connection
   */
  private addUserSocket(userId: string, socketId: string): void {
    // Add to userSockets map
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);

    // Add to socketUsers map
    this.socketUsers.set(socketId, userId);
  }

  /**
   * Remove user socket connection
   */
  private removeUserSocket(userId: string, socketId: string): void {
    // Remove from userSockets map
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    // Remove from socketUsers map
    this.socketUsers.delete(socketId);
  }

  /**
   * Send notification to a specific user
   */
  public sendNotificationToUser(userId: string, notification: any): void {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach(socketId => {
        this.io.to(socketId).emit('notification', notification);
      });
    }
  }

  /**
   * Broadcast message to a chat room
   */
  public broadcastToChat(chatId: string, event: string, data: any): void {
    this.io.to(`chat:${chatId}`).emit(event, data);
  }

  /**
   * Check if user is online
   */
  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Get all online users
   */
  public getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  /**
   * Get Socket.IO server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Gracefully shutdown the WebSocket server
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down WebSocket server...');
    
    // Disconnect all clients
    this.io.disconnectSockets();
    
    // Close the server
    await new Promise<void>((resolve) => {
      this.io.close(() => {
        console.log('WebSocket server closed');
        resolve();
      });
    });
  }
}
