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

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  userVerified: boolean;
  unreadMessages: number;
}

export function Header({ language, onLanguageChange, userVerified, unreadMessages }: HeaderProps) {
  const t = (key: any) => translate(language, key);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

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
    <header className="sticky top-0 z-50 bg-white border-b">
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
              {userVerified ? (
                <Badge variant="secondary" className="gap-1">
                  <span className="text-green-600">✓</span>
                  {t('verified')} - STU***123
                </Badge>
              ) : (
                <Button variant="outline" size="sm">
                  {t('verifyNow')}
                </Button>
              )}
            </div>

            {/* 消息预览浮窗 / Message Preview Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <div className="relative cursor-pointer">
                  <Bell className="w-5 h-5" />
                  {unreadMessages > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                      {unreadMessages}
                    </div>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="px-3 pt-3 pb-2">
                  <p className="font-semibold text-sm">{t('messages') || 'Messages'}</p>
                </div>
                <div
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-md mx-1 mb-1"
                  onClick={() => navigate('/chat/example-seller')}
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                      ES
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Example Seller</p>
                    <p className="text-sm text-gray-500 truncate">Hi! Is this item still available?</p>
                  </div>
                </div>
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
              className="hidden lg:flex bg-gradient-to-r from-blue-500 to-purple-600"
              onClick={() => navigate('/create-product')}
            >
              {t('postItemCTA')}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}