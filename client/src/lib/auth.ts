import { apiRequest } from "./queryClient";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  phone?: string;
  referredBy?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  subscriptionTier: 'basic' | 'professional' | 'master';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  referralCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class AuthService {
  /**
   * Authenticate user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<User> {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    return response.json();
  }

  /**
   * Register a new user account
   */
  static async register(data: RegisterData): Promise<{ message: string; userId: string }> {
    const response = await apiRequest("POST", "/api/auth/register", data);
    return response.json();
  }

  /**
   * Sign out the current user
   */
  static async logout(): Promise<void> {
    await apiRequest("POST", "/api/auth/logout");
  }

  /**
   * Get current authenticated user information
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiRequest("GET", "/api/auth/me");
      return response.json();
    } catch (error) {
      // Return null if not authenticated (401 error)
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get user's subscription status
   */
  static getSubscriptionTier(user: User | null): 'basic' | 'professional' | 'master' {
    return user?.subscriptionTier || 'basic';
  }

  /**
   * Check if user has access to specific features based on subscription tier
   */
  static hasFeatureAccess(user: User | null, feature: string): boolean {
    const tier = this.getSubscriptionTier(user);
    
    const featureAccess = {
      basic: [
        'job_board',
        'basic_calculators',
        'practice_tests',
        'email_support'
      ],
      professional: [
        'job_board',
        'basic_calculators',
        'complete_calculator_suite',
        'photo_code_checker',
        'ai_mentor',
        'resume_builder',
        'priority_support',
        'practice_tests'
      ],
      master: [
        'job_board',
        'basic_calculators',
        'complete_calculator_suite',
        'photo_code_checker',
        'ai_mentor',
        'resume_builder',
        'plan_analysis',
        'material_list_generator',
        'referral_commissions',
        'book_store',
        'white_glove_support',
        'practice_tests'
      ]
    };

    return featureAccess[tier].includes(feature);
  }

  /**
   * Format user display name
   */
  static getDisplayName(user: User | null): string {
    if (!user) return 'Guest';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    if (user.firstName) {
      return user.firstName;
    }
    
    return user.username;
  }

  /**
   * Check if user has completed profile setup
   */
  static isProfileComplete(user: User | null): boolean {
    if (!user) return false;
    
    return !!(user.firstName && user.lastName && user.email);
  }

  /**
   * Get user's referral code for sharing
   */
  static getReferralCode(user: User | null): string | null {
    return user?.referralCode || null;
  }

  /**
   * Generate referral link
   */
  static generateReferralLink(user: User | null): string | null {
    const referralCode = this.getReferralCode(user);
    if (!referralCode) return null;
    
    const baseUrl = window.location.origin;
    return `${baseUrl}/register?ref=${referralCode}`;
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password should contain at least one special character');
    }
    
    const isValid = errors.length === 0;
    
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength = 'strong';
    } else if (password.length >= 8 && errors.length <= 1) {
      strength = 'medium';
    }
    
    return { isValid, errors, strength };
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get user's subscription status information
   */
  static getSubscriptionInfo(user: User | null) {
    if (!user) return null;
    
    const tierInfo = {
      basic: {
        name: 'Basic',
        price: '$49/month',
        maxCourses: 1,
        features: ['1 Certification Track', 'Basic Calculator Tools', 'Practice Tests', 'Job Board Access', 'Email Support']
      },
      professional: {
        name: 'Professional',
        price: '$79/month',
        maxCourses: 3,
        features: ['3 Certification Tracks', 'Complete Calculator Suite', 'Photo Code Checker', 'AI Mentor Support', 'Resume Builder', 'Priority Support']
      },
      master: {
        name: 'Master',
        price: '$99/month',
        maxCourses: 5,
        features: ['All 5 Certification Tracks', 'Plan Analysis Tools', 'Material List Generator', 'Referral Commissions', 'Book Store Access', 'White-Glove Support']
      }
    };
    
    return tierInfo[user.subscriptionTier] || tierInfo.basic;
  }
}

// Export utility functions for use in components
export const {
  login,
  register,
  logout,
  getCurrentUser,
  isAuthenticated,
  hasFeatureAccess,
  getDisplayName,
  isProfileComplete,
  getReferralCode,
  generateReferralLink,
  validatePassword,
  validateEmail,
  getSubscriptionInfo
} = AuthService;
