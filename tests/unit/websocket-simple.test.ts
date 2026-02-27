import { Server as HTTPServer } from 'http';
import { WebSocketService } from '../../src/services/WebSocketService';
import { AuthService } from '../../src/services/AuthService';
import express from 'express';
import { createServer } from 'http';

// Mock AuthService
jest.mock('../../src/services/AuthService');

describe('WebSocketService - Basic Tests', () => {
  let httpServer: HTTPServer;
  let webSocketService: WebSocketService;
  let authService: jest.Mocked<AuthService>;

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

  beforeAll(() => {
    // Create HTTP server
    const app = express();
    httpServer = createServer(app);
  });

  afterAll(async () => {
    if (webSocketService) {
      await webSocketService.shutdown();
    }
    if (httpServer) {
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
    }
  });

  beforeEach(() => {
    // Setup AuthService mock
    authService = new AuthService() as jest.Mocked<AuthService>;
    authService.validateSession = jest.fn().mockResolvedValue(mockUser);
  });

  describe('Initialization', () => {
    it('should initialize WebSocket service successfully', () => {
      webSocketService = new WebSocketService(httpServer);
      expect(webSocketService).toBeDefined();
    });

    it('should get Socket.IO server instance', () => {
      webSocketService = new WebSocketService(httpServer);
      const io = webSocketService.getIO();
      expect(io).toBeDefined();
    });
  });

  describe('User Tracking', () => {
    beforeEach(() => {
      webSocketService = new WebSocketService(httpServer);
    });

    it('should check if user is online', () => {
      const isOnline = webSocketService.isUserOnline('user-123');
      expect(typeof isOnline).toBe('boolean');
    });

    it('should get list of online users', () => {
      const onlineUsers = webSocketService.getOnlineUsers();
      expect(Array.isArray(onlineUsers)).toBe(true);
    });

    it('should initially have no online users', () => {
      const onlineUsers = webSocketService.getOnlineUsers();
      expect(onlineUsers.length).toBe(0);
    });
  });

  describe('Broadcasting', () => {
    beforeEach(() => {
      webSocketService = new WebSocketService(httpServer);
    });

    it('should broadcast to chat room without errors', () => {
      expect(() => {
        webSocketService.broadcastToChat('chat-123', 'test_event', {
          message: 'test'
        });
      }).not.toThrow();
    });

    it('should send notification to user without errors', () => {
      expect(() => {
        webSocketService.sendNotificationToUser('user-123', {
          type: 'message',
          title: 'Test',
          message: 'Test notification',
          timestamp: new Date().toISOString()
        });
      }).not.toThrow();
    });
  });

  describe('Graceful Shutdown', () => {
    it('should shutdown gracefully', async () => {
      webSocketService = new WebSocketService(httpServer);
      await expect(webSocketService.shutdown()).resolves.not.toThrow();
    });

    it('should handle multiple shutdown calls', async () => {
      webSocketService = new WebSocketService(httpServer);
      await webSocketService.shutdown();
      await expect(webSocketService.shutdown()).resolves.not.toThrow();
    });
  });

  describe('Service Methods', () => {
    beforeEach(() => {
      webSocketService = new WebSocketService(httpServer);
    });

    it('should have all required public methods', () => {
      expect(typeof webSocketService.sendNotificationToUser).toBe('function');
      expect(typeof webSocketService.broadcastToChat).toBe('function');
      expect(typeof webSocketService.isUserOnline).toBe('function');
      expect(typeof webSocketService.getOnlineUsers).toBe('function');
      expect(typeof webSocketService.getIO).toBe('function');
      expect(typeof webSocketService.shutdown).toBe('function');
    });

    it('should return correct types from methods', () => {
      const io = webSocketService.getIO();
      const isOnline = webSocketService.isUserOnline('test');
      const onlineUsers = webSocketService.getOnlineUsers();

      expect(io).toBeDefined();
      expect(typeof isOnline).toBe('boolean');
      expect(Array.isArray(onlineUsers)).toBe(true);
    });
  });
});
