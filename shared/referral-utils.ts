import { subscriptionTierEnum } from "./schema";

// Plan tier pricing (monthly)
export const PLAN_PRICING = {
  basic: 49,
  professional: 79,
  master: 99,
} as const;

// Plan tier hierarchy (higher number = higher tier)
export const PLAN_TIER_LEVELS = {
  basic: 1,
  professional: 2,
  master: 3,
} as const;

export type SubscriptionTier = "basic" | "professional" | "master";

/**
 * Calculate referral commission based on referrer's plan tier cap
 * 
 * Rule: Referrers can only earn commission for their plan tier or lower
 * - Basic referrer: gets Basic commission even if referral buys Professional/Master
 * - Professional referrer: gets Professional commission for Professional/Master, Basic for Basic
 * - Master referrer: gets full commission for any tier
 */
export function calculateReferralCommission(
  referrerTier: SubscriptionTier,
  referredTier: SubscriptionTier,
  commissionRate: number = 0.10 // 10% default
): {
  eligibleTier: SubscriptionTier;
  eligiblePrice: number;
  commissionAmount: number;
} {
  // Commission logic: referrer gets commission based on the lower of:
  // 1. Their own tier (cap)
  // 2. The tier the referred user actually bought
  const referrerLevel = PLAN_TIER_LEVELS[referrerTier];
  const referredLevel = PLAN_TIER_LEVELS[referredTier];
  
  // If referred user buys lower tier, use that tier
  // If referred user buys higher tier, cap at referrer's tier
  const eligibleLevel = Math.min(referrerLevel, referredLevel);
  
  // Map back to tier name
  const eligibleTier = Object.entries(PLAN_TIER_LEVELS).find(
    ([_, level]) => level === eligibleLevel
  )?.[0] as SubscriptionTier;
  
  if (!eligibleTier) {
    throw new Error("Invalid tier calculation");
  }
  
  const eligiblePrice = PLAN_PRICING[eligibleTier];
  const commissionAmount = Math.round(eligiblePrice * commissionRate * 100) / 100; // Round to 2 decimals
  
  return {
    eligibleTier,
    eligiblePrice,
    commissionAmount,
  };
}

/**
 * Examples of commission calculations:
 * 
 * Basic referrer (tier 1):
 * - Refers Basic user → Gets $4.90 (10% of $49)
 * - Refers Professional user → Gets $4.90 (10% of $49, capped at Basic)
 * - Refers Master user → Gets $4.90 (10% of $49, capped at Basic)
 * 
 * Professional referrer (tier 2):
 * - Refers Basic user → Gets $4.90 (10% of $49)
 * - Refers Professional user → Gets $7.90 (10% of $79)
 * - Refers Master user → Gets $7.90 (10% of $79, capped at Professional)
 * 
 * Master referrer (tier 3):
 * - Refers Basic user → Gets $4.90 (10% of $49)
 * - Refers Professional user → Gets $7.90 (10% of $79)
 * - Refers Master user → Gets $9.90 (10% of $99)
 */

/**
 * Get monthly earnings potential for each referrer tier
 */
export function getReferralEarningsPotential(referrerTier: SubscriptionTier) {
  const maxCommission = calculateReferralCommission(referrerTier, referrerTier);
  
  return {
    tier: referrerTier,
    maxMonthlyCommission: maxCommission.commissionAmount,
    cappedAt: maxCommission.eligibleTier,
    description: `Earn up to $${maxCommission.commissionAmount}/month per referral (capped at ${maxCommission.eligibleTier} plan tier)`,
  };
}

/**
 * Validate subscription tier
 */
export function isValidSubscriptionTier(tier: string): tier is SubscriptionTier {
  return tier in PLAN_PRICING;
}

/**
 * Format commission amount for display
 */
export function formatCommission(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}