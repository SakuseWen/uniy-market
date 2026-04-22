import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env['RESEND_API_KEY']);
  }
  return resend;
}

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send verification code email via Resend
 */
export async function sendVerificationEmail(to: string, code: string): Promise<boolean> {
  try {
    const { error } = await getResend().emails.send({
      from: 'Uniy Market <emailService@uniymarket.com>',
      to: [to],
      subject: 'Uniy Market - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #6366f1; margin: 0;">🎓 Uniy Market</h1>
          </div>
          <h2 style="text-align: center; color: #1f2937;">Email Verification</h2>
          <p style="color: #4b5563; text-align: center;">Your verification code is:</p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 16px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px; text-align: center;">This code expires in 10 minutes.</p>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to send verification email:', err);
    return false;
  }
}
