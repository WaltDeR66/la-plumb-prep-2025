import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertJobSchema, insertJobApplicationSchema, insertCourseContentSchema, insertPrivateCodeBookSchema, insertCourseSchema } from "@shared/schema";
import { analyzePhoto, analyzePlans, getMentorResponse, calculatePipeSize } from "./openai";
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

      // Handle referral if provided
      if (userData.referredBy) {
        try {
          const referrer = await storage.getUserByUsername(userData.referredBy);
          if (referrer) {
            await storage.createReferral(referrer.id, user.id, 10); // 10% commission
          }
        } catch (error) {
          console.error('Referral creation failed:', error);
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

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        trial_period_days: 7, // 7-day free trial
      });

      await storage.updateUserStripeInfo(user.id, customerId, subscription.id);
      await storage.updateUser(user.id, { subscriptionTier: tier });

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
      const { message, conversationId } = req.body;
      const userId = (req.user as any).id;

      const response = await getMentorResponse(message);
      
      let conversation;
      if (conversationId) {
        const conversations = await storage.getUserMentorConversations(userId);
        const existingConversation = conversations.find(c => c.id === conversationId);
        if (existingConversation) {
          const messages = [
            ...(existingConversation.messages as any[]),
            { role: 'user', content: message, timestamp: new Date() },
            { role: 'assistant', content: response, timestamp: new Date() }
          ];
          conversation = await storage.updateMentorConversation(conversationId, messages);
        }
      } else {
        const messages = [
          { role: 'user', content: message, timestamp: new Date() },
          { role: 'assistant', content: response, timestamp: new Date() }
        ];
        conversation = await storage.createMentorConversation(userId, messages);
      }

      res.json({ response, conversationId: conversation?.id });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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

  // QuizGecko import route
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
      const courseStats = await storage.getCourseContentStats(journeymanCourse.id);
      await storage.updateCourse(journeymanCourse.id, {
        lessons: courseStats.lessons,
        practiceQuestions: courseStats.quizzes
      });

      res.json({ 
        message: "Content imported successfully", 
        count: imported.length,
        content: imported 
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

  const httpServer = createServer(app);
  return httpServer;
}
