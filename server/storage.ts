import { 
  users, 
  courses, 
  courseEnrollments,
  employers,
  jobs,
  jobApplications,
  mentorConversations,
  studyCompanionMessages,
  photoUploads,
  planUploads,
  referrals,
  monthlyCommissions,
  payoutRequests,
  accountCreditTransactions,
  courseContent,
  privateCodeBooks,
  chatAnswers,
  flashcards,
  studySessions,
  quizAttempts,
  sectionProgress,
  products,
  cartItems,
  productReviews,
  competitionQuestions,
  type User, 
  type InsertUser,
  type Course,
  type InsertCourse,
  type Employer,
  type InsertEmployer,
  type Job,
  type InsertJob,
  type JobApplication,
  type InsertJobApplication,
  type CourseEnrollment,
  type MentorConversation,
  type StudyCompanionMessage,
  type InsertStudyCompanionMessage,
  type PhotoUpload,
  type PlanUpload,
  type Referral,
  type InsertReferral,
  type CourseContent,
  type InsertCourseContent,
  type PrivateCodeBook,
  type InsertPrivateCodeBook,
  type ChatAnswer,
  type InsertChatAnswer,
  type Flashcard,
  type InsertFlashcard,
  type StudySession,
  type InsertStudySession,
  type QuizAttempt,
  type InsertQuizAttempt,
  type SectionProgress,
  type InsertSectionProgress,
  type LessonStepProgress,
  type InsertLessonStepProgress,
  type Product,
  type InsertProduct,
  type CartItem,
  type InsertCartItem,
  type ProductReview,
  type InsertProductReview,
  type PayoutRequest,
  type InsertPayoutRequest,
  type AccountCreditTransaction,
  type InsertAccountCreditTransaction,
  type MonthlyCommission,
  type InsertMonthlyCommission,
  achievements,
  userAchievements,
  monthlyCompetitions,
  competitionAttempts,
  userPointsHistory,
  lessonStepProgress
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, count, isNull, ilike, like } from "drizzle-orm";
import { calculateReferralCommission } from "@shared/referral-utils";

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
  
  // Employer methods
  createEmployer(employer: InsertEmployer): Promise<Employer>;
  getEmployer(id: string): Promise<Employer | undefined>;
  getEmployerByEmail(email: string): Promise<Employer | undefined>;
  updateEmployer(id: string, updates: Partial<Employer>): Promise<Employer>;
  getEmployers(page?: number, limit?: number): Promise<{ employers: Employer[], total: number }>;
  
  // Job methods
  getJobs(page?: number, limit?: number, search?: string, status?: string): Promise<{ jobs: Job[], total: number }>;
  getJob(id: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job>;
  updateJobStatus(id: string, status: string): Promise<Job>;
  getPendingJobs(): Promise<Job[]>;
  approveJob(id: string, approvedBy: string): Promise<Job>;
  rejectJob(id: string, rejectionReason: string): Promise<Job>;
  getAllJobsWithDetails(): Promise<Job[]>;
  getEmployerJobsWithApplications(employerId: string): Promise<any[]>;
  getJobApplicationsWithUserDetails(jobId: string): Promise<any[]>;
  
  // Job application methods
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  getUserJobApplications(userId: string): Promise<JobApplication[]>;
  
  // AI mentor methods
  createMentorConversation(userId: string, messages: any[]): Promise<MentorConversation>;
  updateMentorConversation(id: string, messages: any[]): Promise<MentorConversation>;
  
  // Flashcard methods
  getFlashcardsByCourse(courseId: string): Promise<Flashcard[]>;
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  getUserMentorConversations(userId: string): Promise<MentorConversation[]>;
  
  // Breakdown methods for admin stats
  getQuestionBreakdowns(courseId: string): Promise<any>;
  getFlashcardBreakdowns(courseId: string): Promise<any>;
  getCourseContentBreakdowns(courseId: string): Promise<any>;
  getStudySessionBreakdowns(courseId: string): Promise<any>;
  getEnrollmentBreakdowns(courseId: string): Promise<any>;
  getUserProgressBreakdowns(courseId: string): Promise<any>;
  
  // Study companion methods
  getStudyCompanionConversations(userId: string): Promise<StudyCompanionMessage[]>;
  saveStudyCompanionMessage(message: InsertStudyCompanionMessage): Promise<StudyCompanionMessage>;
  getUserProgress(userId: string): Promise<any>;
  
  // Photo upload methods
  createPhotoUpload(userId: string, filename: string, url: string, analysis?: any): Promise<PhotoUpload>;
  getUserPhotoUploads(userId: string): Promise<PhotoUpload[]>;
  
  // Plan upload methods
  createPlanUpload(userId: string, filename: string, url: string, materialList?: any, analysis?: any): Promise<PlanUpload>;
  getUserPlanUploads(userId: string): Promise<PlanUpload[]>;
  
  // Referral methods
  createReferral(referralData: InsertReferral): Promise<Referral>;
  getUserReferrals(userId: string): Promise<Referral[]>;
  getUserReferralEarnings(userId: string): Promise<{ total: number; unpaid: number; paid: number }>;
  
  // Monthly commission methods for subscription upgrades
  createMonthlyCommission(commission: any): Promise<any>;
  getMonthlyCommissions(userId: string, month?: string): Promise<any[]>;
  updateMonthlyCommission(commissionId: string, isPaid: boolean, paidAt?: Date): Promise<any>;
  getAllUnpaidMonthlyCommissions(): Promise<any[]>;
  processSubscriptionUpgrade(referredUserId: string, newTier: string, oldTier: string): Promise<void>;
  
  // Payment methods
  updateUserPaymentPreferences(userId: string, paymentMethod: string, paypalEmail?: string, minimumPayout?: number): Promise<User>;
  getUserAccountBalance(userId: string): Promise<number>;
  addAccountCredit(userId: string, amount: number, description: string, referenceId?: string): Promise<AccountCreditTransaction>;
  deductAccountCredit(userId: string, amount: number, description: string, referenceId?: string): Promise<AccountCreditTransaction>;
  getUserAccountTransactions(userId: string, page?: number, limit?: number): Promise<AccountCreditTransaction[]>;
  
  // Payout methods
  createPayoutRequest(request: InsertPayoutRequest): Promise<PayoutRequest>;
  getUserPayoutRequests(userId: string): Promise<PayoutRequest[]>;
  getPendingPayoutRequests(): Promise<PayoutRequest[]>;
  updatePayoutRequestStatus(payoutId: string, status: string, transactionId?: string, failureReason?: string): Promise<PayoutRequest>;
  processAutomaticPayouts(): Promise<{ processed: number; total: number }>;
  getUserEligibleCommissionsForPayout(userId: string): Promise<{ referrals: Referral[]; monthlyCommissions: MonthlyCommission[]; totalAmount: number }>;
  
  // Course content methods
  getCourseContent(courseId: string): Promise<CourseContent[]>;
  getStudyPlansByCourse(courseId: string): Promise<any[]>;
  createCourseContent(content: InsertCourseContent): Promise<CourseContent>;
  updateCourseContent(id: string, updates: Partial<CourseContent>): Promise<CourseContent>;
  deleteCourseContent(id: string): Promise<void>;
  createLesson(lesson: InsertCourseContent): Promise<CourseContent>;
  createChapter(chapter: InsertCourseContent): Promise<CourseContent>;
  
  // Private code book methods
  getPrivateCodeBooks(): Promise<PrivateCodeBook[]>;
  createPrivateCodeBook(codeBook: InsertPrivateCodeBook): Promise<PrivateCodeBook>;
  deletePrivateCodeBook(id: string): Promise<void>;
  
  // Chat answer methods
  getChatAnswer(question: string, contentId?: string): Promise<ChatAnswer | undefined>;
  createChatAnswer(answer: InsertChatAnswer): Promise<ChatAnswer>;
  getAllChatAnswers(): Promise<ChatAnswer[]>;
  
  // Study session methods
  startStudySession(userId: string, contentId: string, contentType: string): Promise<StudySession>;
  endStudySession(sessionId: string): Promise<StudySession>;
  getUserStudySessions(userId: string, contentId?: string): Promise<StudySession[]>;
  createStudySession(data: InsertStudySession): Promise<StudySession>;
  updateStudySession(sessionId: string, updates: Partial<StudySession>): Promise<StudySession>;
  
  // Study notes methods
  getStudyNotesByCourse(courseId: string): Promise<CourseContent[]>;
  createStudyNote(studyNote: InsertCourseContent): Promise<CourseContent>;
  getStudySessionStats(userId: string): Promise<{ totalTime: number; sessionsCount: number; avgSessionTime: number }>;
  
  // Quiz attempt methods
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getUserQuizAttempts(userId: string, contentId?: string): Promise<QuizAttempt[]>;
  getLatestQuizAttempt(userId: string, contentId: string): Promise<QuizAttempt | undefined>;
  
  // Section progress methods
  getSectionProgress(userId: string, courseId: string): Promise<SectionProgress[]>;
  updateSectionProgress(userId: string, courseId: string, chapter: number, section: number, data: Partial<SectionProgress>): Promise<SectionProgress>;
  unlockNextSection(userId: string, courseId: string, chapter: number, section: number): Promise<void>;
  isSectionUnlocked(userId: string, courseId: string, chapter: number, section: number): Promise<boolean>;
  
  // Lesson step progress methods
  updateLessonStepProgress(progressData: Partial<LessonStepProgress>): Promise<LessonStepProgress>;
  getLessonStepProgress(userId: string, courseId: string, section: number, stepType: string): Promise<LessonStepProgress | undefined>;
  getCurrentLessonStep(userId: string, courseId: string, section: number): Promise<{ stepType: string; stepIndex: number; currentPosition?: any } | null>;
  
  // Product methods
  getProducts(category?: string, search?: string, page?: number, limit?: number): Promise<{ products: Product[], total: number }>;
  getProduct(id: string): Promise<Product | undefined>;
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  
  // Cart methods
  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(userId: string, productId: string, quantity?: number): Promise<CartItem>;
  updateCartItem(userId: string, productId: string, quantity: number): Promise<CartItem>;
  removeFromCart(userId: string, productId: string): Promise<void>;
  clearCart(userId: string): Promise<void>;
  
  // Product review methods
  getProductReviews(productId: string): Promise<ProductReview[]>;
  createProductReview(review: InsertProductReview): Promise<ProductReview>;
  updateProductReview(id: string, updates: Partial<ProductReview>): Promise<ProductReview>;
  deleteProductReview(id: string): Promise<void>;

  // Gamification methods
  // Achievements
  getUserAchievements(userId: string): Promise<any[]>;
  awardAchievement(userId: string, achievementId: string): Promise<any>;
  
  // Points and Leaderboard
  getUserPointsSummary(userId: string): Promise<any>;
  getLeaderboard(period: string): Promise<any[]>;
  addPoints(userId: string, points: number, action: string, description: string, referenceId?: string): Promise<void>;
  
  // Monthly Competitions
  getCurrentCompetition(month: string): Promise<any>;
  startCompetitionAttempt(competitionId: string, userId: string): Promise<any>;
  submitCompetitionAttempt(competitionId: string, userId: string, answers: any[], timeSpent: number): Promise<any>;
  getUserCompetitionHistory(userId: string): Promise<any[]>;
  createMonthlyCompetition(competition: any): Promise<any>;
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

  // Update user difficulty settings for adaptive learning
  async updateUserDifficultySettings(userId: string, settings: {
    preferredDifficulty?: 'easy' | 'hard' | 'very_hard';
    currentSkillLevel?: 'easy' | 'hard' | 'very_hard';
    adaptiveDifficultyEnabled?: boolean;
  }): Promise<void> {
    await db
      .update(users)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(users.id, userId));
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
    return await db.select().from(courses);
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

  async getCourseContentStats(courseId: string): Promise<{ lessons: number; quizzes: number; duration: number }> {
    const stats = await db
      .select({
        lessons: sql<number>`COUNT(CASE WHEN type = 'lesson' THEN 1 END)`,
        quizSections: sql<number>`COUNT(CASE WHEN type = 'quiz' THEN 1 END)`,
        totalContentDuration: sql<number>`COALESCE(SUM(duration), 0)`
      })
      .from(courseContent)
      .where(eq(courseContent.courseId, courseId));
    
    const lessons = Number(stats[0]?.lessons || 0);
    const quizSections = Number(stats[0]?.quizSections || 0);
    const contentDuration = Number(stats[0]?.totalContentDuration || 0);
    
    // Calculate total duration: content duration + estimated time for quizzes
    // Estimate 30 minutes (0.5 hours) per quiz section
    const estimatedQuizDuration = quizSections * 0.5;
    const totalDuration = contentDuration + estimatedQuizDuration;
    
    return {
      lessons,
      quizzes: quizSections,
      duration: Math.ceil(totalDuration) || 1 // At least 1 hour minimum
    };
  }

  // Helper function to automatically update course stats after content changes
  async updateCourseStatsAutomatically(courseId: string): Promise<void> {
    const stats = await this.getCourseContentStats(courseId);
    await this.updateCourse(courseId, {
      lessons: stats.lessons,
      practiceQuestions: stats.quizzes,
      duration: `${stats.duration} hours`
    });
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

  // Employer methods
  async createEmployer(employer: InsertEmployer): Promise<Employer> {
    const [newEmployer] = await db
      .insert(employers)
      .values(employer)
      .returning();
    return newEmployer;
  }

  async getEmployer(id: string): Promise<Employer | undefined> {
    const [employer] = await db.select().from(employers).where(eq(employers.id, id));
    return employer || undefined;
  }

  async getEmployerByEmail(email: string): Promise<Employer | undefined> {
    const [employer] = await db.select().from(employers).where(eq(employers.contactEmail, email));
    return employer || undefined;
  }

  async updateEmployer(id: string, updates: Partial<Employer>): Promise<Employer> {
    const [employer] = await db
      .update(employers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(employers.id, id))
      .returning();
    return employer;
  }

  async getEmployers(page = 1, limit = 10): Promise<{ employers: Employer[], total: number }> {
    const offset = (page - 1) * limit;
    
    const employersResult = await db
      .select()
      .from(employers)
      .orderBy(desc(employers.createdAt))
      .limit(limit)
      .offset(offset);
    
    const [{ count: total }] = await db.select({ count: count() }).from(employers);
    
    return { employers: employersResult, total };
  }


  async getJobs(page = 1, limit = 10, search?: string, status?: string): Promise<{ jobs: Job[], total: number }> {
    const offset = (page - 1) * limit;
    
    // For students, only show approved jobs
    let baseCondition = and(eq(jobs.isActive, true), eq(jobs.status, 'approved'));
    
    // If status filter is provided (for admin), use that instead
    if (status) {
      baseCondition = eq(jobs.status, status as any);
    }
    
    let query = db.select().from(jobs).where(baseCondition);
    let countQuery = db.select({ count: count() }).from(jobs).where(baseCondition);
    
    if (search) {
      const searchCondition = or(
        ilike(jobs.title, `%${search}%`),
        ilike(jobs.company, `%${search}%`),
        ilike(jobs.location, `%${search}%`)
      );
      baseCondition = and(baseCondition, searchCondition);
      query = db.select().from(jobs).where(baseCondition);
      countQuery = db.select({ count: count() }).from(jobs).where(baseCondition);
    }
    
    const jobsResult = await query
      .orderBy(desc(jobs.isFeatured), desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);
    
    const [{ count: total }] = await countQuery;
    
    return { jobs: jobsResult, total };
  }

  async getPendingJobs(): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.status, 'pending'))
      .orderBy(desc(jobs.createdAt));
  }

  async approveJob(id: string, approvedBy: string): Promise<Job> {
    const [job] = await db
      .update(jobs)
      .set({ 
        status: 'approved', 
        approvedBy, 
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(jobs.id, id))
      .returning();
    return job;
  }

  async rejectJob(id: string, rejectionReason: string): Promise<Job> {
    const [job] = await db
      .update(jobs)
      .set({ 
        status: 'rejected', 
        rejectionReason,
        updatedAt: new Date()
      })
      .where(eq(jobs.id, id))
      .returning();
    return job;
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

  async updateJobStatus(id: string, status: string): Promise<Job> {
    const [job] = await db
      .update(jobs)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return job;
  }

  async getAllJobsWithDetails(): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .orderBy(desc(jobs.createdAt));
  }

  async getEmployerJobsWithApplications(employerId: string): Promise<any[]> {
    // Get jobs for this employer with application counts
    return await db
      .select({
        id: jobs.id,
        title: jobs.title,
        description: jobs.description,
        location: jobs.location,
        type: jobs.type,
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
        requirements: jobs.requirements,
        benefits: jobs.benefits,
        status: jobs.status,
        isFeatured: jobs.isFeatured,
        createdAt: jobs.createdAt,
        daysRemaining: sql<number>`GREATEST(0, EXTRACT(DAY FROM (${jobs.expiresAt} - NOW())))`,
        applicationsCount: sql<number>`(SELECT COUNT(*) FROM ${jobApplications} WHERE ${jobApplications.jobId} = ${jobs.id})`
      })
      .from(jobs)
      .where(eq(jobs.employerId, employerId))
      .orderBy(desc(jobs.createdAt));
  }

  async getJobApplicationsWithUserDetails(jobId: string): Promise<any[]> {
    return await db
      .select({
        id: jobApplications.id,
        userId: jobApplications.userId,
        name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        email: users.email,
        phone: users.phone,
        resumeUrl: jobApplications.resumeUrl,
        coverLetter: jobApplications.coverLetter,
        appliedAt: jobApplications.appliedAt
      })
      .from(jobApplications)
      .innerJoin(users, eq(jobApplications.userId, users.id))
      .where(eq(jobApplications.jobId, jobId))
      .orderBy(desc(jobApplications.appliedAt));
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

  // Study companion methods
  async getStudyCompanionConversations(userId: string): Promise<StudyCompanionMessage[]> {
    return await db
      .select()
      .from(studyCompanionMessages)
      .where(eq(studyCompanionMessages.userId, userId))
      .orderBy(studyCompanionMessages.timestamp);
  }

  async saveStudyCompanionMessage(message: InsertStudyCompanionMessage): Promise<StudyCompanionMessage> {
    const [savedMessage] = await db
      .insert(studyCompanionMessages)
      .values(message)
      .returning();
    return savedMessage;
  }

  async getUserProgress(userId: string): Promise<any> {
    try {
      // Get user enrollments
      const enrollments = await this.getUserEnrollments(userId);
      
      // Get user's study sessions for progress tracking
      const studySessions = await this.getUserStudySessions(userId);
      
      // Get recent quiz attempts
      const quizAttempts = await this.getUserQuizAttempts(userId);
      
      // Calculate overall progress
      const totalStudyTime = studySessions.reduce((total, session) => {
        const duration = session.sessionEnd && session.sessionStart 
          ? new Date(session.sessionEnd).getTime() - new Date(session.sessionStart).getTime()
          : session.durationSeconds ? session.durationSeconds * 1000 : 0;
        return total + (duration / (1000 * 60)); // Convert to minutes
      }, 0);

      const enrolledCourses = enrollments.map(e => e.courseId);
      const recentTopics = Array.from(new Set(studySessions
        .slice(-5)
        .map(session => session.contentType)
        .filter(Boolean)
      ));

      return {
        enrolledCourses,
        overallProgress: enrollments.length > 0 
          ? enrollments.reduce((avg, e) => avg + Number(e.progress || 0), 0) / enrollments.length 
          : 0,
        totalStudyTime: Math.round(totalStudyTime),
        recentTopics,
        quizPerformance: quizAttempts.length > 0 
          ? quizAttempts.reduce((avg, attempt) => avg + Number(attempt.score || 0), 0) / quizAttempts.length 
          : 0,
        studyStreak: this.calculateStudyStreak(studySessions),
        lastActivity: studySessions.length > 0 
          ? studySessions[studySessions.length - 1].sessionStart 
          : null
      };
    } catch (error) {
      console.error("Error getting user progress:", error);
      return {
        enrolledCourses: [],
        overallProgress: 0,
        totalStudyTime: 0,
        recentTopics: [],
        quizPerformance: 0,
        studyStreak: 0,
        lastActivity: null
      };
    }
  }

  private calculateStudyStreak(studySessions: any[]): number {
    if (studySessions.length === 0) return 0;
    
    // Simple streak calculation - count consecutive days with study sessions
    const sessionDates = studySessions
      .map(session => new Date(session.sessionStart).toDateString())
      .reverse(); // Most recent first
    
    const uniqueDates = [...new Set(sessionDates)];
    let streak = 0;
    const today = new Date().toDateString();
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const sessionDate = new Date(uniqueDates[i]);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (sessionDate.toDateString() === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
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

  async getPlanUpload(planId: string, userId: string): Promise<PlanUpload | undefined> {
    const [plan] = await db
      .select()
      .from(planUploads)
      .where(and(
        eq(planUploads.id, planId),
        eq(planUploads.userId, userId)
      ));
    return plan || undefined;
  }

  // Flashcard methods
  async getFlashcardsByCourse(courseId: string): Promise<Flashcard[]> {
    return await db
      .select()
      .from(flashcards)
      .where(eq(flashcards.courseId, courseId))
      .orderBy(desc(flashcards.createdAt));
  }

  async createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard> {
    const [created] = await db
      .insert(flashcards)
      .values(flashcard)
      .returning();
    return created;
  }

  // Breakdown methods for detailed admin statistics
  async getQuestionBreakdowns(courseId: string): Promise<any> {
    // Get breakdowns from competition_questions table
    const categoryBreakdown = await db
      .select({
        category: competitionQuestions.category,
        count: sql<number>`COUNT(*)`
      })
      .from(competitionQuestions)
      .groupBy(competitionQuestions.category);

    const difficultyBreakdown = await db
      .select({
        difficulty: competitionQuestions.difficulty,
        count: sql<number>`COUNT(*)`
      })
      .from(competitionQuestions)
      .groupBy(competitionQuestions.difficulty);

    const sectionBreakdown = await db
      .select({
        codeReference: competitionQuestions.codeReference,
        count: sql<number>`COUNT(*)`
      })
      .from(competitionQuestions)
      .groupBy(competitionQuestions.codeReference);

    return {
      byChapter: categoryBreakdown,
      byDifficulty: difficultyBreakdown,
      bySection: sectionBreakdown
    };
  }

  async getFlashcardBreakdowns(courseId: string): Promise<any> {
    const categoryBreakdown = await db
      .select({
        category: flashcards.category,
        count: sql<number>`COUNT(*)`
      })
      .from(flashcards)
      .where(eq(flashcards.courseId, courseId))
      .groupBy(flashcards.category);

    const difficultyBreakdown = await db
      .select({
        difficulty: flashcards.difficulty,
        count: sql<number>`COUNT(*)`
      })
      .from(flashcards)
      .where(eq(flashcards.courseId, courseId))
      .groupBy(flashcards.difficulty);

    const sectionBreakdown = await db
      .select({
        codeReference: flashcards.codeReference,
        count: sql<number>`COUNT(*)`
      })
      .from(flashcards)
      .where(eq(flashcards.courseId, courseId))
      .groupBy(flashcards.codeReference);

    return {
      byChapter: categoryBreakdown,
      byDifficulty: difficultyBreakdown,
      bySection: sectionBreakdown
    };
  }

  async createReferral(referralData: InsertReferral): Promise<Referral> {
    const [referral] = await db
      .insert(referrals)
      .values(referralData)
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

  async getUserReferralEarnings(userId: string): Promise<{ total: number; unpaid: number; paid: number }> {
    const earnings = await db
      .select({
        total: sql<number>`sum(${referrals.commissionAmount})`,
        unpaid: sql<number>`sum(case when ${referrals.isPaid} = false then ${referrals.commissionAmount} else 0 end)`,
        paid: sql<number>`sum(case when ${referrals.isPaid} = true then ${referrals.commissionAmount} else 0 end)`
      })
      .from(referrals)
      .where(eq(referrals.referrerId, userId));

    const result = earnings[0];
    return {
      total: Number(result?.total || 0),
      unpaid: Number(result?.unpaid || 0),
      paid: Number(result?.paid || 0)
    };
  }

  // Monthly commission methods for subscription upgrades
  async createMonthlyCommission(commission: any): Promise<any> {
    const [newCommission] = await db
      .insert(monthlyCommissions)
      .values(commission)
      .returning();
    return newCommission;
  }

  async getMonthlyCommissions(userId: string, month?: string): Promise<any[]> {
    const conditions = [eq(monthlyCommissions.referrerId, userId)];
    
    if (month) {
      conditions.push(eq(monthlyCommissions.commissionMonth, month));
    }

    return await db
      .select()
      .from(monthlyCommissions)
      .where(and(...conditions));
  }

  async updateMonthlyCommission(commissionId: string, isPaid: boolean, paidAt?: Date): Promise<any> {
    const [updated] = await db
      .update(monthlyCommissions)
      .set({
        isPaid,
        paidAt: paidAt || new Date()
      })
      .where(eq(monthlyCommissions.id, commissionId))
      .returning();
    return updated;
  }

  async getAllUnpaidMonthlyCommissions(): Promise<any[]> {
    return await db
      .select()
      .from(monthlyCommissions)
      .where(eq(monthlyCommissions.isPaid, false));
  }

  async processSubscriptionUpgrade(referredUserId: string, newTier: string, oldTier: string): Promise<void> {
    // Find all referrals where this user was referred
    const userReferrals = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referredId, referredUserId));

    const currentMonth = new Date().toISOString().slice(0, 7); // Format: "2025-01"

    for (const referral of userReferrals) {
      // Get the current referrer's tier
      const referrer = await this.getUser(referral.referrerId);
      if (!referrer) continue;

      // Calculate commission based on upgrade
      const { commissionAmount, eligibleTier } = calculateReferralCommission(
        referrer.subscriptionTier as any,
        newTier as any
      );

      // Create monthly commission record
      await this.createMonthlyCommission({
        referralId: referral.id,
        referrerId: referral.referrerId,
        referredUserId: referredUserId,
        commissionMonth: currentMonth,
        referrerTierAtTime: referrer.subscriptionTier,
        referredTierAtTime: newTier,
        eligibleTier,
        commissionAmount: commissionAmount.toString(),
        commissionRate: "0.10",
        isPaid: false
      });
    }
  }

  // Payment methods
  async updateUserPaymentPreferences(userId: string, paymentMethod: string, paypalEmail?: string, minimumPayout?: number): Promise<User> {
    const updates: Partial<User> = {
      preferredPaymentMethod: paymentMethod as any,
      updatedAt: new Date()
    };
    
    if (paypalEmail !== undefined) {
      updates.paypalEmail = paypalEmail;
    }
    
    if (minimumPayout !== undefined) {
      updates.minimumPayout = minimumPayout.toString();
    }

    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserAccountBalance(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) return 0;
    return parseFloat(user.accountBalance || "0");
  }

  async addAccountCredit(userId: string, amount: number, description: string, referenceId?: string): Promise<AccountCreditTransaction> {
    const currentBalance = await this.getUserAccountBalance(userId);
    const newBalance = currentBalance + amount;

    // Update user balance
    await this.updateUser(userId, { 
      accountBalance: newBalance.toString() 
    });

    // Create transaction record
    const [transaction] = await db
      .insert(accountCreditTransactions)
      .values({
        userId,
        amount: amount.toString(),
        type: "credit",
        description,
        referenceId,
        balanceBefore: currentBalance.toString(),
        balanceAfter: newBalance.toString()
      })
      .returning();

    return transaction;
  }

  async deductAccountCredit(userId: string, amount: number, description: string, referenceId?: string): Promise<AccountCreditTransaction> {
    const currentBalance = await this.getUserAccountBalance(userId);
    if (currentBalance < amount) {
      throw new Error("Insufficient account balance");
    }
    
    const newBalance = currentBalance - amount;

    // Update user balance
    await this.updateUser(userId, { 
      accountBalance: newBalance.toString() 
    });

    // Create transaction record
    const [transaction] = await db
      .insert(accountCreditTransactions)
      .values({
        userId,
        amount: (-amount).toString(),
        type: "debit",
        description,
        referenceId,
        balanceBefore: currentBalance.toString(),
        balanceAfter: newBalance.toString()
      })
      .returning();

    return transaction;
  }

  async getUserAccountTransactions(userId: string, page: number = 1, limit: number = 50): Promise<AccountCreditTransaction[]> {
    const offset = (page - 1) * limit;
    
    return await db
      .select()
      .from(accountCreditTransactions)
      .where(eq(accountCreditTransactions.userId, userId))
      .orderBy(desc(accountCreditTransactions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // Payout methods
  async createPayoutRequest(request: InsertPayoutRequest): Promise<PayoutRequest> {
    const [payoutRequest] = await db
      .insert(payoutRequests)
      .values(request)
      .returning();
    return payoutRequest;
  }

  async getUserPayoutRequests(userId: string): Promise<PayoutRequest[]> {
    return await db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.userId, userId))
      .orderBy(desc(payoutRequests.createdAt));
  }

  async getPendingPayoutRequests(): Promise<PayoutRequest[]> {
    return await db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.status, "pending"))
      .orderBy(payoutRequests.requestedAt);
  }

  async updatePayoutRequestStatus(payoutId: string, status: string, transactionId?: string, failureReason?: string): Promise<PayoutRequest> {
    const updates: any = {
      status: status as any,
      updatedAt: new Date()
    };

    if (status === "processing") {
      updates.processedAt = new Date();
    }
    if (status === "completed") {
      updates.completedAt = new Date();
    }
    if (transactionId) {
      updates.transactionId = transactionId;
    }
    if (failureReason) {
      updates.failureReason = failureReason;
    }

    const [payoutRequest] = await db
      .update(payoutRequests)
      .set(updates)
      .where(eq(payoutRequests.id, payoutId))
      .returning();

    return payoutRequest;
  }

  async processAutomaticPayouts(): Promise<{ processed: number; total: number }> {
    // This would implement automatic payout processing logic
    // For now, return placeholder values
    return { processed: 0, total: 0 };
  }

  async getUserEligibleCommissionsForPayout(userId: string): Promise<{ referrals: Referral[]; monthlyCommissions: MonthlyCommission[]; totalAmount: number }> {
    // Get unpaid referrals
    const unpaidReferrals = await db
      .select()
      .from(referrals)
      .where(and(
        eq(referrals.referrerId, userId),
        eq(referrals.isPaid, false)
      ));

    // Get unpaid monthly commissions
    const unpaidMonthlyCommissions = await db
      .select()
      .from(monthlyCommissions)
      .where(and(
        eq(monthlyCommissions.referrerId, userId),
        eq(monthlyCommissions.isPaid, false)
      ));

    // Calculate total amount
    const referralTotal = unpaidReferrals.reduce((sum, ref) => sum + parseFloat(ref.commissionAmount || "0"), 0);
    const monthlyTotal = unpaidMonthlyCommissions.reduce((sum, comm) => sum + parseFloat(comm.commissionAmount || "0"), 0);
    const totalAmount = referralTotal + monthlyTotal;

    return {
      referrals: unpaidReferrals,
      monthlyCommissions: unpaidMonthlyCommissions,
      totalAmount
    };
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

  async getStudyPlansByCourse(courseId: string): Promise<any[]> {
    const results = await db
      .select()
      .from(courseContent)
      .where(and(
        eq(courseContent.courseId, courseId),
        eq(courseContent.type, 'study_plans')
      ))
      .orderBy(courseContent.chapter, courseContent.section, courseContent.sortOrder);
    
    return results.map(plan => ({
      id: plan.id,
      title: plan.title,
      content: plan.content,
      duration: plan.duration || 30 // Default 30 minutes if not specified
    }));
  }

  async getCourseContentById(id: string): Promise<CourseContent | null> {
    const [result] = await db
      .select()
      .from(courseContent)
      .where(eq(courseContent.id, id))
      .limit(1);
    
    return result || null;
  }

  // Get course content by title (for duplicate detection)
  async getCourseContentByTitle(courseId: string, title: string): Promise<CourseContent | null> {
    const [result] = await db
      .select()
      .from(courseContent)
      .where(and(
        eq(courseContent.courseId, courseId),
        eq(courseContent.title, title)
      ))
      .limit(1);
    
    return result || null;
  }

  async createCourseContent(content: InsertCourseContent): Promise<CourseContent> {
    const [result] = await db
      .insert(courseContent)
      .values(content)
      .returning();
    
    return result;
  }

  async updateCourseContent(id: string, data: Partial<InsertCourseContent>): Promise<CourseContent> {
    const [result] = await db
      .update(courseContent)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courseContent.id, id))
      .returning();
    
    if (!result) {
      throw new Error("Course content not found");
    }
    
    return result;
  }

  async deleteCourseContent(id: string): Promise<void> {
    await db.delete(courseContent).where(eq(courseContent.id, id));
  }

  async updateContentAudio(contentId: string, audioUrl: string): Promise<void> {
    await db
      .update(courseContent)
      .set({ 
        content: sql`jsonb_set(content, '{extracted,audioUrl}', ${JSON.stringify(audioUrl)})`,
        updatedAt: new Date()
      })
      .where(eq(courseContent.id, contentId));
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

  async getChatAnswer(question: string, contentId?: string): Promise<ChatAnswer | undefined> {
    const lowerQuestion = question.toLowerCase();
    
    // Search for answers that match keywords
    const answers = await db.select().from(chatAnswers);
    
    return answers.find(answer => {
      if (answer.keywords) {
        return answer.keywords.some(keyword => lowerQuestion.includes(keyword.toLowerCase()));
      }
      return false;
    });
  }

  async createChatAnswer(answer: InsertChatAnswer): Promise<ChatAnswer> {
    const [result] = await db.insert(chatAnswers).values(answer).returning();
    return result;
  }

  async getAllChatAnswers(): Promise<ChatAnswer[]> {
    return await db.select().from(chatAnswers);
  }

  // Study session methods
  async startStudySession(userId: string, contentId: string, contentType: string): Promise<StudySession> {
    const [session] = await db
      .insert(studySessions)
      .values({
        userId,
        contentId,
        contentType,
        sessionStart: new Date(),
      })
      .returning();
    
    return session;
  }

  async endStudySession(sessionId: string): Promise<StudySession> {
    const now = new Date();
    
    // Get the session to calculate duration
    const [existingSession] = await db
      .select()
      .from(studySessions)
      .where(eq(studySessions.id, sessionId));
    
    if (!existingSession || !existingSession.sessionStart) {
      throw new Error('Study session not found or has no start time');
    }
    
    const durationSeconds = Math.floor((now.getTime() - new Date(existingSession.sessionStart).getTime()) / 1000);
    
    const [session] = await db
      .update(studySessions)
      .set({
        sessionEnd: now,
        durationSeconds,
        completed: true,
      })
      .where(eq(studySessions.id, sessionId))
      .returning();
    
    return session;
  }

  async getUserStudySessions(userId: string, contentId?: string): Promise<StudySession[]> {
    const conditions = [eq(studySessions.userId, userId)];
    
    if (contentId) {
      conditions.push(eq(studySessions.contentId, contentId));
    }
    
    return await db
      .select()
      .from(studySessions)
      .where(and(...conditions))
      .orderBy(desc(studySessions.sessionStart));
  }

  // Study notes methods
  async getStudyNotesByCourse(courseId: string): Promise<CourseContent[]> {
    return await db
      .select()
      .from(courseContent)
      .where(and(
        eq(courseContent.courseId, courseId),
        eq(courseContent.type, 'study-notes')
      ))
      .orderBy(courseContent.sortOrder, courseContent.title);
  }

  async createStudyNote(studyNote: InsertCourseContent): Promise<CourseContent> {
    const [result] = await db
      .insert(courseContent)
      .values({
        ...studyNote,
        type: 'study-notes'
      })
      .returning();
    
    return result;
  }

  async getStudySessionStats(userId: string): Promise<{ totalTime: number; sessionsCount: number; avgSessionTime: number }> {
    const stats = await db
      .select({
        totalSeconds: sql<number>`COALESCE(SUM(${studySessions.durationSeconds}), 0)`,
        sessionCount: sql<number>`COUNT(*)`,
      })
      .from(studySessions)
      .where(and(
        eq(studySessions.userId, userId),
        eq(studySessions.completed, true)
      ));
    
    const totalSeconds = Number(stats[0]?.totalSeconds || 0);
    const sessionsCount = Number(stats[0]?.sessionCount || 0);
    const avgSessionTime = sessionsCount > 0 ? Math.round(totalSeconds / sessionsCount) : 0;
    
    return {
      totalTime: totalSeconds,
      sessionsCount,
      avgSessionTime,
    };
  }

  // Quiz attempt methods
  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [result] = await db
      .insert(quizAttempts)
      .values(attempt)
      .returning();
    
    return result;
  }

  async getUserQuizAttempts(userId: string, contentId?: string): Promise<QuizAttempt[]> {
    const conditions = [eq(quizAttempts.userId, userId)];
    
    if (contentId) {
      conditions.push(eq(quizAttempts.contentId, contentId));
    }
    
    return await db
      .select()
      .from(quizAttempts)
      .where(and(...conditions))
      .orderBy(desc(quizAttempts.completedAt));
  }

  async getLatestQuizAttempt(userId: string, contentId: string): Promise<QuizAttempt | undefined> {
    const [result] = await db
      .select()
      .from(quizAttempts)
      .where(and(
        eq(quizAttempts.userId, userId),
        eq(quizAttempts.contentId, contentId)
      ))
      .orderBy(desc(quizAttempts.completedAt))
      .limit(1);
    
    return result;
  }

  // Section progress methods
  async getSectionProgress(userId: string, courseId: string): Promise<SectionProgress[]> {
    return await db
      .select()
      .from(sectionProgress)
      .where(and(
        eq(sectionProgress.userId, userId),
        eq(sectionProgress.courseId, courseId)
      ))
      .orderBy(sectionProgress.chapter, sectionProgress.section);
  }

  async updateSectionProgress(userId: string, courseId: string, chapter: number, section: number, data: Partial<SectionProgress>): Promise<SectionProgress> {
    // Try to find existing progress record
    const [existing] = await db
      .select()
      .from(sectionProgress)
      .where(and(
        eq(sectionProgress.userId, userId),
        eq(sectionProgress.courseId, courseId),
        eq(sectionProgress.chapter, chapter),
        eq(sectionProgress.section, section)
      ));

    if (existing) {
      // Update existing record
      const [updated] = await db
        .update(sectionProgress)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(sectionProgress.id, existing.id))
        .returning();
      
      return updated;
    } else {
      // Create new record
      const [created] = await db
        .insert(sectionProgress)
        .values({
          userId,
          courseId,
          chapter,
          section,
          ...data,
        })
        .returning();
      
      return created;
    }
  }

  async unlockNextSection(userId: string, courseId: string, chapter: number, section: number): Promise<void> {
    // Get all course content to determine next section
    const content = await db
      .select()
      .from(courseContent)
      .where(eq(courseContent.courseId, courseId))
      .orderBy(courseContent.chapter, courseContent.section);

    // Find current section index
    const currentIndex = content.findIndex(c => c.chapter === chapter && c.section === section);
    
    if (currentIndex >= 0 && currentIndex < content.length - 1) {
      const nextContent = content[currentIndex + 1];
      
      // Unlock next section
      await this.updateSectionProgress(userId, courseId, nextContent.chapter!, nextContent.section!, {
        isUnlocked: true,
        unlockedAt: new Date(),
      });
    }
  }

  async isSectionUnlocked(userId: string, courseId: string, chapter: number, section: number): Promise<boolean> {
    // First section (section 101) is always unlocked
    if (section === 101) {
      return true;
    }

    const [progress] = await db
      .select()
      .from(sectionProgress)
      .where(and(
        eq(sectionProgress.userId, userId),
        eq(sectionProgress.courseId, courseId),
        eq(sectionProgress.chapter, chapter),
        eq(sectionProgress.section, section)
      ));

    return progress?.isUnlocked || false;
  }

  // Lesson step progress methods
  async updateLessonStepProgress(progressData: Partial<LessonStepProgress>): Promise<LessonStepProgress> {
    // Try to find existing progress record
    const [existing] = await db
      .select()
      .from(lessonStepProgress)
      .where(and(
        eq(lessonStepProgress.userId, progressData.userId!),
        eq(lessonStepProgress.courseId, progressData.courseId!),
        eq(lessonStepProgress.section, progressData.section!),
        eq(lessonStepProgress.stepType, progressData.stepType!)
      ));

    if (existing) {
      // Update existing record
      const [updated] = await db
        .update(lessonStepProgress)
        .set({ ...progressData, updatedAt: new Date() })
        .where(eq(lessonStepProgress.id, existing.id))
        .returning();
      
      return updated;
    } else {
      // Create new record
      const [created] = await db
        .insert(lessonStepProgress)
        .values({
          ...progressData,
          createdAt: new Date(),
          updatedAt: new Date()
        } as any)
        .returning();
      
      return created;
    }
  }

  async getLessonStepProgress(userId: string, courseId: string, section: number, stepType: string): Promise<LessonStepProgress | undefined> {
    const [progress] = await db
      .select()
      .from(lessonStepProgress)
      .where(and(
        eq(lessonStepProgress.userId, userId),
        eq(lessonStepProgress.courseId, courseId),
        eq(lessonStepProgress.section, section),
        eq(lessonStepProgress.stepType, stepType)
      ));

    return progress || undefined;
  }

  async getCurrentLessonStep(userId: string, courseId: string, section: number): Promise<{ stepType: string; stepIndex: number; currentPosition?: any } | null> {
    // Get all lesson steps for this section, ordered by stepIndex
    const steps = await db
      .select()
      .from(lessonStepProgress)
      .where(and(
        eq(lessonStepProgress.userId, userId),
        eq(lessonStepProgress.courseId, courseId),
        eq(lessonStepProgress.section, section)
      ))
      .orderBy(desc(lessonStepProgress.lastAccessedAt));

    if (steps.length === 0) {
      // No progress yet, start with introduction
      return { stepType: 'introduction', stepIndex: 0 };
    }

    // Find the most recently accessed step that's not completed
    const currentStep = steps.find(step => !step.isCompleted);
    
    if (currentStep) {
      return {
        stepType: currentStep.stepType,
        stepIndex: currentStep.stepIndex,
        currentPosition: currentStep.currentPosition
      };
    }

    // All steps completed, return the last one
    const lastStep = steps[0]; // Most recently accessed
    return {
      stepType: lastStep.stepType,
      stepIndex: lastStep.stepIndex,
      currentPosition: lastStep.currentPosition
    };
  }

  // Product methods
  async getProducts(category?: string, search?: string, page = 1, limit = 20): Promise<{ products: Product[], total: number }> {
    const offset = (page - 1) * limit;
    
    const conditions = [eq(products.isActive, true)];
    
    if (category && category !== 'all') {
      conditions.push(eq(products.category, category as any));
    }
    
    if (search) {
      const searchCondition = or(
        ilike(products.name, `%${search}%`),
        ilike(products.description, `%${search}%`),
        ilike(products.brand, `%${search}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }
    
    const finalCondition = conditions.length > 1 ? and(...conditions) : conditions[0];
    
    const query = db.select().from(products).where(finalCondition);
    const countQuery = db.select({ count: count() }).from(products).where(finalCondition);
    
    const productsResult = await query
      .orderBy(desc(products.isFeatured), products.sortOrder, desc(products.createdAt))
      .limit(limit)
      .offset(offset);
    
    const [{ count: total }] = await countQuery;
    
    return { products: productsResult, total };
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
      .orderBy(products.sortOrder, desc(products.createdAt))
      .limit(limit);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
  }

  // Cart methods
  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    return await db
      .select()
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId))
      .orderBy(desc(cartItems.createdAt));
  }

  async addToCart(userId: string, productId: string, quantity = 1): Promise<CartItem> {
    // Check if item already exists in cart
    const [existing] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));

    if (existing) {
      // Update existing item quantity
      const [updated] = await db
        .update(cartItems)
        .set({ 
          quantity: existing.quantity + quantity,
          updatedAt: new Date()
        })
        .where(eq(cartItems.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new cart item
      const [newItem] = await db
        .insert(cartItems)
        .values({ userId, productId, quantity })
        .returning();
      return newItem;
    }
  }

  async updateCartItem(userId: string, productId: string, quantity: number): Promise<CartItem> {
    const [updated] = await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
      .returning();
    return updated;
  }

  async removeFromCart(userId: string, productId: string): Promise<void> {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // Product review methods
  async getProductReviews(productId: string): Promise<ProductReview[]> {
    return await db
      .select()
      .from(productReviews)
      .where(and(eq(productReviews.productId, productId), eq(productReviews.isApproved, true)))
      .orderBy(desc(productReviews.createdAt));
  }

  async createProductReview(review: InsertProductReview): Promise<ProductReview> {
    const [newReview] = await db
      .insert(productReviews)
      .values(review)
      .returning();
    return newReview;
  }

  async updateProductReview(id: string, updates: Partial<ProductReview>): Promise<ProductReview> {
    const [review] = await db
      .update(productReviews)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(productReviews.id, id))
      .returning();
    return review;
  }

  async deleteProductReview(id: string): Promise<void> {
    await db.delete(productReviews).where(eq(productReviews.id, id));
  }

  // ===== GAMIFICATION METHODS =====

  // Get user achievements with badge details
  async getUserAchievements(userId: string): Promise<any[]> {
    return await db
      .select({
        id: userAchievements.id,
        earnedAt: userAchievements.earnedAt,
        pointsEarned: userAchievements.pointsEarned,
        achievement: {
          id: achievements.id,
          name: achievements.name,
          description: achievements.description,
          type: achievements.type,
          icon: achievements.icon,
          badgeColor: achievements.badgeColor,
          pointValue: achievements.pointValue,
        }
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.earnedAt));
  }

  // Award achievement to user (with duplicate check)
  async awardAchievement(userId: string, achievementId: string): Promise<any> {
    // Check if already earned
    const existing = await db
      .select()
      .from(userAchievements)
      .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievementId)));

    if (existing.length > 0) {
      throw new Error("Achievement already earned");
    }

    // Get achievement details for points
    const [achievement] = await db
      .select()
      .from(achievements)
      .where(eq(achievements.id, achievementId));

    if (!achievement) {
      throw new Error("Achievement not found");
    }

    // Award the achievement
    const [newAchievement] = await db
      .insert(userAchievements)
      .values({
        userId,
        achievementId,
        pointsEarned: achievement.pointValue || 0,
      })
      .returning();

    // Add points to user's total
    if (achievement.pointValue && achievement.pointValue > 0) {
      await this.addPoints(
        userId,
        achievement.pointValue,
        "achievement_earned",
        `Earned achievement: ${achievement.name}`,
        achievementId
      );
    }

    return newAchievement;
  }

  // Get user points summary
  async getUserPointsSummary(userId: string): Promise<any> {
    const [user] = await db
      .select({
        totalPoints: users.totalPoints,
        currentStreak: users.currentStreak,
        longestStreak: users.longestStreak,
      })
      .from(users)
      .where(eq(users.id, userId));

    const achievements = await this.getUserAchievements(userId);
    
    return {
      totalPoints: user?.totalPoints || 0,
      currentStreak: user?.currentStreak || 0,
      longestStreak: user?.longestStreak || 0,
      achievementCount: achievements.length,
      recentAchievements: achievements.slice(0, 3),
    };
  }

  // Get leaderboard based on period
  async getLeaderboard(period: string): Promise<any[]> {
    let query = db
      .select({
        userId: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        totalPoints: users.totalPoints,
        currentStreak: users.currentStreak,
        achievementCount: sql<number>`COUNT(${userAchievements.id})`,
      })
      .from(users)
      .leftJoin(userAchievements, eq(users.id, userAchievements.userId))
      .groupBy(users.id)
      .orderBy(desc(users.totalPoints))
      .limit(20);

    return await query;
  }

  // Add points to user account
  async addPoints(userId: string, points: number, action: string, description: string, referenceId?: string): Promise<void> {
    // Get current balance
    const [user] = await db
      .select({ totalPoints: users.totalPoints })
      .from(users)
      .where(eq(users.id, userId));

    const currentBalance = user?.totalPoints || 0;
    const newBalance = currentBalance + points;

    // Update user points
    await db
      .update(users)
      .set({ 
        totalPoints: newBalance,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Record points history
    await db
      .insert(userPointsHistory)
      .values({
        userId,
        points,
        action,
        description,
        referenceId,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
      });
  }

  // Get current monthly competition
  async getCurrentCompetition(month: string): Promise<any> {
    const [competition] = await db
      .select()
      .from(monthlyCompetitions)
      .where(eq(monthlyCompetitions.month, month))
      .orderBy(desc(monthlyCompetitions.createdAt));

    if (!competition) {
      // Create this month's competition if it doesn't exist
      const now = new Date();
      const year = now.getFullYear();
      const monthNum = now.getMonth();
      
      // Last day of current month
      const lastDay = new Date(year, monthNum + 1, 0);
      const startDate = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 0, 0, 0);
      const endDate = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59, 59);

      const [newCompetition] = await db
        .insert(monthlyCompetitions)
        .values({
          title: `${lastDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Plumbing Code Challenge`,
          description: "Test your knowledge of the complete Louisiana Plumbing Code in this month's competition!",
          month,
          year,
          startDate,
          endDate,
          status: 'upcoming',
          timeLimit: 120, // 2 hours
          questionCount: 100,
          difficultyCounts: {
            medium: 40,
            hard: 40,
            very_hard: 20
          }
        })
        .returning();

      return newCompetition;
    }

    return competition;
  }

  // Start competition attempt
  async startCompetitionAttempt(competitionId: string, userId: string): Promise<any> {
    // Check if user already attempted this competition
    const existing = await db
      .select()
      .from(competitionAttempts)
      .where(and(eq(competitionAttempts.competitionId, competitionId), eq(competitionAttempts.userId, userId)));

    if (existing.length > 0) {
      throw new Error("You have already attempted this competition");
    }

    // Get competition details
    const [competition] = await db
      .select()
      .from(monthlyCompetitions)
      .where(eq(monthlyCompetitions.id, competitionId));

    if (!competition) {
      throw new Error("Competition not found");
    }

    // Check if competition is active (on last day of month)
    const now = new Date();
    if (now < competition.startDate || now > competition.endDate) {
      throw new Error("Competition is not currently active");
    }

    // Get random questions based on difficulty
    const questions = await this.getCompetitionQuestions(competition.difficultyCounts);

    // Create attempt record
    const [attempt] = await db
      .insert(competitionAttempts)
      .values({
        competitionId,
        userId,
        questions,
        totalQuestions: questions.length,
        correctAnswers: 0,
        score: "0",
      })
      .returning();

    return {
      ...attempt,
      competition,
      timeLimit: competition.timeLimit,
    };
  }

  // Get random competition questions based on difficulty distribution
  async getCompetitionQuestions(difficultyCounts: any): Promise<any[]> {
    const questions: any[] = [];
    
    for (const [difficulty, count] of Object.entries(difficultyCounts)) {
      const difficultyQuestions = await db
        .select()
        .from(competitionQuestions)
        .where(and(
          eq(competitionQuestions.difficulty, difficulty as any),
          eq(competitionQuestions.isActive, true)
        ))
        .orderBy(sql`RANDOM()`)
        .limit(count as number);

      questions.push(...difficultyQuestions);
    }

    return questions;
  }

  // Get all active questions from database (for duplicate checking across entire database)
  async getAllActiveQuestions(): Promise<any[]> {
    return await db
      .select()
      .from(competitionQuestions)
      .where(eq(competitionQuestions.isActive, true))
      .orderBy(competitionQuestions.createdAt);
  }

  // Get questions filtered by courseId (for course statistics)
  async getQuestionsByCourse(courseId: string): Promise<any[]> {
    // Since competitionQuestions don't have courseId, return all active questions for now
    // TODO: Add proper course-question mapping based on codeReference or category
    return await db
      .select()
      .from(competitionQuestions)
      .where(eq(competitionQuestions.isActive, true))
      .orderBy(competitionQuestions.createdAt);
  }

  // Get questions by section for quiz
  async getQuestionsBySection(section: string): Promise<any[]> {
    console.log('🔍 Getting questions for section:', section);
    
    const questions = await db
      .select()
      .from(competitionQuestions)
      .where(and(
        eq(competitionQuestions.isActive, true),
        like(competitionQuestions.codeReference, `%${section}%`)
      ))
      .orderBy(competitionQuestions.createdAt);
      
    console.log('📊 Found', questions.length, 'questions for section', section);
    console.log('📝 Code references:', questions.map(q => q.codeReference).slice(0, 3));
    
    return questions;
  }

  // Create a new question
  async createQuestion(questionData: any): Promise<any> {
    // Handle both field names for question text
    const questionText = questionData.question || questionData.questionText;
    
    if (!questionText) {
      throw new Error('Question text is required');
    }
    
    const [newQuestion] = await db
      .insert(competitionQuestions)
      .values({
        question: questionText,
        options: questionData.options,
        correctAnswer: questionData.correctAnswer,
        explanation: questionData.explanation,
        difficulty: questionData.difficulty || 'medium',
        category: questionData.category || questionData.chapter,
        codeReference: questionData.codeReference || questionData.section || `${questionData.chapter || 'General'} - ${questionData.section || 'Section 1'}`,
        pointValue: questionData.pointValue || 1,
        isActive: true
      })
      .returning();
    return newQuestion;
  }

  // Submit competition attempt
  async submitCompetitionAttempt(competitionId: string, userId: string, answers: any[], timeSpent: number): Promise<any> {
    // Get the attempt
    const [attempt] = await db
      .select()
      .from(competitionAttempts)
      .where(and(eq(competitionAttempts.competitionId, competitionId), eq(competitionAttempts.userId, userId)));

    if (!attempt) {
      throw new Error("Competition attempt not found");
    }

    if (attempt.completedAt) {
      throw new Error("Competition already completed");
    }

    // Calculate score
    const questions = attempt.questions as any[];
    let correctAnswers = 0;

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const userAnswer = answers[i];
      
      if (userAnswer === question.correctAnswer) {
        correctAnswers++;
      }
    }

    const score = (correctAnswers / questions.length) * 100;
    const pointsEarned = Math.floor(score * 2); // 2 points per percentage point

    // Update attempt
    const [updatedAttempt] = await db
      .update(competitionAttempts)
      .set({
        correctAnswers,
        score,
        timeSpent,
        completedAt: new Date(),
        pointsEarned,
      })
      .where(eq(competitionAttempts.id, attempt.id))
      .returning();

    // Award points
    await this.addPoints(
      userId,
      pointsEarned,
      "competition_completed",
      `Completed monthly competition with ${score.toFixed(1)}% score`,
      competitionId
    );

    return updatedAttempt;
  }

  // Get user's competition history
  async getUserCompetitionHistory(userId: string): Promise<any[]> {
    return await db
      .select({
        id: competitionAttempts.id,
        score: competitionAttempts.score,
        rank: competitionAttempts.rank,
        timeSpent: competitionAttempts.timeSpent,
        pointsEarned: competitionAttempts.pointsEarned,
        completedAt: competitionAttempts.completedAt,
        competition: {
          id: monthlyCompetitions.id,
          title: monthlyCompetitions.title,
          month: monthlyCompetitions.month,
          year: monthlyCompetitions.year,
        }
      })
      .from(competitionAttempts)
      .innerJoin(monthlyCompetitions, eq(competitionAttempts.competitionId, monthlyCompetitions.id))
      .where(eq(competitionAttempts.userId, userId))
      .orderBy(desc(competitionAttempts.completedAt));
  }

  // Create monthly competition (admin only)
  async createMonthlyCompetition(competition: any): Promise<any> {
    const [newCompetition] = await db
      .insert(monthlyCompetitions)
      .values(competition)
      .returning();

    return newCompetition;
  }

  // Additional study session methods
  async createStudySession(data: InsertStudySession): Promise<StudySession> {
    const [session] = await db
      .insert(studySessions)
      .values(data)
      .returning();
    
    return session;
  }

  async updateStudySession(sessionId: string, updates: Partial<StudySession>): Promise<StudySession> {
    const [session] = await db
      .update(studySessions)
      .set(updates)
      .where(eq(studySessions.id, sessionId))
      .returning();
    
    if (!session) {
      throw new Error('Study session not found');
    }
    
    return session;
  }

  // Course content wrapper methods
  async createLesson(lesson: InsertCourseContent): Promise<CourseContent> {
    return this.createCourseContent({ ...lesson, type: 'lesson' });
  }

  async createChapter(chapter: InsertCourseContent): Promise<CourseContent> {
    return this.createCourseContent({ ...chapter, type: 'chapter' });
  }

  // Lessons breakdown - only chapter/section, no difficulty
  async getCourseContentBreakdowns(courseId: string): Promise<any> {
    const lessons = await db
      .select({
        chapter: courseContent.chapter,
        count: sql<number>`COUNT(*)`
      })
      .from(courseContent)
      .where(and(eq(courseContent.courseId, courseId), eq(courseContent.type, 'lesson')))
      .groupBy(courseContent.chapter);

    const sections = await db
      .select({
        section: courseContent.section,
        count: sql<number>`COUNT(*)`
      })
      .from(courseContent)
      .where(and(eq(courseContent.courseId, courseId), eq(courseContent.type, 'lesson')))
      .groupBy(courseContent.section);

    return {
      byChapter: lessons.map(item => ({ category: `Chapter ${item.chapter}`, count: item.count })),
      bySection: sections.map(item => ({ codeReference: `Section ${item.section}`, count: item.count }))
      // No byDifficulty for lessons - they don't have meaningful difficulty levels
    };
  }

  // Study Notes breakdown - chapter/section only, no difficulty
  async getStudySessionBreakdowns(courseId: string): Promise<any> {
    const chapters = await db
      .select({
        chapter: courseContent.chapter,
        count: sql<number>`COUNT(*)`
      })
      .from(courseContent)
      .where(and(eq(courseContent.courseId, courseId), eq(courseContent.type, 'study-notes')))
      .groupBy(courseContent.chapter);

    const sections = await db
      .select({
        section: courseContent.section,
        count: sql<number>`COUNT(*)`
      })
      .from(courseContent)
      .where(and(eq(courseContent.courseId, courseId), eq(courseContent.type, 'study-notes')))
      .groupBy(courseContent.section);

    return {
      byChapter: chapters.map(item => ({ category: `Chapter ${item.chapter}`, count: item.count })),
      bySection: sections.map(item => ({ codeReference: `Section ${item.section}`, count: item.count }))
      // No byDifficulty for study notes - they're informational content, not difficulty-based
    };
  }

  async getEnrollmentBreakdowns(courseId: string): Promise<any> {
    const chapters = await db
      .select({
        chapter: courseContent.chapter,
        count: sql<number>`COUNT(*)`
      })
      .from(courseContent)
      .where(and(eq(courseContent.courseId, courseId), eq(courseContent.type, 'study-plan')))
      .groupBy(courseContent.chapter);

    const sections = await db
      .select({
        section: courseContent.section,
        count: sql<number>`COUNT(*)`
      })
      .from(courseContent)
      .where(and(eq(courseContent.courseId, courseId), eq(courseContent.type, 'study-plan')))
      .groupBy(courseContent.section);

    // Get actual difficulty breakdown for study plans
    const difficultyResults = await db
      .select({
        difficulty: courseContent.difficulty,
        count: sql<number>`COUNT(*)`
      })
      .from(courseContent)
      .where(and(eq(courseContent.courseId, courseId), eq(courseContent.type, 'study-plan')))
      .groupBy(courseContent.difficulty);

    // Ensure all difficulty levels are represented
    const difficultyMap = new Map(difficultyResults.map(d => [d.difficulty, d.count]));
    const difficulty = [
      { difficulty: 'easy', count: difficultyMap.get('easy') || 0 },
      { difficulty: 'hard', count: difficultyMap.get('hard') || 0 },
      { difficulty: 'very_hard', count: difficultyMap.get('very_hard') || 0 }
    ];

    return {
      byChapter: chapters.map(item => ({ category: `Chapter ${item.chapter}`, count: item.count })),
      bySection: sections.map(item => ({ codeReference: `Section ${item.section}`, count: item.count })),
      byDifficulty: difficulty
    };
  }

  // Podcasts breakdown - only chapter/section, no difficulty
  async getUserProgressBreakdowns(courseId: string): Promise<any> {
    const chapters = await db
      .select({
        chapter: courseContent.chapter,
        count: sql<number>`COUNT(*)`
      })
      .from(courseContent)
      .where(and(eq(courseContent.courseId, courseId), eq(courseContent.type, 'podcast')))
      .groupBy(courseContent.chapter);

    const sections = await db
      .select({
        section: courseContent.section,
        count: sql<number>`COUNT(*)`
      })
      .from(courseContent)
      .where(and(eq(courseContent.courseId, courseId), eq(courseContent.type, 'podcast')))
      .groupBy(courseContent.section);

    return {
      byChapter: chapters.map(item => ({ category: `Chapter ${item.chapter}`, count: item.count })),
      bySection: sections.map(item => ({ codeReference: `Section ${item.section}`, count: item.count }))
      // No byDifficulty for podcasts - they're just educational content, not difficulty-based
    };
  }
}

export const storage = new DatabaseStorage();
