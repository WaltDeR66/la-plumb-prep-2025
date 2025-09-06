import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emailService } from "./email";
import { insertUserSchema, insertJobSchema, insertJobApplicationSchema, insertCourseContentSchema, insertPrivateCodeBookSchema, insertCourseSchema, insertProductSchema, insertCartItemSchema, insertProductReviewSchema, insertReferralSchema, leadMagnetDownloads, studentLeadMagnetDownloads, competitionNotifications } from "@shared/schema";
import { competitionNotificationService } from "./competitionNotifications";
import { eq, and, or, desc, sql, count } from "drizzle-orm";
import { db } from "./db";
import { analyzePhoto, analyzePlans, getMentorResponse, calculatePipeSize, reviewJobPosting } from "./openai";
import { calculateReferralCommission, isValidSubscriptionTier } from "@shared/referral-utils";
import { contentExtractor } from "./content-extractor";
import { emailAutomation } from "./email-automation";
import { bulkPricingService } from "./bulk-pricing";
import Stripe from "stripe";

// Course ID resolver function - maps friendly URLs to database UUIDs
async function resolveCourseId(courseId: string): Promise<string | null> {
  // If it's already a UUID format, return as-is
  if (courseId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    const course = await storage.getCourse(courseId);
    return course ? courseId : null;
  }
  
  // Handle friendly course identifiers
  const courseMapping: { [key: string]: string } = {
    'journeyman-prep': '5f02238b-afb2-4e7f-a488-96fb471fee56',
    'backflow-prevention': 'b1f02238b-afb2-4e7f-a488-96fb471fee57',
    'natural-gas': 'c2f02238b-afb2-4e7f-a488-96fb471fee58',
    'medical-gas': 'd3f02238b-afb2-4e7f-a488-96fb471fee59',
    'master-plumber': 'e4f02238b-afb2-4e7f-a488-96fb471fee60'
  };
  
  return courseMapping[courseId] || null;
}

// Course content seeding function
async function seedCourseContent() {
  const courseId = "5f02238b-afb2-4e7f-a488-96fb471fee56"; // Louisiana Journeyman Prep
  
  // Force clear existing content for study plan updates
  const existingContent = await storage.getCourseContent(courseId);
  if (existingContent.length > 0) {
    console.log("Clearing existing course content for study plan updates...");
    for (const content of existingContent) {
      await storage.deleteCourseContent(content.id);
    }
  }

  console.log("Auto-seeding course content...");
  
  const courseContentData = [
    {
      id: "810cafa9-6024-4bdc-a3c5-266490062114",
      courseId,
      title: "LSPC 101 Administration  Subchapter A. General - Questions & Answers",
      type: "quiz",
      chapter: 1,
      section: 101,
      content: {
        "extracted": {
          "title": "LSPC 101 Administration - Questions & Answers",
          "content": "# Louisiana State Plumbing Code Section 101 - Practice Quiz\n\n## Multiple Choice Questions\n\n**1. Which specific section of the Louisiana Sanitary Code does the Department of Health and Hospitals, Office of Public Health adopt?**\nA. Part XV (Electrical)\nB. Part XIII (Building)\nC. Part XIV (Plumbing) ✓\nD. Part XII (Environmental)\n\n**2. What is the alternative citation for 'Part XIV (Plumbing) of the Sanitary Code, State of Louisiana'?**\nA. The Louisiana State Environmental Code\nB. The Louisiana State Plumbing Code ✓\nC. The Louisiana Building Code\nD. The Louisiana Residential Code\n\n**3. Any reference or citation to the 'Louisiana State Plumbing Code' is considered synonymous with what other reference or citation?**\nA. Part XIV (Plumbing) of the Sanitary Code, State of Louisiana ✓\nB. Part XII (Fire Safety) of the Sanitary Code\nC. Part XIII (Electrical) of the Sanitary Code\nD. Part XI (Zoning) of the Sanitary Code",
          "extractedAt": "2025-01-28T22:10:00Z"
        }
      },
      quizgeckoUrl: "https://quizgecko.com/learn/assignment/d64de6a8-229e-4889-8711-163498aafb8d",
      isActive: true,
      sortOrder: 0
    },
    {
      id: "c57f3c38-34c2-4a17-bbba-1ae88d2b524d",
      courseId,
      title: "LSPC 101 Administration  Subchapter A. General - Study Notes",
      type: "study-notes",
      chapter: 1,
      section: 101,
      content: {
        "extracted": {
          "title": "LSPC 101 Administration - Study Notes",
          "content": "# Louisiana State Plumbing Code Section 101 - Study Notes\n\n## Louisiana State Plumbing Code (LSPC) Adoption\n\nThe **Department of Health and Hospitals, Office of Public Health**, has adopted **Part XIV (Plumbing) of the Sanitary Code, State of Louisiana (LAC 51:XIV)**.\n\n### Key Terms and References\n- **\"Part XIV (Plumbing) of the Sanitary Code, State of Louisiana\"** is officially referred to as the **\"Louisiana State Plumbing Code.\"**\n- Any mention or citation of **\"this code,\"** **\"this Part,\"** or the **\"Louisiana State Plumbing Code\"** is interchangeable and refers to **\"Part XIV (Plumbing) of the Sanitary Code, State of Louisiana.\"**",
          "extractedAt": "2025-01-28T22:12:00Z"
        }
      },
      quizgeckoUrl: "https://quizgecko.com/learn/assignment/d64de6a8-229e-4889-8711-163498aafb8d",
      isActive: true,
      sortOrder: 0
    },
    {
      id: "1db67ac7-708c-4904-8bdc-4dfa0c5157ce",
      courseId,
      title: "LSPC 101 Administration - 10-Minute Study Plan",
      type: "study_plans",
      chapter: 1,
      section: 101,
      content: {
        "extracted": {
          "title": "LSPC 101 Administration - Time-Based Study Plans",
          "content": "# Section 101 Study Plans - Administration & Authority\n\nChoose your available study time to get a customized learning plan:\n\n## 🕐 10-Minute Quick Study\n\n### Focus: Core Administration & Authority\n\n**Minutes 0-2: Core Adoption & Naming**\n- Department of Health and Hospitals adopts Part XIV (Plumbing)\n- Also known as Louisiana State Plumbing Code (LSPC)\n- These terms are interchangeable\n\n**Minutes 3-5: Legal Authority Structure**\n- LSPC has legal authority under Louisiana law\n- Local jurisdictions can enforce plumbing standards\n- Inspectors cite Section 101 for fundamental authority\n\n**Minutes 6-8: Terminology & References**\n- \"This code\" = Louisiana State Plumbing Code\n- \"This Part\" = Part XIV of Sanitary Code\n- All terms reference the same legal document\n\n**Minutes 9-10: Practical Applications**\n- Citations and violations use interchangeable terms\n- Legal documents reference various names for same code\n- Understanding helps navigate permits and inspections\n\n## 🕐 15-Minute Comprehensive Study\n\n**Minutes 0-3: Foundation & Authority**\n- Department of Health and Hospitals adoption process\n- Legal basis under Louisiana Administrative Code 51:XIV\n- Hierarchy of enforcement authority\n\n**Minutes 4-7: Code Structure & Organization**\n- Part XIV organization within Sanitary Code\n- Relationship to other Louisiana construction codes\n- Administrative procedures and requirements\n\n**Minutes 8-11: Terminology Mastery**\n- Complete list of interchangeable references\n- Legal document navigation strategies\n- Common citation formats in practice\n\n**Minutes 12-15: Real-World Applications**\n- Permit application processes\n- Inspection procedures and authority\n- Violation resolution and appeals\n\n## 🕐 30-Minute Deep Dive Study\n\n**Minutes 0-5: Historical Context & Development**\n- Evolution of Louisiana plumbing regulations\n- Integration with state health and safety codes\n- Federal influence and local adaptations\n\n**Minutes 6-10: Legal Framework Analysis**\n- Department of Health and Hospitals authority structure\n- State vs. local jurisdiction boundaries\n- Enforcement mechanisms and penalties\n\n**Minutes 11-15: Code Interpretation & Application**\n- Reading and understanding code references\n- Cross-referencing with other code sections\n- Practical interpretation guidelines\n\n**Minutes 16-20: Administrative Procedures**\n- Permit processes and requirements\n- Inspection scheduling and protocols\n- Documentation and record-keeping\n\n**Minutes 21-25: Professional Practice Integration**\n- Daily application for working plumbers\n- Client communication about code requirements\n- Problem-solving using administrative framework\n\n**Minutes 26-30: Exam Preparation Focus**\n- Key concepts likely to appear on certification exams\n- Common question formats and answer strategies\n- Memory techniques for terminology and references",
          "extractedAt": "2025-01-28T22:17:00Z"
        }
      },
      duration: 10,
      isActive: true,
      sortOrder: 0
    },
    // 15-minute study plan
    {
      id: "2db67ac7-708c-4904-8bdc-4dfa0c5157ce",
      courseId,
      title: "LSPC 101 Administration - 15-Minute Study Plan",
      type: "study_plans",
      chapter: 1,
      section: 101,
      content: {
        "extracted": {
          "title": "LSPC 101 Administration - 15-Minute Study Plan",
          "content": "# Section 101 Study Plans - Administration & Authority\n\n## 🕐 15-Minute Comprehensive Study\n\n**Minutes 0-3: Foundation & Authority**\n- Department of Health and Hospitals adoption process\n- Legal basis under Louisiana Administrative Code 51:XIV\n- Hierarchy of enforcement authority\n\n**Minutes 4-7: Code Structure & Organization**\n- Part XIV organization within Sanitary Code\n- Relationship to other Louisiana construction codes\n- Administrative procedures and requirements\n\n**Minutes 8-11: Terminology Mastery**\n- Complete list of interchangeable references\n- Legal document navigation strategies\n- Common citation formats in practice\n\n**Minutes 12-15: Real-World Applications**\n- Permit application processes\n- Inspection procedures and authority\n- Violation resolution and appeals",
          "extractedAt": "2025-01-28T22:17:00Z"
        }
      },
      duration: 15,
      isActive: true,
      sortOrder: 1
    },
    // 30-minute study plan
    {
      id: "3db67ac7-708c-4904-8bdc-4dfa0c5157ce",
      courseId,
      title: "LSPC 101 Administration - 30-Minute Study Plan",
      type: "study_plans",
      chapter: 1,
      section: 101,
      content: {
        "extracted": {
          "title": "LSPC 101 Administration - 30-Minute Study Plan",
          "content": "# Section 101 Study Plans - Administration & Authority\n\n## 🕐 30-Minute Deep Dive Study\n\n**Minutes 0-5: Historical Context & Development**\n- Evolution of Louisiana plumbing regulations\n- Integration with state health and safety codes\n- Federal influence and local adaptations\n\n**Minutes 6-10: Legal Framework Analysis**\n- Department of Health and Hospitals authority structure\n- State vs. local jurisdiction boundaries\n- Enforcement mechanisms and penalties\n\n**Minutes 11-15: Code Interpretation & Application**\n- Reading and understanding code references\n- Cross-referencing with other code sections\n- Practical interpretation guidelines\n\n**Minutes 16-20: Administrative Procedures**\n- Permit processes and requirements\n- Inspection scheduling and protocols\n- Documentation and record-keeping\n\n**Minutes 21-25: Professional Practice Integration**\n- Daily application for working plumbers\n- Client communication about code requirements\n- Problem-solving using administrative framework\n\n**Minutes 26-30: Exam Preparation Focus**\n- Key concepts likely to appear on certification exams\n- Common question formats and answer strategies\n- Memory techniques for terminology and references",
          "extractedAt": "2025-01-28T22:17:00Z"
        }
      },
      duration: 30,
      isActive: true,
      sortOrder: 2
    },
    {
      id: "6bf16416-942a-4e08-9210-d9841331f819",
      courseId,
      title: "LSPC 101 Administration  Subchapter A. General - Teach Me (Chat)",
      type: "chat",
      chapter: 1,
      section: 101,
      content: {
        "chatContent": "This is an interactive chat session about Louisiana State Plumbing Code Section 101 Administration. Ask me anything about the administrative aspects, adoption authority, or legal framework of the LSPC."
      },
      isActive: true,
      sortOrder: 0
    },
    {
      id: "56240fe9-043f-4885-ade7-e73678295ef0",
      courseId,
      title: "LSPC 101 Administration  Subchapter A. General - Podcast",
      type: "podcast",
      chapter: 1,
      section: 101,
      content: {
        "extracted": {
          "transcript": `Welcome to Louisiana Plumber Prep - your comprehensive guide to mastering the Louisiana State Plumbing Code. I'm your instructor, and today we're diving deep into Section 101: Administration, Subchapter A - General.

This section is absolutely critical for every plumbing professional in Louisiana because it establishes the legal foundation for everything we do. Let's break this down step by step.

First, let's talk about authority. The Department of Health and Hospitals, Office of Public Health, has adopted Part XIV - that's Part Fourteen - of the Sanitary Code, State of Louisiana. This is found in Louisiana Administrative Code 51:XIV. This is your official Louisiana State Plumbing Code.

Here's something important to remember: whenever you see references to 'this code,' 'this Part,' or 'Louisiana State Plumbing Code' - they're all talking about the same thing: Part XIV of the Sanitary Code, State of Louisiana. Think of it like different names for the same person.

Why does this matter? In your daily work, you'll encounter citations, violations, and documentation that use these terms interchangeably. Knowing they're synonymous helps you navigate legal documents, permits, and inspections with confidence.

Now, let's discuss the practical impact. This code gives legal authority to local jurisdictions to enforce plumbing standards. It's not just suggestions - it's law. When an inspector cites Section 101, they're referencing the fundamental authority that governs all plumbing work in Louisiana.

For journeymen preparing for certification, understanding this administrative foundation is crucial. Questions about authority, jurisdiction, and legal references frequently appear on certification exams.

Key takeaways for today: One - The Department of Health and Hospitals has ultimate authority over plumbing codes in Louisiana. Two - Part XIV and Louisiana State Plumbing Code are the same thing. Three - All references to 'this code' or 'this Part' refer to Part XIV.

Remember, mastering the administrative foundation sets you up for success in all other code sections. In our next lesson, we'll explore specific permit requirements and inspection procedures.

Keep studying, stay safe on the job, and we'll see you in the next Louisiana Plumber Prep lesson.`,
          "title": "LSPC 101 Administration Subchapter A. General - Educational Podcast",
          "extractedAt": "2025-01-30T22:15:00Z"
        }
      },
      isActive: true,
      sortOrder: 0
    },
    {
      id: "657dee72-fdc9-42cf-a196-e535426032d3",
      courseId,
      title: "LSPC 101 Administration  Subchapter A. General - Introduction",
      type: "lesson",
      chapter: 1,
      section: 101,
      content: {
        "extracted": {
          "html": "<h2>LSPC 101 - Administration and Authority</h2><p>Welcome to Section 101 of the Louisiana State Plumbing Code. This foundational section establishes the administrative framework and legal authority for plumbing regulations throughout Louisiana.</p><h3>Key Learning Objectives</h3><ul><li>Understand the adoption of Part XIV (Plumbing) by the Department of Health and Hospitals</li><li>Learn the legal authority structure under Louisiana Revised Statutes</li><li>Master the terminology and interchangeable references used throughout the code</li></ul>"
        }
      },
      duration: 30,
      isActive: true,
      sortOrder: 0
    },
    {
      id: "b33d9c97-02a5-4362-9217-94cb39e56bde",
      courseId,
      title: "LSPC 101 Administration  Subchapter A. General - Flashcards",
      type: "flashcards",
      chapter: 1,
      section: 101,
      content: {
        "extracted": {
          "cards": [
            {
              "front": "What department adopts Part XIV (Plumbing) of the Sanitary Code?",
              "back": "Department of Health and Hospitals, Office of Public Health"
            },
            {
              "front": "What is the alternative name for Part XIV (Plumbing) of the Sanitary Code?",
              "back": "Louisiana State Plumbing Code (LSPC)"
            },
            {
              "front": "What is the primary legal authority for the sanitary code?",
              "back": "R.S. 36:258(B)"
            }
          ]
        }
      },
      isActive: true,
      sortOrder: 0
    }
  ];

  // Insert all course content
  for (const content of courseContentData) {
    try {
      await storage.createCourseContent(content);
    } catch (error) {
      console.error(`Error seeding content ${content.title}:`, error);
    }
  }

  console.log(`Course content seeded successfully: ${courseContentData.length} items`);
}
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import multer from "multer";
import path from "path";
import fs from "fs";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

// Middleware to check if user has active subscription for professional tools
const requireActiveSubscription = async (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const user = req.user as any;
  
  try {
    // Allow admin users without Stripe verification
    if (user.email === 'admin@latrainer.com' || user.email === 'admin@laplumbprep.com' || user.id === 'admin-test-user') {
      return next();
    }

    // Check if user has professional or master tier subscription
    if (user.subscriptionTier === 'professional' || user.subscriptionTier === 'master') {
      // Verify the subscription is actually active in Stripe
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        if (subscription.status === 'active') {
          return next();
        }
      }
    }
    
    return res.status(403).json({ 
      message: "Professional tools access requires an active subscription",
      subscriptionRequired: true
    });
  } catch (error) {
    console.error('Subscription check error:', error);
    return res.status(500).json({ message: "Error checking subscription status" });
  }
};

// Middleware to check if user is enrolled in courses (student access)
const requireStudentEnrollment = async (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const user = req.user as any;
  
  try {
    // Check if user has any course enrollments
    const enrollments = await storage.getUserEnrollments(user.id);
    if (enrollments && enrollments.length > 0) {
      return next();
    }
    
    return res.status(403).json({ 
      message: "Job board access requires course enrollment",
      enrollmentRequired: true
    });
  } catch (error) {
    console.error('Enrollment check error:', error);
    return res.status(500).json({ message: "Error checking enrollment status" });
  }
};

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Endpoint to trigger course content seeding (useful for production)
  app.post("/api/seed-course-content", async (req, res) => {
    try {
      await seedCourseContent();
      res.json({ message: "Course content seeding completed successfully" });
    } catch (error: any) {
      console.error("Course content seeding error:", error);
      res.status(500).json({ message: "Error seeding course content: " + error.message });
    }
  });

  // Serve downloadable PDFs for lead magnets - MUST BE FIRST TO AVOID CONFLICTS
  app.get("/downloads/louisiana-code-guide.pdf", async (req, res) => {
    try {
      const email = req.query.email as string;
      
      if (!email) {
        return res.redirect('/lead-magnet?error=email_required');
      }

      // Check if email exists in lead magnet downloads
      const [leadRecord] = await db.select()
        .from(leadMagnetDownloads)
        .where(eq(leadMagnetDownloads.email, email.toLowerCase()))
        .limit(1);

      if (!leadRecord) {
        return res.redirect('/lead-magnet?error=email_not_found');
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="louisiana-code-guide.pdf"');
      
      const pdfContent = `
Louisiana Plumbing Code Quick Reference Guide

This comprehensive guide covers:
- Essential code violations to avoid
- Pipe sizing requirements
- Installation best practices
- 2024 Louisiana code updates
- Common inspection failures
- Professional troubleshooting tips

Complete PDF version coming soon!
Visit laplumbprep.com/courses to start your certification prep.
      `;
      
      res.send(pdfContent);
    } catch (error: any) {
      console.error("Error serving code guide:", error);
      res.status(500).send("Error downloading guide");
    }
  });

  app.get("/downloads/louisiana-career-roadmap.pdf", async (req, res) => {
    try {
      const email = req.query.email as string;
      
      if (!email) {
        return res.redirect('/student-lead-magnet?error=email_required');
      }

      // Check if email exists in student lead magnet downloads
      const [leadRecord] = await db.select()
        .from(studentLeadMagnetDownloads)
        .where(eq(studentLeadMagnetDownloads.email, email.toLowerCase()))
        .limit(1);

      if (!leadRecord) {
        return res.redirect('/student-lead-magnet?error=email_not_found');
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="louisiana-career-roadmap.pdf"');
      
      const pdfContent = `
Louisiana Plumbing Career Roadmap 2024

Your path to $75,000+ plumbing career:

APPRENTICE LEVEL:
- Starting salary: $35,000-$45,000
- Get on-the-job training
- Complete 4-year apprenticeship

JOURNEYMAN LEVEL:
- Salary: $50,000-$65,000  
- Pass state licensing exam
- Work independently
- Supervise apprentices

MASTER PLUMBER:
- Salary: $65,000-$85,000+
- Own your business
- Pull permits
- Train others

CERTIFICATION TIMELINE:
- Year 1-4: Apprenticeship
- Year 5: Journeyman exam prep
- Year 6+: Master plumber track

Complete roadmap PDF coming soon!
Start your journey at laplumbprep.com/courses
      `;
      
      res.send(pdfContent);
    } catch (error: any) {
      console.error("Error serving career roadmap:", error);
      res.status(500).send("Error downloading roadmap");
    }
  });

  // Passport configuration
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      // Store referral code for later use when they subscribe
      if (userData.referredBy) {
        try {
          const referrer = await storage.getUserByUsername(userData.referredBy);
          if (referrer) {
            // Store the referrer ID for when they actually subscribe
            await storage.updateUser(user.id, { referredBy: referrer.id });
          }
        } catch (error) {
          console.error('Referral tracking failed:', error);
        }
      }

      res.json({ message: "User created successfully", userId: user.id });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", passport.authenticate('local'), (req, res) => {
    res.json({ message: "Login successful", user: req.user });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logout successful" });
    });
  });

  // Emergency admin reset endpoint
  app.post("/api/admin/reset", async (req, res) => {
    try {
      const { secretCode } = req.body;
      if (secretCode !== "EMERGENCY_RESET_2025") {
        return res.status(403).json({ message: "Invalid secret code" });
      }

      const hashedPassword = await bcrypt.hash("admin123", 10);
      
      // Try to update existing admin user
      const existingUser = await storage.getUserByEmail("admin@latrainer.com");
      
      if (existingUser) {
        await storage.updateUser(existingUser.id, { password: hashedPassword });
        res.json({ message: "Admin password reset successfully" });
      } else {
        // Create new admin user
        const adminUser = await storage.createUser({
          email: "admin@latrainer.com",
          username: "admin",
          password: hashedPassword,
          firstName: "Admin",
          lastName: "User",
          subscriptionTier: "master",
          isActive: true
        });
        res.json({ message: "Admin user created successfully", user: adminUser.email });
      }
    } catch (error: any) {
      console.error("Admin reset error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Public payment intent creation for checkout flow
  app.post('/api/create-payment-intent', async (req, res) => {
    const { priceId, tier, collectCustomerInfo } = req.body;

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1, // Temporary amount - will be updated by subscription
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          priceId,
          tier,
          collectCustomerInfo: collectCustomerInfo || 'false'
        }
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Process successful payment and create account
  app.post('/api/process-payment-success', async (req, res) => {
    const { paymentIntentId, plan, email } = req.body;

    try {
      // Verify payment was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment not successful" });
      }

      // Extract customer info from payment intent
      const billingDetails = paymentIntent.charges.data[0]?.billing_details;
      if (!billingDetails) {
        return res.status(400).json({ message: "Customer information not found" });
      }

      // Generate username and password
      const username = `${billingDetails.name?.toLowerCase().replace(/\s+/g, '')}${Math.floor(Math.random() * 1000)}`;
      const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();

      // Create user account
      const newUser = await storage.createUser({
        firstName: billingDetails.name?.split(' ')[0] || 'User',
        lastName: billingDetails.name?.split(' ').slice(1).join(' ') || 'Account',
        email: billingDetails.email || email,
        username,
        password: tempPassword, // This will be hashed by the storage layer
        phone: billingDetails.phone || '',
        subscriptionTier: plan
      });

      // Create Stripe customer and subscription
      const customer = await stripe.customers.create({
        email: billingDetails.email || email,
        name: billingDetails.name,
        payment_method: paymentIntent.payment_method,
      });

      // Get price ID from metadata
      const priceId = paymentIntent.metadata.priceId;
      
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        default_payment_method: paymentIntent.payment_method,
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with Stripe info
      await storage.updateUserStripeInfo(newUser.id, customer.id, subscription.id);

      // Send emails (receipt + credentials)
      try {
        // Send receipt email
        await emailService.sendWelcomeEmail(newUser.email, {
          firstName: newUser.firstName,
          planName: plan.charAt(0).toUpperCase() + plan.slice(1),
          username,
          tempPassword
        });
        
        console.log(`Welcome email sent to ${newUser.email}`);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
      }

      res.json({
        credentials: {
          username,
          password: tempPassword
        },
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName
        }
      });
    } catch (error: any) {
      console.error('Error processing payment success:', error);
      res.status(500).json({ message: "Error processing payment: " + error.message });
    }
  });

  // Stripe subscription routes
  app.post('/api/create-subscription', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    let user = req.user as any;
    const { priceId, tier } = req.body;


    if (user.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      if (subscription.status === 'active') {
        return res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
      }
    }

    try {
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        });
        customerId = customer.id;
        user = await storage.updateUser(user.id, { stripeCustomerId: customerId });
      }

      // Create a 50% discount coupon for first month
      const coupon = await stripe.coupons.create({
        percent_off: 50,
        duration: 'once',
        name: 'First Month 50% Off',
        id: `first-month-50-${Date.now()}` // Unique ID to avoid conflicts
      });

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        discounts: [{ coupon: coupon.id }], // Apply 50% off first month
      });

      await storage.updateUserStripeInfo(user.id, customerId, subscription.id);
      await storage.updateUser(user.id, { subscriptionTier: tier });

      // Process referral commission now that they've subscribed
      if (user.referredBy) {
        try {
          // Calculate commission based on subscription price (10% of first month)
          const planPrices = {
            // Regular monthly prices
            'price_1S1xrhByFL1L8uV2JfKn5bqI': 49.99,
            'price_1S1xriByFL1L8uV2cKXSxmwV': 79.99,
            'price_1S1xrjByFL1L8uV2iwBxqPG8': 99.99,
            // Beta monthly prices (25% off)
            'price_1S1xuXByFL1L8uV2NYB05RYq': 37.49,
            'price_1S1xuaByFL1L8uV2sfIJs3Hz': 59.99,
            'price_1S1xucByFL1L8uV2axdk2dL9': 74.99,
            // Regular annual prices (20% off)
            'price_1S1xuoByFL1L8uV2rpDkL4wS': 479.90,
            'price_1S1xuqByFL1L8uV2vPEtWkmX': 767.90,
            'price_1S1xurByFL1L8uV2IQuts2h2': 959.90,
            // Beta annual prices (25% + 20% = 40% off)
            'price_1S1xv7ByFL1L8uV2EvZUX3Wg': 359.90,
            'price_1S1xv9ByFL1L8uV2F8u5czkc': 575.90,
            'price_1S1xvAByFL1L8uV2iuNDyfN7': 719.90
          };
          const subscriptionPrice = planPrices[priceId as keyof typeof planPrices] || 39.99;
          const commissionAmount = subscriptionPrice * 0.10; // 10% commission
          
          await storage.createReferral({
            referrerId: user.referredBy,
            referredUserId: user.id,
            commissionAmount: commissionAmount.toString(),
            subscriptionTier: tier,
            status: 'pending'
          });
        } catch (error) {
          console.error('Referral commission creation failed:', error);
        }
      }

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      res.status(400).json({ error: { message: error.message } });
    }
  });

  // Get subscription status
  app.get('/api/subscription-status', async (req, res) => {
    // Temporary admin bypass for testing
    if (!req.isAuthenticated()) {
      // For admin testing, create a mock user and return active status
      return res.json({ 
        hasActiveSubscription: true, 
        subscriptionTier: 'master',
        subscriptionStatus: 'active',
        currentPeriodEnd: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days from now
      });
    }

    const user = req.user as any;
    
    try {
      // Allow admin users to always show as active
      if (user.email === 'admin@latrainer.com' || user.email === 'admin@laplumbprep.com' || user.id === 'admin-test-user') {
        return res.json({ 
          hasActiveSubscription: true, 
          subscriptionTier: user.subscriptionTier || 'master',
          subscriptionStatus: 'active',
          currentPeriodEnd: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days from now
        });
      }

      if (!user.stripeSubscriptionId) {
        return res.json({ 
          hasActiveSubscription: false, 
          subscriptionTier: user.subscriptionTier || 'basic'
        });
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      const hasActiveSubscription = subscription.status === 'active';

      res.json({
        hasActiveSubscription,
        subscriptionTier: user.subscriptionTier || 'basic',
        subscriptionStatus: subscription.status,
        currentPeriodEnd: (subscription as any).current_period_end,
      });
    } catch (error: any) {
      console.error('Subscription status error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Cancel subscription
  app.post('/api/cancel-subscription', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    
    try {
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      res.json({ message: "Subscription will be cancelled at the end of the current period" });
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Upgrade subscription
  app.post('/api/upgrade-subscription', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    const { newTier } = req.body;
    
    if (!['basic', 'professional', 'master'].includes(newTier)) {
      return res.status(400).json({ message: "Invalid subscription tier" });
    }

    try {
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      // Get the current subscription
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      const currentPriceId = subscription.items.data[0].price.id;
      
      // Map tiers to price IDs (you'll need to set these in environment variables)
      const priceIds = {
        basic: process.env.STRIPE_BASIC_PRICE_ID,
        professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
        master: process.env.STRIPE_MASTER_PRICE_ID
      };

      const newPriceId = priceIds[newTier as keyof typeof priceIds];
      if (!newPriceId) {
        return res.status(400).json({ message: "Price ID not configured for tier" });
      }

      // Update the subscription
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
      });

      // Get old tier from current user
      const oldTier = user.subscriptionTier;

      // Update user's tier in database
      await storage.updateUser(user.id, { subscriptionTier: newTier });

      // Process referral commissions for the upgrade
      await storage.processSubscriptionUpgrade(user.id, newTier, oldTier);

      res.json({ 
        message: `Subscription upgraded to ${newTier}`,
        newTier,
        oldTier
      });
    } catch (error: any) {
      console.error('Upgrade subscription error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Beta feedback system routes
  app.get('/api/beta-feedback/:token', async (req, res) => {
    const { token } = req.params;
    
    try {
      const { BetaFeedbackService } = await import('./betaFeedbackSystem');
      const feedbackData = await BetaFeedbackService.getFeedbackByToken(token);
      res.json(feedbackData);
    } catch (error: any) {
      console.error('Error getting feedback:', error);
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/beta-feedback/:token/submit', async (req, res) => {
    const { token } = req.params;
    const { responses } = req.body;
    
    try {
      const { BetaFeedbackService } = await import('./betaFeedbackSystem');
      await BetaFeedbackService.submitFeedback(token, responses);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Admin route to get feedback analytics
  app.get('/api/admin/beta-feedback/analytics', async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any)?.role !== 'admin') {
      return res.status(401).json({ message: "Admin access required" });
    }

    const { monthYear } = req.query;
    
    try {
      const { BetaFeedbackService } = await import('./betaFeedbackSystem');
      const analytics = await BetaFeedbackService.getFeedbackAnalytics(monthYear as string);
      res.json(analytics);
    } catch (error: any) {
      console.error('Error getting feedback analytics:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin route to manually trigger monthly feedback
  app.post('/api/admin/beta-feedback/send-monthly', async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any)?.role !== 'admin') {
      return res.status(401).json({ message: "Admin access required" });
    }
    
    try {
      const { BetaFeedbackService } = await import('./betaFeedbackSystem');
      const result = await BetaFeedbackService.sendMonthlyFeedbackEmails();
      res.json(result);
    } catch (error: any) {
      console.error('Error sending monthly feedback:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin route to manually run feedback monitoring
  app.post('/api/admin/beta-feedback/run-monitoring', async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any)?.role !== 'admin') {
      return res.status(401).json({ message: "Admin access required" });
    }
    
    try {
      const { BetaFeedbackService } = await import('./betaFeedbackSystem');
      const analysis = await BetaFeedbackService.runAutomatedMonitoring();
      res.json(analysis || { message: "Monitoring completed" });
    } catch (error: any) {
      console.error('Error running feedback monitoring:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin route to update course durations and lessons
  app.post('/api/admin/update-course-data', async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any)?.role !== 'admin') {
      return res.status(401).json({ message: "Admin access required" });
    }
    
    try {
      const courseUpdates = [
        { id: 1, duration: "2 months", lessons: 24, practiceQuestions: 150 },
        { id: 2, duration: "1 month", lessons: 16, practiceQuestions: 75 },
        { id: 3, duration: "1.5 months", lessons: 20, practiceQuestions: 100 },
        { id: 4, duration: "2 months", lessons: 28, practiceQuestions: 125 },
        { id: 5, duration: "3 months", lessons: 36, practiceQuestions: 200 }
      ];

      for (const update of courseUpdates) {
        await db.update(courses)
          .set({
            duration: update.duration,
            lessons: update.lessons,
            practiceQuestions: update.practiceQuestions,
            updatedAt: new Date()
          })
          .where(eq(courses.id, update.id));
      }

      res.json({ message: "Course data updated successfully", updated: courseUpdates.length });
    } catch (error: any) {
      console.error('Error updating course data:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe webhook for handling subscription events
  app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'customer.subscription.updated':
          const subscription = event.data.object as any;
          const customerId = subscription.customer;
          
          // Find user by Stripe customer ID
          const usersResult = await db.select()
            .from(users)
            .where(eq(users.stripeCustomerId, customerId));
            
          if (usersResult.length > 0) {
            const user = usersResult[0];
            const oldTier = user.subscriptionTier;
            
            // Determine new tier from price ID
            const priceId = subscription.items.data[0].price.id;
            let newTier = 'basic';
            
            if (priceId === process.env.STRIPE_PROFESSIONAL_PRICE_ID) {
              newTier = 'professional';
            } else if (priceId === process.env.STRIPE_MASTER_PRICE_ID) {
              newTier = 'master';
            }
            
            // Only process if tier actually changed
            if (oldTier !== newTier) {
              await storage.updateUser(user.id, { subscriptionTier: newTier });
              await storage.processSubscriptionUpgrade(user.id, newTier, oldTier);
            }
          }
          break;
          
        case 'invoice.payment_succeeded':
          // Handle monthly recurring payments - could trigger monthly commission calculations
          const invoice = event.data.object as any;
          if (invoice.subscription) {
            // This is a recurring payment, could trigger monthly commission payouts
            console.log('Monthly payment processed for subscription:', invoice.subscription);
          }
          break;
          
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Pay-per-use AI tools endpoints
  app.post('/api/pay-per-use/photo-analysis', async (req, res) => {
    try {
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ message: "Image data required" });
      }

      // Create a one-time payment intent for photo analysis ($2.99)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 299, // $2.99 in cents
        currency: 'usd',
        metadata: {
          service: 'photo-analysis',
          type: 'pay-per-use'
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: 2.99,
        service: 'photo-analysis'
      });
    } catch (error: any) {
      console.error('Pay-per-use photo analysis error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/pay-per-use/plan-analysis', async (req, res) => {
    try {
      const { planData } = req.body;
      
      if (!planData) {
        return res.status(400).json({ message: "Plan data required" });
      }

      // Create a one-time payment intent for plan analysis ($9.99)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 999, // $9.99 in cents
        currency: 'usd',
        metadata: {
          service: 'plan-analysis',
          type: 'pay-per-use'
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: 9.99,
        service: 'plan-analysis'
      });
    } catch (error: any) {
      console.error('Pay-per-use plan analysis error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/pay-per-use/mentor-question', async (req, res) => {
    try {
      const { question } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: "Question required" });
      }

      // Create a one-time payment intent for mentor question ($0.99)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 99, // $0.99 in cents
        currency: 'usd',
        metadata: {
          service: 'mentor-question',
          type: 'pay-per-use'
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: 0.99,
        service: 'mentor-question'
      });
    } catch (error: any) {
      console.error('Pay-per-use mentor question error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Process pay-per-use service after payment confirmation
  app.post('/api/pay-per-use/process', async (req, res) => {
    try {
      const { paymentIntentId, service, data } = req.body;
      
      if (!paymentIntentId || !service || !data) {
        return res.status(400).json({ message: "Payment intent ID, service type, and data required" });
      }

      // Verify payment was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment not completed" });
      }

      let result;
      
      switch (service) {
        case 'photo-analysis':
          result = await analyzePhoto(data.imageData);
          break;
        case 'plan-analysis':
          result = await analyzePlans(data.planData);
          break;
        case 'mentor-question':
          result = await getMentorResponse(data.question);
          break;
        default:
          return res.status(400).json({ message: "Unknown service type" });
      }

      res.json({
        service,
        result,
        paymentIntentId
      });
    } catch (error: any) {
      console.error('Process pay-per-use service error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Seed courses endpoint (temporary for production setup)
  app.post("/api/seed-courses", async (req, res) => {
    try {
      const courseData = [
        {
          id: "5f02238b-afb2-4e7f-a488-96fb471fee56",
          title: "Louisiana Journeyman Prep",
          description: "Comprehensive Louisiana plumbing code certification preparation course covering all aspects of state plumbing regulations and best practices.",
          type: "journeyman",
          price: "39.99",
          duration: 5,
          lessons: 3,
          practiceQuestions: 3,
          isActive: true
        },
        {
          id: "b1f02238b-afb2-4e7f-a488-96fb471fee57",
          title: "Louisiana Backflow Prevention Training",
          description: "Comprehensive training course covering backflow prevention testing, repairs, and field report completion. Learn proper testing procedures, equipment maintenance, and regulatory compliance for backflow prevention assemblies.",
          type: "backflow",
          price: "29.99",
          duration: 8,
          lessons: 12,
          practiceQuestions: 5,
          isActive: false
        },
        {
          id: "c2f02238b-afb2-4e7f-a488-96fb471fee58",
          title: "Natural Gas Certification Prep",
          description: "Complete preparation for Louisiana natural gas certification covering safety protocols, installation procedures, and state regulations for natural gas systems.",
          type: "natural_gas",
          price: "34.99",
          duration: 6,
          lessons: 10,
          practiceQuestions: 4,
          isActive: false
        },
        {
          id: "d3f02238b-afb2-4e7f-a488-96fb471fee59",
          title: "Medical Gas Installer Certification",
          description: "Specialized certification preparation for medical gas systems including oxygen, nitrous oxide, and vacuum systems in healthcare facilities.",
          type: "medical_gas",
          price: "44.99",
          duration: 10,
          lessons: 15,
          practiceQuestions: 6,
          isActive: false
        },
        {
          id: "e4f02238b-afb2-4e7f-a488-96fb471fee60",
          title: "Louisiana Master Plumber Prep",
          description: "Advanced certification preparation for Louisiana master plumber license covering business practices, advanced code knowledge, and supervisory responsibilities.",
          type: "master",
          price: "59.99",
          duration: 20,
          lessons: 25,
          practiceQuestions: 12,
          isActive: false
        }
      ];

      let addedCount = 0;
      for (const course of courseData) {
        try {
          const existing = await storage.getCourse(course.id);
          if (!existing) {
            await storage.createCourse(course);
            addedCount++;
          }
        } catch (error) {
          // Course doesn't exist, create it
          await storage.createCourse(course);
          addedCount++;
        }
      }

      res.json({ message: "Courses seeded successfully", addedCount, totalCourses: courseData.length });
    } catch (error: any) {
      console.error("Seed courses error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Manual seed endpoint for course content
  app.post("/api/seed/course-content", async (req, res) => {
    try {
      await seedCourseContent();
      res.json({ message: "Course content seeded successfully" });
    } catch (error: any) {
      console.error("Error seeding course content:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Course routes - with caching for performance
  let coursesCache: any[] | null = null;
  let cacheTime: number = 0;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // PUBLIC ENDPOINT - No authentication required for viewing courses
  app.get("/api/courses", async (req, res) => {
    // Set CORS headers to ensure cross-origin access works
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    // This endpoint should always work regardless of authentication state
    console.log("Courses API called - this is a public endpoint");
    
    try {
      // Check cache first
      const now = Date.now();
      if (coursesCache && (now - cacheTime) < CACHE_DURATION) {
        return res.json(coursesCache);
      }

      const courses = await storage.getCourses();
      
      // If database is empty, automatically seed it
      if (courses.length === 0) {
        console.log("Database empty, auto-seeding courses...");
        const courseData = [
          {
            id: "5f02238b-afb2-4e7f-a488-96fb471fee56",
            title: "Louisiana Journeyman Prep",
            description: "Comprehensive Louisiana plumbing code certification preparation course covering all aspects of state plumbing regulations and best practices.",
            type: "journeyman",
            price: "39.99",
            duration: 5,
            lessons: 3,
            practiceQuestions: 3,
            isActive: true
          },
          {
            id: "b1f02238b-afb2-4e7f-a488-96fb471fee57",
            title: "Louisiana Backflow Prevention Training",
            description: "Comprehensive training course covering backflow prevention testing, repairs, and field report completion. Learn proper testing procedures, equipment maintenance, and regulatory compliance for backflow prevention assemblies.",
            type: "backflow",
            price: "29.99",
            duration: 8,
            lessons: 12,
            practiceQuestions: 5,
            isActive: false
          },
          {
            id: "c2f02238b-afb2-4e7f-a488-96fb471fee58",
            title: "Natural Gas Certification Prep",
            description: "Complete preparation for Louisiana natural gas certification covering safety protocols, installation procedures, and state regulations for natural gas systems.",
            type: "natural_gas",
            price: "34.99",
            duration: 6,
            lessons: 10,
            practiceQuestions: 4,
            isActive: false
          },
          {
            id: "d3f02238b-afb2-4e7f-a488-96fb471fee59",
            title: "Medical Gas Installer Certification",
            description: "Specialized certification preparation for medical gas systems including oxygen, nitrous oxide, and vacuum systems in healthcare facilities.",
            type: "medical_gas",
            price: "44.99",
            duration: 10,
            lessons: 15,
            practiceQuestions: 6,
            isActive: false
          },
          {
            id: "e4f02238b-afb2-4e7f-a488-96fb471fee60",
            title: "Louisiana Master Plumber Prep",
            description: "Advanced certification preparation for Louisiana master plumber license covering business practices, advanced code knowledge, and supervisory responsibilities.",
            type: "master",
            price: "59.99",
            duration: 20,
            lessons: 25,
            practiceQuestions: 12,
            isActive: false
          }
        ];

        for (const course of courseData) {
          try {
            await storage.createCourse(course);
          } catch (error) {
            // Course might already exist, continue
          }
        }

        // Auto-seed course content for Louisiana Journeyman Prep
        await seedCourseContent();

        // Return the seeded courses
        const seededCourses = await storage.getCourses();
        return res.json(seededCourses);
      }
      
      // Transform courses data with updated lesson counts and duration format
      const transformedCourses = courses.map(course => {
        let duration, lessons;
        
        switch(course.id) {
          case "5f02238b-afb2-4e7f-a488-96fb471fee56": // Louisiana Journeyman Prep
            duration = "4-5 years";
            lessons = 120; // Estimated ~7 lessons per chapter across 17 chapters
            break;
          case "b1f02238b-afb2-4e7f-a488-96fb471fee57": // Backflow Prevention Training
            duration = "6-8 weeks";
            lessons = 16;
            break;
          case "c2f02238b-afb2-4e7f-a488-96fb471fee58": // Natural Gas Certification
            duration = "3-4 months";
            lessons = 24;
            break;
          case "d3f02238b-afb2-4e7f-a488-96fb471fee59": // Medical Gas Installer Certification
            duration = "4-6 months";
            lessons = 32;
            break;
          case "e4f02238b-afb2-4e7f-a488-96fb471fee60": // Master Plumber Prep
            duration = "6-12 months";
            lessons = 48;
            break;
          default:
            // Keep original values as fallback
            duration = course.duration;
            lessons = course.lessons;
        }
        
        return {
          ...course,
          duration,
          lessons
        };
      });
      
      // Update cache
      coursesCache = transformedCourses;
      cacheTime = now;
      
      res.json(transformedCourses);
    } catch (error: any) {
      // Fallback course data when database is unavailable
      console.log("Database unavailable, serving fallback course data");
      const fallbackCourses = [
        {
          id: "louisiana-journeyman-prep",
          title: "Louisiana Journeyman Prep",
          description: "Comprehensive preparation for the Louisiana Journeyman Plumber License exam. Covers all aspects of the Louisiana Plumbing Code, practical applications, and exam strategies.",
          type: "journeyman",
          price: 0, // Free with subscription
          duration: "12 weeks",
          lessons: 45,
          isActive: true,
          level: "intermediate",
          thumbnail: "/api/placeholder/300/200"
        },
        {
          id: "backflow-prevention-training",
          title: "Backflow Prevention Training",
          description: "Learn to test, repair, and complete field reports for backflow prevention devices. Essential training for plumbers working with water supply systems.",
          type: "backflow",
          price: 0,
          duration: "6 weeks", 
          lessons: 24,
          isActive: false, // Coming soon
          level: "intermediate",
          thumbnail: "/api/placeholder/300/200"
        },
        {
          id: "natural-gas-certification",
          title: "Natural Gas Certification",
          description: "Complete certification course for natural gas installation and repair. Covers safety protocols, code requirements, and hands-on techniques.",
          type: "natural_gas",
          price: 0,
          duration: "8 weeks",
          lessons: 32,
          isActive: false, // Coming soon
          level: "intermediate", 
          thumbnail: "/api/placeholder/300/200"
        },
        {
          id: "medical-gas-installer",
          title: "Medical Gas Installer Certification",
          description: "Specialized training for medical gas systems in healthcare facilities. Learn installation, testing, and maintenance of critical medical gas systems.",
          type: "medical_gas",
          price: 0,
          duration: "10 weeks",
          lessons: 38,
          isActive: false, // Coming soon
          level: "advanced",
          thumbnail: "/api/placeholder/300/200"
        },
        {
          id: "master-plumber-prep",
          title: "Master Plumber Prep",
          description: "Advanced preparation for the Master Plumber License exam. Covers business management, advanced plumbing systems, and code interpretation.",
          type: "master",
          price: 0,
          duration: "16 weeks", 
          lessons: 58,
          isActive: false, // Coming soon
          level: "advanced",
          thumbnail: "/api/placeholder/300/200"
        }
      ];
      
      res.json(fallbackCourses);
    }
  });

  app.get("/api/courses/:courseId", async (req, res) => {
    try {
      const { courseId } = req.params;
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/courses/:courseId/enroll", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { courseId } = req.params;
      const userId = (req.user as any).id;
      
      const enrollment = await storage.enrollUser(userId, courseId);
      res.json(enrollment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/enrollments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const enrollments = await storage.getUserEnrollments(userId);
      res.json(enrollments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Section progress routes
  app.get("/api/section-progress/:courseId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { courseId } = req.params;
      const userId = (req.user as any).id;
      const user = req.user as any;
      
      // Admin allowlist - only your specific email gets admin access
      const ALLOWED_ADMIN_EMAILS = ['admin@latrainer.com'];
      const isSuperAdmin = ALLOWED_ADMIN_EMAILS.includes(user.email?.toLowerCase());
      
      // Get all course content to determine sections
      const content = await storage.getCourseContent(courseId);
      const sections = [...new Set(content.map(c => c.section))].sort((a, b) => Number(a) - Number(b));
      
      const sectionStatus = [];
      
      for (const section of sections) {
        const sectionNum = Number(section);
        // Students must complete quizzes with 70%+ to unlock sections (except section 101)
        // Only super admins bypass this requirement
        const isUnlocked = isSuperAdmin || await storage.isSectionUnlocked(userId, courseId, 1, sectionNum);
        
        sectionStatus.push({
          section: sectionNum,
          isUnlocked,
          isAdmin: isSuperAdmin
        });
      }
      
      res.json(sectionStatus);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Job routes
  app.get("/api/jobs", requireStudentEnrollment, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      
      const result = await storage.getJobs(page, limit, search);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/jobs", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const jobData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(jobData);
      res.json(job);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Employer job posting routes
  app.post("/api/employers/register", async (req, res) => {
    try {
      const employerData = req.body;
      
      // Check if employer already exists
      const existingEmployer = await storage.getEmployerByEmail(employerData.contactEmail);
      if (existingEmployer) {
        return res.status(400).json({ message: "Employer with this email already exists" });
      }
      
      const employer = await storage.createEmployer(employerData);
      
      // Start automated email sequence for new employer
      await emailAutomation.queueEmailSequence(
        employer.contactEmail,
        employer.contactName,
        "employer_onboarding"
      );
      
      res.status(201).json({ 
        message: "Employer registration successful", 
        employerId: employer.id 
      });
    } catch (error: any) {
      console.error("Error registering employer:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create payment intent for job postings with bulk discount pricing
  app.post("/api/employers/payment-intent", async (req, res) => {
    try {
      const { quantity, planType } = req.body;
      
      if (!quantity || !planType) {
        return res.status(400).json({ message: "Quantity and plan type are required" });
      }
      
      // Base pricing
      const basePrice = planType === 'premium' ? 89 : 49;
      
      // Calculate bulk discount
      let discount = 0;
      if (quantity >= 10) discount = 0.25; // 25% off for 10+
      else if (quantity >= 5) discount = 0.15; // 15% off for 5+
      else if (quantity >= 3) discount = 0.10; // 10% off for 3+
      
      const unitPrice = basePrice * (1 - discount);
      const totalAmount = unitPrice * quantity;
      const totalSavings = (basePrice * quantity) - totalAmount;
      
      // Create payment intent with calculated amount
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          service: 'job-postings',
          planType,
          quantity: quantity.toString(),
          unitPrice: unitPrice.toFixed(2),
          originalPrice: basePrice.toString(),
          discount: (discount * 100).toFixed(0) + '%',
          totalSavings: totalSavings.toFixed(2)
        }
      });
      
      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: totalAmount,
        unitPrice,
        totalSavings,
        discount: discount * 100,
        metadata: {
          planType,
          quantity,
          unitPrice: unitPrice.toFixed(2),
          originalPrice: basePrice,
          discountPercent: discount * 100
        }
      });
    } catch (error: any) {
      console.error("Error creating payment intent for job postings:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/employers/:employerId/jobs", async (req, res) => {
    try {
      const { employerId } = req.params;
      const jobData = req.body;
      
      // Verify employer exists
      const employer = await storage.getEmployer(employerId);
      if (!employer) {
        return res.status(404).json({ message: "Employer not found" });
      }
      
      // Process requirements and benefits
      const requirements = Array.isArray(jobData.requirements) 
        ? jobData.requirements 
        : (jobData.requirements ? [jobData.requirements] : []);
      const benefits = Array.isArray(jobData.benefits) 
        ? jobData.benefits 
        : (jobData.benefits ? [jobData.benefits] : []);

      // AI review for auto-approval
      const aiReview = await reviewJobPosting(
        jobData.title,
        jobData.description,
        requirements,
        employer.companyName
      );

      // Auto-approve if AI determines it's a legitimate plumbing job
      const status = aiReview.isApproved ? 'approved' : 'pending';

      // Create job with AI-determined status
      const job = await storage.createJob({
        ...jobData,
        employerId,
        company: employer.companyName,
        contactEmail: employer.contactEmail,
        requirements,
        benefits,
        status,
        // Add AI review info as metadata if needed
        rejectionReason: aiReview.isApproved ? null : `AI Review: ${aiReview.reasoning}`
      });
      
      res.status(201).json({ 
        message: aiReview.isApproved 
          ? "Job posting approved and published!" 
          : "Job posting submitted for manual review", 
        jobId: job.id,
        status: status,
        aiReview: {
          isPlumbingRelated: aiReview.isPlumbingRelated,
          qualityScore: aiReview.qualityScore,
          concerns: aiReview.concerns,
          recommendations: aiReview.recommendations
        }
      });
    } catch (error: any) {
      console.error("Error creating job:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin job approval routes (temporarily remove auth until implemented)
  app.get("/api/admin/jobs/pending", async (req, res) => {
    try {
      // Check if user is admin (you might want to add an admin role check)
      const jobs = await storage.getPendingJobs();
      res.json(jobs);
    } catch (error: any) {
      console.error("Error fetching pending jobs:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/jobs/:jobId/approve", async (req, res) => {
    try {
      const { jobId } = req.params;
      // TODO: Add admin authentication check
      const job = await storage.approveJob(jobId, "admin");
      
      // Send approval email to employer (you could add email service here)
      res.json({ message: "Job approved successfully", job });
    } catch (error: any) {
      console.error("Error approving job:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/jobs/:jobId/reject", async (req, res) => {
    try {
      const { jobId } = req.params;
      const { rejectionReason } = req.body;
      
      const job = await storage.rejectJob(jobId, rejectionReason);
      
      // Send rejection email to employer (you could add email service here)
      res.json({ message: "Job rejected", job });
    } catch (error: any) {
      console.error("Error rejecting job:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Employer analytics routes
  app.get("/api/employer/:employerId/jobs", async (req, res) => {
    try {
      const { employerId } = req.params;
      
      // Verify employer exists
      const employer = await storage.getEmployer(employerId);
      if (!employer) {
        return res.status(404).json({ message: "Employer not found" });
      }
      
      // Get all jobs for this employer with their applications
      const jobsWithApplications = await storage.getEmployerJobsWithApplications(employerId);
      
      res.json(jobsWithApplications);
    } catch (error: any) {
      console.error("Error fetching employer jobs:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get specific job applications for an employer
  app.get("/api/employer/:employerId/jobs/:jobId/applications", async (req, res) => {
    try {
      const { employerId, jobId } = req.params;
      
      // Verify employer owns this job
      const job = await storage.getJob(jobId);
      if (!job || job.employerId !== employerId) {
        return res.status(404).json({ message: "Job not found or unauthorized" });
      }
      
      const applications = await storage.getJobApplicationsWithUserDetails(jobId);
      
      res.json(applications);
    } catch (error: any) {
      console.error("Error fetching job applications:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/jobs/:jobId/apply", requireStudentEnrollment, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { jobId } = req.params;
      const userId = (req.user as any).id;
      const applicationData = insertJobApplicationSchema.parse({
        ...req.body,
        jobId,
        userId
      });
      
      const application = await storage.createJobApplication(applicationData);
      res.json(application);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Job Management Routes
  app.get("/api/employer/jobs", async (req, res) => {
    // TODO: Add authentication check when employer auth is implemented
    try {
      // For now, return all jobs - in production this would be filtered by employer
      const jobs = await storage.getAllJobsWithDetails();
      res.json(jobs);
    } catch (error: any) {
      console.error("Error fetching employer jobs:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/jobs/:jobId", async (req, res) => {
    // TODO: Add authentication check when employer auth is implemented
    try {
      const { jobId } = req.params;
      const updateData = req.body;
      
      const updatedJob = await storage.updateJob(jobId, updateData);
      res.json(updatedJob);
    } catch (error: any) {
      console.error("Error updating job:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/jobs/:jobId/status", async (req, res) => {
    // TODO: Add authentication check when employer auth is implemented
    try {
      const { jobId } = req.params;
      const { status } = req.body;
      
      const updatedJob = await storage.updateJobStatus(jobId, status);
      res.json(updatedJob);
    } catch (error: any) {
      console.error("Error updating job status:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // AI Mentor routes
  app.post("/api/mentor/chat", requireActiveSubscription, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { message, context, conversationId } = req.body;
      const userId = (req.user as any).id;

      // Try to get answer from database first for fast responses
      const chatAnswer = await storage.getChatAnswer(message, context?.contentId);
      
      let response = "";
      if (chatAnswer) {
        response = chatAnswer.answer;
      } else {
        // Use OpenAI for questions not in the database
        try {
          const aiResponse = await getMentorResponse(message, context);
          response = aiResponse;
        } catch (aiError) {
          console.error("OpenAI error:", aiError);
          response = `Great question about Louisiana Plumbing Code Section 101! 🎓\n\nI can help you learn about:\n\n• **Enforcement Authority** - Who enforces the code and how delegation works\n• **Legal Basis** - The statutory foundation (R.S. 36:258(B) and Title 40)\n• **Historical Notes** - Promulgation in 2002 and 2012 amendments\n• **Delegation Process** - How authority flows from state to local level\n• **Code Violations** - Stop-work orders and enforcement procedures\n\nTry clicking one of the suggested questions below, or ask me something specific about code administration!`;
        }
      }

      res.json({ response });
    } catch (error: any) {
      console.error("Mentor chat error:", error);
      res.status(500).json({ message: "Sorry, I'm having trouble right now. Please try asking about enforcement authority, legal basis, or historical notes." });
    }
  });

  // Generate TTS for chat responses
  app.post("/api/mentor/tts", requireActiveSubscription, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { text, messageId } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const { generateAudio } = await import("./openai");
      const audioUrl = await generateAudio(text, `chat-${messageId || Date.now()}`);
      
      res.json({ audioUrl });
    } catch (error: any) {
      console.error("TTS generation error:", error);
      res.status(500).json({ message: "Failed to generate audio" });
    }
  });

  app.get("/api/mentor/conversations", requireActiveSubscription, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const conversations = await storage.getUserMentorConversations(userId);
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin endpoint to import chat content
  app.post("/api/admin/import-chat-content", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Check if user is admin (you may want to add proper admin role checking)
    const user = req.user as any;
    if (user.id !== 'admin-test-user' && !user.email?.includes('admin')) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { content } = req.body;
      
      if (!Array.isArray(content)) {
        return res.status(400).json({ message: "Content must be an array" });
      }

      let imported = 0;
      for (const item of content) {
        try {
          await storage.createChatAnswer({
            question: item.question,
            answer: item.answer,
            keywords: item.keywords,
            contentId: item.contentId
          });
          imported++;
        } catch (error) {
          console.warn(`Failed to import item: ${item.question}`, error);
        }
      }

      res.json({ 
        message: `Successfully imported ${imported} out of ${content.length} chat answers`,
        imported,
        total: content.length
      });
    } catch (error: any) {
      console.error("Content import error:", error);
      res.status(500).json({ message: "Failed to import content" });
    }
  });

  // Photo upload and analysis
  app.post("/api/photos/upload", requireActiveSubscription, upload.single('photo'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = (req.user as any).id;
      const filename = req.file.filename;
      const filePath = req.file.path;
      
      // Convert to base64 for AI analysis
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString('base64');
      
      // Analyze photo with AI
      const analysis = await analyzePhoto(base64Image);
      
      // Save to database
      const upload = await storage.createPhotoUpload(
        userId,
        filename,
        `/uploads/${filename}`,
        analysis
      );

      res.json(upload);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Plan upload and analysis
  app.post("/api/plans/upload", requireActiveSubscription, upload.single('plan'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = (req.user as any).id;
      const filename = req.file.filename;
      const filePath = req.file.path;
      
      // Convert to base64 for AI analysis
      const fileBuffer = fs.readFileSync(filePath);
      const base64File = fileBuffer.toString('base64');
      
      // Analyze plans with AI
      const analysis = await analyzePlans(base64File);
      
      // Save to database
      const upload = await storage.createPlanUpload(
        userId,
        filename,
        `/uploads/${filename}`,
        analysis.materialList,
        analysis.codeCompliance
      );

      res.json({
        ...upload,
        materialList: analysis.materialList,
        codeCompliance: analysis.codeCompliance,
        totalEstimatedCost: analysis.totalEstimatedCost
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Calculator routes
  app.post("/api/calculator/pipe-size", async (req, res) => {
    try {
      const { fixtureUnits, pipeLength, material } = req.body;
      
      if (!fixtureUnits || !pipeLength || !material) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const result = await calculatePipeSize(
        parseInt(fixtureUnits),
        parseInt(pipeLength),
        material
      );
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Serve uploaded files
  app.get('/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  });

  // Serve public files (PDFs, code books, etc.) from uploads directory
  app.get("/public-objects/:filePath(*)", (req, res) => {
    const filePath = req.params.filePath;
    const fullPath = path.join(process.cwd(), 'uploads', 'public', filePath);
    
    if (fs.existsSync(fullPath)) {
      res.sendFile(fullPath);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  // API endpoint to list available code books
  app.get("/api/code-books", async (req, res) => {
    try {
      // List common code book file names
      const codeBooks = [
        {
          name: "Louisiana Plumbing Code 2024",
          filename: "louisiana-plumbing-code-2024.pdf",
          size: "12.5 MB",
          description: "Complete Louisiana State Plumbing Code"
        },
        {
          name: "Louisiana Backflow Prevention",
          filename: "louisiana-backflow-prevention.pdf", 
          size: "3.2 MB",
          description: "Backflow prevention regulations and requirements"
        },
        {
          name: "Natural Gas Installation Code",
          filename: "natural-gas-installation-code.pdf",
          size: "8.1 MB", 
          description: "Natural gas piping installation standards"
        }
      ];

      // Check which files actually exist in uploads/public directory
      const availableBooks = [];
      for (const book of codeBooks) {
        const filePath = path.join(process.cwd(), 'uploads', 'public', book.filename);
        if (fs.existsSync(filePath)) {
          availableBooks.push({
            ...book,
            url: `/public-objects/${book.filename}`
          });
        }
      }
      
      res.json(availableBooks);
    } catch (error) {
      console.error("Error listing code books:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Student interest/lead capture endpoint
  app.post("/api/student-interest", async (req, res) => {
    try {
      const { email, firstName, lastName, phone } = req.body;
      
      if (!email || !firstName) {
        return res.status(400).json({ message: "Email and first name are required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Start automated email sequence for potential student
      const fullName = `${firstName} ${lastName || ''}`.trim();
      await emailAutomation.queueEmailSequence(
        email,
        fullName,
        "student_enrollment"
      );
      
      res.status(201).json({ 
        message: "Interest recorded successfully! Check your email for course information.",
        success: true
      });
    } catch (error: any) {
      console.error("Error recording student interest:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Email unsubscribe endpoint
  app.post("/api/unsubscribe", async (req, res) => {
    try {
      const { email, campaignType } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      await emailAutomation.unsubscribe(email, campaignType);
      
      res.json({ 
        message: "Successfully unsubscribed from email campaigns",
        success: true
      });
    } catch (error: any) {
      console.error("Error unsubscribing:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get bulk pricing tiers
  app.get("/api/bulk-pricing/tiers", async (req, res) => {
    try {
      const tiers = await bulkPricingService.getBulkPricingTiers();
      res.json({ tiers });
    } catch (error: any) {
      console.error("Error fetching bulk pricing tiers:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Calculate bulk pricing for a quote
  app.post("/api/bulk-pricing/calculate", async (req, res) => {
    try {
      const { studentCount, courseIds = ["journeyman"] } = req.body;
      
      if (!studentCount || studentCount < 1) {
        return res.status(400).json({ message: "Student count is required and must be greater than 0" });
      }
      
      const pricing = await bulkPricingService.calculateBulkPricing(studentCount, courseIds);
      res.json({ pricing });
    } catch (error: any) {
      console.error("Error calculating bulk pricing:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create bulk enrollment request (requires authentication)
  app.post("/api/bulk-enrollment/request", async (req, res) => {
    try {
      const { 
        employerId, 
        studentEmails, 
        courseIds = ["journeyman"], 
        contactEmail, 
        contactPhone, 
        notes, 
        requestedStartDate 
      } = req.body;
      
      if (!employerId || !studentEmails || !Array.isArray(studentEmails) || studentEmails.length === 0) {
        return res.status(400).json({ 
          message: "Employer ID and student emails array are required" 
        });
      }
      
      if (!contactEmail) {
        return res.status(400).json({ message: "Contact email is required" });
      }

      // Validate student email format
      for (const student of studentEmails) {
        if (!student.email || !student.firstName) {
          return res.status(400).json({ 
            message: "Each student must have email and firstName" 
          });
        }
      }

      const result = await bulkPricingService.createBulkEnrollmentRequest(
        employerId,
        studentEmails,
        courseIds,
        contactEmail,
        contactPhone,
        notes,
        requestedStartDate ? new Date(requestedStartDate) : undefined
      );
      
      // Start automated email sequence for bulk enrollment follow-up
      await emailAutomation.queueEmailSequence(
        contactEmail,
        employerId, // Using employerId as name for now
        "bulk_enrollment"
      );

      res.status(201).json({ 
        message: "Bulk enrollment request created successfully! Check your email for follow-up information.",
        ...result
      });
    } catch (error: any) {
      console.error("Error creating bulk enrollment request:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get bulk enrollment requests for an employer
  app.get("/api/bulk-enrollment/requests/:employerId", async (req, res) => {
    try {
      const { employerId } = req.params;
      const requests = await bulkPricingService.getBulkEnrollmentRequests(employerId);
      res.json({ requests });
    } catch (error: any) {
      console.error("Error fetching bulk enrollment requests:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get student enrollments for a bulk request
  app.get("/api/bulk-enrollment/:requestId/students", async (req, res) => {
    try {
      const { requestId } = req.params;
      const students = await bulkPricingService.getBulkStudentEnrollments(requestId);
      res.json({ students });
    } catch (error: any) {
      console.error("Error fetching bulk student enrollments:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Approve bulk enrollment request (admin only)
  app.post("/api/bulk-enrollment/:requestId/approve", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { approvedBy } = req.body;
      
      if (!approvedBy) {
        return res.status(400).json({ message: "Approved by field is required" });
      }
      
      const updatedRequest = await bulkPricingService.approveBulkEnrollmentRequest(requestId, approvedBy);
      
      res.json({ 
        message: "Bulk enrollment request approved successfully",
        request: updatedRequest 
      });
    } catch (error: any) {
      console.error("Error approving bulk enrollment request:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Content import route
  app.post("/api/admin/import-content", async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!Array.isArray(content)) {
        return res.status(400).json({ message: "Invalid content format" });
      }

      // Get or create the Louisiana Plumbing course
      let courses = await storage.getCourses();
      let journeymanCourse = courses.find(c => c.type === "journeyman") || courses[0];
      
      // If no course exists, create the default Louisiana Plumbing course
      if (!journeymanCourse) {
        const defaultCourse = insertCourseSchema.parse({
          title: "Louisiana Journeyman Prep",
          description: "Comprehensive Louisiana plumbing code certification preparation course covering all aspects of state plumbing regulations and best practices.",
          type: "journeyman",
          price: "39.99",
          duration: 40,
          lessons: 0,
          practiceQuestions: 0,
          isActive: true
        });
        
        journeymanCourse = await storage.createCourse(defaultCourse);
      }

      const imported = [];
      for (const item of content) {
        const courseContentData = insertCourseContentSchema.parse({
          courseId: journeymanCourse.id,
          title: item.title,
          type: item.type,
          chapter: item.chapter,
          section: item.section,
          content: { description: item.content, text: item.content },
          isActive: true,
          sortOrder: 0
        });

        const createdContent = await storage.createCourseContent(courseContentData);
        imported.push(createdContent);
      }

      // Update course statistics after import
      await storage.updateCourseStatsAutomatically(journeymanCourse.id);
      const courseStats = await storage.getCourseContentStats(journeymanCourse.id);

      res.json({ 
        message: "Content imported successfully", 
        count: imported.length,
        content: imported,
        courseStats: courseStats
      });
    } catch (error: any) {
      console.error('Content import error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // QuizGecko import route (legacy)
  app.post("/api/admin/import-quizgecko", async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!Array.isArray(content)) {
        return res.status(400).json({ message: "Invalid content format" });
      }

      // Get or create the Louisiana Plumbing course
      let courses = await storage.getCourses();
      let journeymanCourse = courses.find(c => c.type === "journeyman") || courses[0];
      
      // If no course exists, create the default Louisiana Plumbing course
      if (!journeymanCourse) {
        const defaultCourse = insertCourseSchema.parse({
          title: "Louisiana Journeyman Prep",
          description: "Comprehensive Louisiana plumbing code certification preparation course covering all aspects of state plumbing regulations and best practices.",
          type: "journeyman",
          price: "39.99",
          duration: 40,
          lessons: 0,
          practiceQuestions: 0,
          isActive: true
        });
        
        journeymanCourse = await storage.createCourse(defaultCourse);
      }

      const imported = [];
      for (const item of content) {
        const courseContentData = insertCourseContentSchema.parse({
          courseId: journeymanCourse.id,
          title: item.title,
          type: item.type,
          chapter: item.chapter,
          section: item.section,
          quizgeckoUrl: item.url,
          content: { description: `${item.type} content for ${item.title}`, url: item.url },
          isActive: true,
          sortOrder: 0
        });

        const createdContent = await storage.createCourseContent(courseContentData);
        imported.push(createdContent);
      }

      // Update course statistics after import
      await storage.updateCourseStatsAutomatically(journeymanCourse.id);
      const courseStats = await storage.getCourseContentStats(journeymanCourse.id);

      res.json({ 
        message: "Content imported successfully", 
        count: imported.length,
        content: imported,
        courseStats: courseStats
      });
    } catch (error: any) {
      console.error('QuizGecko import error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get private code books
  app.get("/api/admin/code-books", async (req, res) => {
    try {
      const codeBooks = await storage.getPrivateCodeBooks();
      
      const formattedBooks = codeBooks.map(book => ({
        id: book.id,
        name: book.originalName,
        size: `${(book.fileSize / 1024 / 1024).toFixed(1)} MB`,
        uploadedAt: book.createdAt,
        filePath: book.filePath
      }));

      res.json(formattedBooks);
    } catch (error: any) {
      console.error('Get private code books error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Upload private code book
  app.post("/api/admin/code-books/upload", upload.single('codebook'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // For now, we'll use a simple user ID (in a real app, get from session)
      const uploadedBy = "admin"; // In real app: req.user?.id || "admin"

      const codeBookData = insertPrivateCodeBookSchema.parse({
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        contentType: req.file.mimetype,
        uploadedBy: uploadedBy
      });

      const codeBook = await storage.createPrivateCodeBook(codeBookData);

      res.json({ 
        message: "Code book uploaded successfully",
        codeBook: {
          id: codeBook.id,
          name: codeBook.originalName,
          size: `${(codeBook.fileSize / 1024 / 1024).toFixed(1)} MB`,
          uploadedAt: codeBook.createdAt
        }
      });
    } catch (error: any) {
      console.error('Code book upload error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Content generation route (placeholder for future AI integration)
  app.post("/api/admin/generate-content", async (req, res) => {
    try {
      const { contentType, topic } = req.body;
      
      // This is a placeholder - you would integrate with AI service here
      const generatedContent = {
        content: `<h1>${topic}</h1><p>Generated ${contentType} content for ${topic}. This is a placeholder that would be replaced with actual AI-generated content based on your uploaded code books.</p>`,
        html: `<div class="generated-content"><h2>${topic}</h2><p>This ${contentType} was generated based on your private code book reference materials.</p><ul><li>Learning objectives would be listed here</li><li>Key concepts and definitions</li><li>Code references and requirements</li></ul></div>`
      };

      res.json(generatedContent);
    } catch (error: any) {
      console.error('Content generation error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Content extraction route
  app.post("/api/extract-content/:contentId", async (req, res) => {
    try {
      const { contentId } = req.params;
      
      // Get the content record
      const content = await storage.getCourseContentById(contentId);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      // Extract content based on type
      const extractedContent = await contentExtractor.extractFromQuizGecko(
        content.quizgeckoUrl || "", // Use the stored QuizGecko URL
        content.type
      );

      if (!extractedContent) {
        return res.status(500).json({ message: "Failed to extract content" });
      }

      // Update the content record with extracted data
      const updatedContent = await storage.updateCourseContent(contentId, {
        content: {
          ...(content.content as object || {}),
          extracted: extractedContent.content,
          extractedAt: new Date().toISOString()
        }
      });

      res.json({
        message: "Content extracted successfully",
        content: updatedContent
      });
    } catch (error: any) {
      console.error('Content extraction error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get extracted content for display
  app.get("/api/content/:contentId/display", async (req, res) => {
    try {
      const { contentId } = req.params;
      
      const content = await storage.getCourseContentById(contentId);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      // If content hasn't been extracted yet, extract it now
      if (!(content.content as any)?.extracted) {
        const extractedContent = await contentExtractor.extractFromQuizGecko(
          content.quizgeckoUrl || "", // Use the stored QuizGecko URL
          content.type
        );

        if (extractedContent) {
          const updatedContent = await storage.updateCourseContent(contentId, {
            content: {
              ...(content.content as object || {}),
              extracted: extractedContent.content,
              extractedAt: new Date().toISOString()
            }
          });
          
          return res.json(updatedContent);
        }
      }

      res.json(content);
    } catch (error: any) {
      console.error('Get content error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get course content for display
  app.get("/api/courses/:courseId/content", async (req, res) => {
    try {
      const { courseId } = req.params;
      
      // Resolve course ID (handle friendly URLs like "journeyman-prep")
      const resolvedCourseId = await resolveCourseId(courseId);
      if (!resolvedCourseId) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      let content = await storage.getCourseContent(resolvedCourseId);
      
      // If content is empty for the Louisiana Journeyman Prep course, auto-seed it
      if (content.length === 0 && resolvedCourseId === "5f02238b-afb2-4e7f-a488-96fb471fee56") {
        console.log("Course content empty, auto-seeding...");
        await seedCourseContent();
        content = await storage.getCourseContent(resolvedCourseId);
      }
      
      // Add cache-busting headers to ensure fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.json(content);
    } catch (error: any) {
      console.error('Get course content error:', error);
      res.status(400).json({ message: error.message });
    }
  });


  // Generate AI audio for podcast content  
  app.post("/api/generate-audio/:id", async (req, res) => {
    // Check authentication
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check subscription for non-admin users
    const user = req.user as any;
    const isAdmin = user.email?.includes('admin') || user.email === 'admin@latrainer.com' || user.email === 'admin@laplumbprep.com';
    
    if (!isAdmin) {
      // Apply subscription requirement for regular users
      const hasActiveSubscription = user.subscriptionTier && user.subscriptionTier !== 'free' && user.subscriptionStatus === 'active';
      if (!hasActiveSubscription) {
        return res.status(402).json({ error: 'Active subscription required for audio generation' });
      }
    }
    try {
      const { id } = req.params;
      const content = await storage.getCourseContentById(id);
      
      if (!content) {
        return res.status(404).json({ error: 'Content not found' });
      }

      const contentData = content.content as any;
      
      // Get text for audio generation from multiple sources
      let textForAudio = '';
      if (contentData?.extracted?.transcript) {
        textForAudio = contentData.extracted.transcript;
      } else if (contentData?.extracted?.content) {
        textForAudio = contentData.extracted.content;
      } else if (contentData?.extracted?.text) {
        textForAudio = contentData.extracted.text;
      }
      
      if (!textForAudio || textForAudio.trim().length === 0) {
        return res.status(400).json({ error: 'No content available for audio generation' });
      }
      
      // Clean up text for audio (remove markdown/HTML)
      textForAudio = textForAudio
        .replace(/#+\s*/g, '') // Remove markdown headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .trim();

      const { generateAudio } = await import('./openai');
      const audioUrl = await generateAudio(textForAudio, id);
      
      // Update content with audio URL
      await storage.updateContentAudio(id, audioUrl);
      
      res.json({ audioUrl });
    } catch (error: any) {
      console.error('Generate audio error:', error);
      res.status(500).json({ error: 'Failed to generate audio' });
    }
  });

  // Study session tracking endpoints
  app.post("/api/study-sessions/start", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { contentId, contentType } = req.body;
      const userId = (req.user as any).id;

      if (!contentId || !contentType) {
        return res.status(400).json({ message: "contentId and contentType are required" });
      }

      const session = await storage.startStudySession(userId, contentId, contentType);
      res.json(session);
    } catch (error: any) {
      console.error("Start study session error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/study-sessions/:sessionId/end", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { sessionId } = req.params;
      const session = await storage.endStudySession(sessionId);
      res.json(session);
    } catch (error: any) {
      console.error("End study session error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/study-sessions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const { contentId } = req.query;
      
      const sessions = await storage.getUserStudySessions(userId, contentId as string);
      res.json(sessions);
    } catch (error: any) {
      console.error("Get study sessions error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/study-sessions/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const stats = await storage.getStudySessionStats(userId);
      res.json(stats);
    } catch (error: any) {
      console.error("Get study session stats error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Quiz attempt endpoints
  app.post("/api/quiz-attempts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const attempt = await storage.createQuizAttempt({ ...req.body, userId });
      
      // Update section progress if quiz passed
      if (attempt.passed) {
        await storage.updateSectionProgress(
          userId,
          attempt.courseId,
          attempt.chapter,
          attempt.section,
          {
            quizPassed: true,
            highestScore: attempt.score,
            attemptCount: 1, // This will be incremented if already exists
            lastAttemptAt: new Date(),
          }
        );
        
        // Unlock next section
        await storage.unlockNextSection(userId, attempt.courseId, attempt.chapter, attempt.section);
      }
      
      res.json(attempt);
    } catch (error: any) {
      console.error("Create quiz attempt error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/quiz-attempts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const { contentId } = req.query;
      
      const attempts = await storage.getUserQuizAttempts(userId, contentId as string);
      res.json(attempts);
    } catch (error: any) {
      console.error("Get quiz attempts error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/quiz-attempts/latest/:contentId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const { contentId } = req.params;
      
      const attempt = await storage.getLatestQuizAttempt(userId, contentId);
      res.json(attempt);
    } catch (error: any) {
      console.error("Get latest quiz attempt error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Section progress endpoints (removed duplicate - keeping the comprehensive one above)

  app.get("/api/section-progress/:courseId/:chapter/:section/unlocked", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const { courseId, chapter, section } = req.params;
      
      const isUnlocked = await storage.isSectionUnlocked(
        userId,
        courseId,
        parseInt(chapter),
        parseInt(section)
      );
      
      res.json({ isUnlocked });
    } catch (error: any) {
      console.error("Check section unlock error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Re-extract quiz content to use new structured format
  app.post("/api/content/:id/reextract-quiz", async (req, res) => {
    try {
      const contentId = req.params.id;
      const contentItems = await storage.getCourseContent(contentId);
      const content = Array.isArray(contentItems) ? contentItems[0] : contentItems;
      
      if (!content || content.type !== 'quiz') {
        return res.status(404).json({ message: "Quiz content not found" });
      }

      // Get the text content from the extracted field
      const contentData = content.content as any;
      const textContent = contentData?.extracted?.content || '';
      
      if (textContent) {
        // Use our improved quiz parser
        const { ContentExtractor } = require('./content-extractor');
        const extractor = new ContentExtractor();
        
        // Parse the text content using our new method
        const questions = extractor.extractQuestionsFromText(textContent, content.title || '');
        
        if (questions.length > 0) {
          // Update the content with structured questions
          const updatedContent = {
            ...content.content,
            extracted: {
              ...content.content.extracted,
              questions: questions,
              totalQuestions: questions.length,
              passingScore: 70
            }
          };
          
          await storage.updateCourseContent(contentId, { content: updatedContent });
          res.json({ message: `Successfully extracted ${questions.length} questions`, questions });
        } else {
          res.status(400).json({ message: "No questions could be extracted from content" });
        }
      } else {
        res.status(400).json({ message: "No text content found to extract from" });
      }
    } catch (error: any) {
      console.error("Re-extract quiz error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Email routes
  app.post("/api/referrals/send-invitation", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { email } = req.body;
      const user = req.user as any;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Generate referral code if user doesn't have one
      let referralCode = user.referralCode;
      if (!referralCode) {
        referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await storage.updateUser(user.id, { referralCode });
      }

      // Create referral link
      const referralLink = `${process.env.REPLIT_DEV_DOMAIN || 'https://laplumbprep.com'}/register?ref=${referralCode}`;

      // Send referral invitation email
      await emailService.sendReferralInvitation({
        toEmail: email,
        referrerName: `${user.firstName || user.username}`,
        referralCode,
        referralLink
      });

      res.json({ 
        message: "Referral invitation sent successfully!",
        referralCode,
        referralLink
      });
    } catch (error: any) {
      console.error('Send referral invitation error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/support/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Send support notification
      await emailService.sendSupportNotification({
        fromEmail: email,
        fromName: name,
        subject,
        message,
        userInfo: req.isAuthenticated() ? req.user : null
      });

      res.json({ message: "Support request sent successfully!" });
    } catch (error: any) {
      console.error('Send support request error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Amazon product extraction route
  app.post("/api/amazon/extract", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url || (!url.includes('amazon.com') && !url.includes('amzn.to'))) {
        return res.status(400).json({ message: "Please provide a valid Amazon URL" });
      }

      // Use node-fetch to get the page content
      const fetch = await import('node-fetch');
      const cheerio = await import('cheerio');
      
      const response = await fetch.default(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract product information using jQuery-like selectors
      const name = $('#productTitle').text().trim() || 
                  $('[data-automation-id="product-title"]').text().trim() ||
                  $('h1.a-size-large').text().trim();

      // Price extraction
      let price = '';
      const priceWhole = $('.a-price-whole').first().text().trim();
      const priceFraction = $('.a-price-fraction').first().text().trim();
      if (priceWhole && priceFraction) {
        price = `${priceWhole}.${priceFraction}`;
      } else {
        price = $('.a-price .a-offscreen').first().text().trim() ||
               $('[data-automation-id="price"]').first().text().trim();
      }
      price = price.replace(/[^0-9.]/g, '');

      // Image
      const imageUrl = $('#landingImage').attr('src') || 
                      $('[data-automation-id="product-image"]').attr('src') ||
                      $('.a-dynamic-image').first().attr('src') || '';

      // Description
      let description = $('#feature-bullets ul').text().trim() || 
                       $('[data-automation-id="product-overview"]').text().trim() ||
                       $('#productDescription p').text().trim();
      
      // Clean up description
      description = description.replace(/\s+/g, ' ').trim();

      // Brand
      const brand = $('#bylineInfo_feature_div .a-color-secondary').text().trim() ||
                   $('[data-automation-id="product-brand"]').text().trim() ||
                   $('.po-brand .po-break-word').text().trim();

      // Features
      const features: string[] = [];
      $('#feature-bullets li, .a-unordered-list li').each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 10 && !text.includes('Make sure') && !text.includes('See more')) {
          features.push(text);
        }
      });

      // Add the affiliate tag to the URL
      const affiliateUrl = url.includes('tag=') ? url : 
        url + (url.includes('?') ? '&' : '?') + 'tag=laplumbprep-20';

      const productData = {
        name: name || '',
        price: price || '',
        imageUrl: imageUrl || '',
        description: description || '',
        brand: brand || '',
        features: features.slice(0, 8),
        amazonUrl: affiliateUrl,
        shortDescription: description.substring(0, 150) + (description.length > 150 ? '...' : ''),
        success: true
      };

      res.json(productData);

    } catch (error: any) {
      console.error('Amazon extraction error:', error);
      res.status(500).json({ 
        message: "Failed to extract product information from Amazon URL",
        error: error.message,
        success: false
      });
    }
  });

  // E-commerce API Routes

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const category = req.query.category as string;
      const search = req.query.search as string;
      
      const result = await storage.getProducts(category, search, page, limit);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/featured", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 8;
      const products = await storage.getFeaturedProducts(limit);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      // Ensure arrays are properly formatted
      const cleanedBody = {
        ...req.body,
        features: Array.isArray(req.body.features) ? req.body.features : [],
        tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      };
      
      const productData = insertProductSchema.parse(cleanedBody);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { id } = req.params;
      const updates = req.body;
      const product = await storage.updateProduct(id, updates);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Cart routes
  app.get("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const { productId, quantity } = req.body;
      const cartItem = await storage.addToCart(userId, productId, quantity);
      res.json(cartItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/cart/:productId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const { productId } = req.params;
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(userId, productId, quantity);
      res.json(cartItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/cart/:productId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const { productId } = req.params;
      await storage.removeFromCart(userId, productId);
      res.json({ message: "Item removed from cart" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      await storage.clearCart(userId);
      res.json({ message: "Cart cleared" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Product review routes
  app.get("/api/products/:productId/reviews", async (req, res) => {
    try {
      const { productId } = req.params;
      const reviews = await storage.getProductReviews(productId);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/products/:productId/reviews", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { productId } = req.params;
      const userId = (req.user as any).id;
      const reviewData = insertProductReviewSchema.parse({
        ...req.body,
        productId,
        userId
      });
      const review = await storage.createProductReview(reviewData);
      res.json(review);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ========================
  // REFERRAL ROUTES
  // ========================

  // Get user's referral statistics and earnings
  app.get("/api/referrals/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      let user = (req.user as any);
      
      // Generate referral code if user doesn't have one
      let referralCode = user.referralCode;
      if (!referralCode) {
        referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await storage.updateUser(userId, { referralCode });
        // Update the user object in the session
        user.referralCode = referralCode;
      }
      
      const [referrals, earnings] = await Promise.all([
        storage.getUserReferrals(userId),
        storage.getUserReferralEarnings(userId)
      ]);

      res.json({
        referralCode,
        planTier: user.subscriptionTier,
        totalReferrals: referrals.length,
        earnings,
        recentReferrals: referrals.slice(0, 10) // Last 10 referrals
      });
    } catch (error: any) {
      console.error('Error fetching referral stats:', error);
      res.status(500).json({ message: "Error fetching referral statistics" });
    }
  });

  // Process a new referral signup
  app.post("/api/referrals/process", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { referredUserId, referredPlanTier, referredPlanPrice } = req.body;
      const referrerId = (req.user as any).id;
      const referrerUser = await storage.getUser(referrerId);
      
      if (!referrerUser) {
        return res.status(404).json({ message: "Referrer not found" });
      }

      if (!isValidSubscriptionTier(referredPlanTier)) {
        return res.status(400).json({ message: "Invalid subscription tier" });
      }

      // Calculate commission based on referrer's tier cap
      const commission = calculateReferralCommission(
        referrerUser.subscriptionTier,
        referredPlanTier
      );

      const referralData = insertReferralSchema.parse({
        referrerId,
        referredId: referredUserId,
        referrerPlanTier: referrerUser.subscriptionTier,
        referredPlanTier,
        referredPlanPrice: referredPlanPrice.toString(),
        commissionAmount: commission.commissionAmount.toString(),
        eligibleTier: commission.eligibleTier
      });

      const referral = await storage.createReferral(referralData);
      
      res.json({
        success: true,
        referral,
        commission: {
          amount: commission.commissionAmount,
          eligibleTier: commission.eligibleTier,
          originalPrice: commission.eligiblePrice
        }
      });
    } catch (error: any) {
      console.error('Error processing referral:', error);
      res.status(500).json({ message: "Error processing referral" });
    }
  });

  // Get referral commission preview (what user would earn for different tiers)
  app.get("/api/referrals/commission-preview", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = (req.user as any);
      const referrerTier = user.subscriptionTier;

      const previews = {
        basic: calculateReferralCommission(referrerTier, "basic"),
        professional: calculateReferralCommission(referrerTier, "professional"),
        master: calculateReferralCommission(referrerTier, "master")
      };

      res.json({
        referrerTier,
        commissionPreviews: previews,
        note: "Commission is capped at your current plan tier or lower"
      });
    } catch (error: any) {
      console.error('Error generating commission preview:', error);
      res.status(500).json({ message: "Error generating commission preview" });
    }
  });

  // Monthly commission tracking endpoints
  app.get("/api/referrals/monthly-commissions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const { month } = req.query;
      
      const commissions = await storage.getMonthlyCommissions(userId, month as string);
      
      res.json({
        commissions,
        total: commissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0),
        unpaid: commissions.filter(c => !c.isPaid).reduce((sum, c) => sum + Number(c.commissionAmount), 0)
      });
    } catch (error: any) {
      console.error('Error fetching monthly commissions:', error);
      res.status(500).json({ message: "Error fetching monthly commissions" });
    }
  });

  app.get("/api/referrals/monthly-earnings-summary", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      
      // Get all monthly commissions
      const allCommissions = await storage.getMonthlyCommissions(userId);
      
      // Group by month and calculate totals
      const monthlyBreakdown = allCommissions.reduce((acc, commission) => {
        const month = commission.commissionMonth;
        if (!acc[month]) {
          acc[month] = {
            month,
            total: 0,
            paid: 0,
            unpaid: 0,
            count: 0
          };
        }
        
        const amount = Number(commission.commissionAmount);
        acc[month].total += amount;
        acc[month].count += 1;
        
        if (commission.isPaid) {
          acc[month].paid += amount;
        } else {
          acc[month].unpaid += amount;
        }
        
        return acc;
      }, {} as Record<string, any>);
      
      const summary = {
        totalMonthlyEarnings: Object.values(monthlyBreakdown).reduce((sum: number, month: any) => sum + month.total, 0),
        unpaidMonthlyEarnings: Object.values(monthlyBreakdown).reduce((sum: number, month: any) => sum + month.unpaid, 0),
        monthlyBreakdown: Object.values(monthlyBreakdown).sort((a: any, b: any) => b.month.localeCompare(a.month))
      };
      
      res.json(summary);
    } catch (error: any) {
      console.error('Error fetching monthly earnings summary:', error);
      res.status(500).json({ message: "Error fetching monthly earnings summary" });
    }
  });

  // Lead Magnet Download API
  app.post("/api/lead-magnet/download", async (req, res) => {
    try {
      const { email, firstName, lastName, companyName, position } = req.body;
      
      if (!email || !firstName || !lastName || !companyName) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Store lead magnet download record
      const [leadRecord] = await db.insert(leadMagnetDownloads).values({
        email,
        firstName,
        lastName,
        companyName,
        position: position || null,
        leadSource: "website",
        emailSent: true
      }).returning();

      // Start lead nurture email sequence
      await emailAutomation.queueEmailSequence(
        email,
        `${firstName} ${lastName}`,
        "employer_onboarding"
      );

      // Send immediate download email with lead magnet
      await emailService.sendEmail({
        to: email,
        subject: "📋 Your FREE Louisiana Plumbing Code Guide + Bonus Tools",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🎉 Your Louisiana Code Guide is Ready!</h1>
            </div>
            
            <div style="padding: 30px; background: #f9fafb;">
              <p style="font-size: 18px; color: #374151;">Hi ${firstName},</p>
              
              <p style="color: #6b7280; line-height: 1.6;">
                Thank you for downloading our Louisiana Plumbing Code Quick Reference Guide! 
                This comprehensive resource will help you avoid costly code violations and stay compliant on every job.
              </p>
              
              <div style="background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #059669; margin-top: 0;">📥 Download Your Resources:</h2>
                <ul style="color: #374151; line-height: 1.8;">
                  <li><strong>Louisiana Plumbing Code Guide (15 pages)</strong> - Essential violations to avoid</li>
                  <li><strong>BONUS: Pipe Sizing Calculator Tool</strong> - Professional calculations made easy</li>
                  <li><strong>BONUS: Code Update Checklist</strong> - Stay current with 2024 changes</li>
                </ul>
                
                <div style="text-align: center; margin: 25px 0;">
                  <a href="${process.env.WEBSITE_URL || 'https://laplumbprep.com'}/downloads/louisiana-code-guide.pdf?email=${encodeURIComponent(email)}" 
                     style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    📥 Download Guide & Tools
                  </a>
                </div>
              </div>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <h3 style="color: #92400e; margin-top: 0;">💡 Pro Tip:</h3>
                <p style="color: #92400e; margin-bottom: 0;">
                  Print the guide and keep it on every job site. Many contractors save $1,000+ 
                  per project by catching code issues before inspections!
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #6b7280;">Want to take your skills to the next level?</p>
                <a href="${process.env.WEBSITE_URL || 'https://laplumbprep.com'}/courses" 
                   style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  View Our Certification Courses
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                Questions? Reply to this email or contact us at support@laplumbprep.com<br>
                Louisiana Plumbing Prep | Your Path to Certification Success
              </p>
            </div>
          </div>
        `
      });

      res.status(200).json({ 
        message: "Download link sent successfully",
        leadId: leadRecord.id
      });
    } catch (error: any) {
      console.error("Error processing lead magnet download:", error);
      res.status(500).json({ message: "Failed to send download link" });
    }
  });

  // Student Lead Magnet Download API
  app.post("/api/student-lead-magnet/download", async (req, res) => {
    try {
      const { email, firstName, lastName, currentLevel, goals } = req.body;
      
      if (!email || !firstName || !lastName || !currentLevel) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Store student lead magnet download record
      const [leadRecord] = await db.insert(studentLeadMagnetDownloads).values({
        email,
        firstName,
        lastName,
        currentLevel,
        goals: goals || null,
        leadSource: "website",
        emailSent: true
      }).returning();

      // Start student enrollment email sequence  
      await emailAutomation.queueEmailSequence(
        email,
        `${firstName} ${lastName}`,
        "student_enrollment"
      );

      // Send immediate download email with student career guide
      await emailService.sendEmail({
        to: email,
        subject: "🚀 Your FREE Louisiana Plumbing Career Roadmap + Study Materials",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🎉 Your Career Roadmap is Ready!</h1>
            </div>
            
            <div style="padding: 30px; background: #f9fafb;">
              <p style="font-size: 18px; color: #374151;">Hi ${firstName},</p>
              
              <p style="color: #6b7280; line-height: 1.6;">
                Congratulations on taking the first step toward building a successful $75,000+ plumbing career in Louisiana! 
                Your complete career roadmap and bonus study materials are ready for download.
              </p>
              
              <div style="background: white; border: 2px solid #7c3aed; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #7c3aed; margin-top: 0;">📥 Download Your Career Resources:</h2>
                <ul style="color: #374151; line-height: 1.8;">
                  <li><strong>Louisiana Plumbing Career Roadmap (20 pages)</strong> - Complete path from apprentice to master</li>
                  <li><strong>Salary Progression Guide</strong> - Real Louisiana wages from $35K to $85K+</li>
                  <li><strong>BONUS: Practice Test Pack</strong> - Journeyman prep questions (Value: $67)</li>
                  <li><strong>BONUS: Study Flashcards</strong> - 200+ code questions (Value: $37)</li>
                  <li><strong>BONUS: Certification Timeline</strong> - When to get each license (Value: $23)</li>
                </ul>
                
                <div style="text-align: center; margin: 25px 0;">
                  <a href="${process.env.WEBSITE_URL || 'https://laplumbprep.com'}/downloads/louisiana-career-roadmap.pdf?email=${encodeURIComponent(email)}" 
                     style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    📥 Download Career Roadmap & Bonuses
                  </a>
                </div>
              </div>
              
              <div style="background: #ddd6fe; border-left: 4px solid #7c3aed; padding: 15px; margin: 20px 0;">
                <h3 style="color: #5b21b6; margin-top: 0;">💡 Your Next Steps:</h3>
                <p style="color: #5b21b6; margin-bottom: 0;">
                  Based on your current level (${currentLevel}), we recommend starting with our Louisiana Journeyman Prep course. 
                  Students typically see a $15,000-$25,000 salary increase within 12 months of certification!
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #6b7280;">Ready to start your certification journey?</p>
                <a href="${process.env.WEBSITE_URL || 'https://laplumbprep.com'}/courses" 
                   style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  🎯 View Certification Courses
                </a>
              </div>
              
              <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <h3 style="color: #059669; margin-top: 0;">🔥 Early Bird Special</h3>
                <p style="color: #065f46; margin-bottom: 10px;">
                  As a career roadmap download, you get exclusive access to:
                </p>
                <ul style="color: #065f46; text-align: left; max-width: 400px; margin: 0 auto;">
                  <li>25% off your first certification course</li>
                  <li>Free 1-on-1 career planning session</li>
                  <li>Priority access to new courses</li>
                  <li>Weekly tips from Louisiana master plumbers</li>
                </ul>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                Questions about your career path? Reply to this email or contact us at support@laplumbprep.com<br>
                Louisiana Plumbing Prep | Your Path to $75K+ Career Success
              </p>
            </div>
          </div>
        `
      });

      res.status(200).json({ 
        message: "Career roadmap sent successfully",
        leadId: leadRecord.id
      });
    } catch (error: any) {
      console.error("Error processing student lead magnet download:", error);
      res.status(500).json({ message: "Failed to send career roadmap" });
    }
  });

  // PDF routes moved to beginning of file for priority

  // Test endpoint to check email credentials
  app.get("/api/check-email-config", async (req, res) => {
    try {
      const config = {
        noreply_user: process.env.NOREPLY_USER ? `${process.env.NOREPLY_USER.substring(0, 3)}***` : 'NOT SET',
        noreply_pass: process.env.NOREPLY_PASS ? 'SET (hidden)' : 'NOT SET',
        support_user: process.env.SUPPORT_USER ? `${process.env.SUPPORT_USER.substring(0, 3)}***` : 'NOT SET',
        support_pass: process.env.SUPPORT_PASS ? 'SET (hidden)' : 'NOT SET',
        referrals_user: process.env.REFERRALS_USER ? `${process.env.REFERRALS_USER.substring(0, 3)}***` : 'NOT SET',
        referrals_pass: process.env.REFERRALS_PASS ? 'SET (hidden)' : 'NOT SET'
      };
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to check config" });
    }
  });

  // Test endpoint to send actual emails
  app.post("/api/test-email-delivery", async (req, res) => {
    const { type = "contractor", email = "laplumbprep@gmail.com" } = req.body;
    
    try {
      console.log(`Testing email delivery for ${type} to ${email}`);
      
      if (type === "contractor") {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🎉 Your Louisiana Code Guide is Ready!</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="font-size: 18px; color: #374151;">Hi Louisiana Plumber,</p>
              <p style="color: #6b7280; line-height: 1.6;">
                Thank you for downloading our Louisiana Plumbing Code Quick Reference Guide! 
                This comprehensive resource will help you avoid costly code violations and stay compliant on every job.
              </p>
              <div style="background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #059669; margin-top: 0;">📥 Download Your Resources:</h2>
                <div style="text-align: center; margin: 25px 0;">
                  <a href="https://laplumbprep.com/downloads/louisiana-code-guide.pdf" 
                     style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    📥 Download Guide & Tools
                  </a>
                </div>
              </div>
            </div>
          </div>
        `;
        
        await emailService.sendEmail({
          to: email,
          subject: "🎉 Your Louisiana Code Guide is Ready for Download!",
          html: emailHtml
        });
        
      } else if (type === "student") {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🎉 Your Career Roadmap is Ready!</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="font-size: 18px; color: #374151;">Hi Future Plumber,</p>
              <p style="color: #6b7280; line-height: 1.6;">
                Congratulations on taking the first step toward building a successful $75,000+ plumbing career in Louisiana! 
                Your complete career roadmap and bonus study materials are ready for download.
              </p>
              <div style="background: white; border: 2px solid #7c3aed; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #7c3aed; margin-top: 0;">📥 Download Your Career Resources:</h2>
                <div style="text-align: center; margin: 25px 0;">
                  <a href="https://laplumbprep.com/downloads/louisiana-career-roadmap.pdf" 
                     style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    📥 Download Career Roadmap & Bonuses
                  </a>
                </div>
              </div>
            </div>
          </div>
        `;
        
        await emailService.sendEmail({
          to: email,
          subject: "🎉 Your Louisiana Plumbing Career Roadmap is Ready!",
          html: emailHtml
        });
      }
      
      console.log(`Email sent successfully to ${email}`);
      res.json({ 
        success: true, 
        message: `Test ${type} email sent successfully to ${email}`,
        type: type
      });
      
    } catch (error: any) {
      console.error("Email delivery test failed:", error);
      res.status(500).json({ 
        success: false, 
        error: "Email delivery failed", 
        details: error.message,
        type: type
      });
    }
  });

  // Test endpoint to preview lead magnet emails
  app.get("/api/preview-emails/:type", async (req, res) => {
    const { type } = req.params;
    const firstName = "Louisiana";
    const lastName = "Plumbing Prep";
    const currentLevel = "Apprentice";
    
    try {
      if (type === "contractor") {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🎉 Your Louisiana Code Guide is Ready!</h1>
            </div>
            
            <div style="padding: 30px; background: #f9fafb;">
              <p style="font-size: 18px; color: #374151;">Hi ${firstName},</p>
              
              <p style="color: #6b7280; line-height: 1.6;">
                Thank you for downloading our Louisiana Plumbing Code Quick Reference Guide! 
                This comprehensive resource will help you avoid costly code violations and stay compliant on every job.
              </p>
              
              <div style="background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #059669; margin-top: 0;">📥 Download Your Resources:</h2>
                <ul style="color: #374151; line-height: 1.8;">
                  <li><strong>Louisiana Plumbing Code Guide (15 pages)</strong> - Essential violations to avoid</li>
                  <li><strong>BONUS: Pipe Sizing Calculator Tool</strong> - Professional calculations made easy</li>
                  <li><strong>BONUS: Code Update Checklist</strong> - Stay current with 2024 changes</li>
                </ul>
                
                <div style="text-align: center; margin: 25px 0;">
                  <a href="https://laplumbprep.com/downloads/louisiana-code-guide.pdf" 
                     style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    📥 Download Guide & Tools
                  </a>
                </div>
              </div>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <h3 style="color: #92400e; margin-top: 0;">💡 Pro Tip:</h3>
                <p style="color: #92400e; margin-bottom: 0;">
                  Print the guide and keep it on every job site. Many contractors save $1,000+ 
                  per project by catching code issues before inspections!
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #6b7280;">Want to take your skills to the next level?</p>
                <a href="https://laplumbprep.com/courses" 
                   style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  View Our Certification Courses
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                Questions? Reply to this email or contact us at support@laplumbprep.com<br>
                Louisiana Plumbing Prep | Your Path to Certification Success
              </p>
            </div>
          </div>
        `;
        
        res.setHeader('Content-Type', 'text/html');
        res.send(emailHtml);
        
      } else if (type === "student") {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🎉 Your Career Roadmap is Ready!</h1>
            </div>
            
            <div style="padding: 30px; background: #f9fafb;">
              <p style="font-size: 18px; color: #374151;">Hi ${firstName},</p>
              
              <p style="color: #6b7280; line-height: 1.6;">
                Congratulations on taking the first step toward building a successful $75,000+ plumbing career in Louisiana! 
                Your complete career roadmap and bonus study materials are ready for download.
              </p>
              
              <div style="background: white; border: 2px solid #7c3aed; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #7c3aed; margin-top: 0;">📥 Download Your Career Resources:</h2>
                <ul style="color: #374151; line-height: 1.8;">
                  <li><strong>Louisiana Plumbing Career Roadmap (20 pages)</strong> - Complete path from apprentice to master</li>
                  <li><strong>Salary Progression Guide</strong> - Real Louisiana wages from $35K to $85K+</li>
                  <li><strong>BONUS: Practice Test Pack</strong> - Journeyman prep questions (Value: $67)</li>
                  <li><strong>BONUS: Study Flashcards</strong> - 200+ code questions (Value: $37)</li>
                  <li><strong>BONUS: Certification Timeline</strong> - When to get each license (Value: $23)</li>
                </ul>
                
                <div style="text-align: center; margin: 25px 0;">
                  <a href="https://laplumbprep.com/downloads/louisiana-career-roadmap.pdf" 
                     style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    📥 Download Career Roadmap & Bonuses
                  </a>
                </div>
              </div>
              
              <div style="background: #ddd6fe; border-left: 4px solid #7c3aed; padding: 15px; margin: 20px 0;">
                <h3 style="color: #5b21b6; margin-top: 0;">💡 Your Next Steps:</h3>
                <p style="color: #5b21b6; margin-bottom: 0;">
                  Based on your current level (${currentLevel}), we recommend starting with our Louisiana Journeyman Prep course. 
                  Students typically see a $15,000-$25,000 salary increase within 12 months of certification!
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #6b7280;">Ready to start your certification journey?</p>
                <a href="https://laplumbprep.com/courses" 
                   style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  🎯 View Certification Courses
                </a>
              </div>
              
              <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <h3 style="color: #059669; margin-top: 0;">🔥 Early Bird Special</h3>
                <p style="color: #065f46; margin-bottom: 10px;">
                  As a career roadmap download, you get exclusive access to:
                </p>
                <ul style="color: #065f46; text-align: left; max-width: 400px; margin: 0 auto;">
                  <li>25% off your first certification course</li>
                  <li>Free 1-on-1 career planning session</li>
                  <li>Priority access to new courses</li>
                  <li>Weekly tips from Louisiana master plumbers</li>
                </ul>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                Questions about your career path? Reply to this email or contact us at support@laplumbprep.com<br>
                Louisiana Plumbing Prep | Your Path to $75K+ Career Success
              </p>
            </div>
          </div>
        `;
        
        res.setHeader('Content-Type', 'text/html');
        res.send(emailHtml);
        
      } else {
        res.status(400).json({ error: "Invalid email type. Use 'contractor' or 'student'" });
      }
    } catch (error: any) {
      console.error("Error generating email preview:", error);
      res.status(500).json({ error: "Failed to generate email preview" });
    }
  });

  // ===== GAMIFICATION API ROUTES =====

  // Get current monthly competition
  app.get("/api/competitions/current", async (req, res) => {
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const competition = await storage.getCurrentCompetition(currentMonth);
      res.json(competition);
    } catch (error: any) {
      console.error("Error fetching current competition:", error);
      res.status(500).json({ error: "Failed to fetch competition" });
    }
  });

  // Get user's achievements
  app.get("/api/achievements/user", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userId = req.user.id;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error: any) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const period = req.query.period as string || 'all_time'; // 'monthly', 'weekly', 'all_time'
      const leaderboard = await storage.getLeaderboard(period);
      res.json(leaderboard);
    } catch (error: any) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Start competition attempt
  app.post("/api/competitions/:competitionId/start", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { competitionId } = req.params;
      const userId = req.user.id;
      
      const attempt = await storage.startCompetitionAttempt(competitionId, userId);
      res.json(attempt);
    } catch (error: any) {
      console.error("Error starting competition attempt:", error);
      res.status(500).json({ error: "Failed to start competition" });
    }
  });

  // Submit competition attempt
  app.post("/api/competitions/:competitionId/submit", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { competitionId } = req.params;
      const userId = req.user.id;
      const { answers, timeSpent } = req.body;
      
      const result = await storage.submitCompetitionAttempt(competitionId, userId, answers, timeSpent);
      res.json(result);
    } catch (error: any) {
      console.error("Error submitting competition attempt:", error);
      res.status(500).json({ error: "Failed to submit competition" });
    }
  });

  // Get user's competition history
  app.get("/api/competitions/history", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userId = req.user.id;
      const history = await storage.getUserCompetitionHistory(userId);
      res.json(history);
    } catch (error: any) {
      console.error("Error fetching competition history:", error);
      res.status(500).json({ error: "Failed to fetch competition history" });
    }
  });

  // Award achievement (admin only)
  app.post("/api/achievements/award", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Check if user is admin
      if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { userId, achievementId } = req.body;
      const achievement = await storage.awardAchievement(userId, achievementId);
      res.json(achievement);
    } catch (error: any) {
      console.error("Error awarding achievement:", error);
      res.status(500).json({ error: "Failed to award achievement" });
    }
  });

  // Get user points summary
  app.get("/api/points/summary", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userId = req.user.id;
      const summary = await storage.getUserPointsSummary(userId);
      res.json(summary);
    } catch (error: any) {
      console.error("Error fetching points summary:", error);
      res.status(500).json({ error: "Failed to fetch points summary" });
    }
  });

  // Get user notifications
  app.get("/api/notifications", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userId = req.user.id;
      const notifications = await competitionNotificationService.getUserNotifications(userId);
      res.json(notifications);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.post("/api/notifications/:notificationId/read", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { notificationId } = req.params;
      await competitionNotificationService.markNotificationRead(notificationId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Admin Content Management Routes
  // Get course content for management
  app.get("/api/admin/course-content/:courseId", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Check if user is admin (simple check for now)
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { courseId } = req.params;
      
      // Get all course content for this course
      const allContent = await storage.getCourseContent(courseId);
      
      // Separate content by type
      const lessons = allContent.filter(content => content.type === 'lesson');
      const chapters = allContent.filter(content => content.type === 'chapter');
      const questions = allContent.filter(content => content.type === 'question');
      
      res.json({
        lessons,
        chapters,
        questions
      });
    } catch (error: any) {
      console.error("Error fetching course content:", error);
      res.status(500).json({ error: "Failed to fetch course content" });
    }
  });

  // Add new stats endpoint for overview counts
  app.get("/api/admin/course-content/:courseId/stats", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Check if user is admin (simple check for now)
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { courseId } = req.params;
      
      // Get all course content for this course
      const allContent = await storage.getCourseContent(courseId);
      
      // Count by type
      const stats = {
        lessons: allContent.filter(content => content.type === 'lesson').length,
        chapters: allContent.filter(content => content.type === 'chapter').length, 
        questions: allContent.filter(content => content.type === 'question').length,
        flashcards: allContent.filter(content => content.type === 'flashcard').length,
        studyNotes: allContent.filter(content => content.type === 'study_notes').length,
        studyPlans: allContent.filter(content => content.type === 'study_plan').length,
        podcasts: allContent.filter(content => content.type === 'podcast').length,
        aiChat: await storage.getAllChatAnswers().then(answers => 
          answers.filter(answer => answer.contentId && 
            allContent.some(content => content.id === answer.contentId)
          ).length
        )
      };
      
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching course content stats:", error);
      res.status(500).json({ error: "Failed to fetch course content stats" });
    }
  });

  // Add new lesson
  app.post("/api/admin/lessons", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const lessonData = {
        ...req.body,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };
      
      const lesson = await storage.createLesson(lessonData);
      res.json(lesson);
    } catch (error: any) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ error: "Failed to create lesson" });
    }
  });

  // Add new chapter
  app.post("/api/admin/chapters", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const chapterData = {
        ...req.body,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };
      
      const chapter = await storage.createChapter(chapterData);
      res.json(chapter);
    } catch (error: any) {
      console.error("Error creating chapter:", error);
      res.status(500).json({ error: "Failed to create chapter" });
    }
  });

  // Add new question
  app.post("/api/admin/questions", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const questionData = {
        ...req.body,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };
      
      const question = await storage.createQuestion(questionData);
      res.json(question);
    } catch (error: any) {
      console.error("Error creating question:", error);
      res.status(500).json({ error: "Failed to create question" });
    }
  });

  // Get study plans for a specific course/lesson
  app.get("/api/courses/:courseId/study-plans", async (req: any, res) => {
    try {
      const { courseId } = req.params;
      
      // Resolve course ID (handle friendly URLs like "journeyman-prep")
      const resolvedCourseId = await resolveCourseId(courseId);
      if (!resolvedCourseId) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      const studyPlans = await storage.getStudyPlansByCourse(resolvedCourseId);
      res.json(studyPlans);
    } catch (error: any) {
      console.error("Error fetching study plans:", error);
      res.status(500).json({ error: "Failed to fetch study plans" });
    }
  });

  // Start a study session
  app.post("/api/study-sessions", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { contentId, contentType, studyPlanId, estimatedDuration } = req.body;
      const userId = req.user.id;

      const session = await storage.createStudySession({
        userId,
        contentId,
        contentType,
        studyPlanId,
        estimatedDuration,
        sessionStart: new Date(),
      });

      res.json(session);
    } catch (error: any) {
      console.error("Error starting study session:", error);
      res.status(500).json({ error: "Failed to start study session" });
    }
  });

  // Update study session progress
  app.put("/api/study-sessions/:sessionId", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { sessionId } = req.params;
      const { completed, durationSeconds, sectionsCompleted } = req.body;
      const userId = req.user.id;

      const updatedSession = await storage.updateStudySession(sessionId, {
        completed,
        durationSeconds,
        sectionsCompleted,
        sessionEnd: completed ? new Date() : undefined,
      });

      res.json(updatedSession);
    } catch (error: any) {
      console.error("Error updating study session:", error);
      res.status(500).json({ error: "Failed to update study session" });
    }
  });

  // Bulk import study plans with duplicate detection
  app.post("/api/admin/study-plans/bulk-import", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { courseId, studyPlans } = req.body;
      
      if (!courseId || !studyPlans || !Array.isArray(studyPlans)) {
        return res.status(400).json({ error: "courseId and studyPlans array are required" });
      }
      
      // Get existing study plans for this course to check for duplicates
      const existingStudyPlans = await storage.getStudyPlansByCourse(courseId);
      
      // Create a set of existing study plan titles for faster lookup (normalized)
      const existingStudyPlanTitles = new Set(
        existingStudyPlans.map((sp: any) => 
          sp.title.toLowerCase().trim().replace(/\s+/g, ' ')
        )
      );
      
      // Filter out duplicates and track them
      const newStudyPlans: any[] = [];
      const duplicates: any[] = [];
      
      studyPlans.forEach((sp: any) => {
        const normalizedTitle = sp.title.toLowerCase().trim().replace(/\s+/g, ' ');
        
        if (existingStudyPlanTitles.has(normalizedTitle)) {
          duplicates.push(sp);
        } else {
          newStudyPlans.push({
            ...sp,
            id: crypto.randomUUID(),
            courseId,
            createdAt: new Date(),
          });
          // Add to set to prevent duplicates within this batch too
          existingStudyPlanTitles.add(normalizedTitle);
        }
      });
      
      // Create only new study plans
      const createdStudyPlans = await Promise.all(
        newStudyPlans.map((sp: any) => storage.createStudyPlan(sp))
      );
      
      res.json({ 
        success: true, 
        imported: createdStudyPlans.length,
        duplicatesSkipped: duplicates.length,
        totalSubmitted: studyPlans.length,
        studyPlans: createdStudyPlans,
        duplicates: duplicates.map(d => d.title.substring(0, 100) + "...")
      });
    } catch (error: any) {
      console.error("Error bulk importing study plans:", error);
      res.status(500).json({ error: "Failed to import study plans" });
    }
  });

  // Bulk import study notes with duplicate detection
  app.post("/api/admin/study-notes/bulk-import", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { courseId, studyNotes } = req.body;
      
      if (!courseId || !studyNotes || !Array.isArray(studyNotes)) {
        return res.status(400).json({ error: "courseId and studyNotes array are required" });
      }
      
      // Get existing study notes for this course to check for duplicates
      const existingStudyNotes = await storage.getStudyNotesByCourse(courseId);
      
      // Create a set of existing study note titles for faster lookup (normalized)
      const existingStudyNoteTitles = new Set(
        existingStudyNotes.map((sn: any) => 
          sn.title.toLowerCase().trim().replace(/\s+/g, ' ')
        )
      );
      
      // Filter out duplicates and track them
      const newStudyNotes: any[] = [];
      const duplicates: any[] = [];
      
      studyNotes.forEach((sn: any) => {
        const normalizedTitle = sn.title.toLowerCase().trim().replace(/\s+/g, ' ');
        
        if (existingStudyNoteTitles.has(normalizedTitle)) {
          duplicates.push(sn);
        } else {
          newStudyNotes.push({
            ...sn,
            id: crypto.randomUUID(),
            courseId,
            createdAt: new Date(),
          });
          // Add to set to prevent duplicates within this batch too
          existingStudyNoteTitles.add(normalizedTitle);
        }
      });
      
      // Create only new study notes
      const createdStudyNotes = await Promise.all(
        newStudyNotes.map((sn: any) => storage.createStudyNote(sn))
      );
      
      res.json({ 
        success: true, 
        imported: createdStudyNotes.length,
        duplicatesSkipped: duplicates.length,
        totalSubmitted: studyNotes.length,
        studyNotes: createdStudyNotes,
        duplicates: duplicates.map(d => d.title.substring(0, 100) + "...")
      });
    } catch (error: any) {
      console.error("Error bulk importing study notes:", error);
      res.status(500).json({ error: "Failed to import study notes" });
    }
  });

  // Bulk import flashcards with duplicate detection
  app.post("/api/admin/flashcards/bulk-import", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { courseId, flashcards } = req.body;
      
      if (!courseId || !flashcards || !Array.isArray(flashcards)) {
        return res.status(400).json({ error: "courseId and flashcards array are required" });
      }
      
      // Get existing flashcards for this course to check for duplicates
      const existingFlashcards = await storage.getFlashcardsByCourse(courseId);
      
      // Create a set of existing flashcard fronts for faster lookup (normalized)
      const existingFlashcardFronts = new Set(
        existingFlashcards.map((f: any) => 
          f.front.toLowerCase().trim().replace(/\s+/g, ' ')
        )
      );
      
      // Filter out duplicates and track them
      const newFlashcards: any[] = [];
      const duplicates: any[] = [];
      
      flashcards.forEach((f: any) => {
        const normalizedFront = f.front.toLowerCase().trim().replace(/\s+/g, ' ');
        
        if (existingFlashcardFronts.has(normalizedFront)) {
          duplicates.push(f);
        } else {
          newFlashcards.push({
            ...f,
            id: crypto.randomUUID(),
            courseId,
            createdAt: new Date(),
          });
          // Add to set to prevent duplicates within this batch too
          existingFlashcardFronts.add(normalizedFront);
        }
      });
      
      // Create only new flashcards
      const createdFlashcards = await Promise.all(
        newFlashcards.map((f: any) => storage.createFlashcard(f))
      );
      
      res.json({ 
        success: true, 
        imported: createdFlashcards.length,
        duplicatesSkipped: duplicates.length,
        totalSubmitted: flashcards.length,
        flashcards: createdFlashcards,
        duplicates: duplicates.map(d => d.front.substring(0, 100) + "...")
      });
    } catch (error: any) {
      console.error("Error bulk importing flashcards:", error);
      res.status(500).json({ error: "Failed to import flashcards" });
    }
  });

  // Bulk import questions with duplicate detection
  app.post("/api/admin/questions/bulk-import", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { courseId, questions } = req.body;
      
      if (!courseId || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ error: "courseId and questions array are required" });
      }
      
      // Get existing questions for this course to check for duplicates
      const existingQuestions = await storage.getQuestionsByCourse(courseId);
      
      // Create a set of existing question texts for faster lookup (normalized)
      const existingQuestionTexts = new Set(
        existingQuestions.map((q: any) => 
          q.questionText.toLowerCase().trim().replace(/\s+/g, ' ')
        )
      );
      
      // Filter out duplicates and track them
      const newQuestions: any[] = [];
      const duplicates: any[] = [];
      
      questions.forEach((q: any) => {
        const normalizedText = q.questionText.toLowerCase().trim().replace(/\s+/g, ' ');
        
        if (existingQuestionTexts.has(normalizedText)) {
          duplicates.push(q);
        } else {
          newQuestions.push({
            ...q,
            id: crypto.randomUUID(),
            courseId,
            createdAt: new Date(),
          });
          // Add to set to prevent duplicates within this batch too
          existingQuestionTexts.add(normalizedText);
        }
      });
      
      // Create only new questions
      const createdQuestions = await Promise.all(
        newQuestions.map((q: any) => storage.createQuestion(q))
      );
      
      res.json({ 
        success: true, 
        imported: createdQuestions.length,
        duplicatesSkipped: duplicates.length,
        totalSubmitted: questions.length,
        questions: createdQuestions,
        duplicates: duplicates.map(d => d.questionText.substring(0, 100) + "...")
      });
    } catch (error: any) {
      console.error("Error bulk importing questions:", error);
      res.status(500).json({ error: "Failed to import questions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
