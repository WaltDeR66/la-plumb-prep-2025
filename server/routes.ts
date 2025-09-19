import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emailService } from "./email";
import { insertUserSchema, insertJobSchema, insertJobApplicationSchema, insertCourseContentSchema, insertPrivateCodeBookSchema, insertCourseSchema, insertProductSchema, insertCartItemSchema, insertProductReviewSchema, insertReferralSchema, leadMagnetDownloads, studentLeadMagnetDownloads, competitionNotifications, courses, users, jobs, products } from "@shared/schema";
import { competitionNotificationService } from "./competitionNotifications";
import { eq, and, or, desc, sql, count } from "drizzle-orm";
import { db } from "./db";
import { analyzePhoto, analyzePlans, getMentorResponse, calculatePipeSize, reviewJobPosting, generateNumberedFittingPDF, generateStudyPlan, reviewWrongAnswers, generateAudio } from "./openai";
import { calculateReferralCommission, isValidSubscriptionTier } from "@shared/referral-utils";
import { contentExtractor } from "./content-extractor";
import { emailAutomation } from "./email-automation";
import { bulkPricingService } from "./bulk-pricing";
import Stripe from "stripe";
import { StudyCompanionService } from "./openai-service";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper function to check if content has extracted data
function hasExtractedContent(content: any): content is { extracted: { content?: string; description?: string } } {
  return content && typeof content === 'object' && 'extracted' in content;
}

// Course ID resolver function - maps friendly URLs to database UUIDs
async function resolveCourseId(courseId: string): Promise<string | null> {
  // If it's already a UUID format, return as-is
  if (courseId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    const course = await storage.getCourse(courseId);
    return course ? courseId : null;
  }
  
  // Handle friendly course identifiers
  const courseMapping: { [key: string]: string } = {
    'journeyman-prep': 'b83c6ebe-f5bd-4787-8fd5-e3b177d9e79b',
    'louisiana-journeyman-prep': 'b83c6ebe-f5bd-4787-8fd5-e3b177d9e79b',
    'backflow-prevention': 'b06e5cc6-3cec-4fe6-81ae-5f7cf5ade62e',
    'natural-gas': 'ce9dfb3e-f6ef-40ed-b578-25bff53eb2dc',
    'medical-gas': '547ca2fb-e3b3-46c7-a3ef-9e082401b510',
    'master-plumber': '2b8778aa-c3ec-43cd-887a-77ca0824a294'
  };
  
  return courseMapping[courseId] || null;
}

// Course content seeding function
async function seedCourseContent() {
  const courseId = "b83c6ebe-f5bd-4787-8fd5-e3b177d9e79b"; // Louisiana Journeyman Prep
  
  // Force clear existing content for study plan updates
  const existingContent = await storage.getCourseContent(courseId);
  if (existingContent.length > 0) {
    console.log("Clearing existing course content for study plan updates...");
    for (const content of existingContent) {
      await storage.deleteCourseContent(content.id);
    }
  }

  console.log("Auto-seeding course content...");
  
  const courseContentData = [
    // Course Introduction - appears first
    {
      id: "intro-001-louisiana-plumbing",
      courseId,
      title: "Course Introduction - Louisiana Plumbing Certification Journey",
      type: "lesson",
      chapter: 0,
      section: 1,
      content: {
        "extracted": {
          "title": "Welcome to Louisiana Journeyman Plumber Certification Prep",
          "content": "# Welcome to Your Louisiana Plumbing Certification Journey\n\n## What You'll Master in This Course\n\nThis comprehensive program prepares you for the **Louisiana Journeyman Plumber certification exam** using the most current Louisiana regulations and code requirements.\n\n### 📚 Louisiana State Plumbing Code (LSPC) Foundation\n\nYou'll develop expertise in:\n- **LSPC Section 101**: Administration and scope of authority\n- **LSPC Section 103**: Permits, inspections, and compliance procedures  \n- **Installation Standards**: Based on Louisiana-specific requirements\n- **Code Interpretation**: Real-world application of regulations\n\n### 🎯 Key Learning Outcomes\n\nBy completion, you will:\n✅ **Navigate Louisiana Sanitary Code Part XIV** with confidence\n✅ **Apply LSPC sections** to real installation scenarios\n✅ **Understand permit processes** and inspection requirements\n✅ **Master compliance procedures** specific to Louisiana\n✅ **Pass your certification exam** with 80%+ confidence\n\n### 📖 Code Reference Method (Copyright-Safe)\n\nOur educational approach:\n- **References official section numbers** (LSPC 101.1, 103.2, etc.)\n- **Explains concepts in clear language** rather than copying text\n- **Provides practical applications** of code requirements\n- **Uses educational fair use** for learning purposes\n- **Cites sources properly** for all code references\n\n### 🔧 Real-World Focus\n\nEvery lesson connects code requirements to:\n- **Actual plumbing installations** you'll encounter\n- **Inspector expectations** based on Louisiana standards\n- **Common violation scenarios** and how to avoid them\n- **Best practices** from experienced Louisiana plumbers\n\n### 📝 Study Methodology\n\nWe recommend this approach:\n1. **Read each section's concept overview**\n2. **Study the practical applications** \n3. **Take practice quizzes** (70% to advance)\n4. **Review chapter summaries** (80% to advance to next chapter)\n5. **Use AI mentor** for personalized help\n\n### 🎓 Certification Preparation\n\nThis course aligns with:\n- **Louisiana State Plumbing Board** requirements\n- **Current 2024-2025 code updates**\n- **Actual exam question formats**\n- **Time management strategies**\n\n---\n\n**Ready to start?** Click 'Complete Reading' below to begin with LSPC Section 101 fundamentals.\n\n*Note: This course references Louisiana State Plumbing Code sections for educational purposes. All content is original educational material designed to teach code concepts and applications.*",
          "extractedAt": "2025-01-30T22:00:00Z"
        }
      },
      isActive: true,
      sortOrder: -1
    },

    // CHAPTER 1 SECTION INTRODUCTIONS
    {
      id: "intro-section-101",
      courseId,
      title: "Section 101 Introduction - Title and Adoption",
      type: "lesson",
      chapter: 1,
      section: 101,
      content: {
        "extracted": {
          "title": "Section 101 Introduction - Title and Adoption of Louisiana State Plumbing Code",
          "content": "# Section 101 Introduction - Title and Adoption of Louisiana State Plumbing Code\n\n## What This Section Establishes\n\nSection 101 serves as the **legal foundation** for all plumbing regulations in Louisiana. This critical section formally adopts the Louisiana State Plumbing Code and establishes its authority.\n\n### 🎯 Key Learning Objectives\n\nAfter studying this section, you will understand:\n- **Legal authority** behind Louisiana plumbing regulations\n- **Official terminology** and how to reference the code properly\n- **Relationship** between state and local plumbing codes\n- **Foundation** for all subsequent code sections\n\n### 📋 Critical Concepts to Master\n\n**Code Authority**\n- How the Department of Health and Hospitals adopts plumbing standards\n- The connection between Louisiana Sanitary Code Part XIV and the Plumbing Code\n- Why this legal foundation matters for enforcement\n\n**Proper Terminology**\n- Understanding 'Louisiana State Plumbing Code' vs 'Part XIV (Plumbing) of the Sanitary Code'\n- When and how to cite code references correctly\n- Professional communication about code requirements\n\n### 🔧 Real-World Applications\n\nAs a Louisiana plumber, Section 101 knowledge helps you:\n- **Communicate professionally** with inspectors and officials\n- **Reference code sections** correctly in documentation\n- **Understand legal backing** when explaining requirements to clients\n- **Navigate disputes** by citing proper authority\n\n### 🎓 Study Focus for Certification\n\n**Memorize These Key Points:**\n- The official name and citation format for Louisiana plumbing regulations\n- Which department has authority over plumbing code adoption\n- How to properly reference code sections in professional settings\n\n**Practical Application:**\nThis section provides the legal basis for everything else you'll learn. Consider it the 'constitutional foundation' of Louisiana plumbing work.\n\n### 📝 Connection to Other Sections\n\nSection 101 works with:\n- **Section 103**: Provides availability information for the code\n- **Section 107**: Explains the purpose behind the authority established here\n- **All subsequent sections**: Derive their legal power from this foundational section\n\n---\n\n**Study Tip:** Think of Section 101 as answering 'What gives this code its power?' - understanding this foundation makes all other sections more meaningful and enforceable.",
          "extractedAt": "2025-01-30T22:15:00Z"
        }
      },
      isActive: true,
      sortOrder: 1
    },

    {
      id: "intro-section-103",
      courseId,
      title: "Section 103 Introduction - Availability",
      type: "lesson",
      chapter: 1,
      section: 103,
      content: {
        "extracted": {
          "title": "Section 103 Introduction - Availability of the Louisiana State Plumbing Code",
          "content": "# Section 103 Introduction - Availability of the Louisiana State Plumbing Code\n\n## What This Section Provides\n\nSection 103 ensures **public access** to the Louisiana State Plumbing Code by establishing where and how professionals and citizens can obtain copies of the regulations.\n\n### 🎯 Key Learning Objectives\n\nAfter studying this section, you will know:\n- **Where to obtain** official copies of the plumbing code\n- **How to access** current regulations and updates\n- **Professional responsibility** for staying current with code requirements\n- **Resources available** for code research and verification\n\n### 📋 Critical Concepts to Master\n\n**Official Code Access**\n- Understanding the role of the Office of the State Register\n- How to contact authorities for official code copies\n- Importance of using current, official versions\n\n**Professional Responsibility**\n- Your obligation to work with current code versions\n- How to verify you're using the most recent regulations\n- When updates and amendments become effective\n\n### 🔧 Real-World Applications\n\nAs a Louisiana plumber, Section 103 knowledge helps you:\n- **Stay current** with code changes and updates\n- **Access official information** when questions arise on job sites\n- **Verify code requirements** for complex installations\n- **Provide accurate information** to clients and colleagues\n\n### 🎓 Study Focus for Certification\n\n**Remember These Contact Points:**\n- Office of the State Register contact information\n- Electronic access methods for code viewing\n- Professional requirement to use current code versions\n\n**Professional Practice:**\nKnowing where to find authoritative code information demonstrates professionalism and ensures your work meets current standards.\n\n### 📝 Connection to Other Sections\n\nSection 103 supports:\n- **Section 101**: Provides access to the code whose authority was established\n- **Section 105**: Works with edition information to ensure current code use\n- **All code sections**: Ensures you can access the most current requirements\n\n### 💡 Professional Tip\n\nBookmark official code access points and check for updates regularly. Plumbing inspectors expect you to work with current code versions, and using outdated information can lead to failed inspections and rework.\n\n---\n\n**Study Tip:** Section 103 answers 'How do I get the official code?' - this practical information ensures you always have access to authoritative regulations when needed.",
          "extractedAt": "2025-01-30T22:16:00Z"
        }
      },
      isActive: true,
      sortOrder: 2
    },

    {
      id: "intro-section-105",
      courseId,
      title: "Section 105 Introduction - Effective Date and Edition",
      type: "lesson",
      chapter: 1,
      section: 105,
      content: {
        "extracted": {
          "title": "Section 105 Introduction - Effective Date and Edition Information",
          "content": "# Section 105 Introduction - Effective Date and Edition Information\n\n## What This Section Establishes\n\nSection 105 provides **critical timing information** about when code requirements take effect and how to identify which edition of the code applies to your work.\n\n### 🎯 Key Learning Objectives\n\nAfter studying this section, you will understand:\n- **When code requirements** become legally enforceable\n- **How edition dating** works for the Louisiana Plumbing Code\n- **Transition periods** and implementation timelines\n- **Which code version** applies to specific projects\n\n### 📋 Critical Concepts to Master\n\n**Code Effective Dates**\n- Understanding when new requirements become mandatory\n- How effective dates affect ongoing projects\n- Transition periods for code compliance\n\n**Edition Identification**\n- How Louisiana Plumbing Code editions are named and dated\n- Identifying which edition applies to your work\n- Staying current with the most recent edition\n\n### 🔧 Real-World Applications\n\nAs a Louisiana plumber, Section 105 knowledge helps you:\n- **Determine which code version** applies to specific projects\n- **Plan project timelines** around code effective dates\n- **Communicate with inspectors** about applicable code editions\n- **Ensure compliance** with current legal requirements\n\n### 🎓 Study Focus for Certification\n\n**Critical Dates to Remember:**\n- February 20, 2013 - Key effective date for major code provisions\n- How the 2013 Edition designation was established\n- Understanding of transition periods and implementation\n\n**Professional Application:**\nKnowing which code edition applies to your work ensures legal compliance and prevents costly rework due to using incorrect requirements.\n\n### 📝 Connection to Other Sections\n\nSection 105 coordinates with:\n- **Section 103**: Ensures you can access the correct edition\n- **Section 113**: Affects how existing buildings are treated under new codes\n- **All subsequent sections**: Determines when their requirements became enforceable\n\n### ⚠️ Important Professional Note\n\nProjects permitted under previous code editions may continue under those requirements, but new work typically must meet current code standards. Understanding effective dates prevents compliance issues.\n\n### 💡 Pro Tip for Certification Exam\n\nThe exam may test your understanding of when different code provisions became effective. Pay special attention to transition dates and how they affect different types of plumbing work.\n\n---\n\n**Study Tip:** Section 105 answers 'When does this code apply?' - this timing information is crucial for ensuring your work meets the correct legal requirements for its timeframe.",
          "extractedAt": "2025-01-30T22:17:00Z"
        }
      },
      isActive: true,
      sortOrder: 3
    },

    {
      id: "intro-section-107",
      courseId,
      title: "Section 107 Introduction - Purpose",
      type: "lesson",
      chapter: 1,
      section: 107,
      content: {
        "extracted": {
          "title": "Section 107 Introduction - Purpose of Louisiana Plumbing Code",
          "content": "# Section 107 Introduction - Purpose of Louisiana Plumbing Code\n\n## What This Section Defines\n\nSection 107 clearly states the **fundamental purpose** behind Louisiana's plumbing regulations, establishing why these codes exist and what they aim to achieve.\n\n### 🎯 Key Learning Objectives\n\nAfter studying this section, you will understand:\n- **Primary purpose** of Louisiana plumbing regulations\n- **Goals of administration and enforcement** procedures\n- **How purpose guides** code interpretation and application\n- **Connection between purpose and compliance** requirements\n\n### 📋 Critical Concepts to Master\n\n**Administration and Enforcement Purpose**\n- Understanding why consistent code administration is essential\n- How enforcement procedures protect public interests\n- The role of uniformity in code application\n\n**Foundational Goals**\n- Public safety protection through proper plumbing installation\n- Health protection via sanitary plumbing systems\n- General welfare promotion through code compliance\n\n### 🔧 Real-World Applications\n\nAs a Louisiana plumber, Section 107 knowledge helps you:\n- **Explain to clients** why code compliance is important\n- **Understand inspector priorities** during inspections\n- **Make judgment calls** when code interpretation is needed\n- **Communicate professionally** about regulatory purpose\n\n### 🎓 Study Focus for Certification\n\n**Key Purpose Elements:**\n- Administration and enforcement as the primary chapter goal\n- How this purpose affects all subsequent code sections\n- Professional responsibility to support code purposes\n\n**Understanding Intent:**\nKnowing the code's purpose helps you apply requirements correctly even in situations not explicitly covered by specific regulations.\n\n### 📝 Connection to Other Sections\n\nSection 107 provides context for:\n- **Section 109**: Explains why the code is declared remedial\n- **Section 111**: Shows how scope supports the stated purpose\n- **Enforcement sections**: Justifies why administration and enforcement matter\n\n### 💡 Professional Insight\n\nWhen code requirements seem unclear or when facing unique installation challenges, returning to the fundamental purpose in Section 107 can guide appropriate decision-making.\n\n### 🎯 Certification Exam Focus\n\nExam questions may test your understanding of:\n- Why Louisiana has plumbing code administration requirements\n- How purpose influences code interpretation\n- The connection between administration and public safety\n\n---\n\n**Study Tip:** Section 107 answers 'Why do we have this code?' - understanding this purpose makes all other requirements more meaningful and helps you apply them correctly in professional practice.",
          "extractedAt": "2025-01-30T22:18:00Z"
        }
      },
      isActive: true,
      sortOrder: 4
    },

    {
      id: "intro-section-109",
      courseId,
      title: "Section 109 Introduction - Code Remedial",
      type: "lesson",
      chapter: 1,
      section: 109,
      content: {
        "extracted": {
          "title": "Section 109 Introduction - Code Remedial Nature and Scope",
          "content": "# Section 109 Introduction - Code Remedial Nature and Scope\n\n## What This Section Establishes\n\nSection 109 declares the Louisiana Plumbing Code as **remedial in nature** and defines its scope, limitations, and the responsibilities of various parties in the plumbing process.\n\n### 🎯 Key Learning Objectives\n\nAfter studying this section, you will understand:\n- **Remedial nature** of the plumbing code and what this means\n- **Quality control limitations** and what the code does NOT cover\n- **Permitting and inspection responsibilities** and limitations\n- **Liability protections** for jurisdictions and officials\n\n### 📋 Critical Concepts to Master\n\n**Remedial Declaration**\n- Understanding 'remedial' means the code aims to remedy or prevent problems\n- How this supports public safety, health, and general welfare\n- The focus on regulating installation and maintenance\n\n**Quality Control Boundaries**\n- What aspects of quality control ARE covered by the code\n- What quality aspects are NOT within the code's scope\n- How this affects your responsibilities as a plumber\n\n**Permitting and Inspection Limitations**\n- What permits and inspections can and cannot guarantee\n- Professional liability considerations\n- Understanding the limits of code compliance verification\n\n### 🔧 Real-World Applications\n\nAs a Louisiana plumber, Section 109 knowledge helps you:\n- **Understand code limitations** when discussing warranties with clients\n- **Recognize your professional responsibilities** beyond basic code compliance\n- **Communicate appropriately** about inspection results and their meaning\n- **Manage client expectations** about what code compliance guarantees\n\n### 🎓 Study Focus for Certification\n\n**Key Remedial Aspects:**\n- Public safety, health, and general welfare as primary goals\n- Installation and maintenance regulation as primary focus\n- Quality control limitations and boundaries\n\n**Professional Responsibility:**\nUnderstanding what the code covers (and doesn't cover) helps you provide appropriate professional services and manage liability.\n\n### ⚠️ Important Professional Implications\n\n**What Code Compliance DOES Provide:**\n- Minimum safety and health standards\n- Regulatory compliance verification\n- Foundation for professional installation practices\n\n**What Code Compliance DOES NOT Guarantee:**\n- Perfect system performance\n- Complete protection from all failures\n- Warranty of physical condition or adequacy\n\n### 📝 Connection to Other Sections\n\nSection 109 works with:\n- **Section 107**: Builds on the purpose by defining scope\n- **Section 111**: Complements the general scope provisions\n- **Inspection sections**: Establishes limitations on inspection authority\n\n### 💡 Professional Practice Tip\n\nExplain to clients that code compliance ensures minimum safety standards but doesn't replace the need for quality workmanship, proper maintenance, and appropriate system design for their specific needs.\n\n---\n\n**Study Tip:** Section 109 answers 'What can we expect from this code and what are its limits?' - this understanding helps you apply the code appropriately while managing professional expectations.",
          "extractedAt": "2025-01-30T22:19:00Z"
        }
      },
      isActive: true,
      sortOrder: 5
    },

    // CHAPTER 1 REVIEW INTRODUCTION
    {
      id: "intro-chapter-1-review",
      courseId,
      title: "Chapter 1 Review Introduction - Administration Mastery",
      type: "lesson",
      chapter: 1,
      section: 999,
      content: {
        "extracted": {
          "title": "Chapter 1 Review Introduction - Administration Mastery",
          "content": "# Chapter 1 Review Introduction - Administration Mastery\n\n## Chapter Overview - Administration Foundation\n\nChapter 1 establishes the **complete administrative framework** for Louisiana plumbing regulations. This chapter provides the legal foundation, access information, timing requirements, purpose, and scope that govern all plumbing work in Louisiana.\n\n### 🎯 Critical Concepts to Master for 80% Pass Threshold\n\n**Legal Foundation (Section 101)**\n- Authority of the Department of Health and Hospitals\n- Proper code citation and terminology\n- Relationship between state and local regulations\n\n**Code Access and Currency (Section 103)**\n- Official sources for current code information\n- Professional responsibility for using current editions\n- Resource availability for code verification\n\n**Timing and Editions (Section 105)**\n- Effective dates and edition identification\n- Transition periods and implementation requirements\n- Project timeline considerations\n\n**Purpose and Intent (Section 107)**\n- Administration and enforcement goals\n- Public safety, health, and welfare objectives\n- How purpose guides code interpretation\n\n**Scope and Limitations (Section 109)**\n- Remedial nature of the code\n- Quality control boundaries and limitations\n- Permitting and inspection responsibilities\n\n### 📚 Integration Points - How Sections Work Together\n\n**Administrative Chain:**\n1. **Section 101** establishes legal authority\n2. **Section 103** ensures code accessibility\n3. **Section 105** provides timing framework\n4. **Section 107** defines purpose and goals\n5. **Section 109** sets scope and limitations\n\n**Professional Application:**\nThese sections work together to create a complete administrative framework that supports all technical requirements in subsequent chapters.\n\n### 🎓 Exam Preparation Strategy\n\n**High-Priority Topics:**\n- Code authority and legal foundation\n- Proper code citation methods\n- Edition identification and effective dates\n- Purpose-driven code interpretation\n- Scope limitations and professional responsibilities\n\n**Common Exam Scenarios:**\n- Questions about code authority and jurisdiction\n- Situations requiring proper code citation\n- Timeline questions involving effective dates\n- Purpose-based code interpretation challenges\n- Scope and limitation identification\n\n### 🔧 Real-World Integration\n\nMastering Chapter 1 enables you to:\n- **Communicate professionally** with inspectors and officials\n- **Apply code requirements** with proper legal understanding\n- **Stay current** with code updates and changes\n- **Understand the bigger picture** behind technical requirements\n- **Manage client expectations** appropriately\n\n### ⚠️ Chapter Review Requirements\n\n**80% Pass Threshold:** This chapter review requires 80% to advance to Chapter 2 (Definitions). This higher standard ensures you have a solid foundation in administrative concepts before moving to technical content.\n\n**Study Approach:**\n1. Review each section's key concepts\n2. Understand how sections integrate\n3. Practice applying administrative knowledge to real scenarios\n4. Focus on professional communication and compliance\n\n### 💡 Success Strategy\n\nThink of Chapter 1 as the \"constitution\" of Louisiana plumbing work. Every technical requirement in later chapters derives its authority and context from these administrative foundations.\n\n---\n\n**Mastery Goal:** You should be able to explain Louisiana plumbing code authority, access current regulations, understand timing requirements, apply code purpose, and recognize scope limitations - all while communicating professionally about these administrative aspects.",
          "extractedAt": "2025-01-30T22:20:00Z"
        }
      },
      isActive: true,
      sortOrder: 99
    },

    // CHAPTER 2 DEFINITIONS REVIEW INTRODUCTION  
    {
      id: "intro-chapter-2-review",
      courseId,
      title: "Chapter 2 Review Introduction - Definitions Mastery",
      type: "lesson",
      chapter: 2,
      section: 999,
      content: {
        "extracted": {
          "title": "Chapter 2 Review Introduction - Definitions Mastery",
          "content": "# Chapter 2 Review Introduction - Definitions Mastery\n\n## Chapter Overview - Technical Vocabulary Foundation\n\nChapter 2 provides the **comprehensive technical vocabulary** essential for understanding and applying all Louisiana plumbing code requirements. This chapter defines hundreds of plumbing terms, from basic components to complex systems.\n\n### 🎯 Critical Concepts to Master for 80% Pass Threshold\n\n**System Components**\n- Drainage system components and relationships\n- Water distribution system terminology\n- Venting system definitions and applications\n- Fixture classifications and requirements\n\n**Installation Terms**\n- Connection methods and joint types\n- Installation procedures and requirements\n- Testing and inspection terminology\n- Pipe sizing and capacity definitions\n\n**Materials and Standards**\n- Approved materials and their applications\n- Quality standards and specifications\n- Installation requirements for different materials\n- Compatibility and restriction definitions\n\n**Safety and Code Compliance**\n- Health and safety terminology\n- Cross-connection protection definitions\n- Emergency procedures and equipment\n- Compliance and enforcement terms\n\n### 📚 Study Strategy for Definitions\n\n**Since Chapter 2 is broken into 7 manageable lessons:**\n\n**Lesson 1**: Foundational plumbing terms and basic concepts\n**Lesson 2**: System components and their relationships  \n**Lesson 3**: Installation terminology and procedures\n**Lesson 4**: Materials, fittings, and connection methods\n**Lesson 5**: Inspection, testing, and compliance terms\n**Lesson 6**: Safety, health, and emergency definitions\n**Lesson 7**: Advanced concepts and specialized equipment\n\n### 🧠 Memorization Techniques\n\n**Group Related Terms:**\n- Study drainage terms together (soil pipe, waste pipe, vent pipe)\n- Learn fixture families (water closet, urinal, lavatory)\n- Master measurement terms (fixture units, flow rates, pressures)\n\n**Visual Connections:**\n- Connect definitions to actual plumbing components\n- Visualize systems while learning terminology\n- Relate terms to installation procedures you'll perform\n\n**Professional Context:**\n- Understand how inspectors use these terms\n- Practice using definitions in professional communication\n- Connect terms to real-world problem solving\n\n### 🎓 Exam Preparation Strategy\n\n**High-Priority Definition Categories:**\n- System component terminology (drainage, water supply, venting)\n- Installation and connection definitions\n- Testing and inspection vocabulary\n- Safety and health protection terms\n- Code compliance and enforcement definitions\n\n**Common Exam Patterns:**\n- Definition matching questions\n- Scenario-based term identification\n- System component relationship questions\n- Professional communication contexts\n\n### 🔧 Real-World Applications\n\nMastering Chapter 2 definitions enables you to:\n- **Communicate precisely** with inspectors and colleagues\n- **Understand technical specifications** and manufacturer instructions\n- **Read and interpret** plumbing plans and drawings correctly\n- **Troubleshoot problems** using proper technical vocabulary\n- **Explain work clearly** to clients using appropriate terms\n\n### ⚠️ Chapter Review Requirements\n\n**80% Pass Threshold:** This chapter review requires 80% to advance to Chapter 3 (General Regulations). Definitions are the foundation for all technical content that follows.\n\n**Study Approach:**\n1. Work through all 7 definition lessons systematically\n2. Create flashcards for challenging terms\n3. Practice using definitions in context\n4. Review relationships between related terms\n5. Test yourself on professional communication scenarios\n\n### 💡 Success Strategy\n\nThink of Chapter 2 as learning the \"language of plumbing.\" Every technical requirement in subsequent chapters assumes you understand these foundational definitions. Strong vocabulary mastery makes all other chapters much easier to understand and apply.\n\n### 📝 Connection to Future Chapters\n\nChapter 2 definitions support:\n- **Chapter 3**: General regulations and basic principles\n- **Chapter 4**: Fixtures and their specific requirements\n- **Chapter 5**: Water heaters and hot water systems\n- **All subsequent chapters**: Technical specifications and installation requirements\n\n---\n\n**Mastery Goal:** You should be able to define, use, and apply all key plumbing terminology correctly in professional contexts, enabling clear communication about technical requirements and proper system installation.",
          "extractedAt": "2025-01-30T22:21:00Z"
        }
      },
      isActive: true,
      sortOrder: 199
    },

    // CHAPTER 3 SECTION INTRODUCTIONS
    {
      id: "intro-section-301",
      courseId,
      title: "Section 301 Introduction - General Regulations",
      type: "lesson",
      chapter: 3,
      section: 301,
      content: {
        "extracted": {
          "title": "Section 301 Introduction - General Regulations",
          "content": "# Section 301 Introduction - General Regulations\n\n## What This Section Establishes\n\nSection 301 sets the **fundamental principles** that guide all plumbing work in Louisiana. This section establishes the basic sanitary and safety goals that underlie every technical requirement in the code.\n\n### 🎯 Key Learning Objectives\n\nAfter studying this section, you will understand:\n- **23 Basic Principles** that govern all plumbing installations\n- **Scope of general regulations** and how they apply\n- **Sanitary and safety goals** behind technical requirements\n- **How principles guide** code interpretation and application\n\n### 📋 Critical Concepts to Master\n\n**Basic Principles Framework**\n- Adequate, safe, and potable water supply requirements\n- Proper drainage system connections and separations\n- Minimum fixture requirements for different building types\n- Material and installation quality standards\n\n**Environmental Sanitation Goals**\n- Public health protection through proper plumbing design\n- Prevention of contamination and cross-connections\n- Proper waste treatment and disposal\n- Protection from freezing and structural damage\n\n### 🔧 Real-World Applications\n\nAs a Louisiana plumber, Section 301 knowledge helps you:\n- **Understand the \"why\"** behind specific code requirements\n- **Make sound decisions** when codes don't cover specific situations\n- **Explain to clients** the health and safety reasons for code compliance\n- **Apply principles** to unique installation challenges\n\n### 🎓 Study Focus for Certification\n\n**Critical Principles to Memorize:**\n- Principle 1: Adequate, safe, potable water supply requirements\n- Principle 2: Separate sewer connections for buildings\n- Principle 3: Minimum fixture requirements for dwellings\n- Principle 5: Water-seal trap requirements for fixtures\n- Principle 7: Backflow prevention and contamination protection\n\n**Professional Application:**\nThese principles provide the foundation for understanding why specific technical requirements exist and how to apply them correctly.\n\n### 📝 Connection to Other Sections\n\nSection 301 principles support:\n- **All technical chapters**: Provide the reasoning behind specific requirements\n- **Section 303**: Material standards that implement these principles\n- **Fixture chapters**: Minimum requirements and proper installation\n- **System design chapters**: Integration of principles into complete systems\n\n### 💡 Professional Insight\n\nWhen facing installation challenges not explicitly covered by code, return to these basic principles. They guide appropriate solutions that maintain health, safety, and sanitary objectives.\n\n---\n\n**Study Tip:** Section 301 answers 'What are we trying to achieve?' - understanding these principles makes all specific technical requirements more logical and easier to remember.",
          "extractedAt": "2025-01-30T22:22:00Z"
        }
      },
      isActive: true,
      sortOrder: 201
    },

    {
      id: "intro-section-303",
      courseId,
      title: "Section 303 Introduction - Materials",
      type: "lesson",
      chapter: 3,
      section: 303,
      content: {
        "extracted": {
          "title": "Section 303 Introduction - Materials",
          "content": "# Section 303 Introduction - Materials\n\n## What This Section Establishes\n\nSection 303 defines the **approved materials and standards** for all plumbing installations in Louisiana. This comprehensive section ensures all components meet safety, durability, and performance requirements.\n\n### 🎯 Key Learning Objectives\n\nAfter studying this section, you will understand:\n- **Approved materials** for different plumbing applications\n- **Quality standards** and testing requirements\n- **Installation specifications** for various materials\n- **Lead-free requirements** and health protection standards\n\n### 📋 Critical Concepts to Master\n\n**Material Standards and Approval**\n- ASTM, ASME, and other recognized standards\n- Material identification and marking requirements\n- Installation according to manufacturer specifications\n- Quality control and testing procedures\n\n**Lead-Free Requirements**\n- NSF Standard 61 compliance for potable water\n- Lead content limitations for pipes, fittings, and fixtures\n- Solder and flux lead-free specifications\n- Exceptions for specific applications\n\n**Special Materials Specifications**\n- Lead requirements for safe pans and flashings\n- Copper specifications for different applications\n- Plastic pipe limitations and proper usage\n- Cleanout and fitting requirements\n\n### 🔧 Real-World Applications\n\nAs a Louisiana plumber, Section 303 knowledge helps you:\n- **Select appropriate materials** for specific installations\n- **Verify material compliance** with Louisiana requirements\n- **Install materials correctly** according to standards\n- **Ensure health protection** through proper material selection\n\n### 🎓 Study Focus for Certification\n\n**Critical Material Requirements:**\n- Lead-free standards for potable water systems\n- Approved plastic pipe applications and limitations\n- Material identification and marking requirements\n- Installation standards and manufacturer compliance\n\n**Professional Responsibility:**\nUsing only approved materials installed correctly ensures code compliance and protects public health.\n\n### 📝 Connection to Other Sections\n\nSection 303 supports:\n- **All installation chapters**: Provides material specifications\n- **Water supply chapters**: Ensures potable water protection\n- **Drainage chapters**: Defines approved drainage materials\n- **Protection sections**: Materials for pipe protection and support\n\n### 💡 Professional Tip\n\nAlways verify material markings and certifications before installation. Using non-approved materials can result in failed inspections and costly rework.\n\n---\n\n**Study Tip:** Section 303 answers 'What materials can I use and how?' - this knowledge is essential for proper material selection and installation compliance.",
          "extractedAt": "2025-01-30T22:23:00Z"
        }
      },
      isActive: true,
      sortOrder: 202
    },

    // CHAPTER 3 REVIEW INTRODUCTION
    {
      id: "intro-chapter-3-review",
      courseId,
      title: "Chapter 3 Review Introduction - General Regulations Mastery",
      type: "lesson",
      chapter: 3,
      section: 999,
      content: {
        "extracted": {
          "title": "Chapter 3 Review Introduction - General Regulations Mastery",
          "content": "# Chapter 3 Review Introduction - General Regulations Mastery\n\n## Chapter Overview - Foundation of Technical Requirements\n\nChapter 3 establishes the **fundamental technical framework** for all plumbing installations in Louisiana. This chapter bridges the administrative foundation of Chapter 1 with the specific technical requirements in subsequent chapters.\n\n### 🎯 Critical Concepts to Master for 80% Pass Threshold\n\n**Basic Principles (Section 301)**\n- 23 fundamental principles governing all plumbing work\n- Environmental sanitation goals and public health protection\n- Minimum requirements for water supply, drainage, and fixtures\n- Contamination prevention and proper waste disposal\n\n**Material Standards (Section 303)**\n- Approved materials and quality standards (ASTM, ASME, etc.)\n- Lead-free requirements for potable water systems\n- Material identification, marking, and installation requirements\n- Special materials specifications and limitations\n\n**Additional Technical Requirements**\n- Pipe protection, support, and installation standards\n- Testing procedures and compliance verification\n- Structural safety and construction coordination\n- Trenching, excavation, and backfill requirements\n\n### 📚 Integration Points - How Sections Work Together\n\n**Regulatory Framework:**\n1. **Section 301** establishes why (principles and goals)\n2. **Section 303** defines what (approved materials and standards)\n3. **Additional sections** specify how (installation and testing procedures)\n\n**Professional Foundation:**\nChapter 3 provides the technical framework that supports all specific installation requirements in subsequent chapters.\n\n### 🎓 Exam Preparation Strategy\n\n**High-Priority Topics:**\n- Basic principles and their practical applications\n- Material approval standards and lead-free requirements\n- Installation and testing procedures\n- Structural safety and protection requirements\n\n**Common Exam Scenarios:**\n- Principle-based problem solving and code interpretation\n- Material selection and compliance verification\n- Installation procedure and testing requirement questions\n- Safety and protection standard applications\n\n### 🔧 Real-World Integration\n\nMastering Chapter 3 enables you to:\n- **Apply fundamental principles** to unique installation challenges\n- **Select and verify appropriate materials** for all applications\n- **Follow proper installation procedures** ensuring code compliance\n- **Coordinate with other trades** while maintaining structural integrity\n- **Conduct proper testing** to verify system performance\n\n### ⚠️ Chapter Review Requirements\n\n**80% Pass Threshold:** This chapter review requires 80% to advance to Chapter 4 (Plumbing Fixtures). Chapter 3 provides the technical foundation for all subsequent specialized chapters.\n\n**Study Approach:**\n1. Master the 23 basic principles and their applications\n2. Understand material standards and approval requirements\n3. Learn installation procedures and testing methods\n4. Practice applying principles to real-world scenarios\n5. Focus on coordination with structural and safety requirements\n\n### 💡 Success Strategy\n\nThink of Chapter 3 as the \"technical constitution\" of Louisiana plumbing work. While Chapter 1 provided legal authority, Chapter 3 provides the technical framework that guides all specific installation requirements.\n\n### 📝 Connection to Future Chapters\n\nChapter 3 foundations support:\n- **Chapter 4**: Fixture installation using approved materials and principles\n- **Chapter 5**: Water heater installation following safety and material standards\n- **Chapter 6**: Water supply systems implementing contamination prevention\n- **All subsequent chapters**: Technical specifications built on these foundations\n\n---\n\n**Mastery Goal:** You should be able to apply basic plumbing principles, select appropriate materials, follow proper installation procedures, and ensure compliance with safety and testing requirements - providing the technical foundation for all specialized plumbing work.",
          "extractedAt": "2025-01-30T22:24:00Z"
        }
      },
      isActive: true,
      sortOrder: 299
    },

    // CHAPTER 4 SECTION INTRODUCTIONS
    {
      id: "intro-section-401",
      courseId,
      title: "Section 401 Introduction - General Fixture Requirements",
      type: "lesson",
      chapter: 4,
      section: 401,
      content: {
        "extracted": {
          "title": "Section 401 Introduction - General Fixture Requirements",
          "content": "# Section 401 Introduction - General Fixture Requirements\n\n## What This Section Establishes\n\nSection 401 sets the **fundamental requirements** for all plumbing fixtures in Louisiana. This section defines scope, prohibited fixtures, and basic installation standards that apply to all fixture types.\n\n### 🎯 Key Learning Objectives\n\nAfter studying this section, you will understand:\n- **Scope of fixture regulations** and what they cover\n- **Prohibited fixture types** and why they're not allowed\n- **Access requirements** for maintenance and repairs\n- **Basic installation standards** for all fixtures\n\n### 📋 Critical Concepts to Master\n\n**Fixture Scope and Standards**\n- Materials, design, installation, and quality requirements\n- How fixture regulations coordinate with other code chapters\n- Professional responsibility for proper fixture selection\n\n**Prohibited Fixtures**\n- Pan, valve, plunger, offset, and washout water closets\n- Fixtures with invisible seals or unventilated spaces\n- Floor type trough urinals and siphonage-prone designs\n- Health and safety reasons behind prohibitions\n\n**Access and Maintenance Requirements**\n- Concealed slip-joint connection access provisions\n- Waste and overflow fitting accessibility\n- Access panel and utility space requirements\n- Inspection and repair considerations\n\n### 🔧 Real-World Applications\n\nAs a Louisiana plumber, Section 401 knowledge helps you:\n- **Select appropriate fixtures** that meet Louisiana requirements\n- **Avoid prohibited fixtures** that will fail inspection\n- **Plan access provisions** for future maintenance needs\n- **Ensure proper installation** according to general standards\n\n### 🎓 Study Focus for Certification\n\n**Critical Requirements:**\n- Complete list of prohibited fixture types\n- Access requirements for concealed connections\n- General installation and quality standards\n- Coordination with material and installation chapters\n\n**Professional Application:**\nUnderstanding general fixture requirements helps you make appropriate selections and installations before moving to specific fixture types.\n\n### 📝 Connection to Other Sections\n\nSection 401 works with:\n- **Section 403**: Installation procedures and standards\n- **Section 405**: Location and spacing requirements\n- **Section 407**: Materials and performance standards\n- **Section 411**: Minimum fixture requirements for buildings\n\n### 💡 Professional Insight\n\nProper fixture selection and installation at the general level prevents costly problems during specific installation and inspection phases.\n\n---\n\n**Study Tip:** Section 401 answers 'What fixtures can I use and what are the basic rules?' - this foundation knowledge guides all specific fixture installation work.",
          "extractedAt": "2025-01-30T22:25:00Z"
        }
      },
      isActive: true,
      sortOrder: 301
    },

    {
      id: "intro-section-403",
      courseId,
      title: "Section 403 Introduction - Installation",
      type: "lesson",
      chapter: 4,
      section: 403,
      content: {
        "extracted": {
          "title": "Section 403 Introduction - Installation",
          "content": "# Section 403 Introduction - Installation\n\n## What This Section Establishes\n\nSection 403 defines the **specific installation requirements** for all plumbing fixtures. This section ensures fixtures are properly positioned, supported, and sealed for optimal performance and accessibility.\n\n### 🎯 Key Learning Objectives\n\nAfter studying this section, you will understand:\n- **Cleaning access requirements** and fixture positioning\n- **Watertight joint specifications** for walls and floors\n- **Support requirements** for wall-hung fixtures\n- **Setting standards** for level, alignment, and spacing\n\n### 📋 Critical Concepts to Master\n\n**Access and Positioning**\n- Easy access for cleaning all fixture surfaces\n- Pipe routing to nearest walls when practical\n- Professional installation for long-term maintenance\n\n**Watertight Installations**\n- Wall and floor joint sealing requirements\n- Prevention of water damage and mold issues\n- Proper caulking and sealing techniques\n\n**Support and Mounting**\n- Wall-hung water closet support requirements\n- Concealed metal supporting members\n- Load distribution and structural considerations\n\n**Setting and Alignment**\n- Level installation and proper alignment standards\n- Minimum spacing requirements between fixtures\n- Center-to-center measurements and clearances\n\n### 🔧 Real-World Applications\n\nAs a Louisiana plumber, Section 403 knowledge helps you:\n- **Install fixtures properly** for long-term performance\n- **Prevent water damage** through proper sealing\n- **Meet spacing requirements** for code compliance\n- **Ensure structural support** for wall-hung fixtures\n\n### 🎓 Study Focus for Certification\n\n**Critical Installation Standards:**\n- Water closet and bidet spacing (15\" from centerline to walls)\n- Center-to-center spacing (30\" water closets, 24\" urinals)\n- Front clearance requirements (21\" minimum)\n- Wall-hung fixture support specifications\n\n**Professional Responsibility:**\nProper installation ensures code compliance, prevents water damage, and provides long-term fixture performance.\n\n### 📝 Connection to Other Sections\n\nSection 403 coordinates with:\n- **Section 401**: General requirements that govern installation\n- **Section 405**: Location requirements that affect installation\n- **Section 407**: Material standards for installation components\n- **Structural codes**: Building requirements for fixture support\n\n### 💡 Professional Tip\n\nMeasure twice, install once. Proper spacing and support prevent costly rework and ensure code compliance from the start.\n\n---\n\n**Study Tip:** Section 403 answers 'How do I install fixtures correctly?' - these standards ensure professional installation that meets code and performance requirements.",
          "extractedAt": "2025-01-30T22:26:00Z"
        }
      },
      isActive: true,
      sortOrder: 302
    },

    // CHAPTER 4 REVIEW INTRODUCTION
    {
      id: "intro-chapter-4-review",
      courseId,
      title: "Chapter 4 Review Introduction - Plumbing Fixtures Mastery",
      type: "lesson",
      chapter: 4,
      section: 999,
      content: {
        "extracted": {
          "title": "Chapter 4 Review Introduction - Plumbing Fixtures Mastery",
          "content": "# Chapter 4 Review Introduction - Plumbing Fixtures Mastery\n\n## Chapter Overview - Complete Fixture Installation Standards\n\nChapter 4 provides **comprehensive requirements** for all plumbing fixtures in Louisiana. This chapter covers selection, installation, location, materials, and minimum requirements for fixtures in all building types.\n\n### 🎯 Critical Concepts to Master for 80% Pass Threshold\n\n**General Requirements (Section 401)**\n- Scope of fixture regulations and prohibited fixture types\n- Access requirements for concealed connections\n- Basic installation standards for all fixtures\n- Health and safety reasons behind fixture prohibitions\n\n**Installation Standards (Section 403)**\n- Cleaning access and fixture positioning requirements\n- Watertight joint specifications and support standards\n- Setting, alignment, and spacing requirements\n- Professional installation for code compliance\n\n**Location Requirements (Section 405)**\n- Ventilation and lighting standards for fixture areas\n- Public restroom and food service facility requirements\n- Construction worker toilet facility provisions\n- Clearance and accessibility standards\n\n**Materials and Performance (Section 407)**\n- Approved fixture materials and construction standards\n- Performance requirements and testing specifications\n- Fixture fittings and accessory standards\n- Quality and durability requirements\n\n**Minimum Fixture Requirements (Section 411)**\n- Building occupancy fixture calculations\n- Specific requirements for different building types\n- Water closet, lavatory, and additional fixture minimums\n- Commercial and institutional facility requirements\n\n### 📚 Integration Points - How Sections Work Together\n\n**Complete Fixture Framework:**\n1. **Section 401** defines what fixtures can be used\n2. **Section 403** specifies how to install them\n3. **Section 405** determines where they can be located\n4. **Section 407** ensures proper materials and performance\n5. **Section 411** establishes minimum quantities required\n\n**Professional Application:**\nChapter 4 provides complete guidance for fixture selection, installation, and compliance in all building types.\n\n### 🎓 Exam Preparation Strategy\n\n**High-Priority Topics:**\n- Prohibited fixture types and reasons for prohibition\n- Installation spacing and clearance requirements\n- Minimum fixture calculations for different occupancies\n- Ventilation and location requirements\n- Material standards and performance requirements\n\n**Common Exam Scenarios:**\n- Fixture quantity calculations for specific building types\n- Installation spacing and support requirements\n- Location and ventilation requirement applications\n- Material selection and performance standard questions\n- Access and maintenance provision requirements\n\n### 🔧 Real-World Integration\n\nMastering Chapter 4 enables you to:\n- **Select appropriate fixtures** for any building type\n- **Calculate minimum fixture requirements** accurately\n- **Install fixtures properly** with correct spacing and support\n- **Meet location and ventilation requirements** for all applications\n- **Ensure material compliance** and long-term performance\n\n### ⚠️ Chapter Review Requirements\n\n**80% Pass Threshold:** This chapter review requires 80% to advance to Chapter 5 (Water Heaters). Fixture knowledge is essential for understanding complete plumbing system design.\n\n**Study Approach:**\n1. Master prohibited fixture types and selection criteria\n2. Learn installation spacing and support requirements\n3. Understand location and ventilation standards\n4. Practice fixture quantity calculations for different building types\n5. Study material and performance requirements\n\n### 💡 Success Strategy\n\nThink of Chapter 4 as \"fixture mastery\" - everything you need to know about selecting, installing, and calculating fixtures for complete code compliance.\n\n### 📝 Connection to Future Chapters\n\nChapter 4 fixture knowledge supports:\n- **Chapter 5**: Water heater connections to fixture supply systems\n- **Chapter 6**: Water supply sizing based on fixture requirements\n- **Chapter 7**: Drainage system sizing based on fixture units\n- **All subsequent chapters**: System design based on fixture loads\n\n---\n\n**Mastery Goal:** You should be able to select appropriate fixtures, calculate minimum requirements, install with proper spacing and support, ensure location compliance, and verify material standards - providing complete fixture expertise for any Louisiana plumbing project.",
          "extractedAt": "2025-01-30T22:27:00Z"
        }
      },
      isActive: true,
      sortOrder: 399
    },

    // CHAPTER 5 SECTION INTRODUCTIONS  
    {
      id: "intro-section-501",
      courseId,
      title: "Section 501 Introduction - General Water Heater Requirements",
      type: "lesson",
      chapter: 5,
      section: 501,
      content: {
        "extracted": {
          "title": "Section 501 Introduction - General Water Heater Requirements",
          "content": "# Section 501 Introduction - General Water Heater Requirements\n\n## What This Section Establishes\n\nSection 501 sets the **fundamental requirements** for water heaters and hot water systems in Louisiana. This section establishes scope, safety standards, and basic installation principles for all water heating equipment.\n\n### 🎯 Key Learning Objectives\n\nAfter studying this section, you will understand:\n- **Scope of water heater regulations** and what they cover\n- **Safety requirements** for installation and operation\n- **Basic installation standards** for all water heating equipment\n- **Coordination with other code chapters** and building systems\n\n### 📋 Critical Concepts to Master\n\n**Water Heater Scope**\n- Types of water heating equipment covered by regulations\n- Installation, safety, and performance requirements\n- Professional responsibility for proper equipment selection\n\n**Safety Standards**\n- Temperature and pressure relief requirements\n- Combustion air and venting provisions\n- Electrical safety and grounding requirements\n- Emergency shutdown and safety device provisions\n\n**Installation Principles**\n- Accessibility for maintenance and service\n- Clearance requirements for safe operation\n- Support and mounting specifications\n- Connection to plumbing and building systems\n\n### 🔧 Real-World Applications\n\nAs a Louisiana plumber, Section 501 knowledge helps you:\n- **Select appropriate water heaters** for specific applications\n- **Ensure safety compliance** in all installations\n- **Plan proper installation** with adequate access and clearances\n- **Coordinate with other trades** for complete system integration\n\n### 🎓 Study Focus for Certification\n\n**Critical Safety Requirements:**\n- Temperature and pressure relief valve specifications\n- Combustion air and venting requirements\n- Electrical connection and grounding standards\n- Emergency safety device requirements\n\n**Professional Application:**\nUnderstanding general water heater requirements provides the foundation for all specific installation and safety procedures.\n\n### 📝 Connection to Other Sections\n\nSection 501 works with:\n- **Section 503**: Installation procedures and requirements\n- **Section 505**: Safety device and relief valve requirements\n- **Section 507**: Venting and combustion air requirements\n- **Chapter 6**: Water supply connections and sizing\n\n### 💡 Professional Insight\n\nWater heater safety is paramount. Proper installation prevents scalding, explosion, and carbon monoxide hazards that can be life-threatening.\n\n---\n\n**Study Tip:** Section 501 answers 'What are the basic safety and installation requirements for water heaters?' - this foundation ensures safe, code-compliant installations.",
          "extractedAt": "2025-01-30T22:28:00Z"
        }
      },
      isActive: true,
      sortOrder: 401
    },

    // CHAPTER 5 REVIEW INTRODUCTION
    {
      id: "intro-chapter-5-review",
      courseId,
      title: "Chapter 5 Review Introduction - Water Heaters Mastery",
      type: "lesson",
      chapter: 5,
      section: 999,
      content: {
        "extracted": {
          "title": "Chapter 5 Review Introduction - Water Heaters Mastery",
          "content": "# Chapter 5 Review Introduction - Water Heaters Mastery\n\n## Chapter Overview - Complete Water Heater Safety and Installation\n\nChapter 5 provides **comprehensive requirements** for water heaters and hot water systems in Louisiana. This chapter covers safety, installation, relief valves, solar systems, and all aspects of safe water heating.\n\n### 🎯 Critical Concepts to Master for 80% Pass Threshold\n\n**General Requirements (Section 501)**\n- Water heater scope and types covered by regulations\n- Basic safety standards and installation principles\n- Coordination with plumbing and building systems\n- Professional responsibility for equipment selection\n\n**Installation Standards (Section 503)**\n- Clearance requirements and accessibility standards\n- Support and mounting specifications\n- Connection procedures for all water heater types\n- Electrical and gas connection requirements\n\n**Safety Devices (Section 511)**\n- Temperature and pressure relief valve requirements\n- Relief valve discharge piping and termination\n- Emergency shutdown and safety device provisions\n- Testing and maintenance requirements\n\n**Solar Water Heating (Section 513)**\n- Closed-loop system requirements and prohibitions\n- Heat exchanger and freeze protection standards\n- Installation and certification requirements\n- Integration with auxiliary heating systems\n\n### 📚 Integration Points - How Sections Work Together\n\n**Complete Water Heater Framework:**\n1. **Section 501** establishes scope and basic requirements\n2. **Section 503** defines installation procedures and standards\n3. **Section 511** ensures safety through relief devices\n4. **Section 513** covers specialized solar water heating\n\n**Safety-First Approach:**\nChapter 5 prioritizes safety at every level, from equipment selection through installation and ongoing operation.\n\n### 🎓 Exam Preparation Strategy\n\n**High-Priority Topics:**\n- Temperature and pressure relief valve specifications\n- Installation clearance and accessibility requirements\n- Safety device testing and discharge requirements\n- Solar system design and installation standards\n- Emergency shutdown and safety procedures\n\n**Common Exam Scenarios:**\n- Relief valve sizing and discharge piping\n- Water heater clearance and support requirements\n- Solar system integration and safety\n- Emergency safety device applications\n- Installation coordination with other systems\n\n### 🔧 Real-World Integration\n\nMastering Chapter 5 enables you to:\n- **Install water heaters safely** with proper clearances and support\n- **Size and install relief valves** correctly for all applications\n- **Design and install solar systems** meeting Louisiana requirements\n- **Ensure safety compliance** in all water heating installations\n- **Coordinate effectively** with electrical and HVAC trades\n\n### ⚠️ Chapter Review Requirements\n\n**80% Pass Threshold:** This chapter review requires 80% to advance to Chapter 6 (Water Supply). Water heater safety knowledge is critical for protecting life and property.\n\n**Study Approach:**\n1. Master safety device requirements and installation\n2. Learn clearance and accessibility standards\n3. Understand relief valve sizing and discharge\n4. Study solar system requirements and integration\n5. Practice emergency safety procedures\n\n### 💡 Success Strategy\n\nThink of Chapter 5 as \"water heater safety mastery\" - proper installation prevents scalding, explosion, and carbon monoxide hazards that can be life-threatening.\n\n### 📝 Connection to Future Chapters\n\nChapter 5 water heater knowledge supports:\n- **Chapter 6**: Water supply sizing and connection to heaters\n- **Chapter 7**: Drainage requirements for relief valve discharge\n- **Chapter 11**: Venting requirements for fuel-burning heaters\n- **All system chapters**: Integration of water heating into complete systems\n\n---\n\n**Mastery Goal:** You should be able to select, install, and ensure safety of all water heating equipment, from conventional units to solar systems, while protecting life and property through proper safety device installation and testing.",
          "extractedAt": "2025-01-30T22:29:00Z"
        }
      },
      isActive: true,
      sortOrder: 499
    },

    // COMPREHENSIVE CHAPTER REVIEWS FOR REMAINING CHAPTERS 6-15
    {
      id: "intro-chapter-6-review",
      courseId,
      title: "Chapter 6 Review Introduction - Water Supply Systems Mastery",
      type: "lesson",
      chapter: 6,
      section: 999,
      content: {
        "extracted": {
          "title": "Chapter 6 Review Introduction - Water Supply Systems Mastery",
          "content": "# Chapter 6 Review Introduction - Water Supply Systems Mastery\n\n## Chapter Overview - Complete Water Supply System Design\n\nChapter 6 provides **comprehensive requirements** for water supply systems in Louisiana. This chapter covers materials, sizing, cross-connection protection, and all aspects of safe potable water delivery.\n\n### 🎯 Critical Concepts to Master for 80% Pass Threshold\n\n**System Design and Materials**\n- Approved materials for water supply piping and fittings\n- Pipe sizing calculations and pressure requirements\n- System layout and distribution design principles\n- Connection standards and installation procedures\n\n**Cross-Connection Protection**\n- Backflow prevention device requirements and applications\n- Air gap specifications and proper installation\n- Cross-connection identification and elimination\n- Testing and maintenance of protection devices\n\n**Pressure and Flow Requirements**\n- Minimum pressure standards for fixtures\n- Flow rate calculations and demand factors\n- Pressure reducing valves and system protection\n- Water hammer prevention and control\n\n### 🔧 Real-World Integration\n\nMastering Chapter 6 enables you to:\n- **Design water supply systems** that meet all pressure and flow requirements\n- **Install cross-connection protection** to safeguard public health\n- **Size piping correctly** for optimal system performance\n- **Ensure water quality** through proper material selection and installation\n\n---\n\n**Mastery Goal:** You should be able to design, install, and protect water supply systems that deliver safe, adequate potable water while preventing contamination and ensuring code compliance.",
          "extractedAt": "2025-01-30T22:30:00Z"
        }
      },
      isActive: true,
      sortOrder: 599
    },

    {
      id: "intro-chapter-7-review",
      courseId,
      title: "Chapter 7 Review Introduction - Drainage Systems Mastery",
      type: "lesson",
      chapter: 7,
      section: 999,
      content: {
        "extracted": {
          "title": "Chapter 7 Review Introduction - Drainage Systems Mastery",
          "content": "# Chapter 7 Review Introduction - Drainage Systems Mastery\n\n## Chapter Overview - Complete Drainage System Design\n\nChapter 7 provides **comprehensive requirements** for sanitary drainage systems in Louisiana. This chapter covers pipe sizing, fixture units, system layout, and proper waste removal.\n\n### 🎯 Critical Concepts to Master for 80% Pass Threshold\n\n**System Design and Sizing**\n- Fixture unit calculations and pipe sizing methods\n- Drainage system layout and slope requirements\n- Building drain and sewer sizing standards\n- Connection procedures and fitting requirements\n\n**Waste Management**\n- Sanitary waste vs. storm water separation\n- Grease interceptor and special waste requirements\n- Floor drain and area drain installation\n- System testing and inspection procedures\n\n### 🔧 Real-World Integration\n\nMastering Chapter 7 enables you to:\n- **Size drainage systems** correctly for all building types\n- **Install proper slopes** for effective waste removal\n- **Design special waste systems** for commercial applications\n- **Ensure system integrity** through proper testing and inspection\n\n---\n\n**Mastery Goal:** You should be able to design and install drainage systems that effectively remove all waste while preventing backups and maintaining sanitary conditions.",
          "extractedAt": "2025-01-30T22:31:00Z"
        }
      },
      isActive: true,
      sortOrder: 699
    },

    {
      id: "intro-chapter-8-review",
      courseId,
      title: "Chapter 8 Review Introduction - Special Waste Systems Mastery",
      type: "lesson",
      chapter: 8,
      section: 999,
      content: {
        "extracted": {
          "title": "Chapter 8 Review Introduction - Special Waste Systems Mastery",
          "content": "# Chapter 8 Review Introduction - Special Waste Systems Mastery\n\n## Chapter Overview - Specialized Waste Handling Systems\n\nChapter 8 provides **comprehensive requirements** for special waste systems in Louisiana. This chapter covers industrial waste, interceptors, and specialized treatment requirements.\n\n### 🎯 Critical Concepts to Master for 80% Pass Threshold\n\n**Special Waste Classification**\n- Industrial waste vs. sanitary waste definitions\n- Grease interceptor sizing and installation\n- Chemical waste treatment requirements\n- Oil and sand interceptor applications\n\n**Treatment and Disposal**\n- Pre-treatment requirements for industrial waste\n- Neutralization and chemical treatment systems\n- Sampling and monitoring requirements\n- Discharge standards and permit compliance\n\n### 🔧 Real-World Integration\n\nMastering Chapter 8 enables you to:\n- **Design interceptor systems** for restaurants and commercial facilities\n- **Handle industrial waste** according to environmental regulations\n- **Install treatment systems** that protect public infrastructure\n- **Ensure compliance** with discharge standards and permits\n\n---\n\n**Mastery Goal:** You should be able to design and install special waste systems that properly treat and dispose of non-domestic waste while protecting public health and the environment.",
          "extractedAt": "2025-01-30T22:32:00Z"
        }
      },
      isActive: true,
      sortOrder: 799
    },

    {
      id: "intro-chapter-9-review",
      courseId,
      title: "Chapter 9 Review Introduction - Venting Systems Mastery",
      type: "lesson",
      chapter: 9,
      section: 999,
      content: {
        "extracted": {
          "title": "Chapter 9 Review Introduction - Venting Systems Mastery",
          "content": "# Chapter 9 Review Introduction - Venting Systems Mastery\n\n## Chapter Overview - Complete Venting System Design\n\nChapter 9 provides **comprehensive requirements** for venting systems in Louisiana. This chapter covers vent sizing, installation, and proper system design for trap seal protection.\n\n### 🎯 Critical Concepts to Master for 80% Pass Threshold\n\n**Vent System Design**\n- Individual and common vent sizing methods\n- Stack venting and wet venting applications\n- Vent terminal locations and protection\n- Connection procedures and fitting requirements\n\n**Trap Seal Protection**\n- Proper vent sizing to prevent siphonage\n- Back pressure prevention in vent systems\n- Relief vent applications and installation\n- Testing procedures for vent system integrity\n\n### 🔧 Real-World Integration\n\nMastering Chapter 9 enables you to:\n- **Design vent systems** that protect all trap seals\n- **Size vents correctly** for optimal performance\n- **Install vent terminals** that prevent weather infiltration\n- **Ensure system balance** through proper vent design\n\n---\n\n**Mastery Goal:** You should be able to design and install venting systems that maintain trap seals, prevent sewer gas infiltration, and ensure proper drainage system operation.",
          "extractedAt": "2025-01-30T22:33:00Z"
        }
      },
      isActive: true,
      sortOrder: 899
    },

    {
      id: "intro-chapter-10-review",
      courseId,
      title: "Chapter 10 Review Introduction - Traps and Interceptors Mastery",
      type: "lesson",
      chapter: 10,
      section: 999,
      content: {
        "extracted": {
          "title": "Chapter 10 Review Introduction - Traps and Interceptors Mastery",
          "content": "# Chapter 10 Review Introduction - Traps and Interceptors Mastery\n\n## Chapter Overview - Trap and Interceptor Systems\n\nChapter 10 provides **comprehensive requirements** for traps and interceptors in Louisiana. This chapter covers trap selection, installation, and maintenance for proper sewer gas protection.\n\n### 🎯 Critical Concepts to Master for 80% Pass Threshold\n\n**Trap Requirements**\n- Individual fixture trap requirements\n- Trap seal depths and protection methods\n- Prohibited trap configurations\n- Trap cleaning and maintenance access\n\n**Interceptor Applications**\n- Grease interceptor sizing for food service\n- Oil interceptor requirements for automotive facilities\n- Sand interceptor applications\n- Maintenance and cleaning procedures\n\n### 🔧 Real-World Integration\n\nMastering Chapter 10 enables you to:\n- **Select appropriate traps** for all fixture types\n- **Install interceptors** correctly for commercial applications\n- **Maintain trap seals** through proper venting\n- **Provide access** for cleaning and maintenance\n\n---\n\n**Mastery Goal:** You should be able to select, install, and maintain traps and interceptors that provide effective sewer gas protection and waste treatment.",
          "extractedAt": "2025-01-30T22:34:00Z"
        }
      },
      isActive: true,
      sortOrder: 999
    },

    {
      id: "intro-chapter-11-review",
      courseId,
      title: "Chapter 11 Review Introduction - Storm Drainage Mastery",
      type: "lesson",
      chapter: 11,
      section: 999,
      content: {
        "extracted": {
          "title": "Chapter 11 Review Introduction - Storm Drainage Mastery",
          "content": "# Chapter 11 Review Introduction - Storm Drainage Mastery\n\n## Chapter Overview - Storm Water Management Systems\n\nChapter 11 provides **comprehensive requirements** for storm drainage systems in Louisiana. This chapter covers roof drainage, area drains, and storm water management.\n\n### 🎯 Critical Concepts to Master for 80% Pass Threshold\n\n**Storm Water Systems**\n- Roof drainage design and sizing calculations\n- Storm sewer vs. sanitary sewer separation\n- Area drain installation and connection\n- Overflow provisions and emergency drainage\n\n**Installation Requirements**\n- Proper slopes for storm water removal\n- Backflow prevention in storm systems\n- Connection to municipal storm systems\n- Testing and inspection procedures\n\n### 🔧 Real-World Integration\n\nMastering Chapter 11 enables you to:\n- **Design roof drainage** for effective water removal\n- **Separate storm and sanitary** systems properly\n- **Install area drains** for surface water management\n- **Prevent flooding** through proper design and installation\n\n---\n\n**Mastery Goal:** You should be able to design and install storm drainage systems that effectively manage rainfall and prevent property damage.",
          "extractedAt": "2025-01-30T22:35:00Z"
        }
      },
      isActive: true,
      sortOrder: 1099
    },

    {
      id: "intro-chapter-12-review",
      courseId,
      title: "Chapter 12 Review Introduction - Fuel Gas Piping Mastery",
      type: "lesson",
      chapter: 12,
      section: 999,
      content: {
        "extracted": {
          "title": "Chapter 12 Review Introduction - Fuel Gas Piping Mastery",
          "content": "# Chapter 12 Review Introduction - Fuel Gas Piping Mastery\n\n## Chapter Overview - Safe Fuel Gas Installation\n\nChapter 12 provides **comprehensive requirements** for fuel gas piping in Louisiana. This chapter covers natural gas and LP gas systems, safety requirements, and installation standards.\n\n### 🎯 Critical Concepts to Master for 80% Pass Threshold\n\n**Gas Piping Systems**\n- Natural gas vs. LP gas system differences\n- Pipe sizing calculations for gas flow\n- Material requirements and approvals\n- Installation and testing procedures\n\n**Safety Requirements**\n- Gas leak detection and prevention\n- Emergency shut-off valve requirements\n- Ventilation requirements for gas appliances\n- Explosion prevention measures\n\n### 🔧 Real-World Integration\n\nMastering Chapter 12 enables you to:\n- **Install gas piping** safely for all appliance types\n- **Test gas systems** to ensure leak-free operation\n- **Size gas lines** correctly for appliance demands\n- **Ensure safety** through proper installation and testing\n\n---\n\n**Mastery Goal:** You should be able to install fuel gas piping systems safely while preventing leaks and ensuring proper appliance operation.",
          "extractedAt": "2025-01-30T22:36:00Z"
        }
      },
      isActive: true,
      sortOrder: 1199
    },

    {
      id: "intro-chapter-13-review",
      courseId,
      title: "Chapter 13 Review Introduction - Medical Facilities Mastery",
      type: "lesson",
      chapter: 13,
      section: 999,
      content: {
        "extracted": {
          "title": "Chapter 13 Review Introduction - Medical Facilities Mastery",
          "content": "# Chapter 13 Review Introduction - Medical Facilities Mastery\n\n## Chapter Overview - Healthcare Facility Plumbing\n\nChapter 13 provides **comprehensive requirements** for medical facility plumbing in Louisiana. This chapter covers specialized requirements for hospitals, clinics, and healthcare facilities.\n\n### 🎯 Critical Concepts to Master for 80% Pass Threshold\n\n**Medical Facility Requirements**\n- Specialized fixture requirements for healthcare\n- Infection control and sanitation standards\n- Medical gas system coordination\n- Emergency system requirements\n\n**Special Considerations**\n- Patient safety and accessibility requirements\n- Isolation room plumbing requirements\n- Laboratory and clinical waste handling\n- Sterilization equipment connections\n\n### 🔧 Real-World Integration\n\nMastering Chapter 13 enables you to:\n- **Install healthcare fixtures** meeting specialized requirements\n- **Ensure infection control** through proper design\n- **Coordinate with medical systems** for complete facility service\n- **Meet accessibility standards** for patient care areas\n\n---\n\n**Mastery Goal:** You should be able to install plumbing systems in medical facilities that meet specialized healthcare requirements while ensuring patient safety and infection control.",
          "extractedAt": "2025-01-30T22:37:00Z"
        }
      },
      isActive: true,
      sortOrder: 1299
    },

    {
      id: "intro-chapter-14-review",
      courseId,
      title: "Chapter 14 Review Introduction - Swimming Pools and Spas Mastery",
      type: "lesson",
      chapter: 14,
      section: 999,
      content: {
        "extracted": {
          "title": "Chapter 14 Review Introduction - Swimming Pools and Spas Mastery",
          "content": "# Chapter 14 Review Introduction - Swimming Pools and Spas Mastery\n\n## Chapter Overview - Pool and Spa Plumbing Systems\n\nChapter 14 provides **comprehensive requirements** for swimming pool and spa plumbing in Louisiana. This chapter covers circulation systems, drainage, and safety requirements.\n\n### 🎯 Critical Concepts to Master for 80% Pass Threshold\n\n**Pool and Spa Systems**\n- Circulation system design and sizing\n- Suction fitting safety requirements\n- Drainage and overflow systems\n- Chemical feed system connections\n\n**Safety Requirements**\n- Anti-entrapment measures and regulations\n- Emergency drainage provisions\n- Backflow prevention for pool systems\n- Equipment access and maintenance requirements\n\n### 🔧 Real-World Integration\n\nMastering Chapter 14 enables you to:\n- **Design pool circulation** for effective water treatment\n- **Install safety features** to prevent entrapment hazards\n- **Connect chemical systems** safely and effectively\n- **Ensure compliance** with pool safety regulations\n\n---\n\n**Mastery Goal:** You should be able to install pool and spa plumbing systems that provide safe operation while meeting all circulation and safety requirements.",
          "extractedAt": "2025-01-30T22:38:00Z"
        }
      },
      isActive: true,
      sortOrder: 1399
    },

    {
      id: "intro-chapter-15-review",
      courseId,
      title: "Chapter 15 Review Introduction - Mobile Homes and Travel Trailers Mastery",
      type: "lesson",
      chapter: 15,
      section: 999,
      content: {
        "extracted": {
          "title": "Chapter 15 Review Introduction - Mobile Homes and Travel Trailers Mastery",
          "content": "# Chapter 15 Review Introduction - Mobile Homes and Travel Trailers Mastery\n\n## Chapter Overview - Mobile and Manufactured Housing Plumbing\n\nChapter 15 provides **comprehensive requirements** for mobile home and travel trailer plumbing in Louisiana. This chapter covers unique requirements for manufactured housing and mobile facilities.\n\n### 🎯 Critical Concepts to Master for 80% Pass Threshold\n\n**Mobile Home Requirements**\n- Unique plumbing requirements for manufactured housing\n- Connection standards for utility hookups\n- Freeze protection in mobile installations\n- Skirting and underpinning access requirements\n\n**Travel Trailer Systems**\n- Temporary connection requirements\n- Sanitary station design and installation\n- Water supply and waste system connections\n- Park facility plumbing requirements\n\n### 🔧 Real-World Integration\n\nMastering Chapter 15 enables you to:\n- **Install mobile home plumbing** meeting manufactured housing standards\n- **Design trailer park facilities** for temporary connections\n- **Ensure freeze protection** in mobile installations\n- **Provide proper connections** for all mobile housing types\n\n---\n\n**Mastery Goal:** You should be able to install plumbing systems for mobile homes and travel trailers that meet specialized requirements while ensuring code compliance and system reliability.\n\n### 🎓 Final Course Integration\n\nCongratulations! Completing all 15 chapters of the Louisiana State Plumbing Code provides you with comprehensive knowledge for journeyman plumber certification. You now understand:\n\n✅ **Administrative requirements** and code authority\n✅ **Technical vocabulary** and professional communication\n✅ **General regulations** and basic principles\n✅ **Fixture installation** and requirements\n✅ **Water heater safety** and installation\n✅ **Water supply systems** and cross-connection protection\n✅ **Drainage systems** and waste management\n✅ **Special waste handling** and treatment\n✅ **Venting systems** and trap seal protection\n✅ **Traps and interceptors** for sewer gas protection\n✅ **Storm drainage** and water management\n✅ **Fuel gas piping** and safety\n✅ **Medical facility** specialized requirements\n✅ **Pool and spa systems** and safety\n✅ **Mobile housing** and manufactured home requirements\n\nYou are now prepared for the Louisiana Journeyman Plumber certification exam!",
          "extractedAt": "2025-01-30T22:39:00Z"
        }
      },
      isActive: true,
      sortOrder: 1499
    },
    {
      id: "810cafa9-6024-4bdc-a3c5-266490062114",
      courseId,
      title: "LSPC 101 Administration  Subchapter A. General - Questions & Answers",
      type: "quiz",
      chapter: 1,
      section: 101,
      content: {
        "extracted": {
          "title": "LSPC 101 Administration - Questions & Answers",
          "content": "# Louisiana State Plumbing Code Section 101 - Practice Quiz\n\n## Multiple Choice Questions\n\n**1. Which specific section of the Louisiana Sanitary Code does the Department of Health and Hospitals, Office of Public Health adopt?**\nA. Part XV (Electrical)\nB. Part XIII (Building)\nC. Part XIV (Plumbing) ✓\nD. Part XII (Environmental)\n\n**2. What is the alternative citation for 'Part XIV (Plumbing) of the Sanitary Code, State of Louisiana'?**\nA. The Louisiana State Environmental Code\nB. The Louisiana State Plumbing Code ✓\nC. The Louisiana Building Code\nD. The Louisiana Residential Code\n\n**3. Any reference or citation to the 'Louisiana State Plumbing Code' is considered synonymous with what other reference or citation?**\nA. Part XIV (Plumbing) of the Sanitary Code, State of Louisiana ✓\nB. Part XII (Fire Safety) of the Sanitary Code\nC. Part XIII (Electrical) of the Sanitary Code\nD. Part XI (Zoning) of the Sanitary Code",
          "extractedAt": "2025-01-28T22:10:00Z"
        }
      },
      quizgeckoUrl: "https://quizgecko.com/learn/assignment/d64de6a8-229e-4889-8711-163498aafb8d",
      isActive: true,
      sortOrder: 0
    },
    {
      id: "c57f3c38-34c2-4a17-bbba-1ae88d2b524d",
      courseId,
      title: "LSPC 101 Administration  Subchapter A. General - Study Notes",
      type: "study-notes",
      chapter: 1,
      section: 101,
      content: {
        "extracted": {
          "title": "LSPC 101 Administration - Study Notes",
          "content": "# Louisiana State Plumbing Code Section 101 - Study Notes\n\n## Louisiana State Plumbing Code (LSPC) Adoption\n\nThe **Department of Health and Hospitals, Office of Public Health**, has adopted **Part XIV (Plumbing) of the Sanitary Code, State of Louisiana (LAC 51:XIV)**.\n\n### Key Terms and References\n- **\"Part XIV (Plumbing) of the Sanitary Code, State of Louisiana\"** is officially referred to as the **\"Louisiana State Plumbing Code.\"**\n- Any mention or citation of **\"this code,\"** **\"this Part,\"** or the **\"Louisiana State Plumbing Code\"** is interchangeable and refers to **\"Part XIV (Plumbing) of the Sanitary Code, State of Louisiana.\"**",
          "extractedAt": "2025-01-28T22:12:00Z"
        }
      },
      quizgeckoUrl: "https://quizgecko.com/learn/assignment/d64de6a8-229e-4889-8711-163498aafb8d",
      isActive: true,
      sortOrder: 0
    },
    {
      id: "1db67ac7-708c-4904-8bdc-4dfa0c5157ce",
      courseId,
      title: "LSPC 101 Administration - 10-Minute Study Plan",
      type: "study_plans",
      chapter: 1,
      section: 101,
      content: {
        "extracted": {
          "title": "LSPC 101 Administration - Time-Based Study Plans",
          "content": "# Section 101 Study Plans - Administration & Authority\n\nChoose your available study time to get a customized learning plan:\n\n## 🕐 10-Minute Quick Study\n\n### Focus: Core Administration & Authority\n\n**Minutes 0-2: Core Adoption & Naming**\n- Department of Health and Hospitals adopts Part XIV (Plumbing)\n- Also known as Louisiana State Plumbing Code (LSPC)\n- These terms are interchangeable\n\n**Minutes 3-5: Legal Authority Structure**\n- LSPC has legal authority under Louisiana law\n- Local jurisdictions can enforce plumbing standards\n- Inspectors cite Section 101 for fundamental authority\n\n**Minutes 6-8: Terminology & References**\n- \"This code\" = Louisiana State Plumbing Code\n- \"This Part\" = Part XIV of Sanitary Code\n- All terms reference the same legal document\n\n**Minutes 9-10: Practical Applications**\n- Citations and violations use interchangeable terms\n- Legal documents reference various names for same code\n- Understanding helps navigate permits and inspections\n\n## 🕐 15-Minute Comprehensive Study\n\n**Minutes 0-3: Foundation & Authority**\n- Department of Health and Hospitals adoption process\n- Legal basis under Louisiana Administrative Code 51:XIV\n- Hierarchy of enforcement authority\n\n**Minutes 4-7: Code Structure & Organization**\n- Part XIV organization within Sanitary Code\n- Relationship to other Louisiana construction codes\n- Administrative procedures and requirements\n\n**Minutes 8-11: Terminology Mastery**\n- Complete list of interchangeable references\n- Legal document navigation strategies\n- Common citation formats in practice\n\n**Minutes 12-15: Real-World Applications**\n- Permit application processes\n- Inspection procedures and authority\n- Violation resolution and appeals\n\n## 🕐 30-Minute Deep Dive Study\n\n**Minutes 0-5: Historical Context & Development**\n- Evolution of Louisiana plumbing regulations\n- Integration with state health and safety codes\n- Federal influence and local adaptations\n\n**Minutes 6-10: Legal Framework Analysis**\n- Department of Health and Hospitals authority structure\n- State vs. local jurisdiction boundaries\n- Enforcement mechanisms and penalties\n\n**Minutes 11-15: Code Interpretation & Application**\n- Reading and understanding code references\n- Cross-referencing with other code sections\n- Practical interpretation guidelines\n\n**Minutes 16-20: Administrative Procedures**\n- Permit processes and requirements\n- Inspection scheduling and protocols\n- Documentation and record-keeping\n\n**Minutes 21-25: Professional Practice Integration**\n- Daily application for working plumbers\n- Client communication about code requirements\n- Problem-solving using administrative framework\n\n**Minutes 26-30: Exam Preparation Focus**\n- Key concepts likely to appear on certification exams\n- Common question formats and answer strategies\n- Memory techniques for terminology and references",
          "extractedAt": "2025-01-28T22:17:00Z"
        }
      },
      duration: 10,
      isActive: true,
      sortOrder: 0
    },
    // 15-minute study plan
    {
      id: "2db67ac7-708c-4904-8bdc-4dfa0c5157ce",
      courseId,
      title: "LSPC 101 Administration - 15-Minute Study Plan",
      type: "study_plans",
      chapter: 1,
      section: 101,
      content: {
        "extracted": {
          "title": "LSPC 101 Administration - 15-Minute Study Plan",
          "content": "# Section 101 Study Plans - Administration & Authority\n\n## 🕐 15-Minute Comprehensive Study\n\n**Minutes 0-3: Foundation & Authority**\n- Department of Health and Hospitals adoption process\n- Legal basis under Louisiana Administrative Code 51:XIV\n- Hierarchy of enforcement authority\n\n**Minutes 4-7: Code Structure & Organization**\n- Part XIV organization within Sanitary Code\n- Relationship to other Louisiana construction codes\n- Administrative procedures and requirements\n\n**Minutes 8-11: Terminology Mastery**\n- Complete list of interchangeable references\n- Legal document navigation strategies\n- Common citation formats in practice\n\n**Minutes 12-15: Real-World Applications**\n- Permit application processes\n- Inspection procedures and authority\n- Violation resolution and appeals",
          "extractedAt": "2025-01-28T22:17:00Z"
        }
      },
      duration: 15,
      isActive: true,
      sortOrder: 1
    },
    // 30-minute study plan
    {
      id: "3db67ac7-708c-4904-8bdc-4dfa0c5157ce",
      courseId,
      title: "LSPC 101 Administration - 30-Minute Study Plan",
      type: "study_plans",
      chapter: 1,
      section: 101,
      content: {
        "extracted": {
          "title": "LSPC 101 Administration - 30-Minute Study Plan",
          "content": "# Section 101 Study Plans - Administration & Authority\n\n## 🕐 30-Minute Deep Dive Study\n\n**Minutes 0-5: Historical Context & Development**\n- Evolution of Louisiana plumbing regulations\n- Integration with state health and safety codes\n- Federal influence and local adaptations\n\n**Minutes 6-10: Legal Framework Analysis**\n- Department of Health and Hospitals authority structure\n- State vs. local jurisdiction boundaries\n- Enforcement mechanisms and penalties\n\n**Minutes 11-15: Code Interpretation & Application**\n- Reading and understanding code references\n- Cross-referencing with other code sections\n- Practical interpretation guidelines\n\n**Minutes 16-20: Administrative Procedures**\n- Permit processes and requirements\n- Inspection scheduling and protocols\n- Documentation and record-keeping\n\n**Minutes 21-25: Professional Practice Integration**\n- Daily application for working plumbers\n- Client communication about code requirements\n- Problem-solving using administrative framework\n\n**Minutes 26-30: Exam Preparation Focus**\n- Key concepts likely to appear on certification exams\n- Common question formats and answer strategies\n- Memory techniques for terminology and references",
          "extractedAt": "2025-01-28T22:17:00Z"
        }
      },
      duration: 30,
      isActive: true,
      sortOrder: 2
    },
    {
      id: "6bf16416-942a-4e08-9210-d9841331f819",
      courseId,
      title: "LSPC 101 Administration  Subchapter A. General - Teach Me (Chat)",
      type: "chat",
      chapter: 1,
      section: 101,
      content: {
        "chatContent": "This is an interactive chat session about Louisiana State Plumbing Code Section 101 Administration. Ask me anything about the administrative aspects, adoption authority, or legal framework of the LSPC."
      },
      isActive: true,
      sortOrder: 0
    },
    {
      id: "56240fe9-043f-4885-ade7-e73678295ef0",
      courseId,
      title: "LSPC 101 Administration  Subchapter A. General - Podcast",
      type: "podcast",
      chapter: 1,
      section: 101,
      content: {
        "extracted": {
          "transcript": `Welcome to Louisiana Plumber Prep - your comprehensive guide to mastering the Louisiana State Plumbing Code. I'm your instructor, and today we're diving deep into Section 101: Administration, Subchapter A - General.

This section is absolutely critical for every plumbing professional in Louisiana because it establishes the legal foundation for everything we do. Let's break this down step by step.

First, let's talk about authority. The Department of Health and Hospitals, Office of Public Health, has adopted Part XIV - that's Part Fourteen - of the Sanitary Code, State of Louisiana. This is found in Louisiana Administrative Code 51:XIV. This is your official Louisiana State Plumbing Code.

Here's something important to remember: whenever you see references to 'this code,' 'this Part,' or 'Louisiana State Plumbing Code' - they're all talking about the same thing: Part XIV of the Sanitary Code, State of Louisiana. Think of it like different names for the same person.

Why does this matter? In your daily work, you'll encounter citations, violations, and documentation that use these terms interchangeably. Knowing they're synonymous helps you navigate legal documents, permits, and inspections with confidence.

Now, let's discuss the practical impact. This code gives legal authority to local jurisdictions to enforce plumbing standards. It's not just suggestions - it's law. When an inspector cites Section 101, they're referencing the fundamental authority that governs all plumbing work in Louisiana.

For journeymen preparing for certification, understanding this administrative foundation is crucial. Questions about authority, jurisdiction, and legal references frequently appear on certification exams.

Key takeaways for today: One - The Department of Health and Hospitals has ultimate authority over plumbing codes in Louisiana. Two - Part XIV and Louisiana State Plumbing Code are the same thing. Three - All references to 'this code' or 'this Part' refer to Part XIV.

Remember, mastering the administrative foundation sets you up for success in all other code sections. In our next lesson, we'll explore specific permit requirements and inspection procedures.

Keep studying, stay safe on the job, and we'll see you in the next Louisiana Plumber Prep lesson.`,
          "title": "LSPC 101 Administration Subchapter A. General - Educational Podcast",
          "extractedAt": "2025-01-30T22:15:00Z"
        }
      },
      isActive: true,
      sortOrder: 0
    },
    {
      id: "657dee72-fdc9-42cf-a196-e535426032d3",
      courseId,
      title: "LSPC 101 Administration  Subchapter A. General - Introduction",
      type: "lesson",
      chapter: 1,
      section: 101,
      content: {
        "extracted": {
          "html": "<h2>LSPC 101 - Administration and Authority</h2><p>Welcome to Section 101 of the Louisiana State Plumbing Code. This foundational section establishes the administrative framework and legal authority for plumbing regulations throughout Louisiana.</p><h3>Key Learning Objectives</h3><ul><li>Understand the adoption of Part XIV (Plumbing) by the Department of Health and Hospitals</li><li>Learn the legal authority structure under Louisiana Revised Statutes</li><li>Master the terminology and interchangeable references used throughout the code</li></ul>"
        }
      },
      duration: 30,
      isActive: true,
      sortOrder: 0
    },
    {
      id: "b33d9c97-02a5-4362-9217-94cb39e56bde",
      courseId,
      title: "LSPC 101 Administration  Subchapter A. General - Flashcards",
      type: "flashcards",
      chapter: 1,
      section: 101,
      content: {
        "extracted": {
          "cards": [
            {
              "front": "What department adopts Part XIV (Plumbing) of the Sanitary Code?",
              "back": "Department of Health and Hospitals, Office of Public Health"
            },
            {
              "front": "What is the alternative name for Part XIV (Plumbing) of the Sanitary Code?",
              "back": "Louisiana State Plumbing Code (LSPC)"
            },
            {
              "front": "What is the primary legal authority for the sanitary code?",
              "back": "R.S. 36:258(B)"
            }
          ]
        }
      },
      isActive: true,
      sortOrder: 0
    },
    {
      id: "c8f3d2a1-4b6e-4f9a-8e7c-1d2e3f4a5b6c",
      courseId,
      title: "LSPC 101 Administration - Study Notes",
      type: "study-notes",
      chapter: 1,
      section: 101,
      content: {
        keyPoints: [
          "The Department of Health and Hospitals, Office of Public Health adopts Part XIV (Plumbing) of the Sanitary Code",
          "Part XIV is also known as the Louisiana State Plumbing Code (LSPC)",
          "Legal authority is derived from Louisiana Revised Statutes R.S. 36:258(B)",
          "All references to 'this code', 'this Part', or 'Louisiana State Plumbing Code' refer to Part XIV",
          "Administrative authority governs all plumbing work and inspections in Louisiana"
        ],
        notes: `<h3>Louisiana State Plumbing Code Administration</h3>
        <p>Section 101 establishes the fundamental administrative framework for plumbing regulation in Louisiana. This section is critical for understanding the legal foundation that governs all plumbing work throughout the state.</p>
        
        <h4>Adoption Authority</h4>
        <p>The <strong>Department of Health and Hospitals, Office of Public Health</strong> has the legal authority to adopt and enforce Part XIV (Plumbing) of the Sanitary Code. This authority is derived from Louisiana Revised Statutes R.S. 36:258(B), which grants the department regulatory power over public health matters including plumbing systems.</p>
        
        <h4>Code Terminology</h4>
        <p>Understanding the interchangeable terminology is essential for professionals:</p>
        <ul>
          <li><strong>Part XIV (Plumbing)</strong> - The official designation in Louisiana Administrative Code 51:XIV</li>
          <li><strong>Louisiana State Plumbing Code (LSPC)</strong> - The common name used by professionals</li>
          <li><strong>"This code" or "this Part"</strong> - References throughout the document that refer to Part XIV</li>
        </ul>
        
        <h4>Practical Application</h4>
        <p>This administrative foundation has practical implications for daily plumbing work:</p>
        <ul>
          <li>All permits and inspections are conducted under this authority</li>
          <li>Code violations are legally enforceable under state law</li>
          <li>Local jurisdictions derive their enforcement power from this state-level adoption</li>
          <li>Professional licensing requirements are tied to knowledge of this administrative structure</li>
        </ul>
        
        <h4>Exam Preparation Focus</h4>
        <p>For journeyman certification exams, focus on:</p>
        <ul>
          <li>Memorizing the exact name: "Department of Health and Hospitals, Office of Public Health"</li>
          <li>Understanding that Part XIV and LSPC are identical</li>
          <li>Recognizing legal authority questions related to R.S. 36:258(B)</li>
        </ul>`,
        codeReferences: [
          {
            section: "Part XIV, Louisiana Administrative Code 51:XIV",
            description: "Official Louisiana State Plumbing Code designation"
          },
          {
            section: "R.S. 36:258(B)",
            description: "Louisiana Revised Statutes granting regulatory authority"
          },
          {
            section: "Department of Health and Hospitals",
            description: "State agency with plumbing code adoption authority"
          }
        ]
      },
      isActive: true,
      sortOrder: 4
    },
    {
      id: "d9e4f5b2-7c8a-4f3e-9b1c-2a3b4c5d6e7f",
      courseId,
      title: "LSPC 103 Availability - Study Notes",
      type: "study-notes",
      chapter: 1,
      section: 103,
      content: {
        keyPoints: [
          "Section 103 ensures public access to the Louisiana State Plumbing Code",
          "Official copies can be obtained from the Office of the State Register",
          "Professionals must use current, official versions of the code",
          "Electronic access methods are available for code viewing",
          "Staying current with code changes is a professional responsibility"
        ],
        notes: `<h3>Louisiana State Plumbing Code Availability</h3>
        <p>Section 103 establishes <strong>public access requirements</strong> for the Louisiana State Plumbing Code, ensuring that professionals and citizens can obtain official copies of the regulations when needed.</p>
        
        <h4>Official Code Access</h4>
        <p>The <strong>Office of the State Register</strong> serves as the primary source for official copies of the Louisiana State Plumbing Code. This ensures that everyone has access to the authoritative version of the regulations.</p>
        
        <h4>Professional Responsibility</h4>
        <p>As a licensed plumbing professional, you have a legal and ethical obligation to:</p>
        <ul>
          <li>Work with current, official versions of the code</li>
          <li>Verify that you're using the most recent regulations</li>
          <li>Stay informed about updates and amendments</li>
          <li>Access official information when questions arise on job sites</li>
        </ul>
        
        <h4>Access Methods</h4>
        <p>The code can be accessed through multiple channels:</p>
        <ul>
          <li><strong>Electronic access</strong> - Online viewing of current code provisions</li>
          <li><strong>Direct contact</strong> - Contacting the Office of the State Register</li>
          <li><strong>Professional resources</strong> - Industry publications and official distributors</li>
        </ul>
        
        <h4>Practical Applications</h4>
        <p>Understanding Section 103 helps you:</p>
        <ul>
          <li>Provide accurate information to clients and colleagues</li>
          <li>Verify code requirements for complex installations</li>
          <li>Demonstrate professionalism through proper code knowledge</li>
          <li>Avoid compliance issues from using outdated information</li>
        </ul>
        
        <h4>Connection to Professional Practice</h4>
        <p>Inspectors expect plumbers to work with current code versions. Using outdated information can lead to:</p>
        <ul>
          <li>Failed inspections and costly rework</li>
          <li>Legal liability for non-compliance</li>
          <li>Professional reputation damage</li>
          <li>Safety issues from outdated requirements</li>
        </ul>`,
        codeReferences: [
          {
            section: "Section 103",
            description: "Public access to Louisiana State Plumbing Code"
          },
          {
            section: "Office of the State Register",
            description: "Official source for code copies and information"
          },
          {
            section: "Professional Responsibility",
            description: "Obligation to use current, official code versions"
          }
        ]
      },
      isActive: true,
      sortOrder: 4
    },
    {
      id: "e1f2a3b4-8d9c-5e6f-0a1b-3c4d5e6f7a8b",
      courseId,
      title: "LSPC 105 Effective Date and Edition - Study Notes",
      type: "study-notes",
      chapter: 1,
      section: 105,
      content: {
        keyPoints: [
          "Section 105 establishes when code requirements become legally enforceable",
          "February 20, 2013 is a key effective date for major code provisions",
          "The 2013 Edition designation marks current Louisiana Plumbing Code standards",
          "Different projects may be governed by different code editions based on permit dates",
          "Understanding effective dates prevents compliance issues and costly rework"
        ],
        notes: `<h3>Code Effective Dates and Edition Information</h3>
        <p>Section 105 provides <strong>critical timing information</strong> about when code requirements take effect and how to identify which edition applies to specific plumbing work in Louisiana.</p>
        
        <h4>Key Effective Date: February 20, 2013</h4>
        <p>This date marks when major provisions of the current Louisiana State Plumbing Code became legally enforceable. Understanding this date is crucial for:</p>
        <ul>
          <li>Determining which requirements apply to existing installations</li>
          <li>Planning project timelines around compliance deadlines</li>
          <li>Understanding transition periods for code implementation</li>
        </ul>
        
        <h4>Edition Identification</h4>
        <p>The <strong>2013 Edition</strong> designation helps professionals identify the current version of Louisiana Plumbing Code requirements:</p>
        <ul>
          <li>Provides clear reference point for current standards</li>
          <li>Ensures consistency in code interpretation and application</li>
          <li>Facilitates communication between professionals and inspectors</li>
        </ul>
        
        <h4>Project Application Rules</h4>
        <p>Understanding which code edition applies is essential:</p>
        <ul>
          <li><strong>New projects</strong> - Must meet current code standards</li>
          <li><strong>Permitted projects</strong> - May continue under previous code editions if already started</li>
          <li><strong>Renovations</strong> - Requirements depend on scope and permit dates</li>
          <li><strong>Repairs</strong> - Generally follow current code unless specifically exempted</li>
        </ul>
        
        <h4>Professional Compliance</h4>
        <p>Proper understanding of effective dates helps you:</p>
        <ul>
          <li>Determine correct code requirements for each project</li>
          <li>Communicate effectively with building officials and inspectors</li>
          <li>Plan work schedules around compliance deadlines</li>
          <li>Avoid costly rework from using incorrect standards</li>
        </ul>
        
        <h4>Exam and Certification Focus</h4>
        <p>The Louisiana Journeyman exam tests knowledge of:</p>
        <ul>
          <li>The February 20, 2013 effective date</li>
          <li>How to determine which code edition applies</li>
          <li>Transition periods and implementation timelines</li>
          <li>Professional responsibilities regarding current standards</li>
        </ul>`,
        codeReferences: [
          {
            section: "Section 105",
            description: "Effective date and edition information for Louisiana Plumbing Code"
          },
          {
            section: "February 20, 2013",
            description: "Key effective date for major code provisions"
          },
          {
            section: "2013 Edition",
            description: "Current edition designation for Louisiana State Plumbing Code"
          }
        ]
      },
      isActive: true,
      sortOrder: 4
    }
  ];

  // Insert all course content
  for (const content of courseContentData) {
    try {
      await storage.createCourseContent(content);
    } catch (error) {
      console.error(`Error seeding content ${content.title}:`, error);
    }
  }

  console.log(`Course content seeded successfully: ${courseContentData.length} items`);
}
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import multer from "multer";
import path from "path";
import fs from "fs";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

// Middleware to check if user has active subscription for professional tools
const requireActiveSubscription = async (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const user = req.user as any;
  
  try {
    // Allow admin users without Stripe verification
    if (user.email === 'admin@latrainer.com' || user.email === 'admin@laplumbprep.com' || user.id === 'admin-test-user') {
      return next();
    }

    // Check if user has professional or master tier subscription
    if (user.subscriptionTier === 'professional' || user.subscriptionTier === 'master') {
      // Verify the subscription is actually active in Stripe
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        if (subscription.status === 'active') {
          return next();
        }
      }
    }
    
    return res.status(403).json({ 
      message: "Professional tools access requires an active subscription",
      subscriptionRequired: true
    });
  } catch (error) {
    console.error('Subscription check error:', error);
    return res.status(500).json({ message: "Error checking subscription status" });
  }
};

// Middleware to check if user is enrolled in courses (student access)
const requireStudentEnrollment = async (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const user = req.user as any;
  
  try {
    // Check if user has any course enrollments
    const enrollments = await storage.getUserEnrollments(user.id);
    if (enrollments && enrollments.length > 0) {
      return next();
    }
    
    return res.status(403).json({ 
      message: "Job board access requires course enrollment",
      enrollmentRequired: true
    });
  } catch (error) {
    console.error('Enrollment check error:', error);
    return res.status(500).json({ message: "Error checking enrollment status" });
  }
};

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Endpoint to trigger course content seeding (useful for production)
  app.post("/api/seed-course-content", async (req, res) => {
    try {
      await seedCourseContent();
      res.json({ message: "Course content seeding completed successfully" });
    } catch (error: any) {
      console.error("Course content seeding error:", error);
      res.status(500).json({ message: "Error seeding course content: " + error.message });
    }
  });

  // Serve downloadable PDFs for lead magnets - MUST BE FIRST TO AVOID CONFLICTS
  app.get("/downloads/louisiana-code-guide.pdf", async (req, res) => {
    try {
      const email = req.query.email as string;
      
      if (!email) {
        return res.redirect('/lead-magnet?error=email_required');
      }

      // Check if email exists in lead magnet downloads
      const [leadRecord] = await db.select()
        .from(leadMagnetDownloads)
        .where(eq(leadMagnetDownloads.email, email.toLowerCase()))
        .limit(1);

      if (!leadRecord) {
        return res.redirect('/lead-magnet?error=email_not_found');
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="louisiana-code-guide.pdf"');
      
      const pdfContent = `
Louisiana Plumbing Code Quick Reference Guide

This comprehensive guide covers:
- Essential code violations to avoid
- Pipe sizing requirements
- Installation best practices
- 2024 Louisiana code updates
- Common inspection failures
- Professional troubleshooting tips

Complete PDF version coming soon!
Visit laplumbprep.com/courses to start your certification prep.
      `;
      
      res.send(pdfContent);
    } catch (error: any) {
      console.error("Error serving code guide:", error);
      res.status(500).send("Error downloading guide");
    }
  });

  app.get("/downloads/louisiana-career-roadmap.pdf", async (req, res) => {
    try {
      const email = req.query.email as string;
      
      if (!email) {
        return res.redirect('/student-lead-magnet?error=email_required');
      }

      // Check if email exists in student lead magnet downloads
      const [leadRecord] = await db.select()
        .from(studentLeadMagnetDownloads)
        .where(eq(studentLeadMagnetDownloads.email, email.toLowerCase()))
        .limit(1);

      if (!leadRecord) {
        return res.redirect('/student-lead-magnet?error=email_not_found');
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="louisiana-career-roadmap.pdf"');
      
      const pdfContent = `
Louisiana Plumbing Career Roadmap 2024

Your path to $75,000+ plumbing career:

APPRENTICE LEVEL:
- Starting salary: $35,000-$45,000
- Get on-the-job training
- Complete 4-year apprenticeship

JOURNEYMAN LEVEL:
- Salary: $50,000-$65,000  
- Pass state licensing exam
- Work independently
- Supervise apprentices

MASTER PLUMBER:
- Salary: $65,000-$85,000+
- Own your business
- Pull permits
- Train others

CERTIFICATION TIMELINE:
- Year 1-4: Apprenticeship
- Year 5: Journeyman exam prep
- Year 6+: Master plumber track

Complete roadmap PDF coming soon!
Start your journey at laplumbprep.com/courses
      `;
      
      res.send(pdfContent);
    } catch (error: any) {
      console.error("Error serving career roadmap:", error);
      res.status(500).send("Error downloading roadmap");
    }
  });

  // Passport configuration
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Atomically assign beta status and create user to prevent race conditions
      const user = await db.transaction(async (tx) => {
        // Count existing users within the transaction
        const [countResult] = await tx.select({ count: count() }).from(users);
        const isBetaTester = countResult.count < 100;
        
        // Create the user within the same transaction
        const [newUser] = await tx
          .insert(users)
          .values({
            ...userData,
            password: hashedPassword,
            isBetaTester,
            betaStartedAt: isBetaTester ? new Date() : null,
            referralCode: Math.random().toString(36).substring(2, 10).toUpperCase()
          })
          .returning();
        
        return newUser;
      });

      // Store referral code for later use when they subscribe
      if (userData.referredBy) {
        try {
          const referrer = await storage.getUserByUsername(userData.referredBy);
          if (referrer) {
            // Store the referrer ID for when they actually subscribe
            await storage.updateUser(user.id, { referredBy: referrer.id });
          }
        } catch (error) {
          console.error('Referral tracking failed:', error);
        }
      }

      res.json({ message: "User created successfully", userId: user.id });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", passport.authenticate('local'), (req, res) => {
    res.json({ message: "Login successful", user: req.user });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logout successful" });
    });
  });

  // Emergency admin reset endpoint
  app.post("/api/admin/reset", async (req, res) => {
    try {
      const { secretCode } = req.body;
      if (secretCode !== "EMERGENCY_RESET_2025") {
        return res.status(403).json({ message: "Invalid secret code" });
      }

      const hashedPassword = await bcrypt.hash("admin123", 10);
      
      // Try to update existing admin user
      const existingUser = await storage.getUserByEmail("admin@latrainer.com");
      
      if (existingUser) {
        await storage.updateUser(existingUser.id, { password: hashedPassword });
        res.json({ message: "Admin password reset successfully" });
      } else {
        // Create new admin user
        const adminUser = await storage.createUser({
          email: "admin@latrainer.com",
          username: "admin",
          password: hashedPassword,
          firstName: "Admin",
          lastName: "User",
          subscriptionTier: "master",
          isActive: true
        });
        res.json({ message: "Admin user created successfully", user: adminUser.email });
      }
    } catch (error: any) {
      console.error("Admin reset error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Public payment intent creation for checkout flow
  app.post('/api/create-payment-intent', async (req, res) => {
    const { planId, isAnnual, tier, collectCustomerInfo } = req.body;

    try {
      // Get current user to check beta status (if authenticated)
      let isBetaTester = false;
      if (req.isAuthenticated() && req.user) {
        isBetaTester = (req.user as any).isBetaTester || false;
      }

      // Server-side priceId computation (never trust client priceId)
      const getPriceId = (planId: string, isAnnual: boolean, isBeta: boolean) => {
        const priceMapping = {
          basic: {
            monthly: {
              regular: "price_1S4EusByFL1L8uV24yWoGtnf",
              beta: "price_1S4E4SByFL1L8uV2fwNtzcdE"
            },
            annual: {
              regular: "price_1S4EqJByFL1L8uV2KtL96A1l",
              beta: "price_1S4Ek6ByFL1L8uV2AYQdiGj4"
            }
          },
          professional: {
            monthly: {
              regular: "price_1S4F7cByFL1L8uV2U5V4tOje",
              beta: "price_1S4E9wByFL1L8uV2wOO4VM4D"
            },
            annual: {
              regular: "price_1S4F4wByFL1L8uV2xK3ArjCj",
              beta: "price_1S4EZSByFL1L8uV2cRdBL3bp"
            }
          },
          master: {
            monthly: {
              regular: "price_1S4F1jByFL1L8uV2YfeGdK7U",
              beta: "price_1S4ESMByFL1L8uV2SPXM5fs4"
            },
            annual: {
              regular: "price_1S4EyGByFL1L8uV2c2IPcRGY",
              beta: "price_1S4EflByFL1L8uV2hXo6sAmI"
            }
          }
        };

        const cycle = isAnnual ? 'annual' : 'monthly';
        const type = isBeta ? 'beta' : 'regular';
        return priceMapping[planId as keyof typeof priceMapping][cycle][type];
      };

      const securepriceId = getPriceId(planId, isAnnual, isBetaTester);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1, // Temporary amount - will be updated by subscription
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          priceId: securepriceId,
          tier,
          collectCustomerInfo: collectCustomerInfo || 'false'
        }
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Process successful payment and create account
  app.post('/api/process-payment-success', async (req, res) => {
    const { paymentIntentId, plan, email } = req.body;

    try {
      // Verify payment was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['payment_method']
      });
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment not successful" });
      }

      // Extract customer info from payment method
      const paymentMethod = paymentIntent.payment_method as any;
      const billingDetails = paymentMethod?.billing_details;
      if (!billingDetails) {
        return res.status(400).json({ message: "Customer information not found" });
      }

      // Generate username and password
      const username = `${billingDetails.name?.toLowerCase().replace(/\s+/g, '')}${Math.floor(Math.random() * 1000)}`;
      const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();

      // Create user account
      const newUser = await storage.createUser({
        firstName: billingDetails.name?.split(' ')[0] || 'User',
        lastName: billingDetails.name?.split(' ').slice(1).join(' ') || 'Account',
        email: billingDetails.email || email,
        username,
        password: tempPassword, // This will be hashed by the storage layer
        phone: billingDetails.phone || '',
        subscriptionTier: plan
      });

      // Create Stripe customer and subscription
      const customer = await stripe.customers.create({
        email: billingDetails.email || email,
        name: billingDetails.name,
        payment_method: typeof paymentIntent.payment_method === 'string' ? paymentIntent.payment_method : paymentIntent.payment_method?.id,
      });

      // Get price ID from metadata
      const priceId = paymentIntent.metadata.priceId;
      
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        default_payment_method: typeof paymentIntent.payment_method === 'string' ? paymentIntent.payment_method : paymentIntent.payment_method?.id,
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with Stripe info
      await storage.updateUserStripeInfo(newUser.id, customer.id, subscription.id);

      // Send emails (receipt + credentials)
      try {
        // Send receipt email
        await emailService.sendWelcomeEmail({
          toEmail: newUser.email,
          firstName: newUser.firstName || 'User',
          loginLink: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/login`
        });
        
        console.log(`Welcome email sent to ${newUser.email}`);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
      }

      res.json({
        credentials: {
          username,
          password: tempPassword
        },
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName
        }
      });
    } catch (error: any) {
      console.error('Error processing payment success:', error);
      res.status(500).json({ message: "Error processing payment: " + error.message });
    }
  });

  // Stripe subscription routes
  app.post('/api/create-subscription', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    let user = req.user as any;
    const { priceId, tier } = req.body;


    if (user.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      if (subscription.status === 'active') {
        return res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
      }
    }

    try {
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        });
        customerId = customer.id;
        user = await storage.updateUser(user.id, { stripeCustomerId: customerId });
      }

      // Create a 50% discount coupon for first month
      const coupon = await stripe.coupons.create({
        percent_off: 50,
        duration: 'once',
        name: 'First Month 50% Off',
        id: `first-month-50-${Date.now()}` // Unique ID to avoid conflicts
      });

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        discounts: [{ coupon: coupon.id }], // Apply 50% off first month
      });

      await storage.updateUserStripeInfo(user.id, customerId, subscription.id);
      await storage.updateUser(user.id, { subscriptionTier: tier });

      // Process referral commission now that they've subscribed
      if (user.referredBy) {
        try {
          // Calculate commission based on subscription price (10% of first month)
          const planPrices = {
            // Regular monthly prices
            'price_1S4EusByFL1L8uV24yWoGtnf': 49.99, // Basic Monthly
            'price_1S4F7cByFL1L8uV2U5V4tOje': 79.99, // Professional Monthly
            'price_1S4F1jByFL1L8uV2YfeGdK7U': 99.99, // Master Monthly
            // Beta monthly prices
            'price_1S4E4SByFL1L8uV2fwNtzcdE': 37.49, // Beta Basic Monthly
            'price_1S4E9wByFL1L8uV2wOO4VM4D': 59.99, // Beta Professional Monthly
            'price_1S4ESMByFL1L8uV2SPXM5fs4': 74.99, // Beta Master Monthly
            // Regular annual prices
            'price_1S4EqJByFL1L8uV2KtL96A1l': 599.88, // Basic Annual
            'price_1S4F4wByFL1L8uV2xK3ArjCj': 959.88, // Professional Annual
            'price_1S4EyGByFL1L8uV2c2IPcRGY': 1199.88, // Master Annual
            // Beta annual prices
            'price_1S4Ek6ByFL1L8uV2AYQdiGj4': 437.41, // Beta Basic Annual
            'price_1S4EZSByFL1L8uV2cRdBL3bp': 699.91, // Beta Professional Annual
            'price_1S4EflByFL1L8uV2hXo6sAmI': 874.91  // Beta Master Annual
          };
          const subscriptionPrice = planPrices[priceId as keyof typeof planPrices] || 39.99;
          const commissionAmount = subscriptionPrice * 0.10; // 10% commission
          
          await storage.createReferral({
            referrerId: user.referredBy,
            referredId: user.id,
            referrerPlanTier: 'basic',
            referredPlanTier: tier,
            referredPlanPrice: subscriptionPrice.toString(),
            eligibleTier: tier,
            commissionRate: '0.10',
            commissionAmount: commissionAmount.toString()
          });
        } catch (error) {
          console.error('Referral commission creation failed:', error);
        }
      }

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      res.status(400).json({ error: { message: error.message } });
    }
  });

  // Get subscription status
  app.get('/api/subscription-status', async (req, res) => {
    // Temporary admin bypass for testing
    if (!req.isAuthenticated()) {
      // For admin testing, create a mock user and return active status
      return res.json({ 
        hasActiveSubscription: true, 
        subscriptionTier: 'master',
        subscriptionStatus: 'active',
        currentPeriodEnd: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days from now
      });
    }

    const user = req.user as any;
    
    try {
      // Allow admin users to always show as active
      if (user.email === 'admin@latrainer.com' || user.email === 'admin@laplumbprep.com' || user.id === 'admin-test-user') {
        return res.json({ 
          hasActiveSubscription: true, 
          subscriptionTier: user.subscriptionTier || 'master',
          subscriptionStatus: 'active',
          currentPeriodEnd: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days from now
        });
      }

      if (!user.stripeSubscriptionId) {
        return res.json({ 
          hasActiveSubscription: false, 
          subscriptionTier: user.subscriptionTier || 'basic'
        });
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      const hasActiveSubscription = subscription.status === 'active';

      res.json({
        hasActiveSubscription,
        subscriptionTier: user.subscriptionTier || 'basic',
        subscriptionStatus: subscription.status,
        currentPeriodEnd: (subscription as any).current_period_end,
      });
    } catch (error: any) {
      console.error('Subscription status error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Cancel subscription
  app.post('/api/cancel-subscription', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    
    try {
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      res.json({ message: "Subscription will be cancelled at the end of the current period" });
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Upgrade subscription
  app.post('/api/upgrade-subscription', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    const { newTier } = req.body;
    
    if (!['basic', 'professional', 'master'].includes(newTier)) {
      return res.status(400).json({ message: "Invalid subscription tier" });
    }

    try {
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      // Get the current subscription
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      const currentPriceId = subscription.items.data[0].price.id;
      
      // Map tiers to price IDs (you'll need to set these in environment variables)
      const priceIds = {
        basic: process.env.STRIPE_BASIC_PRICE_ID,
        professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
        master: process.env.STRIPE_MASTER_PRICE_ID
      };

      const newPriceId = priceIds[newTier as keyof typeof priceIds];
      if (!newPriceId) {
        return res.status(400).json({ message: "Price ID not configured for tier" });
      }

      // Update the subscription
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
      });

      // Get old tier from current user
      const oldTier = user.subscriptionTier;

      // Update user's tier in database
      await storage.updateUser(user.id, { subscriptionTier: newTier });

      // Process referral commissions for the upgrade
      await storage.processSubscriptionUpgrade(user.id, newTier, oldTier);

      res.json({ 
        message: `Subscription upgraded to ${newTier}`,
        newTier,
        oldTier
      });
    } catch (error: any) {
      console.error('Upgrade subscription error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Beta feedback system routes
  app.get('/api/beta-feedback/:token', async (req, res) => {
    const { token } = req.params;
    
    try {
      const { BetaFeedbackService } = await import('./betaFeedbackSystem');
      const feedbackData = await BetaFeedbackService.getFeedbackByToken(token);
      res.json(feedbackData);
    } catch (error: any) {
      console.error('Error getting feedback:', error);
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/beta-feedback/:token/submit', async (req, res) => {
    const { token } = req.params;
    const { responses } = req.body;
    
    try {
      const { BetaFeedbackService } = await import('./betaFeedbackSystem');
      await BetaFeedbackService.submitFeedback(token, responses);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Admin route to get feedback analytics
  app.get('/api/admin/beta-feedback/analytics', async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any)?.role !== 'admin') {
      return res.status(401).json({ message: "Admin access required" });
    }

    const { monthYear } = req.query;
    
    try {
      const { BetaFeedbackService } = await import('./betaFeedbackSystem');
      const analytics = await BetaFeedbackService.getFeedbackAnalytics(monthYear as string);
      res.json(analytics);
    } catch (error: any) {
      console.error('Error getting feedback analytics:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin route to manually trigger monthly feedback
  app.post('/api/admin/beta-feedback/send-monthly', async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any)?.role !== 'admin') {
      return res.status(401).json({ message: "Admin access required" });
    }
    
    try {
      const { BetaFeedbackService } = await import('./betaFeedbackSystem');
      const result = await BetaFeedbackService.sendMonthlyFeedbackEmails();
      res.json(result);
    } catch (error: any) {
      console.error('Error sending monthly feedback:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin route to manually run feedback monitoring
  app.post('/api/admin/beta-feedback/run-monitoring', async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any)?.role !== 'admin') {
      return res.status(401).json({ message: "Admin access required" });
    }
    
    try {
      const { BetaFeedbackService } = await import('./betaFeedbackSystem');
      const analysis = await BetaFeedbackService.runAutomatedMonitoring();
      res.json(analysis || { message: "Monitoring completed" });
    } catch (error: any) {
      console.error('Error running feedback monitoring:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin route to update course durations and lessons
  app.post('/api/admin/update-course-data', async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any)?.role !== 'admin') {
      return res.status(401).json({ message: "Admin access required" });
    }
    
    try {
      const courseUpdates = [
        { id: "5f02238b-afb2-4e7f-a488-96fb471fee56", duration: "2 months", lessons: 24, practiceQuestions: 150 },
        { id: "b1f02238b-afb2-4e7f-a488-96fb471fee57", duration: "1 month", lessons: 16, practiceQuestions: 75 },
        { id: "c2f02238b-afb2-4e7f-a488-96fb471fee58", duration: "1.5 months", lessons: 20, practiceQuestions: 100 },
        { id: "d3f02238b-afb2-4e7f-a488-96fb471fee59", duration: "2 months", lessons: 28, practiceQuestions: 125 },
        { id: "e4f02238b-afb2-4e7f-a488-96fb471fee60", duration: "3 months", lessons: 36, practiceQuestions: 200 }
      ];

      for (const update of courseUpdates) {
        await db.update(courses)
          .set({
            duration: update.duration,
            lessons: update.lessons,
            practiceQuestions: update.practiceQuestions,
            updatedAt: new Date()
          })
          .where(eq(courses.id, update.id));
      }

      res.json({ message: "Course data updated successfully", updated: courseUpdates.length });
    } catch (error: any) {
      console.error('Error updating course data:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe webhook for handling subscription events
  app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'customer.subscription.updated':
          const subscription = event.data.object as any;
          const customerId = subscription.customer;
          
          // Find user by Stripe customer ID
          const usersResult = await db.select()
            .from(users)
            .where(eq(users.stripeCustomerId, customerId));
            
          if (usersResult.length > 0) {
            const user = usersResult[0];
            const oldTier = user.subscriptionTier;
            
            // Determine new tier from price ID
            const priceId = subscription.items.data[0].price.id;
            let newTier = 'basic';
            
            if (priceId === process.env.STRIPE_PROFESSIONAL_PRICE_ID) {
              newTier = 'professional';
            } else if (priceId === process.env.STRIPE_MASTER_PRICE_ID) {
              newTier = 'master';
            }
            
            // Only process if tier actually changed
            if (oldTier !== newTier) {
              await storage.updateUser(user.id, { subscriptionTier: newTier as any });
              await storage.processSubscriptionUpgrade(user.id, newTier, oldTier || 'basic');
            }
          }
          break;
          
        case 'invoice.payment_succeeded':
          // Handle monthly recurring payments - could trigger monthly commission calculations
          const invoice = event.data.object as any;
          if (invoice.subscription) {
            // This is a recurring payment, could trigger monthly commission payouts
            console.log('Monthly payment processed for subscription:', invoice.subscription);
          }
          break;
          
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Pay-per-use AI tools endpoints
  app.post('/api/pay-per-use/photo-analysis', async (req, res) => {
    try {
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ message: "Image data required" });
      }

      // Create a one-time payment intent for photo analysis using your Stripe price ID
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 299, // $2.99 in cents
        currency: 'usd',
        metadata: {
          service: 'photo-analysis',
          type: 'pay-per-use',
          priceId: 'price_1S4DRpByFL1L8uV2xlSpm1Zq' // Photo Analysis - $2.99
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: 2.99,
        service: 'photo-analysis'
      });
    } catch (error: any) {
      console.error('Pay-per-use photo analysis error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/pay-per-use/plan-analysis', async (req, res) => {
    try {
      const { planData, fileSizeBytes } = req.body;
      
      if (!planData) {
        return res.status(400).json({ message: "Plan data required" });
      }

      if (!fileSizeBytes) {
        return res.status(400).json({ message: "File size required for pricing" });
      }

      const fileSizeMB = fileSizeBytes / (1024 * 1024);
      
      let price: number;
      let tier: string;
      let priceId: string;
      
      if (fileSizeMB <= 2) {
        price = 4.99;
        tier = "Small";
        priceId = "price_1S4DodByFL1L8uV2GezncbVz"; // Plan Analysis Tool Small Files
      } else if (fileSizeMB <= 10) {
        price = 9.99;
        tier = "Medium";
        priceId = "price_1S4DscByFL1L8uV2y9RBvVFw"; // Plan Analysis Tool Medium Files
      } else if (fileSizeMB <= 25) {
        price = 19.99;
        tier = "Large";
        priceId = "price_1S4DwJByFL1L8uV2nazKwF5f"; // Plan Analysis Tool Large Files
      } else {
        price = 39.99;
        tier = "Enterprise";
        priceId = "price_1S4DzrByFL1L8uV2Fk4fbabq"; // Plan Analysis Tool Enterprise Files
      }

      // Create a one-time payment intent using your Stripe price IDs
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(price * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          service: 'plan-analysis',
          type: 'pay-per-use',
          tier: tier,
          fileSizeMB: fileSizeMB.toFixed(2),
          priceId: priceId
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: price,
        tier: tier,
        fileSizeMB: parseFloat(fileSizeMB.toFixed(2)),
        service: 'plan-analysis'
      });
    } catch (error: any) {
      console.error('Pay-per-use plan analysis error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/pay-per-use/mentor-question', async (req, res) => {
    try {
      const { question } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: "Question required" });
      }

      // Create a one-time payment intent for mentor question using your Stripe price ID
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 99, // $0.99 in cents
        currency: 'usd',
        metadata: {
          service: 'mentor-question',
          type: 'pay-per-use',
          priceId: 'price_1S4DVoByFL1L8uV2sC7p8FLk' // AI Mentor - $0.99
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: 0.99,
        service: 'mentor-question'
      });
    } catch (error: any) {
      console.error('Pay-per-use mentor question error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Process pay-per-use service after payment confirmation
  app.post('/api/pay-per-use/process', async (req, res) => {
    try {
      const { paymentIntentId, service, data } = req.body;
      
      if (!paymentIntentId || !service || !data) {
        return res.status(400).json({ message: "Payment intent ID, service type, and data required" });
      }

      // Verify payment was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment not completed" });
      }

      let result;
      
      switch (service) {
        case 'photo-analysis':
          result = await analyzePhoto(data.imageData);
          break;
        case 'plan-analysis':
          result = await analyzePlans(data.planData);
          break;
        case 'mentor-question':
          result = await getMentorResponse(data.question);
          break;
        default:
          return res.status(400).json({ message: "Unknown service type" });
      }

      res.json({
        service,
        result,
        paymentIntentId
      });
    } catch (error: any) {
      console.error('Process pay-per-use service error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Seed courses endpoint (temporary for production setup)
  app.post("/api/seed-courses", async (req, res) => {
    try {
      const courseData = [
        {
          title: "Louisiana Journeyman Prep",
          description: "Comprehensive Louisiana plumbing code certification preparation course covering all aspects of state plumbing regulations and best practices.",
          type: "journeyman" as const,
          price: "39.99",
          duration: "5 months",
          lessons: 3,
          practiceQuestions: 3,
          isActive: true
        },
        {
          title: "Louisiana Backflow Prevention Training",
          description: "Comprehensive training course covering backflow prevention testing, repairs, and field report completion. Learn proper testing procedures, equipment maintenance, and regulatory compliance for backflow prevention assemblies.",
          type: "backflow" as const,
          price: "29.99",
          duration: "8 weeks",
          lessons: 12,
          practiceQuestions: 5,
          isActive: false
        },
        {
          title: "Natural Gas Certification Prep",
          description: "Complete preparation for Louisiana natural gas certification covering safety protocols, installation procedures, and state regulations for natural gas systems.",
          type: "natural_gas" as const,
          price: "34.99",
          duration: "6 months",
          lessons: 10,
          practiceQuestions: 4,
          isActive: false
        },
        {
          title: "Medical Gas Installer Certification",
          description: "Specialized certification preparation for medical gas systems including oxygen, nitrous oxide, and vacuum systems in healthcare facilities.",
          type: "medical_gas" as const,
          price: "44.99",
          duration: "10 months",
          lessons: 15,
          practiceQuestions: 6,
          isActive: false
        },
        {
          title: "Louisiana Master Plumber Prep",
          description: "Advanced certification preparation for Louisiana master plumber license covering business practices, advanced code knowledge, and supervisory responsibilities.",
          type: "master" as const,
          price: "59.99",
          duration: "20 months",
          lessons: 25,
          practiceQuestions: 12,
          isActive: false
        }
      ];

      let addedCount = 0;
      for (const course of courseData) {
        try {
          // Check if course with same title already exists
          const courses = await storage.getCourses();
          const existing = courses.find(c => c.title === course.title);
          if (!existing) {
            await storage.createCourse(course);
            addedCount++;
          }
        } catch (error) {
          // Course doesn't exist, create it
          await storage.createCourse(course);
          addedCount++;
        }
      }

      res.json({ message: "Courses seeded successfully", addedCount, totalCourses: courseData.length });
    } catch (error: any) {
      console.error("Seed courses error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Manual seed endpoint for course content
  app.post("/api/seed/course-content", async (req, res) => {
    try {
      await seedCourseContent();
      res.json({ message: "Course content seeded successfully" });
    } catch (error: any) {
      console.error("Error seeding course content:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Course routes - with caching for performance
  let coursesCache: any[] | null = null;
  let cacheTime: number = 0;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // PUBLIC ENDPOINT - No authentication required for viewing courses
  app.get("/api/courses", async (req, res) => {
    // Set CORS headers to ensure cross-origin access works
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    // This endpoint should always work regardless of authentication state
    console.log("Courses API called - this is a public endpoint");
    
    try {
      // Check cache first
      const now = Date.now();
      if (coursesCache && (now - cacheTime) < CACHE_DURATION) {
        return res.json(coursesCache);
      }

      const courses = await storage.getCourses();
      
      // If database is empty, automatically seed it
      if (courses.length === 0) {
        console.log("Database empty, auto-seeding courses...");
        const courseData = [
          {
            title: "Louisiana Journeyman Prep",
            description: "Comprehensive Louisiana plumbing code certification preparation course covering all aspects of state plumbing regulations and best practices.",
            type: "journeyman" as const,
            price: "39.99",
            duration: "5 months",
            lessons: 3,
            practiceQuestions: 3,
            isActive: true
          },
          {
            title: "Louisiana Backflow Prevention Training",
            description: "Comprehensive training course covering backflow prevention testing, repairs, and field report completion. Learn proper testing procedures, equipment maintenance, and regulatory compliance for backflow prevention assemblies.",
            type: "backflow" as const,
            price: "29.99",
            duration: "8 weeks",
            lessons: 12,
            practiceQuestions: 5,
            isActive: false
          },
          {
            title: "Natural Gas Certification Prep",
            description: "Complete preparation for Louisiana natural gas certification covering safety protocols, installation procedures, and state regulations for natural gas systems.",
            type: "natural_gas" as const,
            price: "34.99",
            duration: "6 months",
            lessons: 10,
            practiceQuestions: 4,
            isActive: false
          },
          {
            title: "Medical Gas Installer Certification",
            description: "Specialized certification preparation for medical gas systems including oxygen, nitrous oxide, and vacuum systems in healthcare facilities.",
            type: "medical_gas" as const,
            price: "44.99",
            duration: "10 months",
            lessons: 15,
            practiceQuestions: 6,
            isActive: false
          },
          {
            title: "Louisiana Master Plumber Prep",
            description: "Advanced certification preparation for Louisiana master plumber license covering business practices, advanced code knowledge, and supervisory responsibilities.",
            type: "master" as const,
            price: "59.99",
            duration: "20 months",
            lessons: 25,
            practiceQuestions: 12,
            isActive: false
          }
        ];

        for (const course of courseData) {
          try {
            await storage.createCourse(course);
          } catch (error) {
            // Course might already exist, continue
          }
        }

        // Auto-seed course content for Louisiana Journeyman Prep
        await seedCourseContent();

        // Return the seeded courses
        const seededCourses = await storage.getCourses();
        return res.json(seededCourses);
      }
      
      // Transform courses data with updated lesson counts and duration format
      const transformedCourses = courses.map(course => {
        let duration, lessons;
        
        switch(course.id) {
          case "5f02238b-afb2-4e7f-a488-96fb471fee56": // Louisiana Journeyman Prep
            duration = "4-5 years";
            lessons = 120; // Estimated ~7 lessons per chapter across 17 chapters
            break;
          case "b1f02238b-afb2-4e7f-a488-96fb471fee57": // Backflow Prevention Training
            duration = "6-8 weeks";
            lessons = 16;
            break;
          case "c2f02238b-afb2-4e7f-a488-96fb471fee58": // Natural Gas Certification
            duration = "3-4 months";
            lessons = 24;
            break;
          case "d3f02238b-afb2-4e7f-a488-96fb471fee59": // Medical Gas Installer Certification
            duration = "4-6 months";
            lessons = 32;
            break;
          case "e4f02238b-afb2-4e7f-a488-96fb471fee60": // Master Plumber Prep
            duration = "6-12 months";
            lessons = 48;
            break;
          default:
            // Keep original values as fallback
            duration = course.duration;
            lessons = course.lessons;
        }
        
        return {
          ...course,
          duration,
          lessons
        };
      });
      
      // Update cache
      coursesCache = transformedCourses;
      cacheTime = now;
      
      res.json(transformedCourses);
    } catch (error: any) {
      // Fallback course data when database is unavailable
      console.log("Database unavailable, serving fallback course data");
      const fallbackCourses = [
        {
          id: "louisiana-journeyman-prep",
          title: "Louisiana Journeyman Prep",
          description: "Comprehensive preparation for the Louisiana Journeyman Plumber License exam. Covers all aspects of the Louisiana Plumbing Code, practical applications, and exam strategies.",
          type: "journeyman",
          price: 0, // Free with subscription
          duration: "12 weeks",
          lessons: 45,
          isActive: true,
          level: "intermediate",
          thumbnail: "/api/placeholder/300/200"
        },
        {
          id: "backflow-prevention-training",
          title: "Backflow Prevention Training",
          description: "Learn to test, repair, and complete field reports for backflow prevention devices. Essential training for plumbers working with water supply systems.",
          type: "backflow",
          price: 0,
          duration: "6 weeks", 
          lessons: 24,
          isActive: false, // Coming soon
          level: "intermediate",
          thumbnail: "/api/placeholder/300/200"
        },
        {
          id: "natural-gas-certification",
          title: "Natural Gas Certification",
          description: "Complete certification course for natural gas installation and repair. Covers safety protocols, code requirements, and hands-on techniques.",
          type: "natural_gas",
          price: 0,
          duration: "8 weeks",
          lessons: 32,
          isActive: false, // Coming soon
          level: "intermediate", 
          thumbnail: "/api/placeholder/300/200"
        },
        {
          id: "medical-gas-installer",
          title: "Medical Gas Installer Certification",
          description: "Specialized training for medical gas systems in healthcare facilities. Learn installation, testing, and maintenance of critical medical gas systems.",
          type: "medical_gas",
          price: 0,
          duration: "10 weeks",
          lessons: 38,
          isActive: false, // Coming soon
          level: "advanced",
          thumbnail: "/api/placeholder/300/200"
        },
        {
          id: "master-plumber-prep",
          title: "Master Plumber Prep",
          description: "Advanced preparation for the Master Plumber License exam. Covers business management, advanced plumbing systems, and code interpretation.",
          type: "master",
          price: 0,
          duration: "16 weeks", 
          lessons: 58,
          isActive: false, // Coming soon
          level: "advanced",
          thumbnail: "/api/placeholder/300/200"
        }
      ];
      
      res.json(fallbackCourses);
    }
  });

  app.get("/api/courses/:courseId", async (req, res) => {
    try {
      const { courseId } = req.params;
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/courses/:courseId/enroll", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { courseId } = req.params;
      const userId = (req.user as any).id;
      
      const enrollment = await storage.enrollUser(userId, courseId);
      res.json(enrollment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/enrollments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const enrollments = await storage.getUserEnrollments(userId);
      res.json(enrollments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Section progress routes
  app.get("/api/section-progress/:courseId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { courseId } = req.params;
      const userId = (req.user as any).id;
      const user = req.user as any;
      
      // Admin allowlist - only your specific email gets admin access
      const ALLOWED_ADMIN_EMAILS = ['admin@latrainer.com'];
      const isSuperAdmin = ALLOWED_ADMIN_EMAILS.includes(user.email?.toLowerCase());
      
      // Get all course content to determine sections
      const content = await storage.getCourseContent(courseId);
      const sectionNumbers = content.map(c => c.section).filter((s): s is number => s !== null);
      const sections = Array.from(new Set(sectionNumbers)).sort((a, b) => a - b);
      
      const sectionStatus = [];
      
      for (const section of sections) {
        const sectionNum = Number(section);
        // Students must complete quizzes with 70%+ to unlock sections (except section 101)
        // Only super admins bypass this requirement
        const isUnlocked = isSuperAdmin || await storage.isSectionUnlocked(userId, courseId, 1, sectionNum);
        
        sectionStatus.push({
          section: sectionNum,
          isUnlocked,
          isAdmin: isSuperAdmin
        });
      }
      
      res.json(sectionStatus);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Lesson step progress tracking
  app.post("/api/lesson-progress/track", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { courseId, section, stepType, stepIndex, isCompleted, currentPosition } = req.body;
      const userId = (req.user as any).id;

      const progressData = {
        userId,
        courseId,
        section,
        stepType,
        stepIndex,
        isCompleted: isCompleted || false,
        currentPosition: currentPosition || null,
        timeSpent: req.body.timeSpent || 0,
        lastAccessedAt: new Date(),
        completedAt: isCompleted ? new Date() : null,
        updatedAt: new Date()
      };

      const progress = await storage.updateLessonStepProgress(progressData);
      res.json(progress);
    } catch (error: any) {
      console.error("Error tracking lesson progress:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/lesson-progress/:courseId/:section/:stepType", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { courseId, section, stepType } = req.params;
      const userId = (req.user as any).id;

      const progress = await storage.getLessonStepProgress(userId, courseId, parseInt(section), stepType);
      if (progress) {
        res.json(progress);
      } else {
        res.json({ message: "No progress found" });
      }
    } catch (error: any) {
      console.error("Error fetching lesson progress:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/lesson-progress/:courseId/:section/current", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { courseId, section } = req.params;
      const userId = (req.user as any).id;

      const currentStep = await storage.getCurrentLessonStep(userId, courseId, parseInt(section));
      res.json(currentStep);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Job routes
  app.get("/api/jobs", requireStudentEnrollment, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      
      const result = await storage.getJobs(page, limit, search);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/jobs", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const jobData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(jobData);
      res.json(job);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Employer job posting routes
  app.post("/api/employers/register", async (req, res) => {
    try {
      const employerData = req.body;
      
      // Check if employer already exists
      const existingEmployer = await storage.getEmployerByEmail(employerData.contactEmail);
      if (existingEmployer) {
        return res.status(400).json({ message: "Employer with this email already exists" });
      }
      
      const employer = await storage.createEmployer(employerData);
      
      // Start automated email sequence for new employer
      await emailAutomation.queueEmailSequence(
        employer.contactEmail,
        employer.contactName,
        "employer_onboarding"
      );
      
      res.status(201).json({ 
        message: "Employer registration successful", 
        employerId: employer.id 
      });
    } catch (error: any) {
      console.error("Error registering employer:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create payment intent for job postings with bulk discount pricing
  app.post("/api/employers/payment-intent", async (req, res) => {
    try {
      const { quantity, planType } = req.body;
      
      if (!quantity || !planType) {
        return res.status(400).json({ message: "Quantity and plan type are required" });
      }
      
      // Base pricing
      const basePrice = planType === 'premium' ? 89 : 49;
      
      // Calculate bulk discount
      let discount = 0;
      if (quantity >= 10) discount = 0.25; // 25% off for 10+
      else if (quantity >= 5) discount = 0.15; // 15% off for 5+
      else if (quantity >= 3) discount = 0.10; // 10% off for 3+
      
      const unitPrice = basePrice * (1 - discount);
      const totalAmount = unitPrice * quantity;
      const totalSavings = (basePrice * quantity) - totalAmount;
      
      // Create payment intent with calculated amount
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          service: 'job-postings',
          planType,
          quantity: quantity.toString(),
          unitPrice: unitPrice.toFixed(2),
          originalPrice: basePrice.toString(),
          discount: (discount * 100).toFixed(0) + '%',
          totalSavings: totalSavings.toFixed(2)
        }
      });
      
      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: totalAmount,
        unitPrice,
        totalSavings,
        discount: discount * 100,
        metadata: {
          planType,
          quantity,
          unitPrice: unitPrice.toFixed(2),
          originalPrice: basePrice,
          discountPercent: discount * 100
        }
      });
    } catch (error: any) {
      console.error("Error creating payment intent for job postings:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/employers/:employerId/jobs", async (req, res) => {
    try {
      const { employerId } = req.params;
      const jobData = req.body;
      
      // Verify employer exists
      const employer = await storage.getEmployer(employerId);
      if (!employer) {
        return res.status(404).json({ message: "Employer not found" });
      }
      
      // Process requirements and benefits
      const requirements = Array.isArray(jobData.requirements) 
        ? jobData.requirements 
        : (jobData.requirements ? [jobData.requirements] : []);
      const benefits = Array.isArray(jobData.benefits) 
        ? jobData.benefits 
        : (jobData.benefits ? [jobData.benefits] : []);

      // AI review for auto-approval
      const aiReview = await reviewJobPosting(
        jobData.title,
        jobData.description,
        requirements,
        employer.companyName
      );

      // Auto-approve if AI determines it's a legitimate plumbing job
      const status = aiReview.isApproved ? 'approved' : 'pending';

      // Create job with AI-determined status
      const job = await storage.createJob({
        ...jobData,
        employerId,
        company: employer.companyName,
        contactEmail: employer.contactEmail,
        requirements,
        benefits,
        status,
        // Add AI review info as metadata if needed
        rejectionReason: aiReview.isApproved ? null : `AI Review: ${aiReview.reasoning}`
      });
      
      res.status(201).json({ 
        message: aiReview.isApproved 
          ? "Job posting approved and published!" 
          : "Job posting submitted for manual review", 
        jobId: job.id,
        status: status,
        aiReview: {
          isPlumbingRelated: aiReview.isPlumbingRelated,
          qualityScore: aiReview.qualityScore,
          concerns: aiReview.concerns,
          recommendations: aiReview.recommendations
        }
      });
    } catch (error: any) {
      console.error("Error creating job:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin job approval routes (temporarily remove auth until implemented)
  app.get("/api/admin/jobs/pending", async (req, res) => {
    try {
      // Check if user is admin (you might want to add an admin role check)
      const jobs = await storage.getPendingJobs();
      res.json(jobs);
    } catch (error: any) {
      console.error("Error fetching pending jobs:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/jobs/:jobId/approve", async (req, res) => {
    try {
      const { jobId } = req.params;
      // TODO: Add admin authentication check
      const job = await storage.approveJob(jobId, "admin");
      
      // Send approval email to employer (you could add email service here)
      res.json({ message: "Job approved successfully", job });
    } catch (error: any) {
      console.error("Error approving job:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/jobs/:jobId/reject", async (req, res) => {
    try {
      const { jobId } = req.params;
      const { rejectionReason } = req.body;
      
      const job = await storage.rejectJob(jobId, rejectionReason);
      
      // Send rejection email to employer (you could add email service here)
      res.json({ message: "Job rejected", job });
    } catch (error: any) {
      console.error("Error rejecting job:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Employer analytics routes
  app.get("/api/employer/:employerId/jobs", async (req, res) => {
    try {
      const { employerId } = req.params;
      
      // Verify employer exists
      const employer = await storage.getEmployer(employerId);
      if (!employer) {
        return res.status(404).json({ message: "Employer not found" });
      }
      
      // Get all jobs for this employer with their applications
      const jobsWithApplications = await storage.getEmployerJobsWithApplications(employerId);
      
      res.json(jobsWithApplications);
    } catch (error: any) {
      console.error("Error fetching employer jobs:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get specific job applications for an employer
  app.get("/api/employer/:employerId/jobs/:jobId/applications", async (req, res) => {
    try {
      const { employerId, jobId } = req.params;
      
      // Verify employer owns this job
      const job = await storage.getJob(jobId);
      if (!job || job.employerId !== employerId) {
        return res.status(404).json({ message: "Job not found or unauthorized" });
      }
      
      const applications = await storage.getJobApplicationsWithUserDetails(jobId);
      
      res.json(applications);
    } catch (error: any) {
      console.error("Error fetching job applications:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/jobs/:jobId/apply", requireStudentEnrollment, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { jobId } = req.params;
      const userId = (req.user as any).id;
      const applicationData = insertJobApplicationSchema.parse({
        ...req.body,
        jobId,
        userId
      });
      
      const application = await storage.createJobApplication(applicationData);
      res.json(application);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Job Management Routes
  app.get("/api/employer/jobs", async (req, res) => {
    // TODO: Add authentication check when employer auth is implemented
    try {
      // For now, return all jobs - in production this would be filtered by employer
      const jobs = await storage.getAllJobsWithDetails();
      res.json(jobs);
    } catch (error: any) {
      console.error("Error fetching employer jobs:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/jobs/:jobId", async (req, res) => {
    // TODO: Add authentication check when employer auth is implemented
    try {
      const { jobId } = req.params;
      const updateData = req.body;
      
      const updatedJob = await storage.updateJob(jobId, updateData);
      res.json(updatedJob);
    } catch (error: any) {
      console.error("Error updating job:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/jobs/:jobId/status", async (req, res) => {
    // TODO: Add authentication check when employer auth is implemented
    try {
      const { jobId } = req.params;
      const { status } = req.body;
      
      const updatedJob = await storage.updateJobStatus(jobId, status);
      res.json(updatedJob);
    } catch (error: any) {
      console.error("Error updating job status:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // AI Mentor routes - Basic users get lesson-specific access, Professional/Master get full access
  app.post("/api/mentor/chat", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    const subscriptionTier = user?.subscriptionTier || 'basic';

    // Check subscription access - Professional/Master require active Stripe subscription
    if (subscriptionTier === 'professional' || subscriptionTier === 'master') {
      // Allow admin bypass
      const isAdmin = user.email === 'admin@latrainer.com' || user.email === 'admin@laplumbprep.com' || user.id === 'admin-test-user';
      
      if (!isAdmin) {
        // Strict enforcement: require active Stripe subscription ID
        if (!user.stripeSubscriptionId) {
          return res.status(403).json({ 
            message: "Professional tools access requires an active subscription",
            subscriptionRequired: true,
            reason: "no_subscription_id"
          });
        }

        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          if (subscription.status !== 'active') {
            return res.status(403).json({ 
              message: "Professional tools access requires an active subscription",
              subscriptionRequired: true,
              reason: "subscription_inactive"
            });
          }
        } catch (error) {
          console.error('Stripe subscription check error:', error);
          return res.status(403).json({ 
            message: "Unable to verify subscription status",
            subscriptionRequired: true,
            reason: "verification_error"
          });
        }
      }
    }

    // Basic users: enforce lesson-specific access
    if (subscriptionTier === 'basic') {
      const { currentSection } = req.body;
      if (!currentSection) {
        return res.status(400).json({ 
          message: "Basic users require a specific lesson section",
          requiresSection: true
        });
      }

      // Validate section is within allowed range (Louisiana code sections 101-109)
      const allowedSections = ['101', '103', '105', '107', '109'];
      if (!allowedSections.includes(currentSection)) {
        return res.status(403).json({ 
          message: "Basic users are limited to specific Louisiana code sections",
          allowedSections,
          requiresUpgrade: true
        });
      }
    }

    try {
      const { message, context, conversationId, currentSection } = req.body;
      const userId = user.id;
      const section = currentSection || '101';

      // Tiered AI response - Basic: section-specific, Pro/Master: complete codebook
      let response = "";
      try {
        const aiResponse = await getMentorResponse(message, context, section, subscriptionTier);
        response = aiResponse;
      } catch (aiError) {
        console.error("OpenAI error:", aiError);
        if (subscriptionTier === 'basic') {
          response = `Great question about Louisiana Plumbing Code Section ${section}! 🎓\n\nI can help you learn about Section ${section} topics including:\n\n• **Code Administration** - Enforcement, authority, and legal basis\n• **Installation Requirements** - Pipe sizing, fixtures, and connections\n• **Safety Standards** - Pressure testing, backflow prevention\n• **Compliance Issues** - Violations, permits, and inspections\n\nTry asking me something specific about Section ${section} of the Louisiana plumbing code!`;
        } else {
          response = `Great question about Louisiana Plumbing Code! 🎓\n\nAs a ${subscriptionTier} plan member, I can help you with:\n\n• **Any Code Section** - Administration, permits, inspections, violations\n• **Installation Requirements** - Complete pipe sizing, fixtures, connections\n• **Safety Standards** - Testing, backflow prevention, pressure requirements\n• **Specialized Systems** - Medical gas, natural gas, backflow devices\n\nAsk me about any Louisiana plumbing code topic!`;
        }
      }

      res.json({ 
        response,
        section: section,
        subscriptionTier: subscriptionTier,
        hasCompleteAccess: subscriptionTier !== 'basic'
      });
    } catch (error: any) {
      console.error("Mentor chat error:", error);
      res.status(500).json({ message: "Sorry, I'm having trouble right now. Please try asking about any Louisiana plumbing code topic and I'll help!" });
    }
  });

  // AI Study Plan Generation
  app.post("/api/generate-study-plan/:section", requireActiveSubscription, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { section } = req.params;
      const { courseId, duration } = req.body;

      // Validate required parameters
      if (!section || !courseId || !duration) {
        return res.status(400).json({ message: "Section, courseId, and duration are required" });
      }

      // Get section content to provide context for study plan generation
      const sectionContent = await storage.getCourseContent(courseId);
      const relevantContent = sectionContent.filter(content => 
        content.section?.toString() === section.toString()
      );

      if (relevantContent.length === 0) {
        return res.status(404).json({ message: "No content found for this section" });
      }

      // Extract lesson content for context
      const lessonContent = relevantContent
        .map(content => {
          if (hasExtractedContent(content.content)) {
            return content.content.extracted?.content || content.content.extracted?.description || '';
          }
          return typeof content.content === 'string' ? content.content : '';
        })
        .join('\n\n')
        .substring(0, 3000); // Limit content length

      // Generate AI study plan
      const studyPlan = await generateStudyPlan(section, lessonContent, parseInt(duration));

      res.json({
        success: true,
        studyPlan: {
          title: studyPlan.title,
          content: studyPlan.content,
          estimatedDuration: studyPlan.estimatedDuration,
          sectionNumber: section,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error("Study plan generation error:", error);
      res.status(500).json({ message: error.message || "Failed to generate study plan" });
    }
  });

  // Generate TTS for chat responses
  app.post("/api/mentor/tts", requireActiveSubscription, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { text, messageId } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const { generateAudio } = await import("./openai");
      const audioUrl = await generateAudio(text, `chat-${messageId || Date.now()}`);
      
      res.json({ audioUrl });
    } catch (error: any) {
      console.error("TTS generation error:", error);
      res.status(500).json({ message: "Failed to generate audio" });
    }
  });

  // Generate speech audio for podcast sentences
  app.post("/api/openai/speech", requireActiveSubscription, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { input, voice = "alloy", model = "tts-1" } = req.body;
      
      if (!input || typeof input !== 'string') {
        return res.status(400).json({ message: "Text input is required" });
      }

      // Create OpenAI audio stream
      const response = await openai.audio.speech.create({
        model: model, // tts-1 for faster, tts-1-hd for higher quality
        voice: voice, // alloy, echo, fable, onyx, nova, shimmer
        input: input.substring(0, 4096), // Limit text length for safety
        speed: 0.9 // Slightly slower for educational content
      });

      // Convert to buffer and send as audio stream
      const buffer = Buffer.from(await response.arrayBuffer());
      
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      });
      
      res.send(buffer);
    } catch (error: any) {
      console.error("OpenAI TTS generation error:", error);
      res.status(500).json({ message: "Failed to generate speech audio" });
    }
  });

  app.get("/api/mentor/conversations", requireActiveSubscription, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const conversations = await storage.getUserMentorConversations(userId);
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Generate AI-powered study plan
  app.post("/api/generate-study-plan/:sectionNumber", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Allow authenticated users to generate study plans
    const user = req.user as any;
    const isAdmin = user.email?.includes('admin') || user.email === 'admin@latrainer.com' || user.email === 'admin@laplumbprep.com';
    
    // Check if user has active subscription (unless admin)
    if (!isAdmin) {
      const hasActiveSubscription = user.subscriptionTier && user.subscriptionTier !== 'free' && user.subscriptionStatus === 'active';
      if (!hasActiveSubscription) {
        return res.status(402).json({ message: "Active subscription required to generate AI study plans" });
      }
    }

    try {
      const { sectionNumber } = req.params;
      const { courseId, duration = 45 } = req.body;
      
      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }

      // Get the lesson content for this section to base the study plan on
      const courseContent = await storage.getCourseContent(courseId);
      const lessonContent = courseContent.find(item => 
        item.section?.toString() === sectionNumber.toString() && item.type === 'lesson'
      );

      if (!lessonContent) {
        return res.status(404).json({ message: `No lesson content found for Section ${sectionNumber}` });
      }

      // Extract text content for AI processing
      let textContent = '';
      if (lessonContent.content) {
        const content = lessonContent.content as any;
        if (content.extracted?.content) {
          textContent = content.extracted.content;
        } else if (content.extracted?.text) {
          textContent = content.extracted.text;
        } else {
          textContent = JSON.stringify(content);
        }
      }

      if (!textContent || textContent.length < 100) {
        return res.status(400).json({ message: "Insufficient lesson content to generate study plan" });
      }

      const { generateStudyPlan } = await import("./openai");
      const studyPlan = await generateStudyPlan(sectionNumber, textContent, duration);
      
      res.json({
        sectionNumber,
        studyPlan,
        basedOnLesson: lessonContent.title
      });
    } catch (error: any) {
      console.error("Study plan generation error:", error);
      res.status(500).json({ message: "Failed to generate study plan: " + error.message });
    }
  });

  // NOTE: AI chat import route removed - system now uses pure AI approach
  // No longer needed since we generate all responses dynamically with GPT-5

  // Photo upload and analysis (subscription required)
  app.post("/api/photos/upload", requireActiveSubscription, upload.single('photo'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = (req.user as any).id;
      const filename = req.file.filename;
      const filePath = req.file.path;
      
      // Convert to base64 for AI analysis
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString('base64');
      
      // Analyze photo with AI
      const analysis = await analyzePhoto(base64Image);
      
      // Save to database
      const upload = await storage.createPhotoUpload(
        userId,
        filename,
        `/uploads/${filename}`,
        analysis
      );

      res.json(upload);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create payment intent for pay-per-use photo analysis
  app.post("/api/create-photo-payment-intent", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { amount } = req.body; // $4.99 = 499 cents
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AI Photo Code Analysis',
              description: 'Professional plumbing code compliance analysis',
            },
            unit_amount: amount,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.DOMAIN || 'http://localhost:5000'}/ai-photo-analysis?success=true`,
        cancel_url: `${process.env.DOMAIN || 'http://localhost:5000'}/ai-photo-analysis?canceled=true`,
        metadata: {
          type: 'photo-analysis-pay-per-use',
          userId: (req.user as any).id,
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Create photo payment intent error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Bulk credit packages (these need Stripe products)
  app.post("/api/create-photo-credits-payment", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { credits, amount, planName } = req.body;
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Photo Analysis Credits - ${planName}`,
              description: `${credits} AI photo analysis credits`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.DOMAIN || 'http://localhost:5000'}/ai-photo-analysis?success=true`,
        cancel_url: `${process.env.DOMAIN || 'http://localhost:5000'}/ai-photo-analysis?canceled=true`,
        metadata: {
          type: 'photo-analysis-credits',
          userId: (req.user as any).id,
          credits: credits.toString(),
          planName,
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Create photo credits payment error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Plan upload and analysis
  app.post("/api/plans/upload", requireActiveSubscription, upload.single('plan'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = (req.user as any).id;
      const filename = req.file.filename;
      const filePath = req.file.path;
      
      // Convert to base64 for AI analysis
      const fileBuffer = fs.readFileSync(filePath);
      const base64File = fileBuffer.toString('base64');
      
      // Analyze plans with AI
      const analysis = await analyzePlans(base64File);
      
      // Save to database
      const upload = await storage.createPlanUpload(
        userId,
        filename,
        `/uploads/${filename}`,
        analysis.materialList,
        analysis.codeCompliance
      );

      // Generate numbered fitting PDF
      const pdfPath = await generateNumberedFittingPDF(analysis, base64File);
      
      res.json({
        ...upload,
        materialList: analysis.materialList,
        numberedFittings: analysis.numberedFittings,
        codeCompliance: analysis.codeCompliance,
        totalEstimatedCost: analysis.totalEstimatedCost,
        pdfUrl: pdfPath
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Calculator routes
  app.post("/api/calculator/pipe-size", async (req, res) => {
    try {
      const { fixtureUnits, pipeLength, material } = req.body;
      
      if (!fixtureUnits || !pipeLength || !material) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const result = await calculatePipeSize(
        parseInt(fixtureUnits),
        parseInt(pipeLength),
        material
      );
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Generate numbered fitting PDF for existing plan
  app.post("/api/plans/:planId/generate-pdf", requireActiveSubscription, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { planId } = req.params;
      const userId = (req.user as any).id;
      
      // Get plan from database
      const plan = await storage.getPlanUpload(planId, userId);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      
      // Read the original plan file
      const planPath = path.join(process.cwd(), 'public', plan.url);
      const planBuffer = fs.readFileSync(planPath);
      const base64Plan = planBuffer.toString('base64');
      
      // Generate PDF with numbered fittings
      const pdfPath = await generateNumberedFittingPDF({
        materialList: plan.materialList as any,
        numberedFittings: (plan.analysis as any)?.numberedFittings || [],
        totalEstimatedCost: (plan.analysis as any)?.totalEstimatedCost || 0
      }, base64Plan);
      
      res.json({ pdfUrl: pdfPath });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Serve uploaded files
  app.get('/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  });

  // Serve PDF files
  app.get('/pdfs/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'public', 'pdfs', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'PDF not found' });
    }
    
    res.contentType('application/pdf');
    res.sendFile(filePath);
  });

  // Serve public files (PDFs, code books, etc.) from uploads directory
  app.get("/public-objects/:filePath(*)", (req, res) => {
    const filePath = req.params.filePath;
    const fullPath = path.join(process.cwd(), 'uploads', 'public', filePath);
    
    if (fs.existsSync(fullPath)) {
      res.sendFile(fullPath);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  // API endpoint to list available code books
  app.get("/api/code-books", async (req, res) => {
    try {
      // List common code book file names
      const codeBooks = [
        {
          name: "Louisiana Plumbing Code 2024",
          filename: "louisiana-plumbing-code-2024.pdf",
          size: "12.5 MB",
          description: "Complete Louisiana State Plumbing Code"
        },
        {
          name: "Louisiana Backflow Prevention",
          filename: "louisiana-backflow-prevention.pdf", 
          size: "3.2 MB",
          description: "Backflow prevention regulations and requirements"
        },
        {
          name: "Natural Gas Installation Code",
          filename: "natural-gas-installation-code.pdf",
          size: "8.1 MB", 
          description: "Natural gas piping installation standards"
        }
      ];

      // Check which files actually exist in uploads/public directory
      const availableBooks = [];
      for (const book of codeBooks) {
        const filePath = path.join(process.cwd(), 'uploads', 'public', book.filename);
        if (fs.existsSync(filePath)) {
          availableBooks.push({
            ...book,
            url: `/public-objects/${book.filename}`
          });
        }
      }
      
      res.json(availableBooks);
    } catch (error) {
      console.error("Error listing code books:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Student interest/lead capture endpoint
  app.post("/api/student-interest", async (req, res) => {
    try {
      const { email, firstName, lastName, phone } = req.body;
      
      if (!email || !firstName) {
        return res.status(400).json({ message: "Email and first name are required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Start automated email sequence for potential student
      const fullName = `${firstName} ${lastName || ''}`.trim();
      await emailAutomation.queueEmailSequence(
        email,
        fullName,
        "student_enrollment"
      );
      
      res.status(201).json({ 
        message: "Interest recorded successfully! Check your email for course information.",
        success: true
      });
    } catch (error: any) {
      console.error("Error recording student interest:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Email unsubscribe endpoint
  app.post("/api/unsubscribe", async (req, res) => {
    try {
      const { email, campaignType } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      await emailAutomation.unsubscribe(email, campaignType);
      
      res.json({ 
        message: "Successfully unsubscribed from email campaigns",
        success: true
      });
    } catch (error: any) {
      console.error("Error unsubscribing:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get bulk pricing tiers
  app.get("/api/bulk-pricing/tiers", async (req, res) => {
    try {
      const tiers = await bulkPricingService.getBulkPricingTiers();
      res.json({ tiers });
    } catch (error: any) {
      console.error("Error fetching bulk pricing tiers:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Calculate bulk pricing for a quote
  app.post("/api/bulk-pricing/calculate", async (req, res) => {
    try {
      const { studentCount, courseIds = ["journeyman"] } = req.body;
      
      if (!studentCount || studentCount < 1) {
        return res.status(400).json({ message: "Student count is required and must be greater than 0" });
      }
      
      const pricing = await bulkPricingService.calculateBulkPricing(studentCount, courseIds);
      res.json({ pricing });
    } catch (error: any) {
      console.error("Error calculating bulk pricing:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create bulk enrollment request (requires authentication)
  app.post("/api/bulk-enrollment/request", async (req, res) => {
    try {
      const { 
        employerId, 
        studentEmails, 
        courseIds = ["journeyman"], 
        contactEmail, 
        contactPhone, 
        notes, 
        requestedStartDate 
      } = req.body;
      
      if (!employerId || !studentEmails || !Array.isArray(studentEmails) || studentEmails.length === 0) {
        return res.status(400).json({ 
          message: "Employer ID and student emails array are required" 
        });
      }
      
      if (!contactEmail) {
        return res.status(400).json({ message: "Contact email is required" });
      }

      // Validate student email format
      for (const student of studentEmails) {
        if (!student.email || !student.firstName) {
          return res.status(400).json({ 
            message: "Each student must have email and firstName" 
          });
        }
      }

      const result = await bulkPricingService.createBulkEnrollmentRequest(
        employerId,
        studentEmails,
        courseIds,
        contactEmail,
        contactPhone,
        notes,
        requestedStartDate ? new Date(requestedStartDate) : undefined
      );
      
      // Start automated email sequence for bulk enrollment follow-up
      await emailAutomation.queueEmailSequence(
        contactEmail,
        employerId, // Using employerId as name for now
        "bulk_enrollment"
      );

      res.status(201).json({ 
        message: "Bulk enrollment request created successfully! Check your email for follow-up information.",
        ...result
      });
    } catch (error: any) {
      console.error("Error creating bulk enrollment request:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get bulk enrollment requests for an employer
  app.get("/api/bulk-enrollment/requests/:employerId", async (req, res) => {
    try {
      const { employerId } = req.params;
      const requests = await bulkPricingService.getBulkEnrollmentRequests(employerId);
      res.json({ requests });
    } catch (error: any) {
      console.error("Error fetching bulk enrollment requests:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get student enrollments for a bulk request
  app.get("/api/bulk-enrollment/:requestId/students", async (req, res) => {
    try {
      const { requestId } = req.params;
      const students = await bulkPricingService.getBulkStudentEnrollments(requestId);
      res.json({ students });
    } catch (error: any) {
      console.error("Error fetching bulk student enrollments:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Approve bulk enrollment request (admin only)
  app.post("/api/bulk-enrollment/:requestId/approve", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { approvedBy } = req.body;
      
      if (!approvedBy) {
        return res.status(400).json({ message: "Approved by field is required" });
      }
      
      const updatedRequest = await bulkPricingService.approveBulkEnrollmentRequest(requestId, approvedBy);
      
      res.json({ 
        message: "Bulk enrollment request approved successfully",
        request: updatedRequest 
      });
    } catch (error: any) {
      console.error("Error approving bulk enrollment request:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Content import route
  app.post("/api/admin/import-content", async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!Array.isArray(content)) {
        return res.status(400).json({ message: "Invalid content format" });
      }

      // Get or create the Louisiana Plumbing course
      let courses = await storage.getCourses();
      let journeymanCourse = courses.find(c => c.type === "journeyman") || courses[0];
      
      // If no course exists, create the default Louisiana Plumbing course
      if (!journeymanCourse) {
        const defaultCourse = insertCourseSchema.parse({
          title: "Louisiana Journeyman Prep",
          description: "Comprehensive Louisiana plumbing code certification preparation course covering all aspects of state plumbing regulations and best practices.",
          type: "journeyman",
          price: "39.99",
          duration: 40,
          lessons: 0,
          practiceQuestions: 0,
          isActive: true
        });
        
        journeymanCourse = await storage.createCourse(defaultCourse);
      }

      const imported = [];
      for (const item of content) {
        const courseContentData = insertCourseContentSchema.parse({
          courseId: journeymanCourse.id,
          title: item.title,
          type: item.type,
          chapter: item.chapter,
          section: item.section,
          content: { description: item.content, text: item.content },
          isActive: true,
          sortOrder: 0
        });

        const createdContent = await storage.createCourseContent(courseContentData);
        imported.push(createdContent);
      }

      // Update course statistics after import
      await storage.updateCourseStatsAutomatically(journeymanCourse.id);
      const courseStats = await storage.getCourseContentStats(journeymanCourse.id);

      res.json({ 
        message: "Content imported successfully", 
        count: imported.length,
        content: imported,
        courseStats: courseStats
      });
    } catch (error: any) {
      console.error('Content import error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // QuizGecko import route (legacy)
  app.post("/api/admin/import-quizgecko", async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!Array.isArray(content)) {
        return res.status(400).json({ message: "Invalid content format" });
      }

      // Get or create the Louisiana Plumbing course
      let courses = await storage.getCourses();
      let journeymanCourse = courses.find(c => c.type === "journeyman") || courses[0];
      
      // If no course exists, create the default Louisiana Plumbing course
      if (!journeymanCourse) {
        const defaultCourse = insertCourseSchema.parse({
          title: "Louisiana Journeyman Prep",
          description: "Comprehensive Louisiana plumbing code certification preparation course covering all aspects of state plumbing regulations and best practices.",
          type: "journeyman",
          price: "39.99",
          duration: 40,
          lessons: 0,
          practiceQuestions: 0,
          isActive: true
        });
        
        journeymanCourse = await storage.createCourse(defaultCourse);
      }

      const imported = [];
      for (const item of content) {
        const courseContentData = insertCourseContentSchema.parse({
          courseId: journeymanCourse.id,
          title: item.title,
          type: item.type,
          chapter: item.chapter,
          section: item.section,
          quizgeckoUrl: item.url,
          content: { description: `${item.type} content for ${item.title}`, url: item.url },
          isActive: true,
          sortOrder: 0
        });

        const createdContent = await storage.createCourseContent(courseContentData);
        imported.push(createdContent);
      }

      // Update course statistics after import
      await storage.updateCourseStatsAutomatically(journeymanCourse.id);
      const courseStats = await storage.getCourseContentStats(journeymanCourse.id);

      res.json({ 
        message: "Content imported successfully", 
        count: imported.length,
        content: imported,
        courseStats: courseStats
      });
    } catch (error: any) {
      console.error('QuizGecko import error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get private code books
  app.get("/api/admin/code-books", async (req, res) => {
    try {
      const codeBooks = await storage.getPrivateCodeBooks();
      
      const formattedBooks = codeBooks.map(book => ({
        id: book.id,
        name: book.originalName,
        size: `${(book.fileSize / 1024 / 1024).toFixed(1)} MB`,
        uploadedAt: book.createdAt,
        filePath: book.filePath
      }));

      res.json(formattedBooks);
    } catch (error: any) {
      console.error('Get private code books error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Upload private code book
  app.post("/api/admin/code-books/upload", upload.single('codebook'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // For now, we'll use a simple user ID (in a real app, get from session)
      const uploadedBy = "admin"; // In real app: req.user?.id || "admin"

      const codeBookData = insertPrivateCodeBookSchema.parse({
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        contentType: req.file.mimetype,
        uploadedBy: uploadedBy
      });

      const codeBook = await storage.createPrivateCodeBook(codeBookData);

      res.json({ 
        message: "Code book uploaded successfully",
        codeBook: {
          id: codeBook.id,
          name: codeBook.originalName,
          size: `${(codeBook.fileSize / 1024 / 1024).toFixed(1)} MB`,
          uploadedAt: codeBook.createdAt
        }
      });
    } catch (error: any) {
      console.error('Code book upload error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Content generation route (placeholder for future AI integration)
  app.post("/api/admin/generate-content", async (req, res) => {
    try {
      const { contentType, topic } = req.body;
      
      // This is a placeholder - you would integrate with AI service here
      const generatedContent = {
        content: `<h1>${topic}</h1><p>Generated ${contentType} content for ${topic}. This is a placeholder that would be replaced with actual AI-generated content based on your uploaded code books.</p>`,
        html: `<div class="generated-content"><h2>${topic}</h2><p>This ${contentType} was generated based on your private code book reference materials.</p><ul><li>Learning objectives would be listed here</li><li>Key concepts and definitions</li><li>Code references and requirements</li></ul></div>`
      };

      res.json(generatedContent);
    } catch (error: any) {
      console.error('Content generation error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Content extraction route
  app.post("/api/extract-content/:contentId", async (req, res) => {
    try {
      const { contentId } = req.params;
      
      // Get the content record
      const content = await storage.getCourseContentById(contentId);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      // Extract content based on type
      const extractedContent = await contentExtractor.extractFromQuizGecko(
        content.quizgeckoUrl || "", // Use the stored QuizGecko URL
        content.type
      );

      if (!extractedContent) {
        return res.status(500).json({ message: "Failed to extract content" });
      }

      // Update the content record with extracted data
      const updatedContent = await storage.updateCourseContent(contentId, {
        content: {
          ...(content.content as object || {}),
          extracted: extractedContent.content,
          extractedAt: new Date().toISOString()
        }
      });

      res.json({
        message: "Content extracted successfully",
        content: updatedContent
      });
    } catch (error: any) {
      console.error('Content extraction error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get extracted content for display
  app.get("/api/content/:contentId/display", async (req, res) => {
    try {
      const { contentId } = req.params;
      
      const content = await storage.getCourseContentById(contentId);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      // If content hasn't been extracted yet, extract it now
      if (!(content.content as any)?.extracted) {
        const extractedContent = await contentExtractor.extractFromQuizGecko(
          content.quizgeckoUrl || "", // Use the stored QuizGecko URL
          content.type
        );

        if (extractedContent) {
          const updatedContent = await storage.updateCourseContent(contentId, {
            content: {
              ...(content.content as object || {}),
              extracted: extractedContent.content,
              extractedAt: new Date().toISOString()
            }
          });
          
          return res.json(updatedContent);
        }
      }


      res.json(content);
    } catch (error: any) {
      console.error('Get content error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get course content for display
  app.get("/api/courses/:courseId/content", async (req, res) => {
    try {
      const { courseId } = req.params;
      console.log(`[DEBUG] Fetching content for courseId: ${courseId}`);
      
      // Resolve course ID (handle friendly URLs like "journeyman-prep")
      const resolvedCourseId = await resolveCourseId(courseId);
      console.log(`[DEBUG] Resolved courseId: ${resolvedCourseId}`);
      if (!resolvedCourseId) {
        console.log(`[DEBUG] Course not found for: ${courseId}`);
        return res.status(404).json({ message: "Course not found" });
      }
      
      let content = await storage.getCourseContent(resolvedCourseId);
      console.log(`[DEBUG] Initial content length: ${content.length}`);
      
      // If content is empty for the Louisiana Journeyman Prep course, auto-seed it
      if (content.length === 0 && resolvedCourseId === "b83c6ebe-f5bd-4787-8fd5-e3b177d9e79b") {
        console.log("Course content empty, auto-seeding...");
        await seedCourseContent();
        content = await storage.getCourseContent(resolvedCourseId);
        console.log(`[DEBUG] After seeding content length: ${content.length}`);
      }
      
      // Add cache-busting headers to ensure fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      console.log(`[DEBUG] Returning ${content.length} content items`);
      res.json(content || []);
    } catch (error: any) {
      console.error('Get course content error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get section-specific study notes
  app.get("/api/courses/:courseId/sections/:section/study-notes", async (req, res) => {
    try {
      const { courseId, section } = req.params;
      
      // Resolve course ID (handle friendly URLs like "journeyman-prep")
      const resolvedCourseId = await resolveCourseId(courseId);
      if (!resolvedCourseId) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Fetch all course content and filter for study-notes of the specific section
      const allContent = await storage.getCourseContent(resolvedCourseId);
      const studyNotesItems = allContent.filter(item => 
        String(item.section) === section && item.type === 'study-notes'
      );
      
      // Prioritize study notes with 'notes' field over 'extracted.content' format
      const studyNotes = studyNotesItems.find(item => {
        const content = item.content as any;
        return content && (content.notes || content.text);
      }) || studyNotesItems[0]; // fallback to first item if no notes/text field found
      
      if (!studyNotes) {
        return res.status(404).json({ 
          message: `Study notes not found for section ${section}` 
        });
      }

      // Clean markdown formatting from study notes content
      const cleanMarkdown = (text: string): string => {
        if (!text) return text;
        return text
          .replace(/^#{1,6}\s+/gm, '') // Remove headers
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
          .replace(/\*(.*?)\*/g, '$1') // Remove italic
          .replace(/\n{3,}/g, '\n\n') // Clean whitespace
          .trim();
      };

      // Clean the content
      if (studyNotes.content && typeof studyNotes.content === 'object') {
        const content = studyNotes.content as any;
        if (content.notes) {
          content.notes = cleanMarkdown(content.notes);
        }
        if (content.text) {
          content.text = cleanMarkdown(content.text);
        }
        if (content.keyPoints && Array.isArray(content.keyPoints)) {
          content.keyPoints = content.keyPoints.map(cleanMarkdown);
        }
      }
      if (studyNotes.title) {
        studyNotes.title = cleanMarkdown(studyNotes.title);
      }
      
      // Add cache-busting headers to ensure fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.json(studyNotes);
    } catch (error: any) {
      console.error('Error fetching section study notes:', error);
      res.status(500).json({ message: "Failed to fetch study notes" });
    }
  });

  // Generate AI audio for podcast content  
  app.post("/api/generate-audio/:id", async (req, res) => {
    // Check authentication
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check subscription for non-admin users
    const user = req.user as any;
    const isAdmin = user.email?.includes('admin') || user.email === 'admin@latrainer.com' || user.email === 'admin@laplumbprep.com';
    
    if (!isAdmin) {
      // Apply subscription requirement for regular users
      const hasActiveSubscription = user.subscriptionTier && user.subscriptionTier !== 'free' && user.subscriptionStatus === 'active';
      if (!hasActiveSubscription) {
        return res.status(402).json({ error: 'Active subscription required for audio generation' });
      }
    }
    try {
      const { id } = req.params;
      const content = await storage.getCourseContentById(id);
      
      if (!content) {
        return res.status(404).json({ error: 'Content not found' });
      }

      const contentData = content.content as any;
      
      // Get text for audio generation from multiple sources
      let textForAudio = '';
      if (contentData?.extracted?.transcript) {
        textForAudio = contentData.extracted.transcript;
      } else if (contentData?.extracted?.content) {
        textForAudio = contentData.extracted.content;
      } else if (contentData?.extracted?.text) {
        textForAudio = contentData.extracted.text;
      }
      
      if (!textForAudio || textForAudio.trim().length === 0) {
        return res.status(400).json({ error: 'No content available for audio generation' });
      }
      
      // Clean up text for audio (remove markdown/HTML)
      textForAudio = textForAudio
        .replace(/#+\s*/g, '') // Remove markdown headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .trim();

      const { generateAudio } = await import('./openai');
      const audioUrl = await generateAudio(textForAudio, id);
      
      // Update content with audio URL
      await storage.updateContentAudio(id, audioUrl);
      
      res.json({ audioUrl });
    } catch (error: any) {
      console.error('Generate audio error:', error);
      res.status(500).json({ error: 'Failed to generate audio' });
    }
  });

  // Study session tracking endpoints
  app.post("/api/study-sessions/start", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { contentId, contentType } = req.body;
      const userId = (req.user as any).id;

      if (!contentId || !contentType) {
        return res.status(400).json({ message: "contentId and contentType are required" });
      }

      const session = await storage.startStudySession(userId, contentId, contentType);
      res.json(session);
    } catch (error: any) {
      console.error("Start study session error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/study-sessions/:sessionId/end", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { sessionId } = req.params;
      const session = await storage.endStudySession(sessionId);
      res.json(session);
    } catch (error: any) {
      console.error("End study session error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/study-sessions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const { contentId } = req.query;
      
      const sessions = await storage.getUserStudySessions(userId, contentId as string);
      res.json(sessions);
    } catch (error: any) {
      console.error("Get study sessions error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/study-sessions/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const stats = await storage.getStudySessionStats(userId);
      res.json(stats);
    } catch (error: any) {
      console.error("Get study session stats error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Quiz attempt endpoints
  app.post("/api/quiz-attempts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const attempt = await storage.createQuizAttempt({ ...req.body, userId });
      
      // Update section progress if quiz passed
      if (attempt.passed) {
        await storage.updateSectionProgress(
          userId,
          attempt.courseId,
          attempt.chapter,
          attempt.section,
          {
            quizPassed: true,
            highestScore: attempt.score,
            attemptCount: 1, // This will be incremented if already exists
            lastAttemptAt: new Date(),
          }
        );
        
        // Unlock next section
        await storage.unlockNextSection(userId, attempt.courseId, attempt.chapter, attempt.section);
      }
      
      res.json(attempt);
    } catch (error: any) {
      console.error("Create quiz attempt error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/quiz-attempts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const { contentId } = req.query;
      
      const attempts = await storage.getUserQuizAttempts(userId, contentId as string);
      res.json(attempts);
    } catch (error: any) {
      console.error("Get quiz attempts error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/quiz-attempts/latest/:contentId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const { contentId } = req.params;
      
      const attempt = await storage.getLatestQuizAttempt(userId, contentId);
      res.json(attempt);
    } catch (error: any) {
      console.error("Get latest quiz attempt error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Section progress endpoints (removed duplicate - keeping the comprehensive one above)

  app.get("/api/section-progress/:courseId/:chapter/:section/unlocked", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const { courseId, chapter, section } = req.params;
      
      const isUnlocked = await storage.isSectionUnlocked(
        userId,
        courseId,
        parseInt(chapter),
        parseInt(section)
      );
      
      res.json({ isUnlocked });
    } catch (error: any) {
      console.error("Check section unlock error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Re-extract quiz content to use new structured format
  app.post("/api/content/:id/reextract-quiz", async (req, res) => {
    try {
      const contentId = req.params.id;
      const contentItems = await storage.getCourseContent(contentId);
      const content = Array.isArray(contentItems) ? contentItems[0] : contentItems;
      
      if (!content || content.type !== 'quiz') {
        return res.status(404).json({ message: "Quiz content not found" });
      }

      // Get the text content from the extracted field
      const contentData = content.content as any;
      const textContent = contentData?.extracted?.content || '';
      
      if (textContent) {
        // Use our improved quiz parser
        const { ContentExtractor } = require('./content-extractor');
        const extractor = new ContentExtractor();
        
        // Parse the text content using our new method
        const questions = extractor.extractQuestionsFromText(textContent, content.title || '');
        
        if (questions.length > 0) {
          // Update the content with structured questions
          const contentObj = content.content as any;
          const updatedContent = {
            ...contentObj,
            extracted: {
              ...(contentObj?.extracted || {}),
              questions: questions,
              totalQuestions: questions.length,
              passingScore: 70
            }
          };
          
          await storage.updateCourseContent(contentId, { content: updatedContent });
          res.json({ message: `Successfully extracted ${questions.length} questions`, questions });
        } else {
          res.status(400).json({ message: "No questions could be extracted from content" });
        }
      } else {
        res.status(400).json({ message: "No text content found to extract from" });
      }
    } catch (error: any) {
      console.error("Re-extract quiz error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Email routes
  app.post("/api/referrals/send-invitation", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { email } = req.body;
      const user = req.user as any;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Generate referral code if user doesn't have one
      let referralCode = user.referralCode;
      if (!referralCode) {
        referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await storage.updateUser(user.id, { referralCode });
      }

      // Create referral link
      const referralLink = `${process.env.REPLIT_DEV_DOMAIN || 'https://laplumbprep.com'}/register?ref=${referralCode}`;

      // Send referral invitation email
      await emailService.sendReferralInvitation({
        toEmail: email,
        referrerName: `${user.firstName || user.username}`,
        referralCode,
        referralLink
      });

      res.json({ 
        message: "Referral invitation sent successfully!",
        referralCode,
        referralLink
      });
    } catch (error: any) {
      console.error('Send referral invitation error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/support/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Send support notification
      await emailService.sendSupportNotification({
        fromEmail: email,
        fromName: name,
        subject,
        message,
        userInfo: req.isAuthenticated() ? req.user : null
      });

      res.json({ message: "Support request sent successfully!" });
    } catch (error: any) {
      console.error('Send support request error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Amazon product extraction route
  app.post("/api/amazon/extract", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url || (!url.includes('amazon.com') && !url.includes('amzn.to'))) {
        return res.status(400).json({ message: "Please provide a valid Amazon URL" });
      }

      // Use node-fetch to get the page content
      const fetch = await import('node-fetch');
      const cheerio = await import('cheerio');
      
      const response = await fetch.default(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract product information using jQuery-like selectors
      const name = $('#productTitle').text().trim() || 
                  $('[data-automation-id="product-title"]').text().trim() ||
                  $('h1.a-size-large').text().trim();

      // Price extraction
      let price = '';
      const priceWhole = $('.a-price-whole').first().text().trim();
      const priceFraction = $('.a-price-fraction').first().text().trim();
      if (priceWhole && priceFraction) {
        price = `${priceWhole}.${priceFraction}`;
      } else {
        price = $('.a-price .a-offscreen').first().text().trim() ||
               $('[data-automation-id="price"]').first().text().trim();
      }
      price = price.replace(/[^0-9.]/g, '');

      // Image
      const imageUrl = $('#landingImage').attr('src') || 
                      $('[data-automation-id="product-image"]').attr('src') ||
                      $('.a-dynamic-image').first().attr('src') || '';

      // Description
      let description = $('#feature-bullets ul').text().trim() || 
                       $('[data-automation-id="product-overview"]').text().trim() ||
                       $('#productDescription p').text().trim();
      
      // Clean up description
      description = description.replace(/\s+/g, ' ').trim();

      // Brand
      const brand = $('#bylineInfo_feature_div .a-color-secondary').text().trim() ||
                   $('[data-automation-id="product-brand"]').text().trim() ||
                   $('.po-brand .po-break-word').text().trim();

      // Features
      const features: string[] = [];
      $('#feature-bullets li, .a-unordered-list li').each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 10 && !text.includes('Make sure') && !text.includes('See more')) {
          features.push(text);
        }
      });

      // Add the affiliate tag to the URL
      const affiliateUrl = url.includes('tag=') ? url : 
        url + (url.includes('?') ? '&' : '?') + 'tag=laplumbprep-20';

      const productData = {
        name: name || '',
        price: price || '',
        imageUrl: imageUrl || '',
        description: description || '',
        brand: brand || '',
        features: features.slice(0, 8),
        amazonUrl: affiliateUrl,
        shortDescription: description.substring(0, 150) + (description.length > 150 ? '...' : ''),
        success: true
      };

      res.json(productData);

    } catch (error: any) {
      console.error('Amazon extraction error:', error);
      res.status(500).json({ 
        message: "Failed to extract product information from Amazon URL",
        error: error.message,
        success: false
      });
    }
  });

  // E-commerce API Routes

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const category = req.query.category as string;
      const search = req.query.search as string;
      
      const result = await storage.getProducts(category, search, page, limit);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/featured", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 8;
      const products = await storage.getFeaturedProducts(limit);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      // Ensure arrays are properly formatted
      const cleanedBody = {
        ...req.body,
        features: Array.isArray(req.body.features) ? req.body.features : [],
        tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      };
      
      const productData = insertProductSchema.parse(cleanedBody);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { id } = req.params;
      const updates = req.body;
      const product = await storage.updateProduct(id, updates);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Cart routes
  app.get("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const { productId, quantity } = req.body;
      const cartItem = await storage.addToCart(userId, productId, quantity);
      res.json(cartItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/cart/:productId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const { productId } = req.params;
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(userId, productId, quantity);
      res.json(cartItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/cart/:productId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const { productId } = req.params;
      await storage.removeFromCart(userId, productId);
      res.json({ message: "Item removed from cart" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      await storage.clearCart(userId);
      res.json({ message: "Cart cleared" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Product review routes
  app.get("/api/products/:productId/reviews", async (req, res) => {
    try {
      const { productId } = req.params;
      const reviews = await storage.getProductReviews(productId);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/products/:productId/reviews", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { productId } = req.params;
      const userId = (req.user as any).id;
      const reviewData = insertProductReviewSchema.parse({
        ...req.body,
        productId,
        userId
      });
      const review = await storage.createProductReview(reviewData);
      res.json(review);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ========================
  // REFERRAL ROUTES
  // ========================

  // Get user's referral statistics and earnings
  app.get("/api/referrals/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      let user = (req.user as any);
      
      // Generate referral code if user doesn't have one
      let referralCode = user.referralCode;
      if (!referralCode) {
        referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await storage.updateUser(userId, { referralCode });
        // Update the user object in the session
        user.referralCode = referralCode;
      }
      
      const [referrals, earnings] = await Promise.all([
        storage.getUserReferrals(userId),
        storage.getUserReferralEarnings(userId)
      ]);

      res.json({
        referralCode,
        planTier: user.subscriptionTier,
        totalReferrals: referrals.length,
        earnings,
        recentReferrals: referrals.slice(0, 10) // Last 10 referrals
      });
    } catch (error: any) {
      console.error('Error fetching referral stats:', error);
      res.status(500).json({ message: "Error fetching referral statistics" });
    }
  });

  // Process a new referral signup
  app.post("/api/referrals/process", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { referredUserId, referredPlanTier, referredPlanPrice } = req.body;
      const referrerId = (req.user as any).id;
      const referrerUser = await storage.getUser(referrerId);
      
      if (!referrerUser) {
        return res.status(404).json({ message: "Referrer not found" });
      }

      if (!isValidSubscriptionTier(referredPlanTier)) {
        return res.status(400).json({ message: "Invalid subscription tier" });
      }

      // Calculate commission based on referrer's tier cap
      const commission = calculateReferralCommission(
        referrerUser.subscriptionTier || 'basic',
        referredPlanTier
      );

      const referralData = insertReferralSchema.parse({
        referrerId,
        referredId: referredUserId,
        referrerPlanTier: referrerUser.subscriptionTier,
        referredPlanTier,
        referredPlanPrice: referredPlanPrice.toString(),
        commissionAmount: commission.commissionAmount.toString(),
        eligibleTier: commission.eligibleTier
      });

      const referral = await storage.createReferral(referralData);
      
      res.json({
        success: true,
        referral,
        commission: {
          amount: commission.commissionAmount,
          eligibleTier: commission.eligibleTier,
          originalPrice: commission.eligiblePrice
        }
      });
    } catch (error: any) {
      console.error('Error processing referral:', error);
      res.status(500).json({ message: "Error processing referral" });
    }
  });

  // Get referral commission preview (what user would earn for different tiers)
  app.get("/api/referrals/commission-preview", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = (req.user as any);
      const referrerTier = user.subscriptionTier;

      const previews = {
        basic: calculateReferralCommission(referrerTier, "basic"),
        professional: calculateReferralCommission(referrerTier, "professional"),
        master: calculateReferralCommission(referrerTier, "master")
      };

      res.json({
        referrerTier,
        commissionPreviews: previews,
        note: "Commission is capped at your current plan tier or lower"
      });
    } catch (error: any) {
      console.error('Error generating commission preview:', error);
      res.status(500).json({ message: "Error generating commission preview" });
    }
  });

  // Monthly commission tracking endpoints
  app.get("/api/referrals/monthly-commissions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const { month } = req.query;
      
      const commissions = await storage.getMonthlyCommissions(userId, month as string);
      
      res.json({
        commissions,
        total: commissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0),
        unpaid: commissions.filter(c => !c.isPaid).reduce((sum, c) => sum + Number(c.commissionAmount), 0)
      });
    } catch (error: any) {
      console.error('Error fetching monthly commissions:', error);
      res.status(500).json({ message: "Error fetching monthly commissions" });
    }
  });

  app.get("/api/referrals/monthly-earnings-summary", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      
      // Get all monthly commissions
      const allCommissions = await storage.getMonthlyCommissions(userId);
      
      // Group by month and calculate totals
      const monthlyBreakdown = allCommissions.reduce((acc, commission) => {
        const month = commission.commissionMonth;
        if (!acc[month]) {
          acc[month] = {
            month,
            total: 0,
            paid: 0,
            unpaid: 0,
            count: 0
          };
        }
        
        const amount = Number(commission.commissionAmount);
        acc[month].total += amount;
        acc[month].count += 1;
        
        if (commission.isPaid) {
          acc[month].paid += amount;
        } else {
          acc[month].unpaid += amount;
        }
        
        return acc;
      }, {} as Record<string, any>);
      
      const summary = {
        totalMonthlyEarnings: Object.values(monthlyBreakdown).reduce((sum: number, month: any) => sum + month.total, 0),
        unpaidMonthlyEarnings: Object.values(monthlyBreakdown).reduce((sum: number, month: any) => sum + month.unpaid, 0),
        monthlyBreakdown: Object.values(monthlyBreakdown).sort((a: any, b: any) => b.month.localeCompare(a.month))
      };
      
      res.json(summary);
    } catch (error: any) {
      console.error('Error fetching monthly earnings summary:', error);
      res.status(500).json({ message: "Error fetching monthly earnings summary" });
    }
  });

  // Lead Magnet Download API
  app.post("/api/lead-magnet/download", async (req, res) => {
    try {
      const { email, firstName, lastName, companyName, position } = req.body;
      
      if (!email || !firstName || !lastName || !companyName) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Store lead magnet download record
      const [leadRecord] = await db.insert(leadMagnetDownloads).values({
        email,
        firstName,
        lastName,
        companyName,
        position: position || null,
        leadSource: "website",
        emailSent: true
      }).returning();

      // Start lead nurture email sequence
      await emailAutomation.queueEmailSequence(
        email,
        `${firstName} ${lastName}`,
        "employer_onboarding"
      );

      // Send immediate download email with lead magnet
      await emailService.sendEmail({
        to: email,
        subject: "📋 Your FREE Louisiana Plumbing Code Guide + Bonus Tools",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🎉 Your Louisiana Code Guide is Ready!</h1>
            </div>
            
            <div style="padding: 30px; background: #f9fafb;">
              <p style="font-size: 18px; color: #374151;">Hi ${firstName},</p>
              
              <p style="color: #6b7280; line-height: 1.6;">
                Thank you for downloading our Louisiana Plumbing Code Quick Reference Guide! 
                This comprehensive resource will help you avoid costly code violations and stay compliant on every job.
              </p>
              
              <div style="background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #059669; margin-top: 0;">📥 Download Your Resources:</h2>
                <ul style="color: #374151; line-height: 1.8;">
                  <li><strong>Louisiana Plumbing Code Guide (15 pages)</strong> - Essential violations to avoid</li>
                  <li><strong>BONUS: Pipe Sizing Calculator Tool</strong> - Professional calculations made easy</li>
                  <li><strong>BONUS: Code Update Checklist</strong> - Stay current with 2024 changes</li>
                </ul>
                
                <div style="text-align: center; margin: 25px 0;">
                  <a href="${process.env.WEBSITE_URL || 'https://laplumbprep.com'}/downloads/louisiana-code-guide.pdf?email=${encodeURIComponent(email)}" 
                     style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    📥 Download Guide & Tools
                  </a>
                </div>
              </div>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <h3 style="color: #92400e; margin-top: 0;">💡 Pro Tip:</h3>
                <p style="color: #92400e; margin-bottom: 0;">
                  Print the guide and keep it on every job site. Many contractors save $1,000+ 
                  per project by catching code issues before inspections!
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #6b7280;">Want to take your skills to the next level?</p>
                <a href="${process.env.WEBSITE_URL || 'https://laplumbprep.com'}/courses" 
                   style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  View Our Certification Courses
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                Questions? Reply to this email or contact us at support@laplumbprep.com<br>
                Louisiana Plumbing Prep | Your Path to Certification Success
              </p>
            </div>
          </div>
        `
      });

      res.status(200).json({ 
        message: "Download link sent successfully",
        leadId: leadRecord.id
      });
    } catch (error: any) {
      console.error("Error processing lead magnet download:", error);
      res.status(500).json({ message: "Failed to send download link" });
    }
  });

  // Student Lead Magnet Download API
  app.post("/api/student-lead-magnet/download", async (req, res) => {
    try {
      const { email, firstName, lastName, currentLevel, goals } = req.body;
      
      if (!email || !firstName || !lastName || !currentLevel) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Store student lead magnet download record
      const [leadRecord] = await db.insert(studentLeadMagnetDownloads).values({
        email,
        firstName,
        lastName,
        currentLevel,
        goals: goals || null,
        leadSource: "website",
        emailSent: true
      }).returning();

      // Start student enrollment email sequence  
      await emailAutomation.queueEmailSequence(
        email,
        `${firstName} ${lastName}`,
        "student_enrollment"
      );

      // Send immediate download email with student career guide
      await emailService.sendEmail({
        to: email,
        subject: "🚀 Your FREE Louisiana Plumbing Career Roadmap + Study Materials",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🎉 Your Career Roadmap is Ready!</h1>
            </div>
            
            <div style="padding: 30px; background: #f9fafb;">
              <p style="font-size: 18px; color: #374151;">Hi ${firstName},</p>
              
              <p style="color: #6b7280; line-height: 1.6;">
                Congratulations on taking the first step toward building a successful $75,000+ plumbing career in Louisiana! 
                Your complete career roadmap and bonus study materials are ready for download.
              </p>
              
              <div style="background: white; border: 2px solid #7c3aed; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #7c3aed; margin-top: 0;">📥 Download Your Career Resources:</h2>
                <ul style="color: #374151; line-height: 1.8;">
                  <li><strong>Louisiana Plumbing Career Roadmap (20 pages)</strong> - Complete path from apprentice to master</li>
                  <li><strong>Salary Progression Guide</strong> - Real Louisiana wages from $35K to $85K+</li>
                  <li><strong>BONUS: Practice Test Pack</strong> - Journeyman prep questions (Value: $67)</li>
                  <li><strong>BONUS: Study Flashcards</strong> - 200+ code questions (Value: $37)</li>
                  <li><strong>BONUS: Certification Timeline</strong> - When to get each license (Value: $23)</li>
                </ul>
                
                <div style="text-align: center; margin: 25px 0;">
                  <a href="${process.env.WEBSITE_URL || 'https://laplumbprep.com'}/downloads/louisiana-career-roadmap.pdf?email=${encodeURIComponent(email)}" 
                     style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    📥 Download Career Roadmap & Bonuses
                  </a>
                </div>
              </div>
              
              <div style="background: #ddd6fe; border-left: 4px solid #7c3aed; padding: 15px; margin: 20px 0;">
                <h3 style="color: #5b21b6; margin-top: 0;">💡 Your Next Steps:</h3>
                <p style="color: #5b21b6; margin-bottom: 0;">
                  Based on your current level (${currentLevel}), we recommend starting with our Louisiana Journeyman Prep course. 
                  Students typically see a $15,000-$25,000 salary increase within 12 months of certification!
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #6b7280;">Ready to start your certification journey?</p>
                <a href="${process.env.WEBSITE_URL || 'https://laplumbprep.com'}/courses" 
                   style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  🎯 View Certification Courses
                </a>
              </div>
              
              <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <h3 style="color: #059669; margin-top: 0;">🔥 Early Bird Special</h3>
                <p style="color: #065f46; margin-bottom: 10px;">
                  As a career roadmap download, you get exclusive access to:
                </p>
                <ul style="color: #065f46; text-align: left; max-width: 400px; margin: 0 auto;">
                  <li>25% off your first certification course</li>
                  <li>Free 1-on-1 career planning session</li>
                  <li>Priority access to new courses</li>
                  <li>Weekly tips from Louisiana master plumbers</li>
                </ul>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                Questions about your career path? Reply to this email or contact us at support@laplumbprep.com<br>
                Louisiana Plumbing Prep | Your Path to $75K+ Career Success
              </p>
            </div>
          </div>
        `
      });

      res.status(200).json({ 
        message: "Career roadmap sent successfully",
        leadId: leadRecord.id
      });
    } catch (error: any) {
      console.error("Error processing student lead magnet download:", error);
      res.status(500).json({ message: "Failed to send career roadmap" });
    }
  });

  // PDF routes moved to beginning of file for priority

  // Test endpoint to check email credentials
  app.get("/api/check-email-config", async (req, res) => {
    try {
      const config = {
        noreply_user: process.env.NOREPLY_USER ? `${process.env.NOREPLY_USER.substring(0, 3)}***` : 'NOT SET',
        noreply_pass: process.env.NOREPLY_PASS ? 'SET (hidden)' : 'NOT SET',
        support_user: process.env.SUPPORT_USER ? `${process.env.SUPPORT_USER.substring(0, 3)}***` : 'NOT SET',
        support_pass: process.env.SUPPORT_PASS ? 'SET (hidden)' : 'NOT SET',
        referrals_user: process.env.REFERRALS_USER ? `${process.env.REFERRALS_USER.substring(0, 3)}***` : 'NOT SET',
        referrals_pass: process.env.REFERRALS_PASS ? 'SET (hidden)' : 'NOT SET'
      };
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to check config" });
    }
  });

  // Test endpoint to send actual emails
  app.post("/api/test-email-delivery", async (req, res) => {
    const { type = "contractor", email = "laplumbprep@gmail.com" } = req.body;
    
    try {
      console.log(`Testing email delivery for ${type} to ${email}`);
      
      if (type === "contractor") {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🎉 Your Louisiana Code Guide is Ready!</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="font-size: 18px; color: #374151;">Hi Louisiana Plumber,</p>
              <p style="color: #6b7280; line-height: 1.6;">
                Thank you for downloading our Louisiana Plumbing Code Quick Reference Guide! 
                This comprehensive resource will help you avoid costly code violations and stay compliant on every job.
              </p>
              <div style="background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #059669; margin-top: 0;">📥 Download Your Resources:</h2>
                <div style="text-align: center; margin: 25px 0;">
                  <a href="https://laplumbprep.com/downloads/louisiana-code-guide.pdf" 
                     style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    📥 Download Guide & Tools
                  </a>
                </div>
              </div>
            </div>
          </div>
        `;
        
        await emailService.sendEmail({
          to: email,
          subject: "🎉 Your Louisiana Code Guide is Ready for Download!",
          html: emailHtml
        });
        
      } else if (type === "student") {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🎉 Your Career Roadmap is Ready!</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="font-size: 18px; color: #374151;">Hi Future Plumber,</p>
              <p style="color: #6b7280; line-height: 1.6;">
                Congratulations on taking the first step toward building a successful $75,000+ plumbing career in Louisiana! 
                Your complete career roadmap and bonus study materials are ready for download.
              </p>
              <div style="background: white; border: 2px solid #7c3aed; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #7c3aed; margin-top: 0;">📥 Download Your Career Resources:</h2>
                <div style="text-align: center; margin: 25px 0;">
                  <a href="https://laplumbprep.com/downloads/louisiana-career-roadmap.pdf" 
                     style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    📥 Download Career Roadmap & Bonuses
                  </a>
                </div>
              </div>
            </div>
          </div>
        `;
        
        await emailService.sendEmail({
          to: email,
          subject: "🎉 Your Louisiana Plumbing Career Roadmap is Ready!",
          html: emailHtml
        });
      }
      
      console.log(`Email sent successfully to ${email}`);
      res.json({ 
        success: true, 
        message: `Test ${type} email sent successfully to ${email}`,
        type: type
      });
      
    } catch (error: any) {
      console.error("Email delivery test failed:", error);
      res.status(500).json({ 
        success: false, 
        error: "Email delivery failed", 
        details: error.message,
        type: type
      });
    }
  });

  // Test endpoint to preview lead magnet emails
  app.get("/api/preview-emails/:type", async (req, res) => {
    const { type } = req.params;
    const firstName = "Louisiana";
    const lastName = "Plumbing Prep";
    const currentLevel = "Apprentice";
    
    try {
      if (type === "contractor") {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🎉 Your Louisiana Code Guide is Ready!</h1>
            </div>
            
            <div style="padding: 30px; background: #f9fafb;">
              <p style="font-size: 18px; color: #374151;">Hi ${firstName},</p>
              
              <p style="color: #6b7280; line-height: 1.6;">
                Thank you for downloading our Louisiana Plumbing Code Quick Reference Guide! 
                This comprehensive resource will help you avoid costly code violations and stay compliant on every job.
              </p>
              
              <div style="background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #059669; margin-top: 0;">📥 Download Your Resources:</h2>
                <ul style="color: #374151; line-height: 1.8;">
                  <li><strong>Louisiana Plumbing Code Guide (15 pages)</strong> - Essential violations to avoid</li>
                  <li><strong>BONUS: Pipe Sizing Calculator Tool</strong> - Professional calculations made easy</li>
                  <li><strong>BONUS: Code Update Checklist</strong> - Stay current with 2024 changes</li>
                </ul>
                
                <div style="text-align: center; margin: 25px 0;">
                  <a href="https://laplumbprep.com/downloads/louisiana-code-guide.pdf" 
                     style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    📥 Download Guide & Tools
                  </a>
                </div>
              </div>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <h3 style="color: #92400e; margin-top: 0;">💡 Pro Tip:</h3>
                <p style="color: #92400e; margin-bottom: 0;">
                  Print the guide and keep it on every job site. Many contractors save $1,000+ 
                  per project by catching code issues before inspections!
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #6b7280;">Want to take your skills to the next level?</p>
                <a href="https://laplumbprep.com/courses" 
                   style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  View Our Certification Courses
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                Questions? Reply to this email or contact us at support@laplumbprep.com<br>
                Louisiana Plumbing Prep | Your Path to Certification Success
              </p>
            </div>
          </div>
        `;
        
        res.setHeader('Content-Type', 'text/html');
        res.send(emailHtml);
        
      } else if (type === "student") {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🎉 Your Career Roadmap is Ready!</h1>
            </div>
            
            <div style="padding: 30px; background: #f9fafb;">
              <p style="font-size: 18px; color: #374151;">Hi ${firstName},</p>
              
              <p style="color: #6b7280; line-height: 1.6;">
                Congratulations on taking the first step toward building a successful $75,000+ plumbing career in Louisiana! 
                Your complete career roadmap and bonus study materials are ready for download.
              </p>
              
              <div style="background: white; border: 2px solid #7c3aed; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #7c3aed; margin-top: 0;">📥 Download Your Career Resources:</h2>
                <ul style="color: #374151; line-height: 1.8;">
                  <li><strong>Louisiana Plumbing Career Roadmap (20 pages)</strong> - Complete path from apprentice to master</li>
                  <li><strong>Salary Progression Guide</strong> - Real Louisiana wages from $35K to $85K+</li>
                  <li><strong>BONUS: Practice Test Pack</strong> - Journeyman prep questions (Value: $67)</li>
                  <li><strong>BONUS: Study Flashcards</strong> - 200+ code questions (Value: $37)</li>
                  <li><strong>BONUS: Certification Timeline</strong> - When to get each license (Value: $23)</li>
                </ul>
                
                <div style="text-align: center; margin: 25px 0;">
                  <a href="https://laplumbprep.com/downloads/louisiana-career-roadmap.pdf" 
                     style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    📥 Download Career Roadmap & Bonuses
                  </a>
                </div>
              </div>
              
              <div style="background: #ddd6fe; border-left: 4px solid #7c3aed; padding: 15px; margin: 20px 0;">
                <h3 style="color: #5b21b6; margin-top: 0;">💡 Your Next Steps:</h3>
                <p style="color: #5b21b6; margin-bottom: 0;">
                  Based on your current level (${currentLevel}), we recommend starting with our Louisiana Journeyman Prep course. 
                  Students typically see a $15,000-$25,000 salary increase within 12 months of certification!
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #6b7280;">Ready to start your certification journey?</p>
                <a href="https://laplumbprep.com/courses" 
                   style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  🎯 View Certification Courses
                </a>
              </div>
              
              <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <h3 style="color: #059669; margin-top: 0;">🔥 Early Bird Special</h3>
                <p style="color: #065f46; margin-bottom: 10px;">
                  As a career roadmap download, you get exclusive access to:
                </p>
                <ul style="color: #065f46; text-align: left; max-width: 400px; margin: 0 auto;">
                  <li>25% off your first certification course</li>
                  <li>Free 1-on-1 career planning session</li>
                  <li>Priority access to new courses</li>
                  <li>Weekly tips from Louisiana master plumbers</li>
                </ul>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                Questions about your career path? Reply to this email or contact us at support@laplumbprep.com<br>
                Louisiana Plumbing Prep | Your Path to $75K+ Career Success
              </p>
            </div>
          </div>
        `;
        
        res.setHeader('Content-Type', 'text/html');
        res.send(emailHtml);
        
      } else {
        res.status(400).json({ error: "Invalid email type. Use 'contractor' or 'student'" });
      }
    } catch (error: any) {
      console.error("Error generating email preview:", error);
      res.status(500).json({ error: "Failed to generate email preview" });
    }
  });

  // ===== GAMIFICATION API ROUTES =====

  // Get current monthly competition
  app.get("/api/competitions/current", async (req, res) => {
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const competition = await storage.getCurrentCompetition(currentMonth);
      res.json(competition);
    } catch (error: any) {
      console.error("Error fetching current competition:", error);
      res.status(500).json({ error: "Failed to fetch competition" });
    }
  });

  // Get user's achievements
  app.get("/api/achievements/user", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userId = req.user.id;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error: any) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const period = req.query.period as string || 'all_time'; // 'monthly', 'weekly', 'all_time'
      const leaderboard = await storage.getLeaderboard(period);
      res.json(leaderboard);
    } catch (error: any) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Start competition attempt
  app.post("/api/competitions/:competitionId/start", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { competitionId } = req.params;
      const userId = req.user.id;
      
      const attempt = await storage.startCompetitionAttempt(competitionId, userId);
      res.json(attempt);
    } catch (error: any) {
      console.error("Error starting competition attempt:", error);
      res.status(500).json({ error: "Failed to start competition" });
    }
  });

  // Submit competition attempt
  app.post("/api/competitions/:competitionId/submit", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { competitionId } = req.params;
      const userId = req.user.id;
      const { answers, timeSpent } = req.body;
      
      const result = await storage.submitCompetitionAttempt(competitionId, userId, answers, timeSpent);
      res.json(result);
    } catch (error: any) {
      console.error("Error submitting competition attempt:", error);
      res.status(500).json({ error: "Failed to submit competition" });
    }
  });

  // Get user's competition history
  app.get("/api/competitions/history", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userId = req.user.id;
      const history = await storage.getUserCompetitionHistory(userId);
      res.json(history);
    } catch (error: any) {
      console.error("Error fetching competition history:", error);
      res.status(500).json({ error: "Failed to fetch competition history" });
    }
  });

  // Award achievement (admin only)
  app.post("/api/achievements/award", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Check if user is admin
      if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { userId, achievementId } = req.body;
      const achievement = await storage.awardAchievement(userId, achievementId);
      res.json(achievement);
    } catch (error: any) {
      console.error("Error awarding achievement:", error);
      res.status(500).json({ error: "Failed to award achievement" });
    }
  });

  // Get user points summary
  app.get("/api/points/summary", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userId = req.user.id;
      const summary = await storage.getUserPointsSummary(userId);
      res.json(summary);
    } catch (error: any) {
      console.error("Error fetching points summary:", error);
      res.status(500).json({ error: "Failed to fetch points summary" });
    }
  });

  // Get user notifications
  app.get("/api/notifications", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userId = req.user.id;
      const notifications = await competitionNotificationService.getUserNotifications(userId);
      res.json(notifications);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.post("/api/notifications/:notificationId/read", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { notificationId } = req.params;
      await competitionNotificationService.markNotificationRead(notificationId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Admin Content Management Routes
  // Get course content for management
  app.get("/api/admin/course-content/:courseId", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Check if user is admin (simple check for now)
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { courseId } = req.params;
      
      // Get all course content for this course
      const allContent = await storage.getCourseContent(courseId);
      
      // Separate content by type
      const lessons = allContent.filter(content => content.type === 'lesson');
      const chapters = allContent.filter(content => content.type === 'chapter');
      const questions = allContent.filter(content => content.type === 'question');
      
      res.json({
        lessons,
        chapters,
        questions
      });
    } catch (error: any) {
      console.error("Error fetching course content:", error);
      res.status(500).json({ error: "Failed to fetch course content" });
    }
  });

  // Add new stats endpoint for overview counts
  app.get("/api/admin/course-content/:courseId/stats", async (req: any, res) => {
    console.log('🔧 ADMIN STATS API CALLED for course:', req.params.courseId);
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Check if user is admin (simple check for now)
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { courseId } = req.params;
      
      // Get all course content for this course
      const allContent = await storage.getCourseContent(courseId);
      
      // Count questions from unified competition_questions table only
      const competitionQuestions = await storage.getQuestionsByCourse(courseId);
      
      console.log('Admin API: Found', competitionQuestions.length, 'questions in unified system');
      
      const questions = competitionQuestions.length;

      // Get flashcards directly from flashcards table
      const courseFlashcards = await storage.getFlashcardsByCourse(courseId);
      const flashcards = courseFlashcards.length;

      // Get detailed breakdowns
      const questionBreakdowns = await storage.getQuestionBreakdowns(courseId);
      const flashcardBreakdowns = await storage.getFlashcardBreakdowns(courseId);
      // Lessons breakdown removed - not needed in admin interface
      const studyNotesBreakdowns = await storage.getStudySessionBreakdowns(courseId);
      const studyPlansBreakdowns = await storage.getEnrollmentBreakdowns(courseId);
      const podcastBreakdowns = await storage.getUserProgressBreakdowns(courseId);

      // Count by type (using actual database types)
      const stats = {
        lessons: allContent.filter(content => content.type === 'lesson').length,
        chapters: allContent.filter(content => content.type === 'chapter').length, 
        questions: questions,
        flashcards: flashcards,
        studyNotes: allContent.filter(content => content.type === 'study-notes').length,
        studyPlans: allContent.filter(content => content.type === 'study-plan' || content.type === 'study-plans').length,
        podcasts: allContent.filter(content => content.type === 'podcast').length,
        aiChat: 1, // Study Companion "Pipe Buddy" is available for all courses
        breakdowns: {
          questions: questionBreakdowns,
          flashcards: flashcardBreakdowns,
          // lessons: lessonBreakdowns, // Removed - lessons don't need breakdown display
          studyNotes: studyNotesBreakdowns,
          studyPlans: studyPlansBreakdowns,
          podcasts: podcastBreakdowns
        }
      };
      
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching course content stats:", error);
      res.status(500).json({ error: "Failed to fetch course content stats" });
    }
  });

  // Public endpoint for course content stats (no auth required)
  app.get("/api/courses/:courseId/stats", async (req: any, res) => {
    try {
      const { courseId } = req.params;
      
      // Get all course content for this course
      const allContent = await storage.getCourseContent(courseId);
      
      // Get actual content from dedicated tables
      const competitionQuestions = await storage.getQuestionsByCourse(courseId);
      const courseFlashcards = await storage.getFlashcardsByCourse(courseId);

      // Count individual items within content, not just content files
      const stats = {
        questions: competitionQuestions.length,
        flashcards: courseFlashcards.length,
        studyNotes: allContent.filter(content => content.type === 'study-notes').length,
        studyPlans: allContent.filter(content => content.type === 'study-plan' || content.type === 'study-plans').length,
        podcasts: allContent.filter(content => content.type === 'podcast').length,
        aiChat: 1 // Study Companion "Pipe Buddy" is available for all courses
      };
      
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching public course content stats:", error);
      res.status(500).json({ error: "Failed to fetch course content stats" });
    }
  });

  // Add new lesson
  app.post("/api/admin/lessons", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const lessonData = {
        ...req.body,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };
      
      const lesson = await storage.createLesson(lessonData);
      res.json(lesson);
    } catch (error: any) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ error: "Failed to create lesson" });
    }
  });

  // Add new chapter
  app.post("/api/admin/chapters", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const chapterData = {
        ...req.body,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };
      
      const chapter = await storage.createChapter(chapterData);
      res.json(chapter);
    } catch (error: any) {
      console.error("Error creating chapter:", error);
      res.status(500).json({ error: "Failed to create chapter" });
    }
  });

  // Add new question
  app.post("/api/admin/questions", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const questionData = {
        ...req.body,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };
      
      const question = await storage.createQuestion(questionData);
      res.json(question);
    } catch (error: any) {
      console.error("Error creating question:", error);
      res.status(500).json({ error: "Failed to create question" });
    }
  });

  // Get study plans for a specific course/lesson
  app.get("/api/courses/:courseId/study-plans", async (req: any, res) => {
    try {
      const { courseId } = req.params;
      
      // Resolve course ID (handle friendly URLs like "journeyman-prep")
      const resolvedCourseId = await resolveCourseId(courseId);
      if (!resolvedCourseId) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      const studyPlans = await storage.getStudyPlansByCourse(resolvedCourseId);
      res.json(studyPlans);
    } catch (error: any) {
      console.error("Error fetching study plans:", error);
      res.status(500).json({ error: "Failed to fetch study plans" });
    }
  });

  // Start a study session
  app.post("/api/study-sessions", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { contentId, contentType, studyPlanId, estimatedDuration } = req.body;
      const userId = req.user.id;

      const session = await storage.createStudySession({
        userId,
        contentId,
        contentType,
        sessionStart: new Date(),
      });

      res.json(session);
    } catch (error: any) {
      console.error("Error starting study session:", error);
      res.status(500).json({ error: "Failed to start study session" });
    }
  });

  // Update study session progress
  app.put("/api/study-sessions/:sessionId", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { sessionId } = req.params;
      const { completed, durationSeconds, sectionsCompleted } = req.body;
      const userId = req.user.id;

      const updatedSession = await storage.updateStudySession(sessionId, {
        completed,
        durationSeconds,
        // sectionsCompleted, // Removed - not in interface
        sessionEnd: completed ? new Date() : undefined,
      });

      res.json(updatedSession);
    } catch (error: any) {
      console.error("Error updating study session:", error);
      res.status(500).json({ error: "Failed to update study session" });
    }
  });

  // Bulk import study plans with duplicate detection
  app.post("/api/admin/study-plans/bulk-import", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { courseId, studyPlans } = req.body;
      
      if (!courseId || !studyPlans || !Array.isArray(studyPlans)) {
        return res.status(400).json({ error: "courseId and studyPlans array are required" });
      }
      
      // Get existing study plans for this course to check for duplicates
      const existingStudyPlans = await storage.getStudyPlansByCourse(courseId);
      
      // Create a set of existing study plan titles for faster lookup (normalized)
      const existingStudyPlanTitles = new Set(
        existingStudyPlans.map((sp: any) => 
          sp.title.toLowerCase().trim().replace(/\s+/g, ' ')
        )
      );
      
      // Filter out duplicates and track them
      const newStudyPlans: any[] = [];
      const duplicates: any[] = [];
      
      studyPlans.forEach((sp: any) => {
        const normalizedTitle = sp.title.toLowerCase().trim().replace(/\s+/g, ' ');
        
        if (existingStudyPlanTitles.has(normalizedTitle)) {
          duplicates.push(sp);
        } else {
          newStudyPlans.push({
            ...sp,
            id: crypto.randomUUID(),
            courseId,
            createdAt: new Date(),
          });
          // Add to set to prevent duplicates within this batch too
          existingStudyPlanTitles.add(normalizedTitle);
        }
      });
      
      // Helper function to extract chapter number from chapter string (e.g., "Chapter 1" -> 1)
      const extractChapterNumber = (chapterStr: string) => {
        const match = chapterStr.match(/chapter\s*(\d+)/i);
        return match ? parseInt(match[1]) : 1;
      };

      // Create only new study plans using the values from the frontend interface
      const createdStudyPlans = await Promise.all(
        newStudyPlans.map((sp: any) => {
          return storage.createCourseContent({
            courseId: sp.courseId,
            type: 'study-plan',
            title: sp.title,
            content: sp.content,
            // Use values selected in the interface, not extracted from content
            chapter: extractChapterNumber(sp.chapter || 'Chapter 1'),
            section: parseInt(sp.section) || null,
            difficulty: sp.difficulty || 'easy'
          });
        })
      );
      
      res.json({ 
        success: true, 
        imported: createdStudyPlans.length,
        duplicatesSkipped: duplicates.length,
        totalSubmitted: studyPlans.length,
        studyPlans: createdStudyPlans,
        duplicates: duplicates.map(d => d.title.substring(0, 100) + "...")
      });
    } catch (error: any) {
      console.error("Error bulk importing study plans:", error);
      res.status(500).json({ error: "Failed to import study plans" });
    }
  });

  // Bulk import study notes with duplicate detection
  app.post("/api/admin/study-notes/bulk-import", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { courseId, studyNotes } = req.body;
      
      if (!courseId || !studyNotes || !Array.isArray(studyNotes)) {
        return res.status(400).json({ error: "courseId and studyNotes array are required" });
      }
      
      // Get existing study notes for this course to check for duplicates
      const existingStudyNotes = await storage.getStudyNotesByCourse(courseId);
      
      // Create a set of existing study note titles for faster lookup (normalized)
      const existingStudyNoteTitles = new Set(
        existingStudyNotes.map((sn: any) => 
          sn.title.toLowerCase().trim().replace(/\s+/g, ' ')
        )
      );
      
      // Filter out duplicates and track them
      const newStudyNotes: any[] = [];
      const duplicates: any[] = [];
      
      studyNotes.forEach((sn: any) => {
        const normalizedTitle = sn.title.toLowerCase().trim().replace(/\s+/g, ' ');
        
        if (existingStudyNoteTitles.has(normalizedTitle)) {
          duplicates.push(sn);
        } else {
          newStudyNotes.push({
            ...sn,
            id: crypto.randomUUID(),
            courseId,
            createdAt: new Date(),
          });
          // Add to set to prevent duplicates within this batch too
          existingStudyNoteTitles.add(normalizedTitle);
        }
      });
      
      // Create only new study notes
      const createdStudyNotes = await Promise.all(
        newStudyNotes.map((sn: any) => storage.createStudyNote(sn))
      );
      
      res.json({ 
        success: true, 
        imported: createdStudyNotes.length,
        duplicatesSkipped: duplicates.length,
        totalSubmitted: studyNotes.length,
        studyNotes: createdStudyNotes,
        duplicates: duplicates.map(d => d.title.substring(0, 100) + "...")
      });
    } catch (error: any) {
      console.error("Error bulk importing study notes:", error);
      res.status(500).json({ error: "Failed to import study notes" });
    }
  });

  // Bulk import flashcards with duplicate detection
  app.post("/api/admin/flashcards/bulk-import", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { courseId, flashcards } = req.body;
      
      if (!courseId || !flashcards || !Array.isArray(flashcards)) {
        return res.status(400).json({ error: "courseId and flashcards array are required" });
      }
      
      // Get existing flashcards for this course to check for duplicates
      const existingFlashcards = await storage.getFlashcardsByCourse(courseId);
      
      // Create a set of existing flashcard front+difficulty combinations for faster lookup
      const existingFlashcardKeys = new Set(
        existingFlashcards.map((f: any) => {
          const normalizedFront = f.front.toLowerCase().trim().replace(/\s+/g, ' ');
          return `${normalizedFront}|||${f.difficulty}`;
        })
      );
      
      // Filter out duplicates and track them
      const newFlashcards: any[] = [];
      const duplicates: any[] = [];
      
      flashcards.forEach((f: any) => {
        const normalizedFront = f.front.toLowerCase().trim().replace(/\s+/g, ' ');
        const flashcardKey = `${normalizedFront}|||${f.difficulty}`;
        
        if (existingFlashcardKeys.has(flashcardKey)) {
          duplicates.push(f);
        } else {
          newFlashcards.push({
            ...f,
            id: crypto.randomUUID(),
            courseId,
            createdAt: new Date(),
          });
          // Add to set to prevent duplicates within this batch too
          existingFlashcardKeys.add(flashcardKey);
        }
      });
      
      // Create only new flashcards
      const createdFlashcards = await Promise.all(
        newFlashcards.map((f: any) => storage.createFlashcard(f))
      );
      
      res.json({ 
        success: true, 
        imported: createdFlashcards.length,
        duplicatesSkipped: duplicates.length,
        totalSubmitted: flashcards.length,
        flashcards: createdFlashcards,
        duplicates: duplicates.map(d => d.front.substring(0, 100) + "...")
      });
    } catch (error: any) {
      console.error("Error bulk importing flashcards:", error);
      res.status(500).json({ error: "Failed to import flashcards" });
    }
  });

  // Bulk import questions with duplicate detection
  app.post("/api/admin/questions/bulk-import", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { courseId, questions } = req.body;
      
      if (!courseId || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ error: "courseId and questions array are required" });
      }
      
      // Get all existing questions from entire database to check for duplicates
      const existingQuestions = await storage.getAllActiveQuestions();
      
      // Create a set of existing question texts for faster lookup (normalized)
      // Normalize by removing extra spaces, punctuation variations, and converting to lowercase
      const normalizeQuestionText = (text: string) => {
        return text
          .toLowerCase()
          .trim()
          .replace(/\s+/g, ' ')           // Multiple spaces to single space
          .replace(/[.!?]+$/, '')         // Remove trailing punctuation
          .replace(/["'"''""]/g, '"')     // Normalize quotes
          .replace(/\s*\?\s*/g, '?')      // Normalize question marks
          .replace(/\s*:\s*/g, ':')       // Normalize colons
          .replace(/\s*;\s*/g, ';');      // Normalize semicolons
      };

      const existingQuestionTexts = new Set(
        existingQuestions.map((q: any) => normalizeQuestionText(q.question))
      );
      
      // Filter out duplicates and track them
      const newQuestions: any[] = [];
      const duplicates: any[] = [];
      
      questions.forEach((q: any) => {
        const normalizedText = normalizeQuestionText(q.questionText);
        
        if (existingQuestionTexts.has(normalizedText)) {
          duplicates.push(q);
        } else {
          newQuestions.push({
            ...q,
            id: crypto.randomUUID(),
            courseId,
            createdAt: new Date(),
          });
          // Add to set to prevent duplicates within this batch too
          existingQuestionTexts.add(normalizedText);
        }
      });
      
      // Create only new questions
      const createdQuestions = await Promise.all(
        newQuestions.map((q: any) => storage.createQuestion(q))
      );
      
      res.json({ 
        success: true, 
        imported: createdQuestions.length,
        duplicatesSkipped: duplicates.length,
        totalSubmitted: questions.length,
        questions: createdQuestions,
        duplicates: duplicates.map(d => d.questionText.substring(0, 100) + "...")
      });
    } catch (error: any) {
      console.error("Error bulk importing questions:", error);
      res.status(500).json({ error: "Failed to import questions" });
    }
  });

  // Adaptive Difficulty Settings Routes
  
  // Get user difficulty settings
  app.get("/api/difficulty-settings", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        preferredDifficulty: user.preferredDifficulty || 'easy',
        currentSkillLevel: user.currentSkillLevel || 'easy',
        adaptiveDifficultyEnabled: user.adaptiveDifficultyEnabled !== false
      });
    } catch (error: any) {
      console.error("Error getting difficulty settings:", error);
      res.status(500).json({ error: "Failed to get difficulty settings" });
    }
  });

  // Update user difficulty settings
  app.post("/api/difficulty-settings", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { preferredDifficulty, currentSkillLevel, adaptiveDifficultyEnabled } = req.body;
      
      await storage.updateUserDifficultySettings(req.user.id, {
        preferredDifficulty,
        currentSkillLevel,
        adaptiveDifficultyEnabled
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating difficulty settings:", error);
      res.status(500).json({ error: "Failed to update difficulty settings" });
    }
  });

  // AI Review Route for Wrong Answers
  app.post("/api/quiz/review-wrong-answers", async (req: any, res) => {
    try {
      const { wrongAnswers, quizType, sectionOrChapter } = req.body;

      if (!wrongAnswers || !Array.isArray(wrongAnswers) || wrongAnswers.length === 0) {
        return res.status(400).json({ error: "No wrong answers provided for review" });
      }

      const review = await reviewWrongAnswers(wrongAnswers, quizType, sectionOrChapter);
      
      res.json(review);
    } catch (error: any) {
      console.error("Error reviewing wrong answers:", error);
      res.status(500).json({ error: "Failed to review wrong answers: " + error.message });
    }
  });

  // Interactive Quiz Routes
  
  // Start a quiz for a specific section with adaptive difficulty
  app.post("/api/quiz/:section/start", async (req: any, res) => {
    try {
      const { section } = req.params;
      const { difficulty } = req.body; // Optional difficulty override
      
      // Get questions for this section
      const allQuestions = await storage.getQuestionsBySection(section);
      
      // Get previously correctly answered question IDs to exclude on retakes
      let excludedQuestionIds: string[] = [];
      if (req.isAuthenticated?.()) {
        const previousAttempts = await storage.getUserQuizAttempts(req.user.id, section);
        
        // Extract question IDs that were answered correctly in previous attempts
        for (const attempt of previousAttempts) {
          if (attempt.questions && Array.isArray(attempt.questions)) {
            const correctlyAnswered = attempt.questions
              .filter((q: any) => q.isCorrect)
              .map((q: any) => q.questionId);
            excludedQuestionIds.push(...correctlyAnswered);
          }
        }
        // Remove duplicates
        excludedQuestionIds = Array.from(new Set(excludedQuestionIds));
      }
      
      // Filter out previously correctly answered questions for retakes
      const availableQuestions = allQuestions.filter(q => !excludedQuestionIds.includes(q.id));
      
      if (availableQuestions.length === 0) {
        return res.status(404).json({ error: "No new questions available for this section" });
      }

      // Determine user's difficulty preferences (default to easy for non-authenticated users)
      let userDifficulty = 'easy';
      let adaptiveEnabled = true;
      
      if (req.isAuthenticated?.()) {
        const user = await storage.getUser(req.user.id);
        if (user) {
          userDifficulty = user.currentSkillLevel || 'easy';
          adaptiveEnabled = user.adaptiveDifficultyEnabled !== false;
        }
      }

      // Use override difficulty if provided, otherwise use user's adaptive level
      const targetDifficulty = difficulty || (adaptiveEnabled ? userDifficulty : 'easy');
      
      // Adaptive difficulty distribution based on user's skill level
      let questionDistribution: { easy: number; hard: number; very_hard: number };
      
      switch (targetDifficulty) {
        case 'easy':
          questionDistribution = { easy: 15, hard: 3, very_hard: 2 }; // Beginner friendly
          break;
        case 'hard':
          questionDistribution = { easy: 8, hard: 8, very_hard: 4 }; // Intermediate
          break;
        case 'very_hard':
          questionDistribution = { easy: 5, hard: 7, very_hard: 8 }; // Advanced
          break;
        default:
          questionDistribution = { easy: 10, hard: 5, very_hard: 5 }; // Balanced
      }
      
      // Filter available questions by difficulty (treating medium as easy for compatibility)
      const easyQuestions = availableQuestions.filter(q => q.difficulty === 'easy' || q.difficulty === 'medium');
      const hardQuestions = availableQuestions.filter(q => q.difficulty === 'hard');
      const veryHardQuestions = availableQuestions.filter(q => q.difficulty === 'very_hard');
      
      // Select questions based on adaptive distribution
      const selectedQuestions = [
        ...easyQuestions.sort(() => Math.random() - 0.5).slice(0, Math.min(questionDistribution.easy, easyQuestions.length)),
        ...hardQuestions.sort(() => Math.random() - 0.5).slice(0, Math.min(questionDistribution.hard, hardQuestions.length)),
        ...veryHardQuestions.sort(() => Math.random() - 0.5).slice(0, Math.min(questionDistribution.very_hard, veryHardQuestions.length))
      ];
      
      // Fill remaining slots if needed
      if (selectedQuestions.length < 20) {
        const remaining = availableQuestions.filter(q => !selectedQuestions.find(sq => sq.id === q.id));
        selectedQuestions.push(...remaining.sort(() => Math.random() - 0.5).slice(0, 20 - selectedQuestions.length));
      }
      
      // Final shuffle and limit to 20 questions
      const shuffledQuestions = selectedQuestions.sort(() => Math.random() - 0.5).slice(0, 20);
      
      res.json({
        id: `quiz-${section}-${Date.now()}`,
        section,
        questions: shuffledQuestions.map(q => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          codeReference: q.codeReference,
          difficulty: q.difficulty
        }))
      });
    } catch (error: any) {
      console.error("Error starting quiz:", error);
      res.status(500).json({ error: "Failed to start quiz" });
    }
  });

  // Submit quiz answers
  app.post("/api/quiz/:section/submit", async (req: any, res) => {
    try {
      const { section } = req.params;
      const { contentId, questions, timeSpent } = req.body;
      
      if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({ error: "Questions data is required" });
      }
      
      // Get content info to determine if this is a chapter review
      const contentResults = contentId ? await storage.getCourseContent(contentId) : null;
      const content = Array.isArray(contentResults) ? contentResults[0] : contentResults;
      const isChapterReview = content?.title?.toLowerCase().includes('chapter review') || false;
      
      // Calculate score
      const correctAnswers = questions.filter(q => q.isCorrect).length;
      const totalQuestions = questions.length;
      const score = Math.round((correctAnswers / totalQuestions) * 100);
      
      // Check pass threshold: 80% for chapter reviews, 70% for regular quizzes
      const requiredScore = isChapterReview ? 80 : 70;
      const passed = score >= requiredScore;
      
      // Store quiz attempt and update adaptive difficulty if user is authenticated
      let attemptId = null;
      if (req.isAuthenticated?.()) {
        const attempt = await storage.createQuizAttempt({
          userId: req.user.id,
          contentId: contentId,
          courseId: content?.courseId || 'b83c6ebe-f5bd-4787-8fd5-e3b177d9e79b',
          chapter: content?.chapter || 1,
          section: parseInt(section),
          score: score.toString(),
          totalQuestions: totalQuestions,
          correctAnswers: correctAnswers,
          passed: passed,
          questions: questions.map(q => ({
            questionId: q.id,
            userAnswer: q.userAnswer,
            correctAnswer: q.correctAnswer,
            isCorrect: q.isCorrect
          }))
        });

        // Update user skill level based on performance (adaptive difficulty)
        const user = await storage.getUser(req.user.id);
        if (user && user.adaptiveDifficultyEnabled) {
          let newSkillLevel = user.currentSkillLevel || 'easy';
          
          // Skill level progression logic
          if (score >= 85 && user.currentSkillLevel === 'easy') {
            newSkillLevel = 'hard'; // Promote to intermediate
          } else if (score >= 90 && user.currentSkillLevel === 'hard') {
            newSkillLevel = 'very_hard'; // Promote to advanced
          } else if (score < 60 && user.currentSkillLevel === 'very_hard') {
            newSkillLevel = 'hard'; // Demote to intermediate
          } else if (score < 50 && user.currentSkillLevel === 'hard') {
            newSkillLevel = 'easy'; // Demote to beginner
          }
          
          // Update skill level if it changed
          if (newSkillLevel !== user.currentSkillLevel) {
            await storage.updateUserDifficultySettings(req.user.id, {
              currentSkillLevel: newSkillLevel
            });
          }
        }
        attemptId = attempt.id;
        
        // If passed, unlock next section and update progress
        if (passed && content) {
          await storage.updateSectionProgress(
            req.user.id,
            content.courseId,
            content.chapter!,
            content.section!,
            {
              quizPassed: true,
              highestScore: score.toString(),
              attemptCount: 1,
              lastAttemptAt: new Date(),
            }
          );
          
          // Unlock next section
          await storage.unlockNextSection(req.user.id, content.courseId, content.chapter!, content.section!);
        }
      }
      
      res.json({
        attemptId,
        score,
        passed,
        requiredScore,
        correctAnswers,
        totalQuestions,
        timeSpent,
        incorrectQuestions: questions.filter(q => !q.isCorrect)
      });
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ error: "Failed to submit quiz" });
    }
  });

  // Chapter Test Routes (100 questions, hard/very_hard only, 1.5hr limit, 80% pass)
  
  // Start a chapter test for a specific chapter
  app.post("/api/chapter-test/:chapter/start", async (req: any, res) => {
    try {
      const { chapter } = req.params;
      const courseId = req.body.courseId || 'b83c6ebe-f5bd-4787-8fd5-e3b177d9e79b'; // Default to Louisiana Journeyman Prep
      
      // Get all questions for all sections in this chapter, hard and very_hard only
      const allQuestions = await storage.getQuestionsByCourse(courseId);
      const chapterQuestions = allQuestions.filter(q => 
        (q.difficulty === 'hard' || q.difficulty === 'very_hard') && 
        (q.category?.includes(`Chapter ${chapter}`) || q.codeReference?.includes(`Section 10${chapter}`))
      );
      
      // Get previously correctly answered question IDs to exclude on chapter test retakes
      let excludedQuestionIds: string[] = [];
      if (req.isAuthenticated?.()) {
        const previousAttempts = await storage.getUserQuizAttempts(req.user.id, `chapter-test-${chapter}`);
        
        // Extract question IDs that were answered correctly in previous attempts
        for (const attempt of previousAttempts) {
          if (attempt.questions && Array.isArray(attempt.questions)) {
            const correctlyAnswered = attempt.questions
              .filter((q: any) => q.isCorrect)
              .map((q: any) => q.questionId);
            excludedQuestionIds.push(...correctlyAnswered);
          }
        }
        // Remove duplicates
        excludedQuestionIds = Array.from(new Set(excludedQuestionIds));
      }
      
      // Filter out previously correctly answered questions for chapter test retakes
      const availableQuestions = chapterQuestions.filter(q => !excludedQuestionIds.includes(q.id));
      
      if (availableQuestions.length < 50) {
        return res.status(404).json({ error: "Insufficient new questions for chapter test. Need at least 50 hard/very_hard questions not previously answered correctly." });
      }

      // Select 100 questions: mix of hard and very_hard (no easy questions for chapter tests)
      const hardQuestions = availableQuestions.filter(q => q.difficulty === 'hard');
      const veryHardQuestions = availableQuestions.filter(q => q.difficulty === 'very_hard');
      
      // Chapter test distribution: 40 hard, 60 very_hard for maximum challenge
      const selectedQuestions = [
        ...hardQuestions.sort(() => Math.random() - 0.5).slice(0, Math.min(40, hardQuestions.length)),
        ...veryHardQuestions.sort(() => Math.random() - 0.5).slice(0, Math.min(60, veryHardQuestions.length))
      ];
      
      // Fill remaining slots if needed with available questions
      if (selectedQuestions.length < 100) {
        const remaining = availableQuestions.filter(q => !selectedQuestions.find(sq => sq.id === q.id));
        selectedQuestions.push(...remaining.sort(() => Math.random() - 0.5).slice(0, 100 - selectedQuestions.length));
      }
      
      // Final shuffle and limit to exactly 100 questions
      const shuffledQuestions = selectedQuestions.sort(() => Math.random() - 0.5).slice(0, 100);
      
      res.json({
        id: `chapter-test-${chapter}-${Date.now()}`,
        chapter,
        courseId,
        timeLimit: 90, // 1.5 hours in minutes
        requiredScore: 80, // 80% pass requirement
        questionCount: shuffledQuestions.length,
        questions: shuffledQuestions.map(q => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          codeReference: q.codeReference,
          difficulty: q.difficulty
        }))
      });
    } catch (error: any) {
      console.error("Error starting chapter test:", error);
      res.status(500).json({ error: "Failed to start chapter test" });
    }
  });

  // Submit chapter test answers
  app.post("/api/chapter-test/:chapter/submit", async (req: any, res) => {
    try {
      const { chapter } = req.params;
      const { courseId, questions, timeSpent, timeLimit } = req.body;
      
      if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({ error: "Questions data is required" });
      }
      
      // Validate time limit (1.5 hours = 90 minutes)
      const timeLimitMinutes = timeLimit || 90;
      const timeLimitExceeded = timeSpent > (timeLimitMinutes * 60); // Convert to seconds
      
      // Calculate score
      const correctAnswers = questions.filter(q => q.isCorrect).length;
      const totalQuestions = questions.length;
      const score = Math.round((correctAnswers / totalQuestions) * 100);
      
      // Chapter tests require 80% to pass
      const requiredScore = 80;
      const passed = score >= requiredScore && !timeLimitExceeded;
      
      // Store chapter test attempt if user is authenticated
      let attemptId = null;
      if (req.isAuthenticated?.()) {
        const attempt = await storage.createQuizAttempt({
          userId: req.user.id,
          contentId: `chapter-test-${chapter}`,
          courseId: courseId || 'b83c6ebe-f5bd-4787-8fd5-e3b177d9e79b',
          chapter: parseInt(chapter),
          section: 999, // Special section for chapter tests
          score: score.toString(),
          totalQuestions: totalQuestions,
          correctAnswers: correctAnswers,
          passed: passed,
          questions: questions.map(q => ({
            questionId: q.id,
            userAnswer: q.userAnswer,
            correctAnswer: q.correctAnswer,
            isCorrect: q.isCorrect
          }))
        });
        
        attemptId = attempt.id;
        
        // If passed, unlock next chapter
        if (passed) {
          const nextChapter = parseInt(chapter) + 1;
          await storage.updateSectionProgress(
            req.user.id,
            courseId,
            parseInt(chapter),
            999, // Special section number for chapter completion
            {
              quizPassed: true,
              highestScore: score.toString(),
              lastAttemptAt: new Date(),
            }
          );
          
          // Unlock first section of next chapter if it exists
          if (nextChapter <= 5) { // Assuming 5 chapters max
            await storage.unlockNextSection(req.user.id, courseId, nextChapter, 1);
          }
        }
      }
      
      res.json({
        attemptId,
        score,
        passed,
        requiredScore,
        correctAnswers,
        totalQuestions,
        timeSpent,
        timeLimitExceeded,
        timeLimit: timeLimitMinutes,
        incorrectQuestions: questions.filter(q => !q.isCorrect)
      });
    } catch (error: any) {
      console.error("Error submitting chapter test:", error);
      res.status(500).json({ error: "Failed to submit chapter test" });
    }
  });

  // Amazon Affiliate Product Search Routes
  app.get("/api/amazon/search", async (req, res) => {
    try {
      const { query, category, maxResults } = req.query;
      
      // Amazon affiliate functionality temporarily disabled
      // const { amazonAffiliate } = await import('./amazon-affiliate');
      
      const products: any[] = [];
      // const products = await amazonAffiliate.searchProducts({
      //   query: query as string || '',
      //   category: category as string,
      //   maxResults: maxResults ? parseInt(maxResults as string) : 12
      // });
      
      res.json({ products });
    } catch (error: any) {
      console.error("Error searching Amazon products:", error);
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  app.get("/api/amazon/featured", async (req, res) => {
    try {
      // Amazon affiliate functionality temporarily disabled
      // const { amazonAffiliate } = await import('./amazon-affiliate');
      const products: any[] = [];
      // const products = await amazonAffiliate.getFeaturedProducts();
      
      res.json({ products });
    } catch (error: any) {
      console.error("Error getting featured products:", error);
      res.status(500).json({ message: "Failed to get featured products" });
    }
  });

  app.get("/api/amazon/tools", async (req, res) => {
    try {
      // Amazon affiliate functionality temporarily disabled
      // const { amazonAffiliate } = await import('./amazon-affiliate');
      const products: any[] = [];
      // const products = await amazonAffiliate.getPopularTools();
      
      res.json({ products });
    } catch (error: any) {
      console.error("Error getting popular tools:", error);
      res.status(500).json({ message: "Failed to get popular tools" });
    }
  });

  // Study Companion AI Chat Routes
  app.get("/api/study-companion/chat", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const conversations = await storage.getStudyCompanionConversations(userId);
      res.json(conversations);
    } catch (error: any) {
      console.error("Error fetching study companion chat:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  app.post("/api/study-companion/chat", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const { message, context } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      // Get user's chat history for context
      const chatHistory = await storage.getStudyCompanionConversations(userId);
      
      // Get user's progress for personalized responses
      const userProgress = context || await storage.getUserProgress(userId);

      // Save user message
      const userMessageData = {
        id: crypto.randomUUID(),
        userId,
        role: "user" as const,
        content: message.trim(),
        timestamp: new Date(),
      };
      await storage.saveStudyCompanionMessage(userMessageData);

      // Generate AI response
      const aiResponse = await StudyCompanionService.generateResponse(
        message,
        userProgress,
        chatHistory.slice(-10) // Last 10 messages for context
      );

      // Save AI response
      const aiMessageData = {
        id: crypto.randomUUID(),
        userId,
        role: "assistant" as const,
        content: aiResponse.content,
        emotion: aiResponse.emotion,
        timestamp: new Date(),
      };
      await storage.saveStudyCompanionMessage(aiMessageData);

      res.json({
        userMessage: userMessageData,
        aiResponse: aiMessageData
      });

    } catch (error: any) {
      console.error("Error in study companion chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.get("/api/user/progress", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error: any) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  app.get("/api/study-companion/suggestions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const userProgress = await storage.getUserProgress(userId);
      const suggestions = await StudyCompanionService.generateStudySuggestions(userProgress);
      res.json({ suggestions });
    } catch (error: any) {
      console.error("Error generating study suggestions:", error);
      res.status(500).json({ message: "Failed to generate suggestions" });
    }
  });

  // Individual Podcast Import Route
  app.post("/api/admin/podcasts", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { title, description, hostName, guestName, segments, totalSegments, duration, status } = req.body;
      
      if (!title || !segments || !Array.isArray(segments)) {
        return res.status(400).json({ error: "Title and segments array are required" });
      }
      
      // Convert segments to podcast content format
      const podcastContent = {
        title,
        description: description || "",
        hostName: hostName || "Host",
        guestName: guestName || "Guest",
        segments,
        totalSegments: totalSegments || segments.length,
        duration: duration || Math.round(segments.length * 15),
        status: status || "draft"
      };
      
      const podcast = await storage.createCourseContent({
        courseId: "5f02238b-afb2-4e7f-a488-96fb471fee56", // Default to Louisiana Journeyman course
        type: 'podcast',
        title: title,
        content: podcastContent,
        chapter: 1,
        section: 101,
        difficulty: 'easy'
      });
      
      res.json({ success: true, podcast });
    } catch (error: any) {
      console.error("Error creating podcast:", error);
      res.status(500).json({ error: "Failed to create podcast" });
    }
  });

  // TTS Episode Creation Route
  app.post("/api/admin/podcast/create-episode", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { courseId, chapter, section, difficulty, title, transcript, audioUrl, duration, contentId, type } = req.body;
      
      if (!courseId || !title || !transcript) {
        return res.status(400).json({ error: "courseId, title, and transcript are required" });
      }
      
      // Helper function to extract chapter number from chapter string
      const extractChapterNumber = (chapterStr: string) => {
        if (!chapterStr) return 1;
        const match = chapterStr.match(/chapter\s*(\d+)/i);
        return match ? parseInt(match[1]) : 1;
      };
      
      // Extract section number from section string
      const extractSectionNumber = (sectionStr: string) => {
        if (!sectionStr) return 101;
        const num = parseInt(sectionStr.replace(/\D/g, ''));
        return num || 101;
      };
      
      // Build podcast content object with TTS audio integration
      const podcastContent = {
        title: title,
        transcript: transcript,
        duration: duration || 180,
        type: 'podcast',
        audioUrl: audioUrl || null,
        contentId: contentId || null,
        // Convert transcript to segments format for the podcast player
        segments: transcript.split('\n').map((line: string, index: number) => ({
          speaker: index % 2 === 0 ? "host" : "guest", 
          text: line.trim()
        })).filter((segment: any) => segment.text.length > 0),
        // Add text property for lessons that expect it
        text: transcript
      };

      const chapterNum = extractChapterNumber(chapter);
      const sectionNum = extractSectionNumber(section);
      
      // Check for duplicates by title and section
      const existingContent = await storage.getCourseContentBySection(courseId, sectionNum, 'podcast');
      if (existingContent && existingContent.title === title) {
        return res.status(409).json({ 
          error: "Episode with this title already exists in this section",
          existing: existingContent 
        });
      }

      const createdEpisode = await storage.createCourseContent({
        courseId: courseId,
        type: 'podcast',
        title: title,
        content: podcastContent,
        duration: Math.ceil((duration || 180) / 60), // Convert to minutes
        chapter: chapterNum,
        section: sectionNum,
        difficulty: (difficulty || 'medium') as 'easy' | 'hard' | 'very_hard'
      });
      
      res.json({ 
        success: true, 
        episode: createdEpisode,
        message: `Episode "${title}" created successfully and is now available to students`
      });
    } catch (error: any) {
      console.error("Error creating TTS episode:", error);
      res.status(500).json({ error: "Failed to create episode: " + error.message });
    }
  });

  // Bulk Podcast Import Route  
  app.post("/api/admin/podcast/bulk-import", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user.email?.includes('admin') && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { courseId, episodes } = req.body;
      
      if (!courseId || !episodes || !Array.isArray(episodes)) {
        return res.status(400).json({ error: "courseId and episodes array are required" });
      }
      
      // Helper function to extract chapter number from chapter string
      const extractChapterNumber = (chapterStr: string) => {
        if (!chapterStr) return 1;
        const match = chapterStr.match(/chapter\s*(\d+)/i);
        return match ? parseInt(match[1]) : 1;
      };

      // Create podcasts using episode data from the frontend
      const createdPodcasts = await Promise.all(
        episodes.map((episode: any) => {
          // Build podcast content object with segments format expected by the player
          const podcastContent = {
            title: episode.title,
            transcript: episode.transcript,
            duration: episode.duration,
            wordCount: episode.wordCount,
            episodeNumber: episode.episodeNumber,
            type: 'podcast',
            // Convert transcript to segments format for the podcast player
            segments: episode.transcript.split('\n').map((line: string, index: number) => ({
              speaker: index % 2 === 0 ? "host" : "guest", 
              text: line.trim()
            })).filter((segment: any) => segment.text.length > 0)
          };

          return storage.createCourseContent({
            courseId: courseId,
            type: 'podcast',
            title: episode.title,
            content: podcastContent,
            // Convert duration from seconds to minutes (integer)
            duration: Math.ceil((episode.duration || 180) / 60),
            // Use values from episode metadata
            chapter: extractChapterNumber(episode.chapter || 'Chapter 1'),
            section: parseInt(episode.section) || 101,
            difficulty: (episode.difficulty || 'easy') as 'easy' | 'hard' | 'very_hard'
          });
        })
      );
      
      res.json({ 
        success: true, 
        imported: createdPodcasts.length,
        podcasts: createdPodcasts
      });
    } catch (error: any) {
      console.error("Error bulk importing podcasts:", error);
      res.status(500).json({ error: "Failed to import podcasts" });
    }
  });

  // Generate audio files from existing podcast scripts
  app.post("/api/admin/generate-podcast-audio", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (req.user.email !== 'admin@latraining.com' && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      // Get all podcast content from database
      const allContent = await storage.getCourseContent('b83c6ebe-f5bd-4787-8fd5-e3b177d9e79b');
      const podcastContent = allContent.filter((item: any) => item.type === 'podcast');
      
      const results = [];
      
      for (const content of podcastContent) {
        try {
          // Extract transcript text from various possible fields
          const contentObj = content.content as any;
          const scriptText = contentObj?.transcript || 
                            contentObj?.text || 
                            (content as any).transcript || 
                            '';
          
          if (!scriptText) continue;
          
          // Strip HTML tags and clean text
          const plainText = scriptText
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
            
          if (plainText.length < 50) continue; // Skip if too short
          
          // Generate audio using existing OpenAI function
          const audioUrl = await generateAudio(plainText, `section-${content.section}-podcast`);
          
          // CRITICAL: Update the database with the generated audio URL
          const updatedContent = {
            ...contentObj,
            audioUrl: audioUrl
          };
          
          await storage.updateCourseContent(content.id, {
            content: updatedContent
          });
          
          results.push({
            section: content.section,
            audioUrl,
            textLength: plainText.length,
            success: true
          });
          
          console.log(`Generated and saved audio for Section ${content.section}: ${audioUrl}`);
          
        } catch (error: any) {
          console.error(`Failed to generate audio for Section ${content.section}:`, error);
          results.push({
            section: content.section,
            success: false,
            error: error.message
          });
        }
      }
      
      res.json({ 
        success: true, 
        message: `Generated audio for ${results.filter(r => r.success).length} podcast episodes`,
        results 
      });
      
    } catch (error: any) {
      console.error("Error generating podcast audio:", error);
      res.status(500).json({ error: "Failed to generate podcast audio: " + error.message });
    }
  });

  // Extract podcast content from QuizGecko URLs
  app.post("/api/admin/extract-quizgecko-content", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (req.user.email !== 'admin@latraining.com' && req.user.subscriptionTier !== 'master') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    try {
      const { courseId, urls, chapter, section, difficulty } = req.body;
      
      // Validate required fields
      if (!courseId || !urls || !Array.isArray(urls)) {
        return res.status(400).json({ error: "courseId and urls array are required" });
      }
      
      // Validate and filter URLs to only allow QuizGecko domains
      const validUrls = [];
      for (const url of urls) {
        try {
          const urlObj = new URL(url);
          // Only allow QuizGecko domains for security
          if (urlObj.protocol === 'https:' && urlObj.hostname.includes('quizgecko.com')) {
            validUrls.push(url);
          } else {
            console.warn(`Rejected non-QuizGecko URL: ${url}`);
          }
        } catch (error) {
          console.warn(`Invalid URL format: ${url}`);
        }
      }
      
      if (validUrls.length === 0) {
        return res.status(400).json({ error: "No valid QuizGecko URLs provided" });
      }
      
      // Get existing sections to show user what they already have
      const existingSections = await storage.getExistingSections(courseId);
      console.log(`Course already has content for sections: ${existingSections.join(', ')}`);
      
      const extractedEpisodes = [];
      const errors = [];
      const skippedSections = [];
      
      for (const url of validUrls) {
        try {
          console.log(`Extracting content from URL: ${url}`);
          
          // Use existing content extractor to get podcast content
          const extractedContent = await contentExtractor.extractFromQuizGecko(url, 'podcast');
          
          if (extractedContent && extractedContent.type === 'podcast') {
            // Extract section number from title or content
            const sectionNumber = extractedContent.content.sectionNumber || 
                                 parseInt(section) || 
                                 parseInt(extractedContent.title.match(/§?(\d+)/)?.[1] || '0');
            
            // Check for duplicates by section and type (skill-level aware)
            const existingBySection = await storage.getCourseContentBySection(courseId, sectionNumber, 'podcast');
            
            if (existingBySection) {
              console.log(`Skipping content for section ${sectionNumber} - already exists: ${existingBySection.title}`);
              skippedSections.push(sectionNumber);
              errors.push(`Section ${sectionNumber} content already exists (${existingBySection.title})`);
              continue;
            }
            
            // Also check by exact title as fallback
            const existingByTitle = await storage.getCourseContentByTitle(courseId, extractedContent.title);
            
            if (existingByTitle) {
              console.log(`Skipping duplicate title: ${extractedContent.title}`);
              errors.push(`Duplicate title skipped: ${extractedContent.title}`);
              continue;
            }
            
            // Create course content entry
            const podcastContent = {
              title: extractedContent.title,
              transcript: extractedContent.content.transcript,
              audioUrl: extractedContent.content.audioUrl || null, // QuizGecko may have hosted audio
              description: extractedContent.content.description,
              extractedAt: new Date().toISOString(),
              sourceUrl: url,
              type: 'podcast'
            };
            
            const courseContent = await storage.createCourseContent({
              courseId: courseId,
              type: 'podcast',
              title: extractedContent.title,
              content: podcastContent,
              duration: extractedContent.duration || Math.ceil((extractedContent.content.transcript?.length || 0) / 1000),
              chapter: parseInt(chapter) || 1,
              section: parseInt(section) || 101,
              difficulty: (difficulty || 'easy') as 'easy' | 'hard' | 'very_hard'
            });
            
            extractedEpisodes.push(courseContent);
            console.log(`Successfully extracted and saved content from ${url}`);
          } else {
            errors.push(`No podcast content found at ${url}`);
          }
        } catch (error: any) {
          console.error(`Failed to extract content from ${url}:`, error);
          errors.push(`Failed to extract ${url}: ${error.message}`);
        }
      }
      
      res.json({ 
        success: true, 
        message: `Extracted ${extractedEpisodes.length} new podcast episodes from QuizGecko`,
        episodes: extractedEpisodes,
        existingSections: existingSections,
        skippedSections: Array.from(new Set(skippedSections)),
        summary: {
          imported: extractedEpisodes.length,
          skipped: errors.length,
          alreadyHaveSections: existingSections
        },
        errors: errors.length > 0 ? errors : undefined
      });
      
    } catch (error: any) {
      console.error("Error extracting QuizGecko content:", error);
      res.status(500).json({ error: "Failed to extract QuizGecko content: " + error.message });
    }
  });

  // Text-to-Speech conversion endpoint
  app.post("/api/text-to-speech", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const { text, title } = req.body;

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ message: "Text content is required" });
      }

      if (text.length > 4096) {
        return res.status(400).json({ message: "Text content must be 4096 characters or less" });
      }

      // Generate unique content ID for this audio file
      const contentId = `tts-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Strip HTML tags from text for clean audio
      const cleanText = text.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();

      // Generate audio using existing OpenAI TTS function
      const audioUrl = await generateAudio(cleanText, contentId);

      res.json({
        success: true,
        audioUrl,
        contentId,
        title: title || "Generated Audio",
        originalText: text,
        cleanText,
        duration: Math.ceil(cleanText.length / 12) // Rough estimate: ~12 chars per second
      });

    } catch (error: any) {
      console.error("Text-to-speech conversion error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to convert text to speech: " + error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
