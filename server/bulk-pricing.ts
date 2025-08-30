import { db } from "./db";
import { 
  bulkEnrollmentTiers, 
  bulkEnrollmentRequests, 
  bulkStudentEnrollments,
  courses,
  type BulkEnrollmentTier,
  type InsertBulkEnrollmentRequest,
  type InsertBulkStudentEnrollment
} from "@shared/schema";
import { eq, and, gte, lte, or, isNull } from "drizzle-orm";

export interface BulkPricingCalculation {
  studentCount: number;
  courseIds: string[];
  basePricePerStudent: number;
  totalBasePrice: number;
  appliedTier: BulkEnrollmentTier | null;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
  pricePerStudent: number;
}

export interface StudentEnrollmentData {
  email: string;
  firstName: string;
  lastName?: string;
}

export class BulkPricingService {
  
  /**
   * Initialize default bulk enrollment tiers
   */
  async initializeBulkTiers() {
    try {
      // Check if tiers already exist
      const existingTiers = await db.select().from(bulkEnrollmentTiers).limit(1);
      if (existingTiers.length > 0) {
        return; // Already initialized
      }

      // Create default bulk pricing tiers
      const defaultTiers = [
        {
          tierName: "Small Team",
          minStudents: 5,
          maxStudents: 19,
          discountPercent: "10.00", // 10% discount
          basePrice: "49.00" // Base price per student
        },
        {
          tierName: "Medium Team", 
          minStudents: 20,
          maxStudents: 49,
          discountPercent: "15.00", // 15% discount
          basePrice: "49.00"
        },
        {
          tierName: "Large Company",
          minStudents: 50,
          maxStudents: null, // No upper limit
          discountPercent: "25.00", // 25% discount
          basePrice: "49.00"
        }
      ];

      await db.insert(bulkEnrollmentTiers).values(defaultTiers);
      console.log("Bulk enrollment tiers initialized");
    } catch (error) {
      console.error("Error initializing bulk enrollment tiers:", error);
    }
  }

  /**
   * Calculate bulk pricing for a given number of students
   */
  async calculateBulkPricing(
    studentCount: number, 
    courseIds: string[] = ["journeyman"] // Default to journeyman course
  ): Promise<BulkPricingCalculation> {
    
    // Get available pricing tiers
    const tiers = await db
      .select()
      .from(bulkEnrollmentTiers)
      .where(eq(bulkEnrollmentTiers.isActive, true));

    // Find applicable tier
    const applicableTier = tiers.find(tier => {
      const meetsMin = studentCount >= tier.minStudents;
      const meetsMax = tier.maxStudents === null || studentCount <= tier.maxStudents;
      return meetsMin && meetsMax;
    });

    // Base pricing calculation
    const basePricePerStudent = 49; // Basic tier price
    const totalBasePrice = basePricePerStudent * studentCount * courseIds.length;
    
    // Apply bulk discount if applicable
    const discountPercent = applicableTier ? parseFloat(applicableTier.discountPercent) : 0;
    const discountAmount = totalBasePrice * (discountPercent / 100);
    const finalPrice = totalBasePrice - discountAmount;
    const pricePerStudent = finalPrice / studentCount;

    return {
      studentCount,
      courseIds,
      basePricePerStudent,
      totalBasePrice,
      appliedTier: applicableTier || null,
      discountPercent,
      discountAmount,
      finalPrice,
      pricePerStudent
    };
  }

  /**
   * Get all active bulk pricing tiers
   */
  async getBulkPricingTiers() {
    return await db
      .select()
      .from(bulkEnrollmentTiers)
      .where(eq(bulkEnrollmentTiers.isActive, true));
  }

  /**
   * Create a bulk enrollment request
   */
  async createBulkEnrollmentRequest(
    employerId: string,
    studentEmails: StudentEnrollmentData[],
    courseIds: string[],
    contactEmail: string,
    contactPhone?: string,
    notes?: string,
    requestedStartDate?: Date
  ) {
    try {
      const studentCount = studentEmails.length;
      
      // Calculate pricing
      const pricing = await this.calculateBulkPricing(studentCount, courseIds);

      // Create bulk enrollment request
      const [bulkRequest] = await db
        .insert(bulkEnrollmentRequests)
        .values({
          employerId,
          studentCount,
          courseIds,
          totalPrice: pricing.totalBasePrice.toString(),
          discountPercent: pricing.discountPercent.toString(),
          finalPrice: pricing.finalPrice.toString(),
          contactEmail,
          contactPhone,
          notes,
          requestedStartDate,
        })
        .returning();

      // Create individual student enrollment records
      const studentEnrollments = studentEmails.map(student => ({
        bulkRequestId: bulkRequest.id,
        studentEmail: student.email,
        studentFirstName: student.firstName,
        studentLastName: student.lastName || null,
      }));

      await db.insert(bulkStudentEnrollments).values(studentEnrollments);

      return {
        bulkRequest,
        pricing,
        studentCount
      };
    } catch (error) {
      console.error("Error creating bulk enrollment request:", error);
      throw error;
    }
  }

  /**
   * Get bulk enrollment requests for an employer
   */
  async getBulkEnrollmentRequests(employerId: string) {
    return await db
      .select()
      .from(bulkEnrollmentRequests)
      .where(eq(bulkEnrollmentRequests.employerId, employerId));
  }

  /**
   * Get student enrollments for a bulk request
   */
  async getBulkStudentEnrollments(bulkRequestId: string) {
    return await db
      .select()
      .from(bulkStudentEnrollments)
      .where(eq(bulkStudentEnrollments.bulkRequestId, bulkRequestId));
  }

  /**
   * Approve a bulk enrollment request
   */
  async approveBulkEnrollmentRequest(requestId: string, approvedBy: string) {
    try {
      // Update request status
      const [updatedRequest] = await db
        .update(bulkEnrollmentRequests)
        .set({
          status: "approved",
          approvedBy,
          approvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(bulkEnrollmentRequests.id, requestId))
        .returning();

      // TODO: Send enrollment invites to students
      // This would trigger email invitations to each student

      return updatedRequest;
    } catch (error) {
      console.error("Error approving bulk enrollment request:", error);
      throw error;
    }
  }
}

export const bulkPricingService = new BulkPricingService();