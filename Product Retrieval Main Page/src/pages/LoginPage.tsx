import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '../services/authContext';
import { translate } from '../lib/i18n';
import type { Language } from '../lib/i18n';
import { useLanguage } from '../lib/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const { language, setLanguage } = useLanguage();
  const t = (key: any) => translate(language, key);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
      navigate('/');
    } catch (err) {
      setError('Login failed. Please check your email and password.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registerEmail,
          name: registerName,
          password: registerPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error?.message || 'Registration failed');
      }

      // 注册成功后跳转邮箱验证页 / Redirect to email verification after registration
      navigate('/verify-email');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      console.error('Register error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const langLabel = language === 'en' ? 'English' : language === 'zh' ? '中文' : 'ไทย';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      {/* Logo 和语言切换器 / Logo and Language Switcher */}
      <div className="absolute top-8 left-8 right-8 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">🎓</span>
          </div>
          <span className="text-xl font-semibold">Uniy Market</span>
        </div>
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

      <div className="w-full max-w-md">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">{t('login')}</TabsTrigger>
            <TabsTrigger value="register">{t('createAccount')}</TabsTrigger>
          </TabsList>

          {/* 登录选项卡 / Login Tab */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>{t('welcomeBack')}</CardTitle>
                <CardDescription>{t('loginDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin}>
                  <div className="space-y-4">
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                        {error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('emailOrStudentId')}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="student@university.edu"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">{t('password')}</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" className="rounded" />
                        <span>{t('rememberMe')}</span>
                      </label>
                      <a href="#" className="text-sm text-blue-600 hover:underline">
                        {t('forgotPassword')}
                      </a>
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? t('loggingIn') : t('login')}
                </Button>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">{t('orContinueWith')}</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* 注册选项卡 / Register Tab */}
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>{t('createAccount')}</CardTitle>
                <CardDescription>{t('joinCommunity')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister}>
                  <div className="space-y-4">
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                        {error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('fullName')}</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">{t('universityEmail')}</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="student@university.edu"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">{t('password')}</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-blue-900 mb-1">{t('campusVerification')}</p>
                          <p className="text-blue-700 text-xs">{t('campusVerificationDesc')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
                  onClick={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading ? t('creatingAccount') : t('createAccount')}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  {t('termsPrefix')}{' '}
                  <a href="#" className="text-blue-600 hover:underline">{t('termsOfService')}</a>
                  {' '}{t('and')}{' '}
                  <a href="#" className="text-blue-600 hover:underline">{t('privacyPolicy')}</a>
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
