import { sql, relations } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  integer, 
  decimal, 
  boolean, 
  timestamp, 
  jsonb,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const subscriptionTierEnum = pgEnum("subscription_tier", ["basic", "professional", "master"]);
export const courseTypeEnum = pgEnum("course_type", ["journeyman", "backflow", "natural_gas", "medical_gas", "master"]);
export const jobTypeEnum = pgEnum("job_type", ["full_time", "part_time", "contract", "temporary"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "cancelled"]);
export const productCategoryEnum = pgEnum("product_category", ["gas_detection", "pipe_tools", "measuring", "safety", "valves", "fittings", "books", "training_materials"]);
export const jobStatusEnum = pgEnum("job_status", ["pending", "approved", "rejected", "expired"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  subscriptionTier: subscriptionTierEnum("subscription_tier").default("basic"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  referralCode: text("referral_code").unique(),
  referredBy: text("referred_by"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Courses table
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: courseTypeEnum("type").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration"), // in hours
  lessons: integer("lessons"),
  practiceQuestions: integer("practice_questions"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course enrollments
export const courseEnrollments = pgTable("course_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  courseId: text("course_id").notNull(),
  progress: decimal("progress", { precision: 5, scale: 2 }).default("0"),
  completedLessons: integer("completed_lessons").default(0),
  testScores: jsonb("test_scores"), // Array of test scores
  isCompleted: boolean("is_completed").default(false),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Employers table
export const employers = pgTable("employers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull().unique(),
  contactPhone: text("contact_phone"),
  companyWebsite: text("company_website"),
  companyDescription: text("company_description"),
  address: text("address"),
  city: text("city"),
  state: text("state").default("Louisiana"),
  zipCode: text("zip_code"),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Jobs table
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employerId: text("employer_id").notNull(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  type: jobTypeEnum("type").notNull(),
  salaryMin: decimal("salary_min", { precision: 10, scale: 2 }),
  salaryMax: decimal("salary_max", { precision: 10, scale: 2 }),
  requirements: text("requirements").array(),
  benefits: text("benefits").array(),
  contactEmail: text("contact_email").notNull(),
  status: jobStatusEnum("status").default("pending"),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  rejectionReason: text("rejection_reason"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job applications
export const jobApplications = pgTable("job_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: text("job_id").notNull(),
  userId: text("user_id").notNull(),
  resumeUrl: text("resume_url"),
  coverLetter: text("cover_letter"),
  status: text("status").default("pending"),
  appliedAt: timestamp("applied_at").defaultNow(),
});

// AI mentor conversations
export const mentorConversations = pgTable("mentor_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  messages: jsonb("messages").notNull(), // Array of messages
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat answers for course content
export const chatAnswers = pgTable("chat_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  contentId: text("content_id"),
  keywords: text("keywords").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Photo uploads for code checking
export const photoUploads = pgTable("photo_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  analysis: jsonb("analysis"), // AI analysis results
  createdAt: timestamp("created_at").defaultNow(),
});

// Plan uploads
export const planUploads = pgTable("plan_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  materialList: jsonb("material_list"), // Generated material list
  analysis: jsonb("analysis"), // Plan analysis results
  createdAt: timestamp("created_at").defaultNow(),
});

// Referrals
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: text("referrer_id").notNull(),
  referredId: text("referred_id").notNull(),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }),
  isPaid: boolean("is_paid").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at"),
});

// Course content (lessons, quizzes, etc.)
export const courseContent = pgTable("course_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: text("course_id").notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'lesson', 'quiz', 'review', 'video'
  chapter: integer("chapter"),
  section: integer("section"),
  content: jsonb("content"), // Main content (HTML, quiz questions, etc.)
  duration: integer("duration"), // in minutes
  quizgeckoUrl: text("quizgecko_url"), // URL for QuizGecko content
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Private code books (admin reference only)
export const privateCodeBooks = pgTable("private_code_books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  contentType: text("content_type").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Study sessions (time tracking)
export const studySessions = pgTable("study_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  contentId: text("content_id").notNull(),
  contentType: text("content_type").notNull(), // 'lesson', 'flashcards', 'quiz', 'chat', 'podcast', 'study_notes', 'study_plans'
  sessionStart: timestamp("session_start").defaultNow(),
  sessionEnd: timestamp("session_end"),
  durationSeconds: integer("duration_seconds"), // calculated duration in seconds
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quiz attempts
export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  contentId: text("content_id").notNull(), // quiz content ID
  courseId: text("course_id").notNull(),
  section: integer("section").notNull(),
  chapter: integer("chapter").notNull(),
  questions: jsonb("questions").notNull(), // Array of questions with user answers
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(), // percentage score
  passed: boolean("passed").notNull(), // true if score >= 70%
  completedAt: timestamp("completed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Section progress tracking
export const sectionProgress = pgTable("section_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  courseId: text("course_id").notNull(),
  chapter: integer("chapter").notNull(),
  section: integer("section").notNull(),
  isUnlocked: boolean("is_unlocked").default(false),
  quizPassed: boolean("quiz_passed").default(false),
  highestScore: decimal("highest_score", { precision: 5, scale: 2 }).default("0"),
  attemptCount: integer("attempt_count").default(0),
  lastAttemptAt: timestamp("last_attempt_at"),
  unlockedAt: timestamp("unlocked_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  shortDescription: text("short_description"),
  category: productCategoryEnum("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  amazonUrl: text("amazon_url").notNull(),
  affiliateTag: text("affiliate_tag").default("laplumbprep-20"),
  imageUrl: text("image_url"),
  brand: text("brand"),
  model: text("model"),
  features: text("features").array(),
  specifications: jsonb("specifications"),
  rating: decimal("rating", { precision: 3, scale: 1 }).default("0"),
  reviewCount: integer("review_count").default(0),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  tags: text("tags").array(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cart items
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  productId: text("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product reviews
export const productReviews = pgTable("product_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: text("product_id").notNull(),
  userId: text("user_id").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title"),
  comment: text("comment"),
  isVerifiedPurchase: boolean("is_verified_purchase").default(false),
  helpfulCount: integer("helpful_count").default(0),
  isApproved: boolean("is_approved").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


// Relations
export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(courseEnrollments),
  jobApplications: many(jobApplications),
  mentorConversations: many(mentorConversations),
  photoUploads: many(photoUploads),
  planUploads: many(planUploads),
  studySessions: many(studySessions),
  quizAttempts: many(quizAttempts),
  sectionProgress: many(sectionProgress),
  cartItems: many(cartItems),
  productReviews: many(productReviews),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  enrollments: many(courseEnrollments),
  content: many(courseContent),
}));

export const courseContentRelations = relations(courseContent, ({ one }) => ({
  course: one(courses, {
    fields: [courseContent.courseId],
    references: [courses.id],
  }),
}));

export const studySessionsRelations = relations(studySessions, ({ one }) => ({
  user: one(users, {
    fields: [studySessions.userId],
    references: [users.id],
  }),
  content: one(courseContent, {
    fields: [studySessions.contentId],
    references: [courseContent.id],
  }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(users, {
    fields: [quizAttempts.userId],
    references: [users.id],
  }),
  content: one(courseContent, {
    fields: [quizAttempts.contentId],
    references: [courseContent.id],
  }),
  course: one(courses, {
    fields: [quizAttempts.courseId],
    references: [courses.id],
  }),
}));

export const sectionProgressRelations = relations(sectionProgress, ({ one }) => ({
  user: one(users, {
    fields: [sectionProgress.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [sectionProgress.courseId],
    references: [courses.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  cartItems: many(cartItems),
  reviews: many(productReviews),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [productReviews.userId],
    references: [users.id],
  }),
}));

export const courseEnrollmentsRelations = relations(courseEnrollments, ({ one }) => ({
  user: one(users, {
    fields: [courseEnrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [courseEnrollments.courseId],
    references: [courses.id],
  }),
}));

export const employersRelations = relations(employers, ({ many }) => ({
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ many, one }) => ({
  applications: many(jobApplications),
  employer: one(employers, {
    fields: [jobs.employerId],
    references: [employers.id],
  }),
}));

export const jobApplicationsRelations = relations(jobApplications, ({ one }) => ({
  job: one(jobs, {
    fields: [jobApplications.jobId],
    references: [jobs.id],
  }),
  user: one(users, {
    fields: [jobApplications.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  referralCode: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployerSchema = createInsertSchema(employers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  status: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  appliedAt: true,
});

export const insertCourseContentSchema = createInsertSchema(courseContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPrivateCodeBookSchema = createInsertSchema(privateCodeBooks).omit({
  id: true,
  createdAt: true,
});

export const insertChatAnswerSchema = createInsertSchema(chatAnswers).omit({
  id: true,
  createdAt: true,
});

export const insertStudySessionSchema = createInsertSchema(studySessions).omit({
  id: true,
  createdAt: true,
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  completedAt: true,
  createdAt: true,
});

export const insertSectionProgressSchema = createInsertSchema(sectionProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductReviewSchema = createInsertSchema(productReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Job = typeof jobs.$inferSelect;
export type Employer = typeof employers.$inferSelect;
export type InsertEmployer = z.infer<typeof insertEmployerSchema>;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type MentorConversation = typeof mentorConversations.$inferSelect;
export type PhotoUpload = typeof photoUploads.$inferSelect;
export type PlanUpload = typeof planUploads.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type CourseContent = typeof courseContent.$inferSelect;
export type InsertCourseContent = z.infer<typeof insertCourseContentSchema>;
export type PrivateCodeBook = typeof privateCodeBooks.$inferSelect;
export type InsertPrivateCodeBook = z.infer<typeof insertPrivateCodeBookSchema>;
export type ChatAnswer = typeof chatAnswers.$inferSelect;
export type InsertChatAnswer = z.infer<typeof insertChatAnswerSchema>;
export type StudySession = typeof studySessions.$inferSelect;
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type SectionProgress = typeof sectionProgress.$inferSelect;
export type InsertSectionProgress = z.infer<typeof insertSectionProgressSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type ProductReview = typeof productReviews.$inferSelect;
export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;
