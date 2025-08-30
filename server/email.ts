import nodemailer from 'nodemailer';

// Email service configuration
export class EmailService {
  private supportTransporter: nodemailer.Transporter;
  private referralTransporter: nodemailer.Transporter;
  private noreplyTransporter: nodemailer.Transporter;

  constructor() {
    // Support email transporter
    this.supportTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // or your SMTP host
      port: 587,
      secure: false,
      auth: {
        user: process.env.SUPPORT_USER || process.env.SUPPORT_EMAIL,
        pass: process.env.SUPPORT_PASS,
      },
    });

    // Referral email transporter
    this.referralTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.REFERRALS_USER || process.env.REFERRALS_FROM,
        pass: process.env.REFERRALS_PASS,
      },
    });

    // No-reply email transporter
    this.noreplyTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.NOREPLY_USER,
        pass: process.env.NOREPLY_PASS,
      },
    });
  }

  // Send referral invitation email
  async sendReferralInvitation(params: {
    toEmail: string;
    referrerName: string;
    referralCode: string;
    referralLink: string;
  }) {
    const { toEmail, referrerName, referralCode, referralLink } = params;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🔧 LA Plumb Prep</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Louisiana Plumbing Code Certification</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">You're Invited to Join LA Plumb Prep!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            <strong>${referrerName}</strong> has invited you to join LA Plumb Prep - Louisiana's premier plumbing certification preparation platform.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">What You'll Get:</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li>Complete Louisiana Plumbing Code preparation course</li>
              <li>Interactive quizzes and practice tests</li>
              <li>Professional plumbing tools and calculators</li>
              <li>AI-powered mentor and code checker</li>
              <li>Study guides and flashcards</li>
              <li>Job board with Louisiana plumbing opportunities</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${referralLink}" 
               style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Get Started with Code: ${referralCode}
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Use referral code <strong>${referralCode}</strong> when signing up to get special benefits and support your referrer!
          </p>
        </div>
        
        <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2025 LA Plumb Prep. All rights reserved.</p>
          <p>Official Louisiana State Prep Course | laplumbprep.com</p>
        </div>
      </div>
    `;

    await this.referralTransporter.sendMail({
      from: `"LA Plumb Prep Referrals" <${process.env.REFERRALS_FROM}>`,
      to: toEmail,
      subject: `${referrerName} invited you to LA Plumb Prep - Louisiana Plumbing Certification`,
      html: htmlContent,
    });
  }

  // Send welcome email to new users
  async sendWelcomeEmail(params: {
    toEmail: string;
    firstName: string;
    loginLink: string;
  }) {
    const { toEmail, firstName, loginLink } = params;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to LA Plumb Prep!</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Welcome, ${firstName}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            You're now part of Louisiana's premier plumbing certification preparation platform. We're excited to help you advance your plumbing career!
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">Your Journey Starts Here:</h3>
            <ol style="color: #555; line-height: 1.8;">
              <li>Complete your profile and choose your subscription</li>
              <li>Start with Section 101 - Administration</li>
              <li>Work through all course materials systematically</li>
              <li>Use our professional tools for real-world practice</li>
              <li>Take practice quizzes to test your knowledge</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginLink}" 
               style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Access Your Dashboard
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            Need help? Contact our support team at support@laplumbprep.com
          </p>
        </div>
        
        <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2025 LA Plumb Prep. All rights reserved.</p>
        </div>
      </div>
    `;

    await this.noreplyTransporter.sendMail({
      from: `"LA Plumb Prep" <${process.env.NOREPLY_USER}>`,
      to: toEmail,
      subject: 'Welcome to LA Plumb Prep - Let\'s Get Started!',
      html: htmlContent,
    });
  }

  // Send support notification
  async sendSupportNotification(params: {
    fromEmail: string;
    fromName: string;
    subject: string;
    message: string;
    userInfo?: any;
  }) {
    const { fromEmail, fromName, subject, message, userInfo } = params;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Support Request</h2>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>From:</strong> ${fromName} (${fromEmail})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          ${userInfo ? `<p><strong>User Info:</strong> ${JSON.stringify(userInfo, null, 2)}</p>` : ''}
        </div>
        
        <div style="background: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h3>Message:</h3>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      </div>
    `;

    await this.supportTransporter.sendMail({
      from: `"LA Plumb Prep Support" <${process.env.SUPPORT_EMAIL}>`,
      to: process.env.SUPPORT_EMAIL,
      replyTo: fromEmail,
      subject: `[Support] ${subject}`,
      html: htmlContent,
    });
  }

  // Send course completion certificate
  async sendCompletionCertificate(params: {
    toEmail: string;
    firstName: string;
    lastName: string;
    courseName: string;
    completionDate: string;
    certificateUrl?: string;
  }) {
    const { toEmail, firstName, lastName, courseName, completionDate, certificateUrl } = params;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🏆 Congratulations!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Course Completion Certificate</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Well Done, ${firstName}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            You have successfully completed <strong>${courseName}</strong> on ${completionDate}.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #667eea; margin: 20px 0; text-align: center;">
            <h3 style="color: #667eea; margin-top: 0;">Certificate of Completion</h3>
            <p style="font-size: 18px; color: #333;"><strong>${firstName} ${lastName}</strong></p>
            <p style="color: #666;">has successfully completed</p>
            <p style="font-size: 20px; color: #667eea; font-weight: bold;">${courseName}</p>
            <p style="color: #666;">on ${completionDate}</p>
          </div>
          
          ${certificateUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${certificateUrl}" 
               style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Download Certificate
            </a>
          </div>
          ` : ''}
          
          <p style="font-size: 14px; color: #666;">
            Keep learning and advancing your plumbing career with LA Plumb Prep!
          </p>
        </div>
        
        <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2025 LA Plumb Prep. All rights reserved.</p>
        </div>
      </div>
    `;

    await this.noreplyTransporter.sendMail({
      from: `"LA Plumb Prep" <${process.env.NOREPLY_USER}>`,
      to: toEmail,
      subject: `🏆 Course Completion Certificate - ${courseName}`,
      html: htmlContent,
    });
  }

  // General purpose email sending method
  async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }) {
    const { to, subject, html, from } = params;
    
    await this.noreplyTransporter.sendMail({
      from: from || `"LA Plumb Prep" <${process.env.NOREPLY_USER}>`,
      to: to,
      subject: subject,
      html: html,
    });
  }
}

// Create singleton instance
export const emailService = new EmailService();