import SparkPost from 'sparkpost';
import { nanoid } from 'nanoid';

const client = new SparkPost(process.env.SPARKPOST_API_KEY || 'e5e02b195fac863bc8277123dfa1aa681bfeda23');

export interface EmailVerificationData {
  email: string;
  firstName: string;
  verificationToken: string;
  baseUrl: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static instance: EmailService;
  private sparkPost: SparkPost;

  private constructor() {
    this.sparkPost = client;
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }



  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      // Clean up the domain in case it has whitespace or newlines
      const rawDomain = process.env.SPARKPOST_SENDING_DOMAIN || 'sparkpostbox.com';
      const sendingDomain = rawDomain.trim();
      const fromEmail = process.env.SPARKPOST_FROM_EMAIL || 
                       (sendingDomain === 'sandbox' ? 'testing@sparkpostbox.com' : `noreply@${sendingDomain}`);
      
      console.log('Raw domain from env:', JSON.stringify(rawDomain));
      console.log('Using sending domain:', sendingDomain);
      console.log('From email:', fromEmail);
      
      const transmissionOptions: any = {
        content: {
          from: fromEmail,
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]*>/g, ''),
        },
        recipients: [{ address: options.to }],
      };

      // Use sandbox mode if domain is 'sandbox'
      if (sendingDomain === 'sandbox') {
        transmissionOptions.options = { sandbox: true };
        console.log('Using sandbox mode');
      }

      const response = await this.sparkPost.transmissions.send(transmissionOptions);
      console.log('Email sent successfully:', response);
    } catch (error) {
      console.error('Error sending email:', error);
      console.error('Error details:', error.errors || error.message);
      throw new Error('Failed to send email');
    }
  }

  async sendVerificationEmail(data: EmailVerificationData): Promise<void> {
    const verificationUrl = `${data.baseUrl}/verify-email?token=${data.verificationToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email - JOMA Media</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to JOMA Media</h1>
            <p>Verify your email to get started</p>
          </div>
          <div class="content">
            <h2>Hi ${data.firstName}!</h2>
            <p>Thank you for signing up for JOMA Media. To complete your registration and start using our platform, please verify your email address.</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            
            <p><strong>This link will expire in 24 hours.</strong></p>
            
            <p>If you didn't create an account with us, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2025 JOMA Media. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: data.email,
      subject: 'Verify Your Email - JOMA Media',
      html,
    });
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to JOMA Media</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to JOMA Media!</h1>
            <p>Your account is now active</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName}!</h2>
            <p>Congratulations! Your email has been verified and your JOMA Media account is now active.</p>
            
            <p>You can now:</p>
            <ul>
              <li>Access your dashboard</li>
              <li>Update your profile</li>
              <li>Submit payment requests</li>
              <li>Track your work items</li>
            </ul>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <p>Welcome aboard!</p>
          </div>
          <div class="footer">
            <p>© 2025 JOMA Media. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to JOMA Media - Account Verified!',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, firstName: string, resetToken: string, baseUrl: string): Promise<void> {
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password - JOMA Media</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
            <p>JOMA Media</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName}!</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            
            <p><strong>This link will expire in 1 hour.</strong></p>
            
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>© 2025 JOMA Media. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - JOMA Media',
      html,
    });
  }
}

export const emailService = EmailService.getInstance();

// Utility function to generate verification token
export function generateVerificationToken(): string {
  return nanoid(32);
}

// Utility function to check if verification token is expired
export function isVerificationTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

// Utility function to get verification token expiry (24 hours from now)
export function getVerificationTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
}

// Utility function to generate password reset token
export function generatePasswordResetToken(): string {
  return nanoid(32);
}

// Utility function to check if password reset token is expired
export function isPasswordResetTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

// Utility function to get password reset token expiry (1 hour from now)
export function getPasswordResetTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1);
  return expiry;
}