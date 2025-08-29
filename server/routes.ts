import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emailService } from "./email";
import { insertUserSchema, insertJobSchema, insertJobApplicationSchema, insertCourseContentSchema, insertPrivateCodeBookSchema, insertCourseSchema } from "@shared/schema";
import { analyzePhoto, analyzePlans, getMentorResponse, calculatePipeSize } from "./openai";
import { contentExtractor } from "./content-extractor";
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
  app.get("/api/jobs", async (req, res) => {
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

  app.post("/api/jobs/:jobId/apply", async (req, res) => {
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
  app.post("/api/mentor/chat", async (req, res) => {
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
  app.post("/api/photos/upload", upload.single('photo'), async (req, res) => {
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
  app.post("/api/plans/upload", upload.single('plan'), async (req, res) => {
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

  // Object storage routes for public assets (PDFs, code books, etc.)
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const { ObjectStorageService } = await import('./objectStorage');
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // API endpoint to list available code books
  app.get("/api/code-books", async (req, res) => {
    try {
      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      
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

      // Check which files actually exist
      const availableBooks = [];
      for (const book of codeBooks) {
        try {
          const file = await objectStorageService.searchPublicObject(book.filename);
          if (file) {
            availableBooks.push({
              ...book,
              url: `/public-objects/${book.filename}`
            });
          }
        } catch (error) {
          // File doesn't exist, skip it
        }
      }
      
      res.json(availableBooks);
    } catch (error) {
      console.error("Error listing code books:", error);
      res.status(500).json({ error: "Internal server error" });
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
  app.post("/api/generate-audio/:id", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
