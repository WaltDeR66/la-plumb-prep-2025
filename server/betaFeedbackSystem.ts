import { db } from "./db";
import { 
  users, 
  betaFeedbackQuestions, 
  betaFeedbackCampaigns, 
  betaFeedbackResponses,
  emailQueue 
} from "@shared/schema";
import { eq, and, isNull, lt } from "drizzle-orm";
import { randomUUID } from "crypto";
import { emailAutomation } from './email-automation';

export class BetaFeedbackService {
  // Initialize default feedback questions
  static async initializeDefaultQuestions() {
    const existingQuestions = await db.select().from(betaFeedbackQuestions).where(eq(betaFeedbackQuestions.isActive, true));
    
    if (existingQuestions.length === 0) {
      const defaultQuestions = [
        {
          questionText: "How would you rate your overall experience with LA Plumb Prep this month?",
          questionType: "rating",
          isRequired: true,
          displayOrder: 1,
        },
        {
          questionText: "Which courses or features did you use most frequently?",
          questionType: "multiple_choice",
          options: JSON.stringify([
            "Louisiana Journeyman Prep",
            "Calculator Tools", 
            "AI Mentor",
            "Photo Code Checker",
            "Practice Tests",
            "Job Board"
          ]),
          isRequired: true,
          displayOrder: 2,
        },
        {
          questionText: "What features or improvements would you like to see added?",
          questionType: "textarea",
          isRequired: true,
          displayOrder: 3,
        },
        {
          questionText: "Did you encounter any technical issues or bugs?",
          questionType: "boolean",
          isRequired: true,
          displayOrder: 4,
        },
        {
          questionText: "If yes, please describe the technical issues you experienced:",
          questionType: "textarea",
          isRequired: false,
          displayOrder: 5,
        },
        {
          questionText: "How helpful was our customer support (if you contacted us)?",
          questionType: "multiple_choice",
          options: JSON.stringify([
            "Very Helpful",
            "Helpful", 
            "Somewhat Helpful",
            "Not Helpful",
            "Didn't Contact Support"
          ]),
          isRequired: false,
          displayOrder: 6,
        },
        {
          questionText: "Would you recommend LA Plumb Prep to other plumbing professionals?",
          questionType: "boolean",
          isRequired: true,
          displayOrder: 7,
        },
        {
          questionText: "Any additional comments or suggestions?",
          questionType: "textarea",
          isRequired: false,
          displayOrder: 8,
        }
      ];

      for (const question of defaultQuestions) {
        await db.insert(betaFeedbackQuestions).values(question);
      }

      console.log("Default feedback questions initialized");
    }
  }

  // Create monthly feedback campaign
  static async createMonthlyCampaign(monthYear: string) {
    const existingCampaign = await db.select()
      .from(betaFeedbackCampaigns)
      .where(eq(betaFeedbackCampaigns.monthYear, monthYear))
      .limit(1);

    if (existingCampaign.length > 0) {
      console.log(`Campaign for ${monthYear} already exists`);
      return existingCampaign[0];
    }

    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 1);
    dueDate.setDate(0); // Last day of current month

    const campaign = await db.insert(betaFeedbackCampaigns).values({
      title: `Monthly Feedback - ${this.formatMonthYear(monthYear)}`,
      description: "Help us improve LA Plumb Prep with your monthly feedback",
      monthYear,
      dueDate,
    }).returning();

    return campaign[0];
  }

  // Send feedback emails to all beta testers
  static async sendMonthlyFeedbackEmails() {
    const currentMonthYear = this.getCurrentMonthYear();
    
    // Create or get current month's campaign
    const campaign = await this.createMonthlyCampaign(currentMonthYear);

    // Get all beta testers who haven't responded yet
    const betaTesters = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName
    })
    .from(users)
    .where(
      and(
        eq(users.isBetaTester, true),
        eq(users.isActive, true)
      )
    );

    // Check who hasn't responded yet
    const existingResponses = await db.select({ userId: betaFeedbackResponses.userId })
      .from(betaFeedbackResponses)
      .where(eq(betaFeedbackResponses.campaignId, campaign.id));

    const respondedUserIds = new Set(existingResponses.map(r => r.userId));
    const unrespondedTesters = betaTesters.filter(user => !respondedUserIds.has(user.id));

    console.log(`Sending feedback emails to ${unrespondedTesters.length} beta testers for ${currentMonthYear}`);

    // Send emails to unresponded beta testers
    for (const tester of unrespondedTesters) {
      const submissionToken = randomUUID();
      
      // Create response record with token
      await db.insert(betaFeedbackResponses).values({
        campaignId: campaign.id,
        userId: tester.id,
        responses: {},
        submissionToken,
        completedAt: null, // Will be set when submitted
      });

      // Queue email
      const feedbackUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/beta-feedback?token=${submissionToken}`;
      
      await db.insert(emailQueue).values({
        recipientEmail: tester.email,
        subject: `🔧 Monthly Beta Feedback Required - Keep Your Discount!`,
        content: this.generateFeedbackEmail(tester.firstName || 'Beta Tester', feedbackUrl, campaign.dueDate.toLocaleDateString()),
        scheduledFor: new Date(),
      });
    }

    // Mark campaign as email sent
    await db.update(betaFeedbackCampaigns)
      .set({ emailSentAt: new Date() })
      .where(eq(betaFeedbackCampaigns.id, campaign.id));

    return {
      campaignId: campaign.id,
      emailsSent: unrespondedTesters.length,
      totalBetaTesters: betaTesters.length
    };
  }

  // Get feedback campaign and questions by token
  static async getFeedbackByToken(token: string) {
    const response = await db.select({
      campaignId: betaFeedbackResponses.campaignId,
      userId: betaFeedbackResponses.userId,
      completed: betaFeedbackResponses.completedAt,
    })
    .from(betaFeedbackResponses)
    .where(eq(betaFeedbackResponses.submissionToken, token))
    .limit(1);

    if (response.length === 0) {
      throw new Error("Invalid feedback token");
    }

    const responseRecord = response[0];
    
    if (responseRecord.completed) {
      throw new Error("Feedback already submitted");
    }

    // Get campaign details
    const campaign = await db.select()
      .from(betaFeedbackCampaigns)
      .where(eq(betaFeedbackCampaigns.id, responseRecord.campaignId))
      .limit(1);

    if (campaign.length === 0) {
      throw new Error("Campaign not found");
    }

    // Get questions
    const questions = await db.select()
      .from(betaFeedbackQuestions)
      .where(eq(betaFeedbackQuestions.isActive, true))
      .orderBy(betaFeedbackQuestions.displayOrder);

    return {
      campaign: campaign[0],
      questions: questions.map(q => ({
        ...q,
        options: q.options ? JSON.parse(q.options as string) : undefined
      }))
    };
  }

  // Submit feedback response
  static async submitFeedback(token: string, responses: Record<string, any>) {
    const responseRecord = await db.select()
      .from(betaFeedbackResponses)
      .where(eq(betaFeedbackResponses.submissionToken, token))
      .limit(1);

    if (responseRecord.length === 0) {
      throw new Error("Invalid feedback token");
    }

    if (responseRecord[0].completedAt) {
      throw new Error("Feedback already submitted");
    }

    // Update response with answers and completion time
    await db.update(betaFeedbackResponses)
      .set({ 
        responses: responses,
        completedAt: new Date()
      })
      .where(eq(betaFeedbackResponses.submissionToken, token));

    console.log(`Feedback submitted for token: ${token}`);
    return true;
  }

  // Get feedback analytics for admin
  static async getFeedbackAnalytics(monthYear?: string) {
    const targetMonth = monthYear || this.getCurrentMonthYear();
    
    const campaign = await db.select()
      .from(betaFeedbackCampaigns)
      .where(eq(betaFeedbackCampaigns.monthYear, targetMonth))
      .limit(1);

    if (campaign.length === 0) {
      return { campaign: null, stats: null, responses: [] };
    }

    // Get response stats
    const allResponses = await db.select({
      userId: betaFeedbackResponses.userId,
      responses: betaFeedbackResponses.responses,
      completedAt: betaFeedbackResponses.completedAt,
      userEmail: users.email,
      userName: users.firstName
    })
    .from(betaFeedbackResponses)
    .leftJoin(users, eq(betaFeedbackResponses.userId, users.id))
    .where(eq(betaFeedbackResponses.campaignId, campaign[0].id));

    const completedResponses = allResponses.filter(r => r.completedAt);
    const totalBetaTesters = await db.select({ count: users.id })
      .from(users)
      .where(and(eq(users.isBetaTester, true), eq(users.isActive, true)));

    return {
      campaign: campaign[0],
      stats: {
        totalSent: allResponses.length,
        completed: completedResponses.length,
        completionRate: allResponses.length > 0 ? (completedResponses.length / allResponses.length) * 100 : 0,
        totalBetaTesters: totalBetaTesters.length
      },
      responses: completedResponses
    };
  }

  // Helper methods
  private static getCurrentMonthYear(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private static formatMonthYear(monthYear: string): string {
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  private static generateFeedbackEmail(firstName: string, feedbackUrl: string, dueDate: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Monthly Beta Feedback - LA Plumb Prep</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a365d; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .warning-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .cta-button { display: inline-block; background: #3182ce; color: white; text-decoration: none; padding: 15px 30px; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔧 LA Plumb Prep</h1>
            <p>Beta Feedback Program</p>
          </div>
          
          <div class="content">
            <h2>Hi ${firstName}!</h2>
            
            <p>It's that time of the month again! As one of our valued beta testers, we need your feedback to continue improving LA Plumb Prep.</p>
            
            <div class="warning-box">
              <strong>⚠️ Action Required:</strong> Complete this feedback survey by <strong>${dueDate}</strong> to maintain your beta status and locked-in pricing for all courses.
            </div>
            
            <h3>Why Your Feedback Matters:</h3>
            <ul>
              <li>Help shape new features and improvements</li>
              <li>Report bugs and technical issues</li>
              <li>Guide our development roadmap</li>
              <li>Improve the experience for all users</li>
            </ul>
            
            <h3>Beta Tester Benefits (Reminder):</h3>
            <ul>
              <li>✅ Keep your discounted pricing forever</li>
              <li>✅ Early access to new features</li>
              <li>✅ Direct influence on product development</li>
              <li>✅ Priority customer support</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${feedbackUrl}" class="cta-button">Complete Monthly Feedback</a>
            </div>
            
            <p><strong>Important:</strong> This survey should only take 3-5 minutes to complete. Your continued participation as a beta tester ensures you maintain your special pricing on all current and future courses.</p>
            
            <p>Thank you for being part of our beta program and helping us build the best plumbing education platform!</p>
            
            <p>Best regards,<br>The LA Plumb Prep Team</p>
          </div>
          
          <div class="footer">
            <p>LA Plumb Prep - Official Louisiana Plumbing Certification Preparation</p>
            <p>This email was sent to beta program participants only.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Monitor and analyze feedback for concerning patterns
  static async analyzeFeedbackPatterns() {
    try {
      // Get recent feedback responses
      const recentResponses = await db.select({
        id: betaFeedbackResponses.id,
        userId: betaFeedbackResponses.userId,
        campaignId: betaFeedbackResponses.campaignId,
        responses: betaFeedbackResponses.responses,
        completedAt: betaFeedbackResponses.completedAt,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        }
      })
      .from(betaFeedbackResponses)
      .leftJoin(users, eq(betaFeedbackResponses.userId, users.id))
      .where(isNull(betaFeedbackResponses.deletedAt));

      const alerts: string[] = [];
      const criticalIssues: string[] = [];

      // Analyze satisfaction scores (Question 1 - Overall experience rating)
      const satisfactionScores = recentResponses
        .map(r => {
          if (typeof r.responses === 'object' && r.responses) {
            const responses = r.responses as any;
            return responses['1'] ? parseInt(responses['1']) : null;
          }
          return null;
        })
        .filter(score => score !== null);

      if (satisfactionScores.length > 0) {
        const avgSatisfaction = satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length;
        const lowScores = satisfactionScores.filter(score => score <= 2).length;
        const lowScorePercentage = (lowScores / satisfactionScores.length) * 100;

        // Alert thresholds
        if (avgSatisfaction < 3.0) {
          criticalIssues.push(`🚨 CRITICAL: Average satisfaction score is ${avgSatisfaction.toFixed(1)}/5 - Immediate attention required`);
        } else if (avgSatisfaction < 3.5) {
          alerts.push(`⚠️ Warning: Average satisfaction score declining to ${avgSatisfaction.toFixed(1)}/5`);
        }

        if (lowScorePercentage > 25) {
          criticalIssues.push(`🚨 CRITICAL: ${lowScorePercentage.toFixed(1)}% of users rated experience 2/5 or lower`);
        } else if (lowScorePercentage > 15) {
          alerts.push(`⚠️ Warning: ${lowScorePercentage.toFixed(1)}% of users giving low satisfaction scores`);
        }
      }

      // Check completion rates
      const campaigns = await db.select()
        .from(betaFeedbackCampaigns)
        .where(isNull(betaFeedbackCampaigns.deletedAt));

      const latestCampaign = campaigns[campaigns.length - 1];
      if (latestCampaign) {
        const campaignResponses = recentResponses.filter(r => r.campaignId === latestCampaign.id);
        const totalBetaTesters = await db.select().from(users).where(eq(users.isBetaTester, true));
        const completionRate = (campaignResponses.length / totalBetaTesters.length) * 100;

        if (completionRate < 30) {
          criticalIssues.push(`🚨 CRITICAL: Only ${completionRate.toFixed(1)}% feedback completion rate - System may have issues`);
        } else if (completionRate < 50) {
          alerts.push(`⚠️ Warning: Low feedback completion rate at ${completionRate.toFixed(1)}%`);
        }
      }

      // Analyze common improvement requests for bug reports
      const improvementRequests = recentResponses
        .map(r => {
          if (typeof r.responses === 'object' && r.responses) {
            const responses = r.responses as any;
            return responses['3'] || ''; // Question 3 - improvement requests
          }
          return '';
        })
        .filter(text => text.length > 10);

      const problemKeywords = ['bug', 'error', 'broken', 'not working', 'slow', 'crash', 'issue', 'problem'];
      const bugReports = improvementRequests.filter(text => 
        problemKeywords.some(keyword => text.toLowerCase().includes(keyword))
      );

      if (bugReports.length > improvementRequests.length * 0.3) {
        criticalIssues.push(`🚨 CRITICAL: ${bugReports.length} users reporting bugs or technical issues`);
      } else if (bugReports.length > 2) {
        alerts.push(`⚠️ Warning: ${bugReports.length} users mentioning technical problems`);
      }

      return {
        alerts,
        criticalIssues,
        totalResponses: recentResponses.length,
        avgSatisfaction: satisfactionScores.length > 0 ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length : 0,
        bugReports: bugReports.length,
        satisfactionScores
      };
    } catch (error) {
      console.error('Error analyzing feedback patterns:', error);
      return { alerts: [], criticalIssues: ['🚨 Error analyzing feedback patterns'], totalResponses: 0, avgSatisfaction: 0, bugReports: 0, satisfactionScores: [] };
    }
  }

  // Send alert emails to admin
  static async sendAdminAlerts(alerts: string[], criticalIssues: string[]) {
    if (alerts.length === 0 && criticalIssues.length === 0) return;

    const adminEmail = process.env.SUPPORT_EMAIL || 'admin@laplumbprep.com';
    const subject = criticalIssues.length > 0 
      ? '🚨 CRITICAL: Beta Feedback Alerts Requiring Immediate Attention'
      : '⚠️ Beta Feedback Monitoring Alerts';

    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 30px;">Beta Feedback System Alert</h2>
        
        ${criticalIssues.length > 0 ? `
          <div style="background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #dc2626; margin-top: 0;">🚨 Critical Issues Requiring Immediate Action</h3>
            <ul style="margin: 0;">
              ${criticalIssues.map(issue => `<li style="color: #7f1d1d; margin-bottom: 8px;">${issue}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${alerts.length > 0 ? `
          <div style="background: #fef3c7; border: 2px solid #d97706; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #d97706; margin-top: 0;">⚠️ Warning Alerts</h3>
            <ul style="margin: 0;">
              ${alerts.map(alert => `<li style="color: #92400e; margin-bottom: 8px;">${alert}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin-top: 20px;">
          <h4 style="margin-top: 0; color: #374151;">Recommended Actions:</h4>
          <ul style="color: #6b7280;">
            <li>Review detailed feedback responses in the admin dashboard</li>
            <li>Prioritize fixes for critical issues affecting user satisfaction</li>
            <li>Consider reaching out directly to users with low satisfaction scores</li>
            <li>Monitor completion rates for technical issues</li>
          </ul>
        </div>
      </div>
    `;

    // Queue admin alert email
    await db.insert(emailQueue).values({
      recipientEmail: adminEmail,
      subject,
      content,
      scheduledFor: new Date(),
    });
  }

  // Run automated monitoring and send alerts if needed
  static async runAutomatedMonitoring() {
    try {
      const analysis = await this.analyzeFeedbackPatterns();
      
      if (analysis.alerts.length > 0 || analysis.criticalIssues.length > 0) {
        await this.sendAdminAlerts(analysis.alerts, analysis.criticalIssues);
        console.log(`Beta feedback monitoring: ${analysis.criticalIssues.length} critical issues, ${analysis.alerts.length} warnings`);
      }
      
      return analysis;
    } catch (error) {
      console.error('Error running feedback monitoring:', error);
      return null;
    }
  }
}

// Initialize the feedback system
export const initializeBetaFeedbackSystem = async () => {
  try {
    await BetaFeedbackService.initializeDefaultQuestions();
    console.log("Beta feedback system initialized");
  } catch (error) {
    console.error("Error initializing beta feedback system:", error);
  }
};