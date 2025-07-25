const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const sesClient = new SESClient({ region: process.env.REGION || 'us-east-1' });

class EmailService {
  constructor() {
    this.fromEmail = 'noreply@wizzcentral.com'; // Update with your verified SES email
  }

  // Send merchant status update email
  async sendMerchantStatusEmail(merchant, action, reason, adminUser) {
    const templates = {
      approve: {
        subject: 'Welcome to WizzCentral - Your Account is Approved!',
        template: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎉 Welcome to WizzCentral!</h1>
            </div>
            <div style="padding: 30px; background: #f8fafc;">
              <h2 style="color: #333;">Congratulations, ${merchant.name}!</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                Your merchant account has been approved and you're now part of the WizzCentral family!
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Reason for approval:</strong></p>
                <p style="font-style: italic; color: #666;">${reason}</p>
              </div>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                You can now log in to your merchant dashboard and start listing your products.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://merchant.wizzcentral.com/login" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Access Merchant Dashboard
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                Best regards,<br>
                The WizzCentral Team
              </p>
            </div>
          </div>
        `
      },
      reject: {
        subject: 'WizzCentral Merchant Application Update',
        template: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #ef4444; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">WizzCentral Application Update</h1>
            </div>
            <div style="padding: 30px; background: #f8fafc;">
              <h2 style="color: #333;">Thank you for your interest, ${merchant.name}</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                Thank you for your interest in joining WizzCentral. After careful review, we're unable to approve your application at this time.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Reason:</strong></p>
                <p style="font-style: italic; color: #666;">${reason}</p>
              </div>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                If you have any questions or would like to reapply in the future, please don't hesitate to contact our support team.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="mailto:support@wizzcentral.com" style="background: #64748b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Contact Support
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                Best regards,<br>
                The WizzCentral Team
              </p>
            </div>
          </div>
        `
      },
      suspend: {
        subject: 'Important: Your WizzCentral Account Status',
        template: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f59e0b; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">⚠️ Account Status Update</h1>
            </div>
            <div style="padding: 30px; background: #f8fafc;">
              <h2 style="color: #333;">Important Notice for ${merchant.name}</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                We need to inform you about a change to your WizzCentral account status. Your account has been temporarily suspended.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p><strong>Reason for suspension:</strong></p>
                <p style="font-style: italic; color: #666;">${reason}</p>
              </div>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                To resolve this issue and reactivate your account, please contact our support team immediately.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="mailto:support@wizzcentral.com" style="background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Contact Support Immediately
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                Best regards,<br>
                The WizzCentral Team
              </p>
            </div>
          </div>
        `
      },
      review: {
        subject: 'WizzCentral Application Under Review',
        template: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #3b82f6; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🔍 Application Under Review</h1>
            </div>
            <div style="padding: 30px; background: #f8fafc;">
              <h2 style="color: #333;">Thank you for your patience, ${merchant.name}</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                Your application is currently under additional review by our team. We appreciate your patience during this process.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Review details:</strong></p>
                <p style="font-style: italic; color: #666;">${reason}</p>
              </div>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                We will notify you as soon as the review is complete. This typically takes 2-3 business days.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://wizzcentral.com/application-status" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Check Application Status
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                Best regards,<br>
                The WizzCentral Team
              </p>
            </div>
          </div>
        `
      },
      reactivate: {
        subject: 'Welcome Back to WizzCentral!',
        template: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎉 Welcome Back!</h1>
            </div>
            <div style="padding: 30px; background: #f8fafc;">
              <h2 style="color: #333;">Great news, ${merchant.name}!</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                Your WizzCentral merchant account has been reactivated and you can now resume your business operations on our platform.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Reactivation details:</strong></p>
                <p style="font-style: italic; color: #666;">${reason}</p>
              </div>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                You can now access your merchant dashboard and start receiving orders again.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://merchant.wizzcentral.com/login" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Access Your Dashboard
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                Best regards,<br>
                The WizzCentral Team
              </p>
            </div>
          </div>
        `
      }
    };

    const template = templates[action];
    if (!template) {
      throw new Error(`Unknown email template: ${action}`);
    }

    const params = {
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [merchant.email]
      },
      Message: {
        Subject: {
          Data: template.subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: template.template,
            Charset: 'UTF-8'
          }
        }
      }
    };

    try {
      const command = new SendEmailCommand(params);
      const result = await sesClient.send(command);
      console.log('Email sent successfully:', result.MessageId);
      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email notification');
    }
  }

  // Send welcome email for new users
  async sendWelcomeEmail(user) {
    const template = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to WizzCentral!</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #333;">Hello ${user.name}!</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Welcome to WizzCentral, the ultimate food delivery management platform. We're excited to have you on board!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://wizzcentral.com/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Get Started
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            The WizzCentral Team
          </p>
        </div>
      </div>
    `;

    const params = {
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [user.email]
      },
      Message: {
        Subject: {
          Data: 'Welcome to WizzCentral!',
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: template,
            Charset: 'UTF-8'
          }
        }
      }
    };

    try {
      const command = new SendEmailCommand(params);
      const result = await sesClient.send(command);
      console.log('Welcome email sent successfully:', result.MessageId);
      return result;
    } catch (error) {
      console.error('Welcome email sending failed:', error);
      // Don't throw error for welcome emails, just log it
      return null;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `https://wizzcentral.com/reset-password?token=${resetToken}`;
    
    const template = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ef4444; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Reset Request</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            You requested to reset your password for your WizzCentral account. Click the button below to set a new password.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">
            This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
          </p>
          <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            The WizzCentral Team
          </p>
        </div>
      </div>
    `;

    const params = {
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [user.email]
      },
      Message: {
        Subject: {
          Data: 'Password Reset Request - WizzCentral',
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: template,
            Charset: 'UTF-8'
          }
        }
      }
    };

    try {
      const command = new SendEmailCommand(params);
      const result = await sesClient.send(command);
      console.log('Password reset email sent successfully:', result.MessageId);
      return result;
    } catch (error) {
      console.error('Password reset email sending failed:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}

module.exports = new EmailService();
