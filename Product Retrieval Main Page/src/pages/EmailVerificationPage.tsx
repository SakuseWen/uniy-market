import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle, Mail } from 'lucide-react';
import { translate } from '../lib/i18n';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../services/authContext';
import { getApiUrl } from '../lib/config';

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const t = (key: any) => translate(language, key);

  const email = (location.state as any)?.email || '';

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError(t('invalidCode'));
      return;
    }

    if (!email) {
      setError(t('emailRequired'));
      navigate('/login');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl('/auth/verify-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorCode = data?.error?.code || '';
        if (errorCode === 'INVALID_CODE') {
          throw new Error(t('invalidOrExpiredCode'));
        }
        throw new Error(t('verificationFailed'));
      }

      // Auto-login: save token and user
      if (data.data?.token) {
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('authUser', JSON.stringify(data.data.user));
      }

      setSuccess(t('verificationSuccess'));
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err: any) {
      setError(err.message || t('verificationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    setError('');
    try {
      const response = await fetch(getApiUrl('/auth/resend-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(t('resendFailed'));
      }
      setSuccess(t('codeSent'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || t('resendFailed'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="absolute top-8 left-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">🎓</span>
          </div>
          <span className="text-xl font-semibold">Uniy Market</span>
        </div>
      </div>

      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <CardTitle>{t('verifyYourEmail')}</CardTitle>
            <CardDescription>
              {t('verifyEmailDesc')}
              {email && <span className="block mt-1 font-medium text-blue-600">{email}</span>}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleVerify}>
              <div className="space-y-4">
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={t('enterCode')}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-lg tracking-widest"
                />
                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}
                {success && (
                  <p className="text-sm text-green-600 text-center">{success}</p>
                )}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-blue-700 text-xs">{t('codeExpiry')}</p>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
              onClick={handleVerify}
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? t('verifying') : t('verify')}
            </Button>
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? t('sendingCode') : t('resendCode')}
            </button>
            <button
              type="button"
              className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
              onClick={() => navigate('/login')}
            >
              {t('backToLogin')}
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
