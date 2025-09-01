# LA Plumb Prep - Louisiana Plumbing Certification Platform

A comprehensive plumbing certification platform for Louisiana plumbers featuring courses, AI-powered tools, job board, and subscription management.

## Features

- 🎓 **Course Management** - Interactive lessons, podcasts, quizzes, and study materials
- 🤖 **AI Tools** - Photo analysis, plan review, pipe sizing, and AI mentor chat
- 💼 **Job Board** - Student-exclusive job opportunities with application tracking
- 💳 **Subscription Plans** - Tiered pricing with Stripe integration
- 📧 **Email Automation** - Automated campaigns and notifications
- 👥 **Referral System** - Commission-based referral tracking
- 📱 **Responsive Design** - Works on all devices

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with bcrypt
- **Payments**: Stripe
- **AI**: OpenAI GPT-4
- **Email**: SendGrid

## Environment Variables

Create these environment variables in your Render dashboard:

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key (generate random string)
- `STRIPE_SECRET_KEY` - Stripe secret key (sk_...)
- `VITE_STRIPE_PUBLIC_KEY` - Stripe publishable key (pk_...)

### Optional
- `SENDGRID_API_KEY` - For email functionality
- `OPENAI_API_KEY` - For AI tools
- `NOREPLY_USER` - Email automation sender
- `NOREPLY_PASS` - Email password
- `SUPPORT_EMAIL` - Support email address

## Deployment on Render

1. **Create GitHub Repository**:
   ```bash
   # Already initialized, just add remote
   git remote add origin https://github.com/yourusername/la-plumb-prep.git
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

2. **Deploy on Render**:
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect the `render.yaml` configuration

3. **Configure Environment Variables**:
   - In Render dashboard, go to your service → Environment
   - Add all required environment variables listed above

4. **Database Setup**:
   - Render will create PostgreSQL database automatically
   - Run database migrations: `npm run db:push`

## Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Environment Variables**:
   - Copy environment variables from Replit Secrets
   - Create `.env` file (not included in repo)

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

## Production Considerations

- Database migrations are handled by `npm run db:push`
- Static assets are served from `/dist/public/`
- Session storage uses PostgreSQL for scalability
- All secrets are managed through environment variables

## Support

For issues or questions, contact through the platform's support system.