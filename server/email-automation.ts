import { db } from "./db";
import { emailCampaigns, emailQueue, emailUnsubscribes } from "@shared/schema";
import { emailService } from "./email";
import { eq, and, lte } from "drizzle-orm";

// Email templates for automated campaigns
export const EMAIL_TEMPLATES = {
  // Employer onboarding sequence
  employer_onboarding: [
    {
      sequenceOrder: 1,
      delayDays: 0,
      subject: "Welcome to LA Plumb Prep's Employer Network",
      content: `Hi {{name}},

Thank you for joining Louisiana Plumbing Prep's employer network! You're now connected to Louisiana's most qualified plumbing professionals.

**Why post jobs with us:**
- Direct access to certified Louisiana plumbers
- Students actively seeking employment opportunities
- Pre-screened candidates with current code knowledge
- Reduced hiring time and training costs

**Your next step:** Post your first job listing for FREE this month.

Ready to find your next great hire?
[Post a Job Now - {{website_url}}/employer/post-job]

Best regards,
LA Plumb Prep Team`
    },
    {
      sequenceOrder: 2,
      delayDays: 3,
      subject: "How ABC Plumbing Found 3 Qualified Techs in 2 Weeks",
      content: `Hi {{name}},

See how local employers are finding great hires through our platform:

**ABC Plumbing - Baton Rouge**
"We hired 3 certified plumbers within 2 weeks. The candidates were already trained on Louisiana code - saved us months of training time!"

**Gulf Coast Mechanical - New Orleans** 
"Best investment we made. These graduates hit the ground running with real Louisiana code knowledge."

**Your turn:** Post a job this week and connect with ready-to-work plumbers.

[Post Your Job Opening - {{website_url}}/employer/post-job]

Questions? Reply to this email.

Best,
LA Plumb Prep Team`
    },
    {
      sequenceOrder: 3,
      delayDays: 7,
      subject: "Last Chance: Free Premium Job Posting (Expires Tomorrow)",
      content: `Hi {{name}},

This is your final reminder - your FREE premium job posting expires tomorrow.

**Premium features include:**
- Featured placement (3x more views)
- Direct candidate contact information
- Priority in student job alerts
- 30-day posting duration

**Don't miss out** - our students are actively looking for work NOW.

[Claim Your Free Premium Posting - {{website_url}}/employer/post-job]

Questions? Email us at support@laplumbprep.com

Talk soon,
LA Plumb Prep Team`
    }
  ],

  // Student enrollment sequence
  student_enrollment: [
    {
      sequenceOrder: 1,
      delayDays: 0,
      subject: "Your Louisiana Plumbing Career Starts Here",
      content: `Hi {{name}},

Thanks for your interest in Louisiana Plumbing Prep! You're one step closer to advancing your plumbing career.

**What makes us different:**
- Louisiana-specific code training
- Real-world scenarios and examples
- Job placement assistance included
- Professional AI tools for licensed plumbers

**Limited Time:** First 100 students get 25% extra discount + 50% off first month.

Ready to get certified?
[Start Your Journey Today - {{website_url}}/courses]

Questions? We're here to help.

Best,
LA Plumb Prep Team`
    },
    {
      sequenceOrder: 2,
      delayDays: 3,
      subject: "From Student to $75K/Year in 6 Months",
      content: `Hi {{name}},

Meet Marcus from Shreveport:

"Before LA Plumb Prep, I was stuck doing basic repairs. After completing the Journeyman course, I passed my state exam on the first try and got hired at $75K/year. The Louisiana-specific training made all the difference."

**Marcus's results:**
- Passed state exam first try
- 40% salary increase
- Promoted to lead plumber in 3 months

**Your success story starts today.**

[Enroll in Journeyman Prep - $39.99 - {{website_url}}/courses]

Ready to level up your career?

Best,
LA Plumb Prep Team`
    },
    {
      sequenceOrder: 3,
      delayDays: 6,
      subject: "387 Students Enrolled This Month (Special Ends Soon)",
      content: `Hi {{name}},

**Hot Update:** 387 Louisiana plumbers enrolled this month!

Here's what they're saying:
⭐⭐⭐⭐⭐ "Best investment I've made in my career" - James K.
⭐⭐⭐⭐⭐ "Passed the exam on first try!" - Sarah M.  
⭐⭐⭐⭐⭐ "Got hired before I even finished the course" - Mike R.

**Special pricing ends in 48 hours:**
- 25% extra discount for early birds
- 50% off first month
- FREE job board access
- Professional AI tools included

[Secure Your Spot Now - $39.99 - {{website_url}}/courses]

Don't let another month pass without advancing your career.

Best,
LA Plumb Prep Team`
    },
    {
      sequenceOrder: 4,
      delayDays: 10,
      subject: "Last Chance: Special Pricing Expires Tonight",
      content: `Hi {{name}},

This is it - your special pricing expires at midnight tonight.

**What you're missing:**
❌ Louisiana-specific code training
❌ Professional AI mentoring tools  
❌ Exclusive job board access
❌ Certification preparation
❌ Career advancement opportunities

**What you could gain:**
✅ Higher paying positions
✅ State certification confidence
✅ Professional tools for life
✅ Direct employer connections

**Final call:** [Enroll Now - Last 6 Hours - {{website_url}}/courses]

After tonight, prices return to full rate.

Your future self will thank you.

Best,
LA Plumb Prep Team`
    }
  ],

  // Bulk enrollment follow-up sequence
  bulk_enrollment: [
    {
      sequenceOrder: 1,
      delayDays: 0,
      subject: "Transform Your Team with Louisiana's Premier Plumbing Certification",
      content: `Hi {{name}},

Thank you for your interest in bulk enrollment at Louisiana Plumbing Prep! You're about to give your team the competitive edge they need.

**Why Choose LA Plumb Prep for Your Team:**

🎯 **Louisiana Code Expertise**
- State-specific regulations and requirements
- Real Louisiana plumbing scenarios and examples
- Current 2024 Louisiana code updates

💰 **Massive Bulk Savings**
- ALL employer enrollments: 25% discount ($37/student vs $49)
- Any number of students qualifies for the discount
- Simple, fair pricing for all employers

🚀 **Complete Professional Toolkit**
- AI Mentor for instant code questions
- Photo Code Checker for job site compliance
- Pipe Sizing Calculator and professional tools
- Plan Review and analysis capabilities

📚 **Comprehensive Training**
- 5 certification tracks available
- Interactive lessons with real-world scenarios
- Practice tests and progress tracking
- Job placement assistance

👨‍💼 **Perfect for Your Business**
- Reduce training time and costs
- Ensure code compliance on all jobs
- Boost your team's credentials and value
- Attract better clients with certified staff

**Next Steps:**
1. Submit your bulk enrollment request
2. We'll create custom pricing for your team size
3. Students receive individual access within 24 hours
4. Track progress through our employer dashboard

[Get Your Custom Quote - {{website_url}}/bulk-enrollment]

Questions? Contact our bulk enrollment specialists:
📧 bulk@laplumbprep.com
📞 (555) 123-4567

Best regards,
LA Plumb Prep Team`
    },
    {
      sequenceOrder: 2,
      delayDays: 3,
      subject: "How Regional Plumbing Saved $15,000 on Training Costs",
      content: `Hi {{name}},

See how smart contractors are maximizing their training budgets:

**Regional Plumbing Services - Lafayette**
"We enrolled 25 technicians through LA Plumb Prep's bulk program. Not only did we save $1,875 on enrollment costs, but our team became Louisiana code experts overnight. We're now winning bigger contracts because clients trust our certified expertise."

**Results achieved:**
✅ 25 technicians certified in 60 days
✅ $3,063 saved on training costs (25% bulk discount)
✅ 40% increase in high-value commercial contracts
✅ Zero code violations in the past 6 months

**Gulf Coast Construction - New Orleans**
"The AI tools alone are worth the investment. Our crews use the Photo Code Checker on every job. We've caught compliance issues before inspectors even arrive. It's like having a code expert on every job site."

**Your team deserves the same success.**

**Special Limited Offer for This Week:**
- Additional 5% discount on top of bulk rates
- Free employer dashboard access
- Priority student onboarding (24-hour activation)

[Claim Your Additional Discount - {{website_url}}/bulk-enrollment]

Ready to level up your entire team?

Best,
LA Plumb Prep Team
P.S. This additional discount expires in 4 days - don't let your team miss out.`
    },
    {
      sequenceOrder: 3,
      delayDays: 7,
      subject: "Complete Professional Toolkit Awaits Your Team",
      content: `Hi {{name}},

Your competition is already using AI-powered plumbing tools. Here's what your team is missing:

**🤖 AI Mentor Support**
- Instant answers to complex code questions
- Available 24/7 for job site challenges
- Louisiana-specific expertise at your fingertips

**📸 Photo Code Checker**
- Snap a photo, get instant compliance feedback
- Prevent costly rework and violations
- Boost client confidence in your work

**📐 Professional Calculators**
- Pipe sizing for complex systems
- Material estimators and cost calculators
- Load calculations and capacity planning

**📋 Plan Review System**
- AI-powered plan analysis
- Code compliance checking before construction
- Risk identification and mitigation

**Real Results from Real Contractors:**

"The Photo Code Checker caught a gas line issue that would have cost us $8,000 to fix during inspection. The tool paid for itself on day one." - Mike's Plumbing, Baton Rouge

"Our estimating accuracy improved by 30% using the professional calculators. We're winning more bids and maintaining better margins." - Acadiana Mechanical

**Your Investment vs Your Returns:**
- Bulk enrollment: $37 per student (25% discount)
- Prevent one $5,000 code violation = 135+ students covered
- Win one additional $50,000 contract = 1,350+ students covered

**The math is simple. The results are proven.**

[Start Your Team's Transformation - {{website_url}}/bulk-enrollment]

Still have questions? I'm here to help:
📧 bulk@laplumbprep.com
📞 (555) 123-4567

Best,
Sarah Thompson
Bulk Enrollment Specialist
LA Plumb Prep`
    },
    {
      sequenceOrder: 4,
      delayDays: 14,
      subject: "Final Notice: Louisiana's Top Contractors Are Moving Fast",
      content: `Hi {{name}},

I wanted to reach out one final time about your team's professional development.

**The landscape is changing fast:**
- Louisiana code updates are more frequent
- Clients demand certified, knowledgeable teams
- Insurance companies reward certified contractors
- Competition is investing in professional development

**Don't let your team fall behind.**

**What You Get with Bulk Enrollment:**
✅ Up to 25% savings on professional certification
✅ Complete AI-powered professional toolkit
✅ Louisiana code expertise for your entire team
✅ Employer dashboard to track progress
✅ Job placement assistance for new hires
✅ 24/7 support and resources

**What You Risk by Waiting:**
❌ Code violations and costly rework
❌ Lost contracts to certified competitors
❌ Higher insurance premiums
❌ Difficulty attracting quality workers
❌ Full-price individual enrollments

**This is my last email about bulk enrollment.**

If you're ready to invest in your team's future (and your company's success), I'm here to help make it happen.

If not, I understand - we'll remove you from this sequence and wish you the best.

[Yes, I Want to Enroll My Team - {{website_url}}/bulk-enrollment]

[No Thanks, Remove Me from This List - {{website_url}}/api/unsubscribe?email={{email}}&campaignType=bulk_enrollment]

Thank you for your time and consideration.

Best regards,
Sarah Thompson
Bulk Enrollment Specialist
LA Plumb Prep

P.S. Our most successful contractors started with bulk enrollment. They're now industry leaders in Louisiana. Your team could be next.`
    }
  ]
};

export class EmailAutomationService {
  // Initialize email campaigns in database
  async initializeCampaigns() {
    try {
      // Check if campaigns already exist
      const existingCampaigns = await db.select().from(emailCampaigns);
      
      if (existingCampaigns.length > 0) {
        console.log("Email campaigns already initialized");
        return;
      }

      // Insert employer campaigns
      for (const template of EMAIL_TEMPLATES.employer_onboarding) {
        await db.insert(emailCampaigns).values({
          name: `Employer Onboarding - Email ${template.sequenceOrder}`,
          type: "employer_onboarding",
          subject: template.subject,
          content: template.content,
          sequenceOrder: template.sequenceOrder,
          delayDays: template.delayDays,
          isActive: true
        });
      }

      // Insert student campaigns
      for (const template of EMAIL_TEMPLATES.student_enrollment) {
        await db.insert(emailCampaigns).values({
          name: `Student Enrollment - Email ${template.sequenceOrder}`,
          type: "student_enrollment",
          subject: template.subject,
          content: template.content,
          sequenceOrder: template.sequenceOrder,
          delayDays: template.delayDays,
          isActive: true
        });
      }

      // Insert bulk enrollment campaigns
      for (const template of EMAIL_TEMPLATES.bulk_enrollment) {
        await db.insert(emailCampaigns).values({
          name: `Bulk Enrollment - Email ${template.sequenceOrder}`,
          type: "bulk_enrollment",
          subject: template.subject,
          content: template.content,
          sequenceOrder: template.sequenceOrder,
          delayDays: template.delayDays,
          isActive: true
        });
      }

      console.log("Email campaigns initialized successfully");
    } catch (error) {
      console.error("Error initializing email campaigns:", error);
    }
  }

  // Queue email sequence for a new subscriber
  async queueEmailSequence(
    email: string, 
    name: string, 
    campaignType: "employer_onboarding" | "student_enrollment" | "bulk_enrollment"
  ) {
    try {
      // Check if user has unsubscribed
      const unsubscribed = await db.select()
        .from(emailUnsubscribes)
        .where(and(
          eq(emailUnsubscribes.email, email),
          eq(emailUnsubscribes.campaignType, campaignType)
        ));

      if (unsubscribed.length > 0) {
        console.log(`User ${email} has unsubscribed from ${campaignType}`);
        return;
      }

      // Get all campaigns for this type
      const campaigns = await db.select()
        .from(emailCampaigns)
        .where(and(
          eq(emailCampaigns.type, campaignType),
          eq(emailCampaigns.isActive, true)
        ))
        .orderBy(emailCampaigns.sequenceOrder);

      // Queue each email in the sequence
      for (const campaign of campaigns) {
        const scheduledFor = new Date();
        scheduledFor.setDate(scheduledFor.getDate() + campaign.delayDays);

        // Replace template variables
        const personalizedSubject = this.replaceTemplateVars(campaign.subject, { name, email });
        const personalizedContent = this.replaceTemplateVars(campaign.content, { 
          name, 
          email,
          website_url: process.env.WEBSITE_URL || "https://laplumbprep.com"
        });

        await db.insert(emailQueue).values({
          recipientEmail: email,
          recipientName: name,
          campaignId: campaign.id,
          campaignType: campaignType,
          subject: personalizedSubject,
          content: personalizedContent,
          scheduledFor: scheduledFor,
          status: "pending"
        });
      }

      console.log(`Queued ${campaigns.length} emails for ${email} (${campaignType})`);
    } catch (error) {
      console.error("Error queueing email sequence:", error);
    }
  }

  // Process email queue and send pending emails
  async processEmailQueue() {
    try {
      const now = new Date();
      
      // Get all pending emails that are due to be sent
      const pendingEmails = await db.select()
        .from(emailQueue)
        .where(and(
          eq(emailQueue.status, "pending"),
          lte(emailQueue.scheduledFor, now)
        ))
        .limit(50); // Process in batches

      console.log(`Processing ${pendingEmails.length} pending emails`);

      for (const email of pendingEmails) {
        try {
          // Check if user unsubscribed since this was queued
          const unsubscribed = await db.select()
            .from(emailUnsubscribes)
            .where(and(
              eq(emailUnsubscribes.email, email.recipientEmail),
              eq(emailUnsubscribes.campaignType, email.campaignType)
            ));

          if (unsubscribed.length > 0) {
            // Mark as cancelled
            await db.update(emailQueue)
              .set({ 
                status: "cancelled",
                errorMessage: "User unsubscribed"
              })
              .where(eq(emailQueue.id, email.id));
            continue;
          }

          // Send the email
          const success = await emailService.sendEmail({
            to: email.recipientEmail,
            subject: email.subject,
            html: this.formatEmailHtml(email.content),
            text: email.content
          });

          if (success) {
            // Mark as sent
            await db.update(emailQueue)
              .set({ 
                status: "sent",
                sentAt: new Date()
              })
              .where(eq(emailQueue.id, email.id));
            
            console.log(`Sent email to ${email.recipientEmail}: ${email.subject}`);
          } else {
            // Mark as failed
            await db.update(emailQueue)
              .set({ 
                status: "failed",
                errorMessage: "Email service failed"
              })
              .where(eq(emailQueue.id, email.id));
          }

          // Small delay between emails to avoid overwhelming the service
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`Error sending email to ${email.recipientEmail}:`, error);
          
          // Mark as failed with error message
          await db.update(emailQueue)
            .set({ 
              status: "failed",
              errorMessage: error instanceof Error ? error.message : "Unknown error"
            })
            .where(eq(emailQueue.id, email.id));
        }
      }

    } catch (error) {
      console.error("Error processing email queue:", error);
    }
  }

  // Replace template variables in email content
  private replaceTemplateVars(content: string, vars: Record<string, string>): string {
    let result = content;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  // Format email content as HTML
  private formatEmailHtml(content: string): string {
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.*?)\]/g, '<a href="$1" style="color: #2563eb; text-decoration: none;">$1</a>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  // Unsubscribe user from campaign type
  async unsubscribe(email: string, campaignType?: "employer_onboarding" | "student_enrollment") {
    try {
      // Add to unsubscribe list
      await db.insert(emailUnsubscribes).values({
        email: email,
        campaignType: campaignType
      }).onConflictDoNothing();

      // Cancel any pending emails
      let query = db.update(emailQueue)
        .set({ status: "cancelled", errorMessage: "User unsubscribed" })
        .where(and(
          eq(emailQueue.recipientEmail, email),
          eq(emailQueue.status, "pending")
        ));

      if (campaignType) {
        query = query.where(eq(emailQueue.campaignType, campaignType));
      }

      await query;

      console.log(`Unsubscribed ${email} from ${campaignType || 'all campaigns'}`);
    } catch (error) {
      console.error("Error unsubscribing user:", error);
    }
  }
}

export const emailAutomation = new EmailAutomationService();