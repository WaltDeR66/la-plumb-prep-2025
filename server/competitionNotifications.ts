import { db } from "./db";
import { users, monthlyCompetitions, competitionNotifications, emailQueue } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { format, subDays, addHours } from "date-fns";

export class CompetitionNotificationService {
  
  // Schedule all notifications for a competition
  async scheduleCompetitionNotifications(competitionId: string) {
    const competition = await this.getCompetition(competitionId);
    if (!competition) return;

    const activeUsers = await this.getActiveUsers();
    
    for (const user of activeUsers) {
      // Schedule advance notice (3 days before)
      await this.scheduleNotification(
        competitionId,
        user.id,
        "advance_notice",
        "Monthly Competition Reminder",
        `Get ready! The ${competition.title} starts ${format(new Date(competition.startDate), "MMMM d")}. Test your Louisiana plumbing code knowledge and compete for subscription rewards!`,
        subDays(new Date(competition.startDate), 3)
      );

      // Schedule day-of notification (competition start time)
      await this.scheduleNotification(
        competitionId,
        user.id,
        "day_of",
        "🏆 Competition is LIVE NOW!",
        `The ${competition.title} is now active! You have ${competition.timeLimit} minutes to complete ${competition.questionCount} questions. Winners get free subscription time!`,
        new Date(competition.startDate)
      );
    }
  }

  // Schedule a single notification
  private async scheduleNotification(
    competitionId: string,
    userId: string,
    type: string,
    title: string,
    message: string,
    scheduledTime: Date
  ) {
    // Create dashboard/in-app notification
    await db.insert(competitionNotifications).values({
      competitionId,
      userId,
      notificationType: type,
      channel: "dashboard",
      title,
      message,
    });

    // Schedule email notification
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user[0]?.email) {
      await this.scheduleEmail(
        user[0].email,
        user[0].firstName || "Student",
        title,
        message,
        competitionId,
        scheduledTime
      );
    }
  }

  // Schedule email notification
  private async scheduleEmail(
    email: string,
    firstName: string,
    subject: string,
    message: string,
    competitionId: string,
    scheduledTime: Date
  ) {
    const emailTemplate = this.generateEmailTemplate(firstName, subject, message, competitionId);
    
    await db.insert(emailQueue).values({
      recipientEmail: email,
      senderEmail: process.env.NOREPLY_USER || "noreply@latrainer.com",
      subject,
      htmlContent: emailTemplate,
      textContent: message,
      scheduledFor: scheduledTime,
      status: "pending",
      retryCount: 0,
    });
  }

  // Generate HTML email template
  private generateEmailTemplate(firstName: string, subject: string, message: string, competitionId: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .btn:hover { background: #059669; }
        .highlight { background: #FEF3C7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #F59E0B; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏆 ${subject}</h1>
          <p>LA Plumb Prep - Official State Prep Course</p>
        </div>
        
        <div class="content">
          <h2>Hello ${firstName}!</h2>
          <p>${message}</p>
          
          <div class="highlight">
            <strong>Competition Details:</strong><br>
            📅 When: Last day of the month<br>
            ⏱️ Duration: 120 minutes<br>
            📝 Questions: 100 questions<br>
            🏅 Rewards: 1st place = Free month, 2nd place = Half month free
          </div>
          
          <a href="${process.env.VITE_APP_URL || 'https://latrainer.com'}/competitions" class="btn">
            View Competition Details
          </a>
          
          <p>Don't miss out on this opportunity to test your Louisiana plumbing code knowledge and compete for valuable prizes!</p>
          
          <p>Good luck!<br>
          The LA Plumb Prep Team</p>
        </div>
        
        <div class="footer">
          <p><small>
            You received this email because you're enrolled in LA Plumb Prep courses.<br>
            <a href="${process.env.VITE_APP_URL || 'https://latrainer.com'}/unsubscribe">Unsubscribe from competition notifications</a>
          </small></p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Send results notifications after competition ends
  async sendResultsNotifications(competitionId: string) {
    const competition = await this.getCompetition(competitionId);
    if (!competition) return;

    // Get all participants and their results
    const participants = await db.execute(sql`
      SELECT 
        ca.userId,
        ca.score,
        ca.rank,
        ca.pointsEarned,
        u.email,
        u.firstName,
        u.lastName
      FROM competition_attempts ca
      JOIN users u ON ca.userId = u.id
      WHERE ca.competitionId = ${competitionId}
      ORDER BY ca.rank ASC
    `);

    for (const participant of participants.rows) {
      const isWinner = participant.rank <= 2;
      const title = isWinner 
        ? `🎉 Congratulations! You placed #${participant.rank} in ${competition.title}!`
        : `📊 Your ${competition.title} Results`;
      
      const message = isWinner
        ? `Amazing work! You ranked #${participant.rank} and earned ${participant.pointsEarned} points. Your subscription reward will be applied automatically.`
        : `You completed the competition with a score of ${participant.score}% and earned ${participant.pointsEarned} points. Keep practicing for next month's competition!`;

      // Send in-app notification
      await db.insert(competitionNotifications).values({
        competitionId,
        userId: participant.userId as string,
        notificationType: "results",
        channel: "in_app",
        title,
        message,
        sentAt: new Date(),
      });

      // Send email notification
      if (participant.email) {
        const emailTemplate = this.generateResultsEmail(
          participant.firstName as string || "Student",
          title,
          message,
          participant.score as number,
          participant.rank as number,
          participant.pointsEarned as number
        );

        await db.insert(emailQueue).values({
          recipientEmail: participant.email as string,
          senderEmail: process.env.NOREPLY_USER || "noreply@latrainer.com",
          subject: title,
          htmlContent: emailTemplate,
          textContent: message,
          scheduledFor: new Date(),
          status: "pending",
          retryCount: 0,
        });
      }
    }
  }

  // Generate results email template
  private generateResultsEmail(
    firstName: string,
    subject: string,
    message: string,
    score: number,
    rank: number,
    points: number
  ): string {
    const isWinner = rank <= 2;
    const rankColor = rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : "#CD7F32";
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
        .results-card { background: #f8fafc; border: 2px solid ${rankColor}; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .score { font-size: 48px; font-weight: bold; color: ${rankColor}; }
        .rank-badge { background: ${rankColor}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
        .btn { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${isWinner ? "🏆" : "📊"} ${subject}</h1>
          <p>LA Plumb Prep Competition Results</p>
        </div>
        
        <div class="content">
          <h2>Hello ${firstName}!</h2>
          <p>${message}</p>
          
          <div class="results-card">
            <div class="score">${score.toFixed(1)}%</div>
            <div style="margin: 10px 0;">
              <span class="rank-badge">Rank #${rank}</span>
            </div>
            <p><strong>${points} Points Earned</strong></p>
          </div>
          
          ${isWinner ? `
          <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0;">
            <h3>🎉 Congratulations on your ${rank === 1 ? "1st place" : "2nd place"} finish!</h3>
            <p>Your subscription reward will be automatically applied to your account.</p>
          </div>
          ` : `
          <div style="background: #DBEAFE; padding: 20px; border-radius: 8px; border-left: 4px solid #3B82F6; margin: 20px 0;">
            <h3>Keep practicing for next month's competition!</h3>
            <p>Every month is a new opportunity to compete and win valuable prizes.</p>
          </div>
          `}
          
          <a href="${process.env.VITE_APP_URL || 'https://latrainer.com'}/leaderboard" class="btn">
            View Full Leaderboard
          </a>
          
          <p>Thank you for participating in our monthly competition!</p>
          
          <p>Best regards,<br>
          The LA Plumb Prep Team</p>
        </div>
        
        <div class="footer">
          <p><small>
            <a href="${process.env.VITE_APP_URL || 'https://latrainer.com'}/competitions">View Next Competition</a> |
            <a href="${process.env.VITE_APP_URL || 'https://latrainer.com'}/unsubscribe">Unsubscribe</a>
          </small></p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Get unread notifications for a user
  async getUserNotifications(userId: string) {
    return await db.select()
      .from(competitionNotifications)
      .where(and(
        eq(competitionNotifications.userId, userId),
        eq(competitionNotifications.isRead, false)
      ))
      .orderBy(competitionNotifications.createdAt);
  }

  // Mark notification as read
  async markNotificationRead(notificationId: string) {
    await db.update(competitionNotifications)
      .set({ 
        isRead: true, 
        readAt: new Date() 
      })
      .where(eq(competitionNotifications.id, notificationId));
  }

  // Helper methods
  private async getCompetition(competitionId: string) {
    const [competition] = await db.select()
      .from(monthlyCompetitions)
      .where(eq(monthlyCompetitions.id, competitionId))
      .limit(1);
    return competition;
  }

  private async getActiveUsers() {
    return await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(eq(users.isActive, true));
  }
}

export const competitionNotificationService = new CompetitionNotificationService();