/**
 * useChatSocket — Socket.IO connection hook for ChatPage
 * useChatSocket — ChatPage 使用的 Socket.IO 连接 Hook
 *
 * Manages the full lifecycle of a Socket.IO connection for a single chat room:
 * connect → join_chat → listen for new_message → leave_chat → disconnect.
 *
 * 管理单个聊天房间的 Socket.IO 连接完整生命周期：
 * 连接 → 加入房间 → 监听新消息 → 离开房间 → 断开连接。
 */
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { MessageDetail } from '../services/chatService';
import { BACKEND_URL, WS_URL } from '../lib/config';

// Read WebSocket server URL from env / 从环境变量读取 WebSocket 服务器地址
const SOCKET_URL =
  (import.meta as any).env?.VITE_SOCKET_URL ||
  (import.meta as any).env?.VITE_WS_URL ||
  BACKEND_URL;

interface UseChatSocketOptions {
  /** Called when a new message arrives from the server / 收到服务器推送的新消息时调用 */
  onNewMessage: (msg: MessageDetail) => void;
  /** Called when messages are marked as read by the other party / 对方已读消息时调用 */
  onMessagesRead?: (data: { userId: string; chatId: string; count: number }) => void;
  /** Called when the WebSocket connection fails / WebSocket 连接失败时调用 */
  onConnectionError?: (err: Error) => void;
}

interface UseChatSocketReturn {
  /** Emit typing indicator / 发送正在输入状态 */
  emitTyping: (isTyping: boolean) => void;
  /** Whether the socket is currently connected / 当前是否已连接 */
  isConnected: boolean;
}

export function useChatSocket(
  chatId: string | undefined,
  { onNewMessage, onMessagesRead, onConnectionError }: UseChatSocketOptions
): UseChatSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);

  // ─── 11.1 修复闭包陷阱：用 ref 持有最新的回调 ────────────────────
  // Fix closure trap: hold the latest callbacks in refs
  const onNewMessageRef = useRef(onNewMessage);
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  const onMessagesReadRef = useRef(onMessagesRead);
  useEffect(() => {
    onMessagesReadRef.current = onMessagesRead;
  }, [onMessagesRead]);

  useEffect(() => {
    if (!chatId) return;

    // Get JWT from sessionStorage / 从 sessionStorage 获取 JWT
    const token = sessionStorage.getItem('authToken');
    if (!token) return;

    // Create Socket.IO connection with JWT auth / 携带 JWT 创建 Socket.IO 连接
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    // Join chat room on connect / 连接成功后加入聊天房间
    socket.on('connect', () => {
      isConnectedRef.current = true;
      socket.emit('join_chat', { chatId });
    });

    // 通过 ref 调用最新的 onNewMessage，避免闭包捕获旧版本
    // Call the latest onNewMessage via ref to avoid stale closure capture
    socket.on('new_message', (msg: MessageDetail) => {
      onNewMessageRef.current(msg);
    });

    // 监听已读回执 / Listen for read receipt events
    socket.on('messages_read', (data: { userId: string; chatId: string; count: number }) => {
      onMessagesReadRef.current?.(data);
    });

    // Handle connection errors / 处理连接错误
    socket.on('connect_error', (err: Error) => {
      isConnectedRef.current = false;
      console.error('[useChatSocket] Connection error:', err.message);
      onConnectionError?.(err);
    });

    socket.on('disconnect', () => {
      isConnectedRef.current = false;
    });

    // Cleanup: leave room and disconnect on unmount / 卸载时离开房间并断开连接
    return () => {
      socket.emit('leave_chat', { chatId });
      socket.disconnect();
      socketRef.current = null;
      isConnectedRef.current = false;
    };
  }, [chatId]); // Re-run only when chatId changes / 仅在 chatId 变化时重新执行

  /** Emit typing indicator to the chat room / 向聊天房间发送正在输入状态 */
  const emitTyping = useCallback(
    (isTyping: boolean) => {
      socketRef.current?.emit(isTyping ? 'typing_start' : 'typing_stop', { chatId });
    },
    [chatId]
  );

  return { emitTyping, isConnected: isConnectedRef.current };
}
