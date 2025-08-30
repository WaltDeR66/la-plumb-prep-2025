import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emailService } from "./email";
import { insertUserSchema, insertJobSchema, insertJobApplicationSchema, insertCourseContentSchema, insertPrivateCodeBookSchema, insertCourseSchema, insertProductSchema, insertCartItemSchema, insertProductReviewSchema, insertReferralSchema } from "@shared/schema";
import { analyzePhoto, analyzePlans, getMentorResponse, calculatePipeSize } from "./openai";
import { calculateReferralCommission, isValidSubscriptionTier } from "@shared/referral-utils";
import { contentExtractor } from "./content-extractor";
import { emailAutomation } from "./email-automation";
import { bulkPricingService } from "./bulk-pricing";
import Stripe from "stripe";
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

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
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
            'price_basic_monthly': 39.99,
            'price_professional_monthly': 79.99,
            'price_master_monthly': 99.99
          };
          const subscriptionPrice = planPrices[priceId as keyof typeof planPrices] || 39.99;
          const commissionAmount = subscriptionPrice * 0.10; // 10% commission
          
          await storage.createReferral(user.referredBy, user.id, commissionAmount);
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
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    
    try {
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
        currentPeriodEnd: subscription.current_period_end,
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

  // Course routes
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
      
      // Check if user is admin (admin email or subscription tier)  
      const isAdmin = user.email?.includes('admin') || user.subscriptionTier === 'master';
      
      // For demo purposes, let's make admin more restrictive - only specific admin emails
      const isSuperAdmin = user.email === 'admin@latrainer.com' || user.email === 'admin@laplumbprep.com';
      
      // Get all course content to determine sections
      const content = await storage.getCourseContent(courseId);
      const sections = [...new Set(content.map(c => c.section))].sort((a, b) => Number(a) - Number(b));
      
      const sectionStatus = [];
      
      for (const section of sections) {
        const sectionNum = Number(section);
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

  app.post("/api/employers/:employerId/jobs", async (req, res) => {
    try {
      const { employerId } = req.params;
      const jobData = req.body;
      
      // Verify employer exists
      const employer = await storage.getEmployer(employerId);
      if (!employer) {
        return res.status(404).json({ message: "Employer not found" });
      }
      
      // Create job with pending status
      const job = await storage.createJob({
        ...jobData,
        employerId,
        company: employer.companyName,
        contactEmail: employer.contactEmail
      });
      
      res.status(201).json({ 
        message: "Job posting submitted for review", 
        jobId: job.id,
        status: "pending" 
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
  app.post("/api/mentor/tts", async (req, res) => {
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

  app.get("/api/mentor/conversations", async (req, res) => {
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
      const content = await storage.getCourseContent(courseId);
      
      res.json(content);
    } catch (error: any) {
      console.error('Get course content error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Generate AI audio for podcast content
  app.post("/api/generate-audio/:id", requireActiveSubscription, async (req, res) => {
    try {
      const { id } = req.params;
      const content = await storage.getCourseContentById(id);
      
      if (!content) {
        return res.status(404).json({ error: 'Content not found' });
      }

      const contentData = content.content as any;
      if (!contentData?.extracted?.transcript) {
        return res.status(400).json({ error: 'No transcript available for audio generation' });
      }

      const { generateAudio } = await import('./openai');
      const audioUrl = await generateAudio(contentData.extracted.transcript, id);
      
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

  // Section progress endpoints
  app.get("/api/section-progress/:courseId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const { courseId } = req.params;
      
      const progress = await storage.getSectionProgress(userId, courseId);
      res.json(progress);
    } catch (error: any) {
      console.error("Get section progress error:", error);
      res.status(500).json({ message: error.message });
    }
  });

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
      const content = await storage.getCourseContent(contentId);
      
      if (!content || content.type !== 'quiz') {
        return res.status(404).json({ message: "Quiz content not found" });
      }

      // Get the text content from the extracted field
      const textContent = content.content?.extracted?.content || '';
      
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
      const user = (req.user as any);
      
      const [referrals, earnings] = await Promise.all([
        storage.getUserReferrals(userId),
        storage.getUserReferralEarnings(userId)
      ]);

      res.json({
        referralCode: user.referralCode,
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
                  <a href="${process.env.WEBSITE_URL || 'https://laplumbprep.com'}/downloads/louisiana-code-guide.pdf" 
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

  const httpServer = createServer(app);
  return httpServer;
}
