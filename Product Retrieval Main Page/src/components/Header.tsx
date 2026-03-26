import { Bell, User, LogOut } from 'lucide-react';
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
import { useState, useEffect, useRef } from 'react';
import { chatService, ChatSummary } from '../services/chatService';
import { useChatNotification } from '../services/ChatNotificationContext';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  /** @deprecated 内部已动态获取，保留此 prop 以兼容旧调用方 / Kept for backward compatibility; internal state is used instead */
  unreadMessages?: number;
}

export function Header({ language, onLanguageChange, unreadMessages }: HeaderProps) {
  const t = (key: any) => translate(language, key);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // ─── 13.1 从全局 Context 获取通知状态 / Get notification state from global context ──
  const { unreadCount, setUnreadCount, previewChats, setPreviewChats, refreshUnread } =
    useChatNotification();

  // ─── 9.3 Popover 对话预览状态 / Popover chat preview state ───────────────
  const [popoverOpen, setPopoverOpen] = useState(false);

  // 用于清除定时器的 ref / Ref to hold the interval timer for cleanup
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── 9.1 初始化 + 30 秒轮询 / Init + 30s polling ─────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    // 立即获取一次 / Fetch immediately on mount
    const fetchUnread = async () => {
      try {
        // 按独立对话框数量计数：获取所有对话，统计 unreadCount > 0 的对话数
        // Count by unique conversations: fetch all chats, count those with unreadCount > 0
        const res = await chatService.getChats(1, 100);
        const chats = res.data.data?.data ?? [];
        const unreadConversationCount = chats.filter((c: ChatSummary) => c.unreadCount > 0).length;
        setUnreadCount(unreadConversationCount);
      } catch {
        // 静默失败，不影响其他功能 / Fail silently
      }
    };

    fetchUnread();

    // 每 30 秒刷新一次 / Refresh every 30 seconds
    intervalRef.current = setInterval(fetchUnread, 30_000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, setUnreadCount]);

  // ─── 9.3 hover 时加载对话预览 / Load chat preview on hover ───────────────
  const handleBellMouseEnter = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await chatService.getChats(1, 20);
      // 只显示有未读消息的对话 / Only show chats with unread messages
      const unreadChats = (res.data.data.data ?? []).filter((c: ChatSummary) => c.unreadCount > 0);
      setPreviewChats(unreadChats.slice(0, 5));
    } catch {
      // 静默失败 / Fail silently
    }
    setPopoverOpen(true);
  };

  // ─── 13.1 点击对话：立即更新 UI，异步标记已读（不阻断导航）────────────────
  // Click chat: immediately update UI, async mark as read (non-blocking)
  const handleChatClick = (chat: ChatSummary) => {
    setPopoverOpen(false);
    // 立即物理移除该对话 / Immediately remove from preview list
    setPreviewChats(previewChats.filter((c) => c.chatID !== chat.chatID));
    // 立即减去该对话的未读数（最小为 0）/ Immediately decrement unread count (min 0)
    setUnreadCount(Math.max(0, unreadCount - (chat.unreadCount ?? 0)));
    // 先导航，再异步标记已读 / Navigate first, then async mark as read
    navigate(`/chat/${chat.chatID}`);
    chatService.markAsRead(chat.chatID).catch(() => {});
  };

  // ─── 工具函数 / Utility functions ─────────────────────────────────────────

  // 判断对方用户 / Determine the other party in the chat
  const getOtherParty = (chat: ChatSummary) => {
    if (user?.userID === chat.buyerID) {
      // 当前用户是买家，对方是卖家 / Current user is buyer, other party is seller
      return {
        name: chat.sellerName,
        image: chat.sellerImage,
      };
    }
    // 当前用户是卖家，对方是买家 / Current user is seller, other party is buyer
    return {
      name: chat.buyerName,
      image: chat.buyerImage,
    };
  };

  // 截断文本至指定长度 / Truncate text to given length
  const truncate = (text: string, maxLen: number) =>
    text.length > maxLen ? text.slice(0, maxLen) + '…' : text;

  // 格式化时间戳 / Format timestamp
  const formatTime = (iso: string) => {
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

  // Mask edu email: e.g. "student@university.edu" → "stu***@university.edu"
  const getMaskedEduEmail = () => {
    if (!user?.eduEmail) return '';
    const [local, domain] = user.eduEmail.split('@');
    if (!domain) return user.eduEmail;
    const visible = local.slice(0, 3);
    return `${visible}***@${domain}`;
  };

  const handleAvatarClick = () => {
    if (isAuthenticated) {
      navigate('/my-page');
    } else {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Site Name */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white">🎓</span>
              </div>
              <span className="hidden sm:block">Uniy Market</span>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="hover:text-blue-600 transition-colors" onClick={() => navigate('/')}>
                {t('home')}
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors" onClick={() => navigate('/my-page')}>
                {t('myPage')}
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors">
                {t('helpCenter')}
              </a>
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Campus Verification */}
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

            {/* 消息预览浮窗 / Message Preview Popover */}
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                {/* onMouseEnter 触发加载预览 / Trigger preview load on hover */}
                <div
                  className="relative cursor-pointer"
                  onMouseEnter={handleBellMouseEnter}
                  onMouseLeave={() => setPopoverOpen(false)}
                >
                  <Bell className="w-5 h-5" />
                  {/* 徽章：absolute 定位，translate 确保叠加在铃铛右上角 / Badge: absolute + translate to overlap bell top-right corner */}
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 min-w-[1rem] h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold px-1 leading-none pointer-events-none">
                      {unreadCount}
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
                <div className="px-3 pt-3 pb-2">
                  <p className="font-semibold text-sm">{t('messages') || 'Messages'}</p>
                </div>

                {/* 9.3: 真实对话预览列表 / Real chat preview list */}
                {previewChats.length === 0 ? (
                  <div className="px-3 pb-3 text-sm text-gray-500">
                    {t('noMessages') || 'No messages yet'}
                  </div>
                ) : (
                  previewChats.map((chat) => {
                    const other = getOtherParty(chat);
                    const initials = other.name
                      ? other.name.slice(0, 2).toUpperCase()
                      : '??';
                    return (
                      // 9.4: 点击导航并标记已读 / Click to navigate and mark as read
                      <div
                        key={chat.chatID}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-md mx-1 mb-1"
                        onClick={() => handleChatClick(chat)}
                      >
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage
                            src={
                              other.image
                                ? `http://localhost:3000${other.image}`
                                : ''
                            }
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">{other.name}</p>
                            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                              {formatTime(chat.lastMessageAt)}
                            </span>
                          </div>
                          {/* 商品标题 / Product title */}
                          <p className="text-xs text-blue-500 truncate">{truncate(chat.productTitle, 30)}</p>
                          {/* 最新消息预览（需求 4.14）/ Latest message preview (Req 4.14) */}
                          <p className="text-xs text-gray-500 truncate">{chat.lastMessageText ?? ''}</p>
                        </div>
                        {/* 该对话的未读数徽章 / Per-chat unread badge */}
                        {chat.unreadCount > 0 && (
                          <div className="min-w-[1.25rem] h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs px-1 flex-shrink-0">
                            {chat.unreadCount}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </PopoverContent>
            </Popover>

            {/* Language Switch */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  {language === 'en' ? 'English' : language === 'zh' ? '中文' : 'ไทย'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onLanguageChange('zh')}>
                  中文
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLanguageChange('en')}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLanguageChange('th')}>
                  ไทย
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Avatar with Dropdown */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 rounded-full"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.profileImage ? `http://localhost:3000${user.profileImage}` : ''} />
                      <AvatarFallback>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/my-page')}>
                    <User className="w-4 h-4 mr-2" />
                    {t('myPage')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('logout') || 'Logout'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Avatar
                className="w-8 h-8 cursor-pointer hover:opacity-80 hover:scale-105 transition-all duration-200"
                onClick={handleAvatarClick}
              >
                <AvatarImage src="" />
                <AvatarFallback>
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
            )}

            {/* Post Item Button */}
            <Button
              className="hidden lg:flex bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:scale-105 transition-all duration-200"
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                if (!user.eduVerified) {
                  toast.error(t('eduRequiredToPost'));
                  return;
                }
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
