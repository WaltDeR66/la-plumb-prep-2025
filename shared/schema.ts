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

// Jobs table
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(courseEnrollments),
  jobApplications: many(jobApplications),
  mentorConversations: many(mentorConversations),
  photoUploads: many(photoUploads),
  planUploads: many(planUploads),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  enrollments: many(courseEnrollments),
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

export const jobsRelations = relations(jobs, ({ many }) => ({
  applications: many(jobApplications),
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

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  appliedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type MentorConversation = typeof mentorConversations.$inferSelect;
export type PhotoUpload = typeof photoUploads.$inferSelect;
export type PlanUpload = typeof planUploads.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
