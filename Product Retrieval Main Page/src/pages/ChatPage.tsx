/**
 * ChatPage — 聊天页面（完整重构版）
 * ChatPage — Chat page (full refactor)
 *
 * 功能：
 * - 接入真实 chatId 和历史消息 / Real chatId and message history
 * - WebSocket 实时消息 / Real-time messages via WebSocket
 * - 图片上传（含校验）/ Image upload with validation
 * - 图片消息渲染 + 全屏预览 / Image message rendering + fullscreen preview
 * - 翻译功能（PC hover + 移动端长按）/ Translation (PC hover + mobile long-press)
 * - 返回按钮导航至聊天历史 / Back button navigates to chat history
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { ArrowLeft, Send, Image as ImageIcon, Languages, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { translate } from '../lib/i18n';
import type { Language } from '../lib/i18n';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../services/authContext';
import { chatService } from '../services/chatService';
import type { MessageDetail, ChatSummary } from '../services/chatService';
import { useChatSocket } from '../hooks/useChatSocket';
import { useChatNotification } from '../services/ChatNotificationContext';
import { getImageUrl } from '../lib/config';

// ─── 常量 / Constants ─────────────────────────────────────────────────────────

/** 图片大小上限 5MB / Max image size 5MB */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** 允许的图片 MIME 类型 / Allowed image MIME types */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

/** 长按触发翻译的最短时间（ms）/ Min long-press duration for translation (ms) */
const LONG_PRESS_DURATION = 500;

// ─── 主组件 / Main Component ──────────────────────────────────────────────────

export default function ChatPage() {
  const navigate = useNavigate();
  // 路由参数改为 chatId / Route param changed to chatId
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const t = (key: any) => translate(language, key);
  // 13.2 进入聊天页时刷新通知状态 / Refresh notification state when entering chat page
  const { refreshUnread } = useChatNotification();

  // ── 核心状态 / Core state ──────────────────────────────────────────────────
  const [messages, setMessages] = useState<MessageDetail[]>([]);
  const [chatInfo, setChatInfo] = useState<ChatSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [wsError, setWsError] = useState(false);
  const [isOtherOnline, setIsOtherOnline] = useState(false);

  // ── 输入状态 / Input state ─────────────────────────────────────────────────
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // ── 图片预览状态 / Image preview state ────────────────────────────────────
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ── 翻译状态 / Translation state ──────────────────────────────────────────
  // Map<messageID, translatedText> 存储每条消息的翻译结果
  // Map<messageID, translatedText> stores translation for each message
  const [translations, setTranslations] = useState<Record<string, string>>({});
  // 正在翻译的消息 ID 集合 / Set of message IDs currently being translated
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());
  // PC 端：当前 hover 的消息 ID / PC: currently hovered message ID
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  // 移动端：长按计时器 / Mobile: long-press timer ref
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 移动端：当前显示翻译菜单的消息 ID / Mobile: message ID showing translation menu
  const [mobileMsgMenuId, setMobileMsgMenuId] = useState<string | null>(null);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ── 初始化：加载历史消息 + 聊天详情 + 标记已读 ────────────────────────────
  // Init: load history + chat info + mark as read
  useEffect(() => {
    if (!chatId) return;

    setLoading(true);
    setLoadError(false);

    Promise.all([
      chatService.getMessages(chatId),
      chatService.getChatById(chatId),
      chatService.markAsRead(chatId).catch(() => {/* 标记已读失败不影响主流程 */}),
    ])
      .then(([msgsRes, chatRes]) => {
        setMessages(msgsRes.data.data?.data ?? []);
        setChatInfo(chatRes.data.data ?? null);
        // 13.2 进入聊天后刷新全局通知状态 / Refresh global notification state after entering chat
        refreshUnread().catch(() => {});
      })
      .catch((err) => {
        // 403：卖家无权访问，提示并跳转 / 403: seller has no access, toast and redirect
        if (err?.response?.status === 403) {
          toast.error('请等待买家发起咨询后再进入对话');
          navigate('/my-page?tab=chat-history');
          return;
        }
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, [chatId, navigate, refreshUnread]);

  // ── WebSocket 实时消息 / Real-time messages via WebSocket ──────────────────
  const handleNewMessage = useCallback((msg: MessageDetail) => {
    setMessages((prev) => {
      // 防止重复追加（REST 发送后 WS 也会推送）/ Prevent duplicates
      if (prev.some((m) => m.messageID === msg.messageID)) return prev;
      return [...prev, msg];
    });
  }, []);

  const handleConnectionError = useCallback(() => {
    setWsError(true);
  }, []);

  useChatSocket(chatId, {
    onNewMessage: handleNewMessage,
    onConnectionError: handleConnectionError,
  });

  // ── 自动滚动到底部 / Auto-scroll to bottom ────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── 语言切换 / Language switch ─────────────────────────────────────────────
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  // ── 发送文本消息 / Send text message ──────────────────────────────────────
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !chatId || sending) return;

    setSending(true);
    try {
      const res = await chatService.sendTextMessage(chatId, message.trim());
      const newMsg = res.data.data;
      if (newMsg) {
        setMessages((prev) =>
          prev.some((m) => m.messageID === newMsg.messageID) ? prev : [...prev, newMsg]
        );
      }
      setMessage('');
    } catch (err: any) {
      toast.error(err?.suspendedMessage || '发送失败，请稍后重试');
    } finally {
      setSending(false);
    }
  };

  // ── 图片上传 / Image upload ────────────────────────────────────────────────
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 重置 input，允许重复选同一文件 / Reset input to allow re-selecting same file
    e.target.value = '';
    if (!file || !chatId) return;

    // 校验 MIME 类型 / Validate MIME type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('仅支持 jpeg/jpg/png/gif/webp 格式');
      return;
    }

    // 校验文件大小 / Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('图片不能超过 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const res = await chatService.sendImageMessage(chatId, file);
      const newMsg = res.data.data;
      if (newMsg) {
        setMessages((prev) =>
          prev.some((m) => m.messageID === newMsg.messageID) ? prev : [...prev, newMsg]
        );
      }
    } catch (err: any) {
      toast.error(err?.suspendedMessage || '图片发送失败，请稍后重试');
    } finally {
      setUploadingImage(false);
    }
  };

  // ── 翻译消息 / Translate message ──────────────────────────────────────────
  const handleTranslate = async (msgId: string) => {
    if (!chatId || translatingIds.has(msgId)) return;
    // 已有翻译则不重复请求 / Skip if already translated
    if (translations[msgId]) return;

    setTranslatingIds((prev) => new Set(prev).add(msgId));
    try {
      const res = await chatService.translateMessage(chatId, msgId, language);
      const translated = res.data.data?.translatedText;
      if (translated) {
        setTranslations((prev) => ({ ...prev, [msgId]: translated }));
      }
    } catch {
      toast.error('翻译失败，请稍后重试');
    } finally {
      setTranslatingIds((prev) => {
        const next = new Set(prev);
        next.delete(msgId);
        return next;
      });
    }
    // 关闭移动端菜单 / Close mobile menu
    setMobileMsgMenuId(null);
  };

  // ── 移动端长按处理 / Mobile long-press handlers ───────────────────────────
  const handleTouchStart = (msgId: string) => {
    longPressTimerRef.current = setTimeout(() => {
      setMobileMsgMenuId(msgId);
    }, LONG_PRESS_DURATION);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // ── 翻译按钮文字 / Translate button label ─────────────────────────────────
  const translateLabel = language === 'zh' ? '翻译' : language === 'th' ? 'แปล' : 'Translate';

  // ── 时间格式化 / Time formatting ───────────────────────────────────────────
  const formatTime = (ts: string) => {
    const date = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor(diff / 60000);

    if (hours < 1) return `${minutes}m ${t('mAgo')}`;
    if (hours < 24) return `${hours}h ${t('mAgo')}`;
    return date.toLocaleDateString();
  };

  // ── 对方用户信息（根据当前用户角色决定）/ Other user info ─────────────────
  // 当前用户是 buyer → 对方是 seller，反之亦然
  // Current user is buyer → other is seller, vice versa
  const otherName = chatInfo
    ? user?.userID === chatInfo.buyerID
      ? chatInfo.sellerName
      : chatInfo.buyerName
    : '...';

  const otherImage = chatInfo
    ? user?.userID === chatInfo.buyerID
      ? chatInfo.sellerImage
      : chatInfo.buyerImage
    : undefined;

  const otherId = chatInfo
    ? user?.userID === chatInfo.buyerID
      ? chatInfo.sellerID
      : chatInfo.buyerID
    : undefined;

  // ── 查询对方在线状态 / Check other user's online status ────────────────
  useEffect(() => {
    if (!otherId) return;
    chatService.checkUserOnline(otherId)
      .then((res) => setIsOtherOnline(!!res.data.data?.online))
      .catch(() => {});
    // Poll every 30s
    const interval = setInterval(() => {
      chatService.checkUserOnline(otherId)
        .then((res) => setIsOtherOnline(!!res.data.data?.online))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [otherId]);

  const langLabel = language === 'en' ? 'English' : language === 'zh' ? '中文' : 'ไทย';

  // ─────────────────────────────────────────────────────────────────────────
  // 加载中 / Loading state
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 加载失败 / Load error state
  // ─────────────────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">加载失败，请稍后重试</p>
        <Button onClick={() => window.location.reload()}>重试</Button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 主界面 / Main UI
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── 顶部栏 / Header ─────────────────────────────────────────────── */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* 智能返回：优先浏览器历史，无历史则回首页 / Smart back: browser history first, fallback to home */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  // window.history.length <= 1 表示没有历史记录（直接链接进入）
                  // window.history.length <= 1 means no history (direct link entry)
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate('/');
                  }
                }}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>

              {/* 对方用户信息 / Other user info */}
              <div
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => otherId && navigate(`/seller/${otherId}`)}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={otherImage} />
                  <AvatarFallback>{otherName?.[0] ?? '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{otherName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOtherOnline ? (
                      <span className="text-xs text-green-600">● {t('online')}</span>
                    ) : (
                      <span className="text-xs text-gray-400">● {t('offline') || 'Offline'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* 语言切换下拉菜单 / Language switcher dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">{langLabel}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleLanguageChange('zh')}>中文</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLanguageChange('en')}>English</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLanguageChange('th')}>ไทย</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* ── 商品上下文 / Product context ────────────────────────────────── */}
      {chatInfo && (
        <div className="bg-blue-50 border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              {chatInfo.productImage ? (
                <img
                  src={chatInfo.productImage.startsWith('http') ? chatInfo.productImage : getImageUrl(chatInfo.productImage)}
                  alt={chatInfo.productTitle}
                  className="w-12 h-12 object-cover rounded flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-400 text-xs">No img</span>
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-sm">{chatInfo.productTitle}</p>
                <p className="text-blue-600 font-semibold">
                  ฿{chatInfo.productPrice}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {chatInfo.productStatus}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* ── WebSocket 重连提示 / WebSocket reconnect notice ─────────────── */}
      {wsError && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <p className="text-xs text-red-700">实时连接已断开，消息可能延迟</p>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7"
              onClick={() => {
                setWsError(false);
                window.location.reload();
              }}
            >
              重新连接
            </Button>
          </div>
        </div>
      )}

      {/* ── 消息区域 / Messages area ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="space-y-4">
            {messages.map((msg) => {
              // 判断是否为当前用户发送 / Determine if sent by current user
              const isMine = msg.senderID === user?.userID;
              const isText = msg.messageType === 'text';
              const translatedText = translations[msg.messageID];
              const isTranslating = translatingIds.has(msg.messageID);
              const showMobileMenu = mobileMsgMenuId === msg.messageID;

              return (
                <div
                  key={msg.messageID}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex gap-2 max-w-[70%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* 头像 / Avatar */}
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={isMine ? user?.profileImage : otherImage} />
                      <AvatarFallback>
                        {isMine ? (user?.name?.[0] ?? 'Me') : (otherName?.[0] ?? '?')}
                      </AvatarFallback>
                    </Avatar>

                    <div className="relative">
                      {/* 消息气泡 / Message bubble */}
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          isMine
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                            : 'bg-white border'
                        }`}
                        // PC 端 hover 显示翻译图标（仅文本消息）
                        // PC: show translate icon on hover (text messages only)
                        onMouseEnter={() => isText && setHoveredMsgId(msg.messageID)}
                        onMouseLeave={() => setHoveredMsgId(null)}
                        // 移动端长按触发翻译菜单（仅文本消息）
                        // Mobile: long-press to show translation menu (text messages only)
                        onTouchStart={() => isText && handleTouchStart(msg.messageID)}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchEnd}
                      >
                        {/* 图片消息 / Image message */}
                        {msg.messageType === 'image' ? (
                          <img
                            src={getImageUrl(msg.messageText)}
                            alt="图片消息"
                            className="max-w-[240px] max-h-[240px] rounded-lg object-contain cursor-pointer"
                            onClick={() =>
                              setPreviewImage(getImageUrl(msg.messageText))
                            }
                          />
                        ) : (
                          /* 文本消息 / Text message */
                          <p className="text-sm">{msg.messageText}</p>
                        )}

                        {/* PC 端翻译按钮（hover 时显示）/ PC translate button (shown on hover) */}
                        {isText && hoveredMsgId === msg.messageID && (
                          <button
                            className={`absolute -bottom-7 ${isMine ? 'right-0' : 'left-0'} mt-2 border border-gray-200 rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors flex items-center gap-1`}
                            onClick={() => handleTranslate(msg.messageID)}
                            disabled={isTranslating}
                          >
                            {isTranslating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Languages className="w-3 h-3" />
                            )}
                            <span>{translateLabel}</span>
                          </button>
                        )}
                      </div>

                      {/* 翻译结果 / Translation result */}
                      {translatedText && (
                        <p
                          className={`text-xs text-gray-400 italic mt-1 px-1 ${
                            isMine ? 'text-right' : 'text-left'
                          }`}
                        >
                          {translatedText}
                        </p>
                      )}

                      {/* 移动端长按翻译菜单 / Mobile long-press translation menu */}
                      {isText && showMobileMenu && (
                        <div
                          className={`absolute z-10 bg-white border rounded-lg shadow-lg p-2 ${
                            isMine ? 'right-0' : 'left-0'
                          } top-full mt-1`}
                        >
                          <button
                            className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-500 px-3 py-1 w-full text-left"
                            onClick={() => handleTranslate(msg.messageID)}
                            disabled={isTranslating}
                          >
                            {isTranslating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Languages className="w-4 h-4" />
                            )}
                            {translateLabel}
                          </button>
                          <button
                            className="text-xs text-gray-400 px-3 py-1 w-full text-left"
                            onClick={() => setMobileMsgMenuId(null)}
                          >
                            取消
                          </button>
                        </div>
                      )}

                      {/* 时间戳 / Timestamp */}
                      <div
                        className={`text-xs text-gray-500 mt-1 ${
                          isMine ? 'text-right' : 'text-left'
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                        {isMine && msg.isRead && ' • Read'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* ── 安全提示 / Safety notice ─────────────────────────────────────── */}
      <div className="bg-yellow-50 border-t border-yellow-200">
        <div className="container mx-auto px-4 py-2">
          <p className="text-xs text-yellow-800 text-center">
            ⚠️ <strong>{t('safetyReminder')}:</strong> {t('safetyReminderChat')}
          </p>
        </div>
      </div>

      {/* ── 输入区域 / Input area ────────────────────────────────────────── */}
      <div className="bg-white border-t sticky bottom-0">
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            {/* 隐藏的图片文件输入 / Hidden image file input */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleImageSelect}
            />

            {/* 图片上传按钮 / Image upload button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={uploadingImage || sending}
              onClick={() => imageInputRef.current?.click()}
            >
              {uploadingImage ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ImageIcon className="w-5 h-5" />
              )}
            </Button>

            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('typeMessage')}
              className="flex-1"
              disabled={sending || uploadingImage}
            />

            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-purple-600"
              disabled={!message.trim() || sending || uploadingImage}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* ── 图片全屏预览 Dialog / Fullscreen image preview Dialog ────────── */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-screen-lg p-2 bg-black/90 border-none">
          {previewImage && (
            <img
              src={previewImage}
              alt="图片预览"
              className="w-full object-contain max-h-[90vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
