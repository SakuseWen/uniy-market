import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Loader2, ArrowLeft, Mail, KeyRound, CheckCircle } from 'lucide-react';
import { translate } from '../lib/i18n';
import { useLanguage } from '../lib/LanguageContext';

const API_BASE = 'http://localhost:3000/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (key: any) => translate(language, key);

  const [step, setStep] = useState<'email' | 'code' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const labels: Record<string, Record<string, string>> = {
    en: {
      title: 'Reset Password',
      emailDesc: 'Enter your registered email address. We will send a verification code.',
      emailLabel: 'Email Address',
      sendCode: 'Send Verification Code',
      codeDesc: 'Enter the 6-digit code sent to your email.',
      codeLabel: 'Verification Code',
      verifyCode: 'Verify Code',
      resetDesc: 'Enter your new password.',
      newPasswordLabel: 'New Password',
      confirmPasswordLabel: 'Confirm New Password',
      resetPassword: 'Reset Password',
      doneTitle: 'Password Reset Successful',
      doneDesc: 'Your password has been reset. You can now log in with your new password.',
      backToLogin: 'Back to Login',
      notFound: 'No account found with this email.',
      invalidCode: 'Invalid or expired verification code.',
      mismatch: 'Passwords do not match.',
      tooShort: 'Password must be at least 6 characters.',
      sendFailed: 'Failed to send code. Please try again.',
      resetFailed: 'Failed to reset password. Please try again.',
      sending: 'Sending...',
      verifying: 'Verifying...',
      resetting: 'Resetting...',
    },
    zh: {
      title: '重置密码',
      emailDesc: '输入您的注册邮箱，我们将发送验证码。',
      emailLabel: '邮箱地址',
      sendCode: '发送验证码',
      codeDesc: '输入发送到您邮箱的6位验证码。',
      codeLabel: '验证码',
      verifyCode: '验证',
      resetDesc: '输入您的新密码。',
      newPasswordLabel: '新密码',
      confirmPasswordLabel: '确认新密码',
      resetPassword: '重置密码',
      doneTitle: '密码重置成功',
      doneDesc: '您的密码已重置，现在可以使用新密码登录。',
      backToLogin: '返回登录',
      notFound: '未找到使用此邮箱的账户。',
      invalidCode: '验证码无效或已过期。',
      mismatch: '两次输入的密码不一致。',
      tooShort: '密码至少需要6个字符。',
      sendFailed: '发送验证码失败，请重试。',
      resetFailed: '重置密码失败，请重试。',
      sending: '发送中...',
      verifying: '验证中...',
      resetting: '重置中...',
    },
    th: {
      title: 'รีเซ็ตรหัสผ่าน',
      emailDesc: 'กรอกอีเมลที่ลงทะเบียน เราจะส่งรหัสยืนยันให้คุณ',
      emailLabel: 'ที่อยู่อีเมล',
      sendCode: 'ส่งรหัสยืนยัน',
      codeDesc: 'กรอกรหัส 6 หลักที่ส่งไปยังอีเมลของคุณ',
      codeLabel: 'รหัสยืนยัน',
      verifyCode: 'ยืนยัน',
      resetDesc: 'กรอกรหัสผ่านใหม่ของคุณ',
      newPasswordLabel: 'รหัสผ่านใหม่',
      confirmPasswordLabel: 'ยืนยันรหัสผ่านใหม่',
      resetPassword: 'รีเซ็ตรหัสผ่าน',
      doneTitle: 'รีเซ็ตรหัสผ่านสำเร็จ',
      doneDesc: 'รหัสผ่านของคุณถูกรีเซ็ตแล้ว คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้',
      backToLogin: 'กลับไปเข้าสู่ระบบ',
      notFound: 'ไม่พบบัญชีที่ใช้อีเมลนี้',
      invalidCode: 'รหัสยืนยันไม่ถูกต้องหรือหมดอายุ',
      mismatch: 'รหัสผ่านไม่ตรงกัน',
      tooShort: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
      sendFailed: 'ส่งรหัสล้มเหลว กรุณาลองอีกครั้ง',
      resetFailed: 'รีเซ็ตรหัสผ่านล้มเหลว กรุณาลองอีกครั้ง',
      sending: 'กำลังส่ง...',
      verifying: 'กำลังยืนยัน...',
      resetting: 'กำลังรีเซ็ต...',
    },
  };
  const l = labels[language] || labels.en;

  const handleSendCode = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/send-code`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.code === 'USER_NOT_FOUND' ? l.notFound : l.sendFailed);
        return;
      }
      setStep('code');
    } catch { setError(l.sendFailed); }
    finally { setLoading(false); }
  };

  const handleVerifyCode = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(l.invalidCode); return; }
      setResetToken(data.data.resetToken);
      setStep('reset');
    } catch { setError(l.invalidCode); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    setError('');
    if (newPassword.length < 6) { setError(l.tooShort); return; }
    if (newPassword !== confirmPassword) { setError(l.mismatch); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/reset`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resetToken, newPassword }),
      });
      if (!res.ok) { setError(l.resetFailed); return; }
      setStep('done');
    } catch { setError(l.resetFailed); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="absolute top-8 left-8">
        <Button variant="ghost" onClick={() => navigate('/login')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> {l.backToLogin}
        </Button>
      </div>

      <div className="w-full max-w-md">
        {step === 'done' ? (
          <Card>
            <CardContent className="pt-8 pb-6 text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold">{l.doneTitle}</h2>
              <p className="text-gray-500 text-sm">{l.doneDesc}</p>
              <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600" onClick={() => navigate('/login')}>
                {l.backToLogin}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-600" /> {l.title}
              </CardTitle>
              <CardDescription>
                {step === 'email' && l.emailDesc}
                {step === 'code' && l.codeDesc}
                {step === 'reset' && l.resetDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}

              {step === 'email' && (
                <>
                  <div className="space-y-2">
                    <Label>{l.emailLabel}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input type="email" placeholder="student@university.edu" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" />
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600" onClick={handleSendCode} disabled={loading || !email.trim()}>
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{l.sending}</> : l.sendCode}
                  </Button>
                </>
              )}

              {step === 'code' && (
                <>
                  <div className="space-y-2">
                    <Label>{l.codeLabel}</Label>
                    <Input placeholder="000000" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="text-center text-2xl tracking-widest" />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600" onClick={handleVerifyCode} disabled={loading || code.length !== 6}>
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{l.verifying}</> : l.verifyCode}
                  </Button>
                </>
              )}

              {step === 'reset' && (
                <>
                  <div className="space-y-2">
                    <Label>{l.newPasswordLabel}</Label>
                    <Input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{l.confirmPasswordLabel}</Label>
                    <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600" onClick={handleReset} disabled={loading || !newPassword || !confirmPassword}>
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{l.resetting}</> : l.resetPassword}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
