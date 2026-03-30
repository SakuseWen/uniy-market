/**
 * Header — 全局导航栏（聚合通知中心）
 * Header — Global navigation bar (Aggregated Notification Hub)
 *
 * 铃铛徽章 = 未读聊天对话数 + 未读购买申请数
 * Bell badge = unread chat conversations + unread purchase requests
 *
 * Popover 统一展示两类通知，最多 6 条可见，超出可滚动
 * Popover shows both notification types, max 6 visible with scroll
 */
import { Bell, User, LogOut, MessageCircle, ShoppingBag } from 'lucide-react';
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

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  /** @deprecated 内部动态获取，保留兼容旧调用方 / Kept for backward compatibility */
  unreadMessages?: number;
}

// ─── 统一通知条目类型 / Unified notification item type ────────────────────────
interface NotificationItem {
  id: string;
  type: 'chat' | 'purchase';
  // 聊天通知字段 / Chat notification fields
  chat?: ChatSummary;
  // 购买申请通知字段 / Purchase request notification fields
  dealNotif?: {
    id: string;
    message: string;
    productTitle?: string;
    createdAt: string;
    isRead: boolean;
    dealID?: string;
  };
}

export function Header({ language, onLanguageChange }: HeaderProps) {
  const t = (key: any) => translate(language, key);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // ─── 聊天通知状态（来自全局 Context）/ Chat notification state (from global Context) ──
  const { unreadCount: chatUnreadCount, setUnreadCount: setChatUnreadCount,
          previewChats, setPreviewChats, refreshUnread: refreshChatUnread } = useChatNotification();

  // ─── 购买申请通知状态 / Purchase request notification state ──────────────
  const [dealNotifs, setDealNotifs] = useState<any[]>([]);
  const [dealUnreadCount, setDealUnreadCount] = useState(0);

  // ─── Popover 状态 / Popover state ─────────────────────────────────────────
  const [popoverOpen, setPopoverOpen] = useState(false);

  // ─── 聚合总未读数 = 聊天未读对话数 + 购买申请未读数 ──────────────────────
  // Aggregated total = unread chat conversations + unread purchase requests
  const totalUnreadCount = chatUnreadCount + dealUnreadCount;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── 拉取聊天未读数 / Fetch chat unread count ─────────────────────────────
  const fetchChatUnread = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await chatService.getChats(1, 100);
      const chats = res.data.data?.data ?? [];
      const count = chats.filter((c: ChatSummary) => c.unreadCount > 0).length;
      setChatUnreadCount(count);
    } catch { /* 静默失败 / Fail silently */ }
  }, [isAuthenticated, setChatUnreadCount]);

  // ─── 拉取购买申请通知 / Fetch deal notifications ──────────────────────────
  const fetchDealNotifs = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiClient.get('/deal-notifications');
      setDealNotifs(res.data.notifications || []);
      setDealUnreadCount(res.data.unreadCount || 0);
    } catch { /* 静默失败 / Fail silently */ }
  }, [isAuthenticated]);

  // ─── 初始化 + 30 秒轮询 / Init + 30s polling ─────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      setChatUnreadCount(0);
      setDealUnreadCount(0);
      return;
    }
    fetchChatUnread();
    fetchDealNotifs();
    intervalRef.current = setInterval(() => {
      fetchChatUnread();
      fetchDealNotifs();
    }, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
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

  // ─── 点击购买申请通知：标记已读 + 导航 / Click deal notif: mark read + navigate ──
  const handleDealNotifClick = async (notif: any) => {
    setPopoverOpen(false);
    setDealNotifs(prev => prev.filter(n => n.id !== notif.id));
    if (!notif.isRead) setDealUnreadCount(prev => Math.max(0, prev - 1));
    navigate('/my-page');
    try {
      await apiClient.put('/deal-notifications/read-all');
    } catch { /* 静默失败 */ }
  };

  // ─── 全部标记已读 / Mark all as read ─────────────────────────────────────
  const handleMarkAllRead = async () => {
    try {
      await apiClient.put('/deal-notifications/read-all');
      setDealUnreadCount(0);
      setDealNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* 静默失败 */ }
  };

  // ─── 构建聚合通知列表 / Build aggregated notification list ───────────────
  // 聊天通知在前，购买申请在后，按时间排序
  // Chat notifications first, then deal notifications, sorted by time
  const allNotifications: NotificationItem[] = [
    ...previewChats.map(chat => ({
      id: `chat-${chat.chatID}`,
      type: 'chat' as const,
      chat,
    })),
    ...dealNotifs.filter(n => !n.isRead).map(n => ({
      id: `deal-${n.id}`,
      type: 'purchase' as const,
      dealNotif: n,
    })),
  ];

  // ─── 工具函数 / Utility functions ─────────────────────────────────────────
  const getOtherParty = (chat: ChatSummary) => {
    if (user?.userID === chat.buyerID) {
      return { name: chat.sellerName, image: chat.sellerImage };
    }
    return { name: chat.buyerName, image: chat.buyerImage };
  };

  const truncate = (text: string, maxLen: number) =>
    text && text.length > maxLen ? text.slice(0, maxLen) + '…' : (text ?? '');

  const formatTime = (iso: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
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
        <div className="flex items-center justify-between">

          {/* ── Logo + 导航 / Logo + Nav ─────────────────────────────────── */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white">🎓</span>
              </div>
              <span className="hidden sm:block">Uniy Market</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="hover:text-blue-600 transition-colors" onClick={() => navigate('/')}>{t('home')}</a>
              <a href="#" className="hover:text-blue-600 transition-colors" onClick={() => navigate('/my-page')}>{t('myPage')}</a>
              <a href="#" className="hover:text-blue-600 transition-colors">{t('helpCenter')}</a>
            </nav>
          </div>

          {/* ── 右侧区域 / Right section ─────────────────────────────────── */}
          <div className="flex items-center gap-4">

            {/* 学校认证徽章 / Edu verification badge */}
            <div className="hidden sm:block">
              {user?.eduVerified ? (
                <Badge variant="secondary" className="gap-1">
                  <span className="text-green-600">✓</span>
                  {t('verified')} - {getMaskedEduEmail()}
                </Badge>
              ) : isAuthenticated ? (
                <Button variant="outline" size="sm" onClick={() => navigate('/my-page')}>
                  {t('verifyNow')}
                </Button>
              ) : null}
            </div>

            {/* ── 聚合通知铃铛 / Aggregated Notification Bell ─────────────── */}
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <div
                  className="relative cursor-pointer p-1"
                  onMouseEnter={handleBellMouseEnter}
                  onMouseLeave={() => setPopoverOpen(false)}
                >
                  <Bell className="w-5 h-5" />
                  {/* 聚合徽章：聊天未读 + 购买申请未读 / Aggregated badge: chat + purchase */}
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
                  <p className="font-semibold text-sm">{t('notifications') || 'Notifications'}</p>
                  {dealUnreadCount > 0 && (
                    <button className="text-xs text-blue-600 hover:underline" onClick={handleMarkAllRead}>
                      {t('markAllRead') || 'Mark all read'}
                    </button>
                  )}
                </div>

                {/* 通知列表：固定 6 条高度，超出可滚动 / List: fixed 6-item height, scrollable overflow */}
                {allNotifications.length === 0 ? (
                  <div className="px-3 py-4 text-center text-sm text-gray-400">
                    {t('noNotifications') || 'No notifications'}
                  </div>
                ) : (
                  <div
                    className="overflow-y-auto"
                    style={{ maxHeight: '24rem' }} /* 约 6 条 × 4rem / ~6 items × 4rem */
                  >
                    {allNotifications.map((item) => {
                      if (item.type === 'chat' && item.chat) {
                        const chat = item.chat;
                        const other = getOtherParty(chat);
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => handleChatClick(chat)}
                          >
                            {/* 聊天图标标识 / Chat type indicator */}
                            <div className="relative flex-shrink-0">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={other.image ? `http://localhost:3000${other.image}` : ''} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                  {other.name ? other.name.slice(0, 2).toUpperCase() : '??'}
                                </AvatarFallback>
                              </Avatar>
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
                              <p className="text-xs text-gray-500 truncate">{chat.lastMessageText ?? ''}</p>
                            </div>
                            {chat.unreadCount > 0 && (
                              <span className="min-w-[1rem] h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] px-1 flex-shrink-0">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                        );
                      }

                      if (item.type === 'purchase' && item.dealNotif) {
                        const n = item.dealNotif;
                        return (
                          <div
                            key={item.id}
                            className={`flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${!n.isRead ? 'bg-orange-50' : ''}`}
                            onClick={() => handleDealNotifClick(n)}
                          >
                            {/* 购买申请图标 / Purchase request icon */}
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <ShoppingBag className="w-5 h-5 text-orange-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800 line-clamp-2">
                                {n.productTitle ? `[${truncate(n.productTitle, 20)}] ` : ''}{n.message}
                              </p>
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
                <Button variant="ghost" size="sm">
                  {language === 'en' ? 'English' : language === 'zh' ? '中文' : 'ไทย'}
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
    </header>
  );
}
