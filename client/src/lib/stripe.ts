import { loadStripe, Stripe } from '@stripe/stripe-js';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

// Stripe configuration
export const stripeConfig = {
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#3b82f6',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  },
  locale: 'en' as const,
};

// Pricing plans configuration
export const pricingPlans = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 49,
    priceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic_monthly',
    tier: 'basic',
    description: 'Perfect for getting started',
    features: [
      '1 Certification Track',
      'Basic Calculator Tools',
      'Practice Tests',
      'Job Board Access',
      'Email Support'
    ],
    popular: false,
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 79,
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional_monthly',
    tier: 'professional',
    description: 'For serious professionals',
    features: [
      '3 Certification Tracks',
      'Complete Calculator Suite',
      'Photo Code Checker',
      'AI Mentor Support',
      'Resume Builder',
      'Priority Support'
    ],
    popular: true,
  },
  master: {
    id: 'master',
    name: 'Master',
    price: 99,
    priceId: process.env.STRIPE_MASTER_PRICE_ID || 'price_master_monthly',
    tier: 'master',
    description: 'Complete mastery package',
    features: [
      'All 5 Certification Tracks',
      'Plan Analysis Tools',
      'Material List Generator',
      'Referral Commissions',
      'Book Store Access',
      'White-Glove Support'
    ],
    popular: false,
  },
};

export type PricingPlan = typeof pricingPlans[keyof typeof pricingPlans];

// Subscription management utilities
export class StripeService {
  /**
   * Create a subscription for a user
   */
  static async createSubscription(priceId: string, tier: string) {
    const response = await fetch('/api/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ priceId, tier }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create subscription');
    }

    return response.json();
  }

  /**
   * Format price for display
   */
  static formatPrice(cents: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  }

  /**
   * Get plan by ID
   */
  static getPlan(planId: string): PricingPlan | null {
    return pricingPlans[planId as keyof typeof pricingPlans] || null;
  }

  /**
   * Get all plans
   */
  static getAllPlans(): PricingPlan[] {
    return Object.values(pricingPlans);
  }

  /**
   * Get popular plan
   */
  static getPopularPlan(): PricingPlan {
    return pricingPlans.professional;
  }

  /**
   * Calculate trial end date (7 days from now)
   */
  static getTrialEndDate(): Date {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);
    return trialEnd;
  }

  /**
   * Format trial end date for display
   */
  static formatTrialEndDate(): string {
    return this.getTrialEndDate().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Check if plan allows specific feature
   */
  static planAllowsFeature(planId: string, feature: string): boolean {
    const plan = this.getPlan(planId);
    if (!plan) return false;

    const featureMapping = {
      basic: ['job_board', 'basic_calculators', 'practice_tests', 'email_support'],
      professional: [
        'job_board',
        'basic_calculators',
        'complete_calculator_suite',
        'photo_code_checker',
        'ai_mentor',
        'resume_builder',
        'priority_support',
        'practice_tests',
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
        'practice_tests',
      ],
    };

    return featureMapping[plan.tier as keyof typeof featureMapping]?.includes(feature) || false;
  }

  /**
   * Get upgrade suggestions for current plan
   */
  static getUpgradeSuggestions(currentPlanId: string): PricingPlan[] {
    const currentPlan = this.getPlan(currentPlanId);
    if (!currentPlan) return this.getAllPlans();

    const planOrder = ['basic', 'professional', 'master'];
    const currentIndex = planOrder.indexOf(currentPlan.tier);
    
    if (currentIndex === -1 || currentIndex === planOrder.length - 1) {
      return [];
    }

    return planOrder
      .slice(currentIndex + 1)
      .map(tier => this.getPlan(tier))
      .filter(Boolean) as PricingPlan[];
  }

  /**
   * Calculate savings for annual billing (20% discount)
   */
  static calculateAnnualSavings(monthlyPrice: number): {
    monthlyTotal: number;
    annualTotal: number;
    savings: number;
    savingsPercent: number;
  } {
    const monthlyTotal = monthlyPrice * 12;
    const annualTotal = monthlyTotal * 0.8; // 20% discount
    const savings = monthlyTotal - annualTotal;
    const savingsPercent = 20;

    return {
      monthlyTotal,
      annualTotal,
      savings,
      savingsPercent,
    };
  }

  /**
   * Generate Stripe Elements options
   */
  static getElementsOptions(clientSecret: string) {
    return {
      clientSecret,
      appearance: stripeConfig.appearance,
      locale: stripeConfig.locale,
    };
  }

  /**
   * Handle Stripe errors
   */
  static handleStripeError(error: any): string {
    if (error.type === 'card_error' || error.type === 'validation_error') {
      return error.message;
    }

    switch (error.code) {
      case 'card_declined':
        return 'Your card was declined. Please try a different payment method.';
      case 'expired_card':
        return 'Your card has expired. Please use a different card.';
      case 'incorrect_cvc':
        return 'Your card\'s security code is incorrect.';
      case 'processing_error':
        return 'An error occurred while processing your card. Please try again.';
      case 'rate_limit':
        return 'Too many requests. Please wait a moment and try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Validate subscription status
   */
  static validateSubscriptionStatus(status: string): {
    isActive: boolean;
    needsAction: boolean;
    message: string;
  } {
    switch (status) {
      case 'active':
        return {
          isActive: true,
          needsAction: false,
          message: 'Subscription is active',
        };
      case 'trialing':
        return {
          isActive: true,
          needsAction: false,
          message: 'Free trial is active',
        };
      case 'incomplete':
        return {
          isActive: false,
          needsAction: true,
          message: 'Payment information required',
        };
      case 'incomplete_expired':
        return {
          isActive: false,
          needsAction: true,
          message: 'Subscription setup expired. Please try again.',
        };
      case 'past_due':
        return {
          isActive: false,
          needsAction: true,
          message: 'Payment failed. Please update your payment method.',
        };
      case 'canceled':
        return {
          isActive: false,
          needsAction: false,
          message: 'Subscription has been canceled',
        };
      case 'unpaid':
        return {
          isActive: false,
          needsAction: true,
          message: 'Payment required to continue service',
        };
      default:
        return {
          isActive: false,
          needsAction: true,
          message: 'Unknown subscription status',
        };
    }
  }
}

// Export utilities for direct use
export const {
  createSubscription,
  formatPrice,
  getPlan,
  getAllPlans,
  getPopularPlan,
  planAllowsFeature,
  getUpgradeSuggestions,
  calculateAnnualSavings,
  getElementsOptions,
  handleStripeError,
  validateSubscriptionStatus,
} = StripeService;

// Export Stripe instance getter
export { getStripe };

// Default export
export default StripeService;
