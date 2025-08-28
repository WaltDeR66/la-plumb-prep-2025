import { 
  users, 
  courses, 
  courseEnrollments,
  jobs,
  jobApplications,
  mentorConversations,
  photoUploads,
  planUploads,
  referrals,
  courseContent,
  privateCodeBooks,
  type User, 
  type InsertUser,
  type Course,
  type InsertCourse,
  type Job,
  type InsertJob,
  type JobApplication,
  type InsertJobApplication,
  type CourseEnrollment,
  type MentorConversation,
  type PhotoUpload,
  type PlanUpload,
  type Referral,
  type CourseContent,
  type InsertCourseContent,
  type PrivateCodeBook,
  type InsertPrivateCodeBook
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, count, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  
  // Course methods
  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, updates: Partial<Course>): Promise<Course>;
  getCourseContentStats(courseId: string): Promise<{ lessons: number; quizzes: number }>;
  
  // Enrollment methods
  getUserEnrollments(userId: string): Promise<CourseEnrollment[]>;
  enrollUser(userId: string, courseId: string): Promise<CourseEnrollment>;
  updateEnrollmentProgress(enrollmentId: string, progress: number, completedLessons: number): Promise<CourseEnrollment>;
  
  // Job methods
  getJobs(page?: number, limit?: number, search?: string): Promise<{ jobs: Job[], total: number }>;
  getJob(id: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job>;
  
  // Job application methods
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  getUserJobApplications(userId: string): Promise<JobApplication[]>;
  
  // AI mentor methods
  createMentorConversation(userId: string, messages: any[]): Promise<MentorConversation>;
  updateMentorConversation(id: string, messages: any[]): Promise<MentorConversation>;
  getUserMentorConversations(userId: string): Promise<MentorConversation[]>;
  
  // Photo upload methods
  createPhotoUpload(userId: string, filename: string, url: string, analysis?: any): Promise<PhotoUpload>;
  getUserPhotoUploads(userId: string): Promise<PhotoUpload[]>;
  
  // Plan upload methods
  createPlanUpload(userId: string, filename: string, url: string, materialList?: any, analysis?: any): Promise<PlanUpload>;
  getUserPlanUploads(userId: string): Promise<PlanUpload[]>;
  
  // Referral methods
  createReferral(referrerId: string, referredId: string, commissionAmount: number): Promise<Referral>;
  getUserReferrals(userId: string): Promise<Referral[]>;
  
  // Course content methods
  getCourseContent(courseId: string): Promise<CourseContent[]>;
  createCourseContent(content: InsertCourseContent): Promise<CourseContent>;
  updateCourseContent(id: string, updates: Partial<CourseContent>): Promise<CourseContent>;
  deleteCourseContent(id: string): Promise<void>;
  
  // Private code book methods
  getPrivateCodeBooks(): Promise<PrivateCodeBook[]>;
  createPrivateCodeBook(codeBook: InsertPrivateCodeBook): Promise<PrivateCodeBook>;
  deletePrivateCodeBook(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        referralCode: Math.random().toString(36).substring(2, 10).toUpperCase()
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId, 
        stripeSubscriptionId, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.isActive, true));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db
      .insert(courses)
      .values(course)
      .returning();
    return newCourse;
  }

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
    const [updatedCourse] = await db
      .update(courses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }

  async getCourseContentStats(courseId: string): Promise<{ lessons: number; quizzes: number }> {
    const stats = await db
      .select({
        lessons: sql<number>`COUNT(CASE WHEN type = 'lesson' THEN 1 END)`,
        quizSections: sql<number>`COUNT(CASE WHEN type = 'quiz' THEN 1 END)`
      })
      .from(courseContent)
      .where(eq(courseContent.courseId, courseId));
    
    return {
      lessons: Number(stats[0]?.lessons || 0),
      quizzes: Number(stats[0]?.quizSections || 0)
    };
  }

  async getUserEnrollments(userId: string): Promise<CourseEnrollment[]> {
    return await db
      .select()
      .from(courseEnrollments)
      .where(eq(courseEnrollments.userId, userId));
  }

  async enrollUser(userId: string, courseId: string): Promise<CourseEnrollment> {
    const [enrollment] = await db
      .insert(courseEnrollments)
      .values({ userId, courseId })
      .returning();
    return enrollment;
  }

  async updateEnrollmentProgress(enrollmentId: string, progress: number, completedLessons: number): Promise<CourseEnrollment> {
    const [enrollment] = await db
      .update(courseEnrollments)
      .set({ 
        progress: progress.toString(), 
        completedLessons,
        isCompleted: progress >= 100
      })
      .where(eq(courseEnrollments.id, enrollmentId))
      .returning();
    return enrollment;
  }

  async getJobs(page = 1, limit = 10, search?: string): Promise<{ jobs: Job[], total: number }> {
    const offset = (page - 1) * limit;
    
    let query = db.select().from(jobs).where(eq(jobs.isActive, true));
    let countQuery = db.select({ count: count() }).from(jobs).where(eq(jobs.isActive, true));
    
    if (search) {
      const searchCondition = or(
        ilike(jobs.title, `%${search}%`),
        ilike(jobs.company, `%${search}%`),
        ilike(jobs.location, `%${search}%`)
      );
      query = query.where(and(eq(jobs.isActive, true), searchCondition));
      countQuery = countQuery.where(and(eq(jobs.isActive, true), searchCondition));
    }
    
    const jobsResult = await query
      .orderBy(desc(jobs.isFeatured), desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);
    
    const [{ count: total }] = await countQuery;
    
    return { jobs: jobsResult, total };
  }

  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db
      .insert(jobs)
      .values(job)
      .returning();
    return newJob;
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
    const [job] = await db
      .update(jobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return job;
  }

  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const [newApplication] = await db
      .insert(jobApplications)
      .values(application)
      .returning();
    return newApplication;
  }

  async getUserJobApplications(userId: string): Promise<JobApplication[]> {
    return await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.userId, userId))
      .orderBy(desc(jobApplications.appliedAt));
  }

  async createMentorConversation(userId: string, messages: any[]): Promise<MentorConversation> {
    const [conversation] = await db
      .insert(mentorConversations)
      .values({ userId, messages })
      .returning();
    return conversation;
  }

  async updateMentorConversation(id: string, messages: any[]): Promise<MentorConversation> {
    const [conversation] = await db
      .update(mentorConversations)
      .set({ messages, updatedAt: new Date() })
      .where(eq(mentorConversations.id, id))
      .returning();
    return conversation;
  }

  async getUserMentorConversations(userId: string): Promise<MentorConversation[]> {
    return await db
      .select()
      .from(mentorConversations)
      .where(eq(mentorConversations.userId, userId))
      .orderBy(desc(mentorConversations.updatedAt));
  }

  async createPhotoUpload(userId: string, filename: string, url: string, analysis?: any): Promise<PhotoUpload> {
    const [upload] = await db
      .insert(photoUploads)
      .values({ userId, filename, url, analysis })
      .returning();
    return upload;
  }

  async getUserPhotoUploads(userId: string): Promise<PhotoUpload[]> {
    return await db
      .select()
      .from(photoUploads)
      .where(eq(photoUploads.userId, userId))
      .orderBy(desc(photoUploads.createdAt));
  }

  async createPlanUpload(userId: string, filename: string, url: string, materialList?: any, analysis?: any): Promise<PlanUpload> {
    const [upload] = await db
      .insert(planUploads)
      .values({ userId, filename, url, materialList, analysis })
      .returning();
    return upload;
  }

  async getUserPlanUploads(userId: string): Promise<PlanUpload[]> {
    return await db
      .select()
      .from(planUploads)
      .where(eq(planUploads.userId, userId))
      .orderBy(desc(planUploads.createdAt));
  }

  async createReferral(referrerId: string, referredId: string, commissionAmount: number): Promise<Referral> {
    const [referral] = await db
      .insert(referrals)
      .values({ referrerId, referredId, commissionAmount: commissionAmount.toString() })
      .returning();
    return referral;
  }

  async getUserReferrals(userId: string): Promise<Referral[]> {
    return await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId))
      .orderBy(desc(referrals.createdAt));
  }

  // Course content methods
  async getCourseContent(courseId: string): Promise<CourseContent[]> {
    const results = await db
      .select()
      .from(courseContent)
      .where(eq(courseContent.courseId, courseId))
      .orderBy(courseContent.chapter, courseContent.section, courseContent.sortOrder);
    
    return results;
  }

  async createCourseContent(content: InsertCourseContent): Promise<CourseContent> {
    const [result] = await db
      .insert(courseContent)
      .values(content)
      .returning();
    
    return result;
  }

  async updateCourseContent(id: string, updates: Partial<CourseContent>): Promise<CourseContent> {
    const [result] = await db
      .update(courseContent)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(courseContent.id, id))
      .returning();
    
    return result;
  }

  async deleteCourseContent(id: string): Promise<void> {
    await db.delete(courseContent).where(eq(courseContent.id, id));
  }

  // Private code book methods
  async getPrivateCodeBooks(): Promise<PrivateCodeBook[]> {
    const results = await db
      .select()
      .from(privateCodeBooks)
      .orderBy(desc(privateCodeBooks.createdAt));
    
    return results;
  }

  async createPrivateCodeBook(codeBook: InsertPrivateCodeBook): Promise<PrivateCodeBook> {
    const [result] = await db
      .insert(privateCodeBooks)
      .values(codeBook)
      .returning();
    
    return result;
  }

  async deletePrivateCodeBook(id: string): Promise<void> {
    await db.delete(privateCodeBooks).where(eq(privateCodeBooks.id, id));
  }
}

export const storage = new DatabaseStorage();
