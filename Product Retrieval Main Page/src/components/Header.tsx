import { Bell, User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
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

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  unreadMessages: number;
}

export function Header({ language, onLanguageChange, unreadMessages }: HeaderProps) {
  const t = (key: any) => translate(language, key);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    apiClient.get('/deal-notifications').then(res => {
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    }).catch(() => {});
    const interval = setInterval(() => {
      apiClient.get('/deal-notifications').then(res => {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = () => {
    apiClient.put('/deal-notifications/read-all').then(() => setUnreadCount(0)).catch(() => {});
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
            <Popover>
              <PopoverTrigger asChild>
                <div className="relative cursor-pointer">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                      {unreadCount}
                    </div>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="px-3 pt-3 pb-2 flex items-center justify-between">
                  <p className="font-semibold text-sm">{t('notifications') || 'Notifications'}</p>
                  {unreadCount > 0 && (
                    <button className="text-xs text-blue-600" onClick={handleMarkAllRead}>{t('markAllRead') || 'Mark all read'}</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-400">{t('noNotifications') || 'No notifications'}</div>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.slice(0, 10).map((n: any) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-2 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${!n.isRead ? 'bg-blue-50' : ''}`}
                        onClick={() => navigate('/my-page')}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{n.productTitle ? `[${n.productTitle}] ` : ''}{n.type === 'new_request' ? t('notifNewRequest') : n.type === 'rejected' ? t('notifRejected') : n.type === 'accepted' ? t('notifAccepted') : n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
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