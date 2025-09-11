declare global {
  namespace Express {
    interface Request {
      isAuthenticated(): boolean;
      user?: {
        id: string;
        email: string;
        stripeCustomerId?: string;
        stripeSubscriptionId?: string;
        subscriptionTier?: string;
        firstName?: string;
        lastName?: string;
        username?: string;
      };
    }
  }
}

export {};