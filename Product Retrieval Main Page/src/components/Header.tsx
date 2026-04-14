/**
 * Header — 全局导航栏（聚合通知中心，WebSocket 驱动）
 * Header — Global navigation bar (Aggregated Notification Hub, WebSocket-driven)
 *
 * 铃铛徽章 = 未读聊天对话数 + 未读购买申请数
 * Bell badge = unread chat conversations + unread purchase requests
 *
 * 彻底移除轮询，改为 WebSocket notification 事件实时驱动
 * Polling removed entirely; driven by WebSocket notification events in real-time
 */
import { Bell, User, LogOut, MessageCircle, ShoppingBag, Shield, Menu, X, Home, HelpCircle, Package } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Language, translate } from '../lib/i18n';
import { useNavigate } from 'react-router';
import { useAuth } from '../services/authContext';
import { toast } from 'sonner';
import apiClient from '../services/api';
import { chatService, ChatSummary } from '../services/chatService';
import { useChatNotification } from '../services/ChatNotificationContext';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  (import.meta as any).env?.VITE_SOCKET_URL ||
  (import.meta as any).env?.VITE_WS_URL ||
  'http://localhost:3000';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  /** @deprecated 内部动态获取，保留兼容旧调用方 / Kept for backward compatibility */
  unreadMessages?: number;
}

export function Header({ language, onLanguageChange }: HeaderProps) {
  const t = (key: any) => translate(language, key);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // ─── 聊天通知状态（来自全局 Context）/ Chat notification state (from global Context) ──
  const { unreadCount: chatUnreadCount, setUnreadCount: setChatUnreadCount,
          previewChats, setPreviewChats } = useChatNotification();

  // ─── 购买申请通知状态 / Purchase request notification state ──────────────
  const [dealNotifs, setDealNotifs] = useState<any[]>([]);
  const [dealUnreadCount, setDealUnreadCount] = useState(0);

  // ─── Popover 状态 / Popover state ─────────────────────────────────────────
  const [popoverOpen, setPopoverOpen] = useState(false);

  // ─── 移动端菜单状态 / Mobile menu state ────────────────────────────────────
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ─── WebSocket ref / WebSocket 连接引用 ───────────────────────────────────
  const socketRef = useRef<Socket | null>(null);

  // ─── 聚合总未读数 = 聊天未读对话数 + 购买申请未读数 ──────────────────────
  // Aggregated total = unread chat conversations + unread purchase requests
  const totalUnreadCount = chatUnreadCount + dealUnreadCount;

  // ─── 初始拉取数据 / Initial data fetch ───────────────────────────────────
  const fetchChatUnread = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await chatService.getChats(1, 100);
      const chats = res.data.data?.data ?? [];
      setChatUnreadCount(chats.filter((c: ChatSummary) => c.unreadCount > 0).length);
    } catch { /* 静默失败 / Fail silently */ }
  }, [isAuthenticated, setChatUnreadCount]);

  const fetchDealNotifs = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiClient.get('/deal-notifications');
      setDealNotifs(res.data.notifications || []);
      setDealUnreadCount(res.data.unreadCount || 0);
    } catch { /* 静默失败 / Fail silently */ }
  }, [isAuthenticated]);

  // ─── 初始化：拉取数据 + 建立 WebSocket 监听 ──────────────────────────────
  // Init: fetch data + establish WebSocket listener
  useEffect(() => {
    if (!isAuthenticated) {
      setChatUnreadCount(0);
      setDealUnreadCount(0);
      return;
    }

    // 初始拉取 / Initial fetch
    fetchChatUnread();
    fetchDealNotifs();

    // 建立 WebSocket 连接，监听 notification 事件
    // Establish WebSocket connection, listen for notification events
    const token = sessionStorage.getItem('authToken');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    // 监听通知事件，实时更新铃铛 / Listen for notification events, update bell in real-time
    socket.on('notification', (notif: any) => {
      if (notif.type === 'new_message') {
        // 新聊天消息：立即 +1，不调用异步 fetchChatUnread 避免竞态覆盖
        // New chat message: immediately +1, skip async fetchChatUnread to avoid race condition
        setChatUnreadCount(prev => prev + 1);
      } else if (
        notif.type === 'new_deal_notification' ||
        notif.type === 'new_request' ||
        notif.type === 'new_purchase_request'
      ) {
        // 新购买申请：立即 +1 并将通知插入列表顶部，不等待 API 响应
        // New purchase request: immediately +1 and prepend to list without waiting for API
        setDealUnreadCount(prev => prev + 1);
        setDealNotifs(prev => [{
          id: notif.id || `ws-${Date.now()}`,
          type: notif.type,
          message: notif.message || '',
          buyerName: notif.buyerName || notif.senderName || '',
          userName: notif.userName || notif.senderName || '',
          productTitle: notif.productTitle || '',
          isRead: false,
          createdAt: notif.timestamp || new Date().toISOString(),
        }, ...prev]);
        // 异步全量刷新，确保数据与后端一致 / Async full refresh to sync with backend
        fetchDealNotifs();
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, fetchChatUnread, fetchDealNotifs, setChatUnreadCount]);

  // ─── hover 时加载预览列表 / Load preview list on hover ───────────────────
  const handleBellMouseEnter = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await chatService.getChats(1, 20);
      const unreadChats = (res.data.data.data ?? []).filter((c: ChatSummary) => c.unreadCount > 0);
      setPreviewChats(unreadChats.slice(0, 5));
    } catch { /* 静默失败 */ }
    setPopoverOpen(true);
  };

  // ─── 点击聊天通知：立即移除 + 导航 / Click chat: remove immediately + navigate ──
  const handleChatClick = (chat: ChatSummary) => {
    setPopoverOpen(false);
    setPreviewChats(previewChats.filter((c) => c.chatID !== chat.chatID));
    setChatUnreadCount(Math.max(0, chatUnreadCount - (chat.unreadCount ?? 0)));
    navigate(`/chat/${chat.chatID}`);
    chatService.markAsRead(chat.chatID).catch(() => {});
  };

  // ─── 点击购买申请通知 / Click deal notification ───────────────────────────
  const handleDealNotifClick = (notif: any) => {
    setPopoverOpen(false);
    setDealNotifs(prev => prev.filter(n => n.id !== notif.id));
    if (!notif.isRead) setDealUnreadCount(prev => Math.max(0, prev - 1));
    navigate('/my-page?tab=deals');
    apiClient.put('/deal-notifications/read-all').catch(() => {});
  };

  // ─── 全部标记已读（聚合：聊天 + 交易通知）/ Mark all as read (aggregated: chat + deal) ──
  const handleMarkAllRead = async () => {
    // 立即同步清零所有红点，不等待 API 响应 / Immediately zero all badges without waiting for API
    setChatUnreadCount(0);
    setDealUnreadCount(0);
    setPreviewChats([]);
    setDealNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      // 并行调用两个批量已读接口 / Call both batch-read endpoints in parallel
      await Promise.all([
        apiClient.put('/chats/read-all'),
        apiClient.put('/deal-notifications/read-all'),
      ]);
    } catch { /* 静默失败，状态已在前端清零 / Fail silently, state already zeroed on frontend */ }
  };

  // ─── 构建聚合通知列表 / Build aggregated notification list ───────────────
  const allNotifications = [
    ...previewChats.map(chat => ({ id: `chat-${chat.chatID}`, type: 'chat' as const, chat })),
    ...dealNotifs.filter(n => !n.isRead).map(n => ({ id: `deal-${n.id}`, type: 'purchase' as const, dealNotif: n })),
  ];

  // ─── 通知文案 i18n（替换 {user} 占位符）/ Notification text i18n (replace {user} placeholder) ──
  const formatNotifText = (notif: any): string => {
    const userName = notif.userName || notif.buyerName || '';
    const productTitle = notif.productTitle ? `[${notif.productTitle.slice(0, 20)}] ` : '';
    if (notif.type === 'new_request' || notif.type === 'new_deal_notification') {
      return productTitle + t('notifNewPurchaseRequest').replace('{user}', userName);
    }
    if (notif.type === 'rejected') return t('notifPurchaseRejected');
    if (notif.type === 'accepted') return t('notifPurchaseAccepted');
    if (notif.type === 'completed') return t('notifDealCompleted');
    return notif.message || '';
  };

  // ─── 工具函数 / Utility functions ─────────────────────────────────────────
  const getOtherParty = (chat: ChatSummary) => {
    if (user?.userID === chat.buyerID) return { name: chat.sellerName, image: chat.sellerImage };
    return { name: chat.buyerName, image: chat.buyerImage };
  };

  const truncate = (text: string, maxLen: number) =>
    text && text.length > maxLen ? text.slice(0, maxLen) + '…' : (text ?? '');

  const formatTime = (iso: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60_000);
    if (diffMins < 1) return t('justNow') || 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString();
  };

  const getMaskedEduEmail = () => {
    if (!user?.eduEmail) return '';
    const [local, domain] = user.eduEmail.split('@');
    if (!domain) return user.eduEmail;
    return `${local.slice(0, 3)}***@${domain}`;
  };

  const handleAvatarClick = () => navigate(isAuthenticated ? '/my-page' : '/login');
  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2">

          {/* ── Logo + 导航 / Logo + Nav ─────────────────────────────────── */}
          <div className="flex items-center gap-2 sm:gap-4 md:gap-8 min-w-0">
            {/* 移动端汉堡菜单按钮 — 仅 lg 以下显示 / Mobile hamburger — only below lg */}
            <button className="lg:hidden p-1" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white">🎓</span>
              </div>
              <span className="hidden sm:block font-semibold">Uniy Market</span>
            </div>
            <nav className="hidden lg:flex items-center gap-6">
              <a href="#" className="hover:text-blue-600 transition-colors" onClick={() => navigate('/')}>{t('home')}</a>
              <a href="#" className="hover:text-blue-600 transition-colors" onClick={() => navigate('/my-page')}>{t('myPage')}</a>
              <a href="#" className="hover:text-blue-600 transition-colors" onClick={() => navigate('/help')}>{t('helpCenter')}</a>
            </nav>
          </div>

          {/* ── 右侧区域 / Right section ─────────────────────────────────── */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">

            {/* 学校认证徽章 / Edu verification badge — 仅中大屏显示 */}
            <div className="hidden lg:block">
              {user?.eduVerified ? (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <span className="text-green-600">✓</span>
                  {t('verified')} - {getMaskedEduEmail()}
                </Badge>
              ) : isAuthenticated ? (
                <Button variant="outline" size="sm" onClick={() => navigate('/my-page')}>
                  {t('verifyNow')}
                </Button>
              ) : null}
            </div>

            {/* ── 聚合通知铃铛（WebSocket 驱动）/ Aggregated Bell (WebSocket-driven) ── */}
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <div
                  className="relative cursor-pointer p-1"
                  onMouseEnter={handleBellMouseEnter}
                  onMouseLeave={() => setPopoverOpen(false)}
                >
                  <Bell className="w-5 h-5" />
                  {/* 聚合徽章 / Aggregated badge */}
                  {totalUnreadCount > 0 && (
                    <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 min-w-[1rem] h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold px-1 leading-none pointer-events-none">
                      {totalUnreadCount}
                    </span>
                  )}
                </div>
              </PopoverTrigger>

              <PopoverContent
                className="w-80 p-0"
                align="end"
                onMouseEnter={() => setPopoverOpen(true)}
                onMouseLeave={() => setPopoverOpen(false)}
              >
                {/* 标题栏 / Header bar */}
                <div className="px-3 pt-3 pb-2 flex items-center justify-between border-b">
                  <p className="font-semibold text-sm">{t('notifications')}</p>
                  {totalUnreadCount > 0 && (
                    <button className="text-xs text-blue-600 hover:underline" onClick={handleMarkAllRead}>
                      {t('markAllRead')}
                    </button>
                  )}
                </div>

                {/* 通知列表：固定高度可滚动 / List: fixed height, scrollable */}
                {allNotifications.length === 0 ? (
                  <div className="px-3 py-4 text-center text-sm text-gray-400">
                    {t('noNotifications')}
                  </div>
                ) : (
                  <div className="overflow-y-auto" style={{ maxHeight: '24rem' }}>
                    {allNotifications.map((item) => {
                      // ── 聊天通知（统一蓝色背景）/ Chat notification (unified blue bg) ──
                      if (item.type === 'chat' && item.chat) {
                        const chat = item.chat;
                        const other = getOtherParty(chat);
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 bg-blue-50/40"
                            onClick={() => handleChatClick(chat)}
                          >
                            <div className="relative flex-shrink-0">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={other.image ? `http://localhost:3000${other.image}` : ''} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                  {other.name ? other.name.slice(0, 2).toUpperCase() : '??'}
                                </AvatarFallback>
                              </Avatar>
                              {/* 聊天类型标识 / Chat type indicator */}
                              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <MessageCircle className="w-2.5 h-2.5 text-white" />
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm truncate">{other.name}</p>
                                <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                  {formatTime(chat.lastMessageAt)}
                                </span>
                              </div>
                              <p className="text-xs text-blue-500 truncate">{truncate(chat.productTitle, 28)}</p>
                              {/* 最新消息预览（i18n）/ Latest message preview (i18n) */}
                              <p className="text-xs text-gray-500 truncate">
                                {chat.lastMessageText
                                  ? chat.lastMessageText
                                  : t('notifChatMessage').replace('{user}', other.name || '')}
                              </p>
                            </div>
                            {chat.unreadCount > 0 && (
                              <span className="min-w-[1rem] h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] px-1 flex-shrink-0">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                        );
                      }

                      // ── 购买申请通知（统一橙色背景）/ Purchase notification (unified orange bg) ──
                      if (item.type === 'purchase' && item.dealNotif) {
                        const n = item.dealNotif;
                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 p-3 hover:bg-orange-50 cursor-pointer border-b last:border-b-0 bg-orange-50/40"
                            onClick={() => handleDealNotifClick(n)}
                          >
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <ShoppingBag className="w-5 h-5 text-orange-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              {/* 通知文案走 i18n / Notification text via i18n */}
                              <p className="text-sm text-gray-800 line-clamp-2">{formatNotifText(n)}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{formatTime(n.createdAt)}</p>
                            </div>
                            {!n.isRead && (
                              <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* 语言切换 / Language switch */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                  <span className="hidden sm:inline">{language === 'en' ? 'English' : language === 'zh' ? '中文' : 'ไทย'}</span>
                  <span className="sm:hidden">{language === 'en' ? 'EN' : language === 'zh' ? '中' : 'ไท'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onLanguageChange('zh')}>中文</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLanguageChange('en')}>English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLanguageChange('th')}>ไทย</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 用户头像 / User avatar */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.profileImage ? `http://localhost:3000${user.profileImage}` : ''} />
                      <AvatarFallback>{user?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/my-page')}>
                    <User className="w-4 h-4 mr-2" />{t('myPage')}
                  </DropdownMenuItem>
                  {user?.isAdmin ? (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="w-4 h-4 mr-2" />Admin
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />{t('logout') || 'Logout'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Avatar className="w-8 h-8 cursor-pointer hover:opacity-80 transition-all" onClick={handleAvatarClick}>
                <AvatarImage src="" />
                <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
              </Avatar>
            )}

            {/* 发布商品按钮 / Post item button */}
            <Button
              className="hidden lg:flex bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:scale-105 transition-all duration-200"
              onClick={() => {
                if (!user) { navigate('/login'); return; }
                if (!user.eduVerified) { toast.error(t('eduRequiredToPost')); return; }
                navigate('/create-product');
              }}
            >
              {t('postItemCTA')}
            </Button>
          </div>
        </div>
      </div>

      {/* ── 移动端抽屉菜单 / Mobile drawer menu ──────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-white">
          <div className="container mx-auto px-4 py-3 space-y-1">
            <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left" onClick={() => { navigate('/'); setMobileMenuOpen(false); }}>
              <Home className="w-5 h-5 text-blue-600" /> {t('home')}
            </button>
            <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left" onClick={() => { navigate('/my-page'); setMobileMenuOpen(false); }}>
              <User className="w-5 h-5 text-blue-600" /> {t('myPage')}
            </button>
            <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left" onClick={() => { navigate('/help'); setMobileMenuOpen(false); }}>
              <HelpCircle className="w-5 h-5 text-blue-600" /> {t('helpCenter')}
            </button>
            {isAuthenticated && (
              <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left" onClick={() => {
                if (!user?.eduVerified) { toast.error(t('eduRequiredToPost')); return; }
                navigate('/create-product'); setMobileMenuOpen(false);
              }}>
                <Package className="w-5 h-5 text-purple-600" /> {t('postItem')}
              </button>
            )}
            {user?.isAdmin && (
              <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left" onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}>
                <Shield className="w-5 h-5 text-red-500" /> Admin
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
