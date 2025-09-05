import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { emailAutomation } from "./email-automation";
import { bulkPricingService } from "./bulk-pricing";
import { seedDatabase } from "./seed-data";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static audio files
app.use('/audio', express.static('public/audio'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);
    
    // Seed database with initial course data
    await seedDatabase();
    
    // Initialize email campaigns on startup
    await emailAutomation.initializeCampaigns();
    
    // Initialize bulk pricing tiers
    await bulkPricingService.initializeBulkTiers();
    
    // Initialize beta feedback system
    const { initializeBetaFeedbackSystem } = await import('./betaFeedbackSystem');
    await initializeBetaFeedbackSystem();
    
    // Start email queue processor (runs every 5 minutes)
    setInterval(async () => {
      try {
        await emailAutomation.processEmailQueue();
      } catch (error) {
        console.error("Error processing email queue:", error);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    // Check for monthly beta feedback sending (runs daily at 9 AM)
    const checkBetaFeedback = async () => {
      const now = new Date();
      const isFirstOfMonth = now.getDate() === 1;
      const isNineAM = now.getHours() === 9;
      
      if (isFirstOfMonth && isNineAM) {
        try {
          const { BetaFeedbackService } = await import('./betaFeedbackSystem');
          const result = await BetaFeedbackService.sendMonthlyFeedbackEmails();
          console.log(`Monthly beta feedback sent to ${result.emailsSent} testers`);
        } catch (error) {
          console.error("Error sending monthly beta feedback:", error);
        }
      }
    };
    
    // Run beta feedback check every hour
    setInterval(checkBetaFeedback, 60 * 60 * 1000); // 1 hour
    
    // Also run on startup if it's the first day of the month
    setTimeout(checkBetaFeedback, 5000); // After 5 seconds
    
    // Run feedback monitoring every 4 hours to check for concerning patterns
    const runFeedbackMonitoring = async () => {
      try {
        const { BetaFeedbackService } = await import('./betaFeedbackSystem');
        await BetaFeedbackService.runAutomatedMonitoring();
      } catch (error) {
        console.error("Error running feedback monitoring:", error);
      }
    };
    
    // Monitor feedback patterns every 4 hours
    setInterval(runFeedbackMonitoring, 4 * 60 * 60 * 1000); // 4 hours
    
    // Run initial monitoring after 30 seconds
    setTimeout(runFeedbackMonitoring, 30000);
    
    log("Email automation system initialized");
    log("Bulk pricing system initialized");
    log("Beta feedback system initialized");
  });
})();
