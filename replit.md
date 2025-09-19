# LA Plumb Prep

## Overview

This is a comprehensive plumbing certification platform designed specifically for Louisiana plumbers. The application provides course management, certification preparation, professional tools, job board functionality, and AI-powered mentoring. It serves as a one-stop platform for plumbing professionals to advance their careers through education, tools, and career opportunities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built using React with TypeScript and follows a component-based architecture. It uses shadcn/ui components for consistent UI design with Tailwind CSS for styling. The application implements client-side routing using wouter and state management through React Query for server state synchronization.

Key architectural decisions:
- **Component Library**: Uses shadcn/ui for consistent, accessible UI components
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: React Query for server state, React hooks for local state
- **Routing**: wouter for lightweight client-side routing
- **Form Management**: React Hook Form with Zod validation

### Backend Architecture
The backend follows a Node.js Express server architecture with a modular structure separating concerns into distinct layers.

Key architectural decisions:
- **Framework**: Express.js with TypeScript for type safety
- **Authentication**: Passport.js with local strategy and session-based authentication
- **File Handling**: Multer for file uploads with validation and size limits
- **API Structure**: RESTful API design with consistent error handling middleware
- **Validation**: Zod schemas shared between client and server

### Data Layer
The application uses Drizzle ORM with PostgreSQL for data persistence, providing type-safe database operations.

Key architectural decisions:
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Centralized schema definitions in shared directory
- **Migrations**: Drizzle Kit for database migrations and schema management

### Authentication & Authorization
Session-based authentication using express-session with bcrypt for password hashing.

Key architectural decisions:
- **Strategy**: Session-based authentication for simplicity and security
- **Password Security**: bcrypt for password hashing with salt rounds
- **Session Storage**: PostgreSQL session store using connect-pg-simple
- **User Management**: Role-based access with subscription tiers

### AI Integration
OpenAI GPT-5 integration for photo analysis, plan review, and AI mentoring capabilities.

Key architectural decisions:
- **Model**: GPT-5 for advanced analysis capabilities
- **Photo Analysis**: Code compliance checking for plumbing installations
- **Plan Review**: Technical drawing analysis for code violations
- **AI Mentor**: Conversational support for plumbing questions
- **Response Format**: Structured JSON responses for consistent data handling

## Recent Changes

### September 19, 2025 - Beta Pricing Structure
- **Beta Pricing Implementation**: Added special beta pricing for launch users
  - Regular Pricing: Basic $49.99, Professional $79.99, Master $99.99
  - Beta Pricing: Basic $19.99, Professional $29.99, Master $49.99 
  - Beta users get 60-62% discount from regular pricing
- **Profitability Analysis**: Architect-confirmed beta pricing maintains >80% profit margins even under heavy usage due to implemented caching systems
- **Cost Optimization**: AI response caching and TTS audio caching provide ~70% reduction in OpenAI API costs

### January 30, 2025 - OpenAI Podcast Player Enhancement
- **OpenAI Text-to-Speech Integration**: Replaced synthetic speech with high-quality OpenAI text-to-speech API for podcast lessons
- **Single Sentence Display**: Implemented sentence-by-sentence display that shows one sentence at a time, replacing it as each is spoken
- **Enhanced User Experience**: Audio now generates using OpenAI's "alloy" voice model for natural, clear pronunciation
- **API Endpoint**: Added `/api/openai/speech` endpoint for real-time text-to-speech generation
- **Improved Interface**: Shows "AI Text-to-Speech Available" with loading states during audio generation

### January 30, 2025
- **Course Management Updates**: Removed pricing display from course cards, all "Start Course" buttons now redirect to unified pricing page
- **Course Status System**: Implemented "Coming Soon" functionality - all courses except Louisiana Journeyman Prep are marked as inactive with disabled buttons and yellow badges
- **Course Data Updates**: 
  - Updated Backflow Prevention from "certification" to "training course" for testing, repairs, and field report completion
  - Added complete course database with 5 total courses (only Journeyman active)
- **Referral System**: Implemented tiered commission system with plan-based caps (Basic: $4.90, Professional: $7.90, Master: $9.90)
- **Database Schema**: Added referral tracking, commission calculations, and course status management

### Current Course Status
- **Active**: Louisiana Journeyman Prep (fully functional)
- **Coming Soon**: Backflow Prevention Training, Natural Gas Certification, Medical Gas Installer Certification, Master Plumber Prep

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database
- **File Storage**: Local filesystem with configurable upload limits
- **Session Storage**: PostgreSQL-backed session storage

### Payment Processing
- **Stripe**: Complete payment processing for subscriptions
  - Subscription management with multiple tiers (basic, professional, master)
  - Payment Elements for secure payment collection
  - Webhook handling for subscription lifecycle events

### AI Services
- **OpenAI API**: GPT-5 model integration for:
  - Photo analysis of plumbing installations
  - Plan review and code compliance checking
  - AI mentor chat functionality
  - Pipe sizing calculations and recommendations

### Development & Build Tools
- **Vite**: Development server and build tool with hot module replacement
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundling for production builds
- **Drizzle Kit**: Database migration and schema management

### UI & Styling
- **shadcn/ui**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library for consistent iconography

### State Management & Data Fetching
- **React Query**: Server state management and caching
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation for forms and API responses