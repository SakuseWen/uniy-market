/**
 * ChatNotificationContext — 全局聊天通知状态
 * ChatNotificationContext — Global chat notification state
 *
 * 将未读数和对话预览列表提升到全局 Context，
 * 使 Header 和 ChatPage 可以共享并同步更新通知状态。
 *
 * Lifts unread count and chat preview list to a global Context,
 * allowing Header and ChatPage to share and synchronize notification state.
 */
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { chatService } from './chatService';

interface ChatNotificationContextType {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  previewChats: any[];
  setPreviewChats: (chats: any[]) => void;
  /** 重新拉取未读数和预览列表 / Re-fetch unread count and preview list */
  refreshUnread: () => Promise<void>;
}

const ChatNotificationContext = createContext<ChatNotificationContextType>({
  unreadCount: 0,
  setUnreadCount: () => {},
  previewChats: [],
  setPreviewChats: () => {},
  refreshUnread: async () => {},
});

export function ChatNotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [previewChats, setPreviewChats] = useState<any[]>([]);

  const refreshUnread = useCallback(async () => {
    try {
      const chatsRes = await chatService.getChats(1, 100);
      const chats = chatsRes.data.data?.data ?? [];
      // 按独立对话框数量计数 / Count by unique conversations with unread messages
      const unreadConversationCount = chats.filter((c: any) => c.unreadCount > 0).length;
      setUnreadCount(unreadConversationCount);
      // 预览列表只保留有未读消息的对话（最多 5 条）
      // Preview list only shows chats with unread messages (max 5)
      setPreviewChats(chats.filter((c: any) => c.unreadCount > 0).slice(0, 5));
    } catch {
      // 静默失败 / Fail silently
    }
  }, []);

  return (
    <ChatNotificationContext.Provider
      value={{ unreadCount, setUnreadCount, previewChats, setPreviewChats, refreshUnread }}
    >
      {children}
    </ChatNotificationContext.Provider>
  );
}

/** 消费 ChatNotificationContext 的便捷 Hook / Convenience hook to consume ChatNotificationContext */
export const useChatNotification = () => useContext(ChatNotificationContext);
