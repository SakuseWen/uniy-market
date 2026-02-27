import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { WebSocketService } from '../../src/services/WebSocketService';
import { AuthService } from '../../src/services/AuthService';
import express from 'express';
import { createServer } from 'http';

// Mock AuthService
jest.mock('../../src/services/AuthService');

describe('WebSocketService', () => {
  let httpServer: HTTPServer;
  let webSocketService: WebSocketService;
  let clientSocket: ClientSocket;
  let authService: jest.Mocked<AuthService>;
  const PORT = 3001;

  const mockUser = {
    userID: 'user-123',
    email: 'test@mahidol.ac.th',
    name: 'Test User',
    phone: null,
    profileImage: null,
    isVerified: true,
    preferredLanguage: 'en',
    isAdmin: false,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockToken = 'valid-test-token';

  beforeAll((done) => {
    // Create HTTP server
    const app = express();
    httpServer = createServer(app);
    
    httpServer.listen(PORT, () => {
      console.log(`Test server listening on port ${PORT}`);
      done();
    });
  });

  afterAll((done) => {
    if (httpServer) {
      httpServer.close(() => {
        console.log('Test server closed');
        done();
      });
    } else {
      done();
    }
  });

  beforeEach(() => {
    // Setup AuthService mock
    authService = new AuthService() as jest.Mocked<AuthService>;
    authService.validateSession = jest.fn().mockResolvedValue(mockUser);

    // Initialize WebSocket service
    webSocketService = new WebSocketService(httpServer);
  });

  afterEach(async () => {
    // Disconnect client socket
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    
    // Shutdown WebSocket service
    if (webSocketService) {
      await webSocketService.shutdown();
    }
    
    // Give time for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Connection Management', () => {
    it('should accept authenticated connections', (done) => {
      clientSocket = ioClient(`http://localhost:${PORT}`, {
        auth: { token: mockToken },
        transports: ['websocket']
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should reject connections without token', (done) => {
      clientSocket = ioClient(`http://localhost:${PORT}`, {
        transports: ['websocket']
      });

      clientSocket.on('connect', () => {
        done(new Error('Should not connect without token'));
      });

      clientSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication token required');
        done();
      });
    });

    it('should reject connections with invalid token', (done) => {
      authService.validateSession = jest.fn().mockResolvedValue(null);

      clientSocket = ioClient(`http://localhost:${PORT}`, {
        auth: { token: 'invalid-token' },
        transports: ['websocket']
      });

      clientSocket.on('connect', () => {
        done(new Error('Should not connect with invalid token'));
      });

      clientSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Invalid or expired token');
        done();
      });
    });

    it('should handle disconnection gracefully', (done) => {
      clientSocket = ioClient(`http://localhost:${PORT}`, {
        auth: { token: mockToken },
        transports: ['websocket']
      });

      clientSocket.on('connect', () => {
        clientSocket.disconnect();
      });

      clientSocket.on('disconnect', () => {
        expect(clientSocket.connected).toBe(false);
        done();
      });
    });
  });

  describe('Chat Room Management', () => {
    beforeEach((done) => {
      clientSocket = ioClient(`http://localhost:${PORT}`, {
        auth: { token: mockToken },
        transports: ['websocket']
      });

      clientSocket.on('connect', () => {
        done();
      });
    });

    it('should allow users to join chat rooms', (done) => {
      const chatId = 'chat-123';

      clientSocket.on('joined_chat', (data) => {
        expect(data.chatId).toBe(chatId);
        expect(data.timestamp).toBeDefined();
        done();
      });

      clientSocket.emit('join_chat', { chatId });
    });

    it('should allow users to leave chat rooms', (done) => {
      const chatId = 'chat-123';

      // First join the room
      clientSocket.emit('join_chat', { chatId });

      // Then leave it
      setTimeout(() => {
        clientSocket.emit('leave_chat', { chatId });
        // If no error occurs, test passes
        setTimeout(done, 100);
      }, 100);
    });

    it('should notify other users when someone joins', (done) => {
      const chatId = 'chat-456';
      
      // Create second client
      const client2 = ioClient(`http://localhost:${PORT}`, {
        auth: { token: mockToken },
        transports: ['websocket']
      });

      client2.on('connect', () => {
        // Client 2 joins first
        client2.emit('join_chat', { chatId });

        // Wait a bit then client 1 joins
        setTimeout(() => {
          client2.on('user_joined', (data) => {
            expect(data.chatId).toBe(chatId);
            expect(data.userId).toBe(mockUser.userID);
            client2.disconnect();
            done();
          });

          clientSocket.emit('join_chat', { chatId });
        }, 100);
      });
    });
  });

  describe('Message Handling', () => {
    beforeEach((done) => {
      clientSocket = ioClient(`http://localhost:${PORT}`, {
        auth: { token: mockToken },
        transports: ['websocket']
      });

      clientSocket.on('connect', () => {
        done();
      });
    });

    it('should broadcast messages to chat room', (done) => {
      const chatId = 'chat-789';
      const messageData = {
        chatId,
        message: {
          messageID: 'msg-123',
          senderID: mockUser.userID,
          senderName: mockUser.name,
          messageText: 'Hello, World!',
          messageType: 'text' as const,
          isRead: false
        }
      };

      // Join the chat room first
      clientSocket.emit('join_chat', { chatId });

      // Listen for the message
      clientSocket.on('new_message', (data) => {
        expect(data.chatId).toBe(chatId);
        expect(data.messageText).toBe('Hello, World!');
        expect(data.timestamp).toBeDefined();
        done();
      });

      // Send message after joining
      setTimeout(() => {
        clientSocket.emit('send_message', messageData);
      }, 100);
    });

    it('should handle typing indicators', (done) => {
      const chatId = 'chat-typing';

      // Create second client to receive typing indicator
      const client2 = ioClient(`http://localhost:${PORT}`, {
        auth: { token: mockToken },
        transports: ['websocket']
      });

      client2.on('connect', () => {
        // Both join the same chat
        clientSocket.emit('join_chat', { chatId });
        client2.emit('join_chat', { chatId });

        setTimeout(() => {
          client2.on('user_typing', (data) => {
            expect(data.chatId).toBe(chatId);
            expect(data.isTyping).toBe(true);
            client2.disconnect();
            done();
          });

          clientSocket.emit('typing_start', { chatId });
        }, 100);
      });
    });

    it('should handle mark as read events', (done) => {
      const chatId = 'chat-read';
      const messageIds = ['msg-1', 'msg-2', 'msg-3'];

      // Create second client
      const client2 = ioClient(`http://localhost:${PORT}`, {
        auth: { token: mockToken },
        transports: ['websocket']
      });

      client2.on('connect', () => {
        clientSocket.emit('join_chat', { chatId });
        client2.emit('join_chat', { chatId });

        setTimeout(() => {
          client2.on('messages_read', (data) => {
            expect(data.chatId).toBe(chatId);
            expect(data.messageIds).toEqual(messageIds);
            client2.disconnect();
            done();
          });

          clientSocket.emit('mark_read', { chatId, messageIds });
        }, 100);
      });
    });
  });

  describe('Public Methods', () => {
    it('should check if user is online', () => {
      // Initially no users online
      expect(webSocketService.isUserOnline(mockUser.userID)).toBe(false);
    });

    it('should get list of online users', () => {
      const onlineUsers = webSocketService.getOnlineUsers();
      expect(Array.isArray(onlineUsers)).toBe(true);
    });

    it('should get Socket.IO server instance', () => {
      const io = webSocketService.getIO();
      expect(io).toBeInstanceOf(SocketIOServer);
    });

    it('should send notification to specific user', (done) => {
      clientSocket = ioClient(`http://localhost:${PORT}`, {
        auth: { token: mockToken },
        transports: ['websocket']
      });

      clientSocket.on('connect', () => {
        const notification = {
          type: 'message',
          title: 'New Message',
          message: 'You have a new message',
          timestamp: new Date().toISOString()
        };

        clientSocket.on('notification', (data) => {
          expect(data.title).toBe('New Message');
          done();
        });

        // Wait a bit for connection to be tracked
        setTimeout(() => {
          webSocketService.sendNotificationToUser(mockUser.userID, notification);
        }, 100);
      });
    });

    it('should broadcast to chat room', (done) => {
      const chatId = 'chat-broadcast';
      
      clientSocket = ioClient(`http://localhost:${PORT}`, {
        auth: { token: mockToken },
        transports: ['websocket']
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('join_chat', { chatId });

        clientSocket.on('custom_event', (data) => {
          expect(data.message).toBe('Broadcast message');
          done();
        });

        setTimeout(() => {
          webSocketService.broadcastToChat(chatId, 'custom_event', {
            message: 'Broadcast message'
          });
        }, 100);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid message data', (done) => {
      clientSocket = ioClient(`http://localhost:${PORT}`, {
        auth: { token: mockToken },
        transports: ['websocket']
      });

      clientSocket.on('connect', () => {
        clientSocket.on('error', (data) => {
          expect(data.message).toBe('Invalid message data');
          done();
        });

        // Send invalid message data
        clientSocket.emit('send_message', { chatId: 'test' }); // Missing message
      });
    });
  });

  describe('Graceful Shutdown', () => {
    it('should shutdown gracefully', async () => {
      await expect(webSocketService.shutdown()).resolves.not.toThrow();
    });
  });
});
