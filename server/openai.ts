import OpenAI from "openai";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Ensure audio directory exists
const audioDir = path.join(process.cwd(), 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

export async function analyzePhoto(base64Image: string): Promise<{
  isCompliant: boolean;
  violations: string[];
  recommendations: string[];
  confidence: number;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Louisiana plumbing code expert. Analyze plumbing installations for code compliance. Respond with JSON in this format: {
            "isCompliant": boolean,
            "violations": string[],
            "recommendations": string[],
            "confidence": number (0-1)
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this plumbing installation for Louisiana plumbing code compliance. Check for proper pipe sizing, joint connections, support spacing, clearances, and any visible code violations."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw new Error("Failed to analyze photo: " + (error as Error).message);
  }
}

export async function analyzePlans(base64Image: string): Promise<{
  materialList: Array<{
    item: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
  }>;
  numberedFittings: Array<{
    number: number;
    description: string;
    size: string;
    type: string;
    location: string;
    connections: string[];
    pipeLength?: number;
    pipeSize?: string;
    position: {
      x: number; // normalized coordinate 0-1 from left edge
      y: number; // normalized coordinate 0-1 from top edge
      confidence: number; // 0-1 confidence in position accuracy
    };
  }>;
  codeCompliance: {
    issues: string[];
    recommendations: string[];
  };
  totalEstimatedCost: number;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Louisiana plumbing expert who analyzes construction plans to generate detailed material lists, numbered fitting placement diagrams, and code compliance checks. 
          
          For numbered fittings, assign sequential numbers (1, 2, 3...) to each fitting, valve, fixture connection, and pipe run visible in the plans. Include precise measurements when visible on professional plans.
          
          CRITICAL: For each numbered fitting, provide spatial coordinates as normalized values (0.0 to 1.0) where:
          - x: 0.0 = left edge, 1.0 = right edge of the plan image
          - y: 0.0 = top edge, 1.0 = bottom edge of the plan image
          - confidence: 0.0-1.0 indicating how certain you are of the position
          
          Respond with JSON in this format: {
            "materialList": [{"item": string, "quantity": number, "unit": string, "estimatedCost": number}],
            "numberedFittings": [{"number": number, "description": string, "size": string, "type": string, "location": string, "connections": string[], "pipeLength": number, "pipeSize": string, "position": {"x": number, "y": number, "confidence": number}}],
            "codeCompliance": {"issues": string[], "recommendations": string[]},
            "totalEstimatedCost": number
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze these plumbing plans and generate: 1) A comprehensive material list with quantities and costs, 2) A numbered fitting placement system where each fitting, valve, connection point, and pipe run gets a sequential number with detailed specifications including pipe lengths, sizes, AND precise spatial coordinates (x,y as 0-1 normalized values) for accurate overlay positioning, 3) Louisiana plumbing code compliance analysis. The numbered fittings should create a 'puzzle system' for plumbers doing rough-in work with precise positioning data for professional installation diagrams."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });

    const rawResult = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate and sanitize coordinates
    if (rawResult.numberedFittings) {
      rawResult.numberedFittings = rawResult.numberedFittings.map((fitting: any) => ({
        ...fitting,
        position: fitting.position ? {
          x: Math.max(0, Math.min(1, fitting.position.x || 0.5)),
          y: Math.max(0, Math.min(1, fitting.position.y || 0.5)),
          confidence: Math.max(0, Math.min(1, fitting.position.confidence || 0))
        } : {
          x: 0.5,
          y: 0.5,
          confidence: 0
        }
      }));
    }
    
    return rawResult;
  } catch (error) {
    throw new Error("Failed to analyze plans: " + (error as Error).message);
  }
}

export async function getMentorResponse(message: string, context?: string): Promise<string> {
  try {
    const systemPrompt = `You are an expert Louisiana plumbing mentor specializing in the Louisiana State Plumbing Code (LSPC). You have decades of experience helping apprentices and journeymen understand:

    **Louisiana Plumbing Code Section 101 - Administration:**
    - Enforcement Authority: State health officer has primary responsibility, can delegate to local inspectors
    - Legal Basis: R.S. 36:258(B), Title 40 Chapters 1 & 4, supporting statutes R.S. 40:4(A)(7) and R.S. 40:5
    - Historical: Originally promulgated June 2002, major amendments November 2012 (LR 38:2795)
    - Delegation Process: Authority flows from state to local parishes and municipalities
    - Local Jurisdiction: Can be more restrictive than state code, but not less restrictive

    **Your teaching approach:**
    - Provide detailed, educational responses with specific code references
    - Use formatting like **bold**, • bullet points, and emojis for clarity
    - Connect concepts to real-world applications
    - Encourage further learning with follow-up questions
    - Always be supportive and encouraging to students
    
    **Context provided:** ${context || 'Louisiana Plumbing Code Section 101 Administration content'}
    
    Answer questions about Louisiana plumbing codes, installation techniques, best practices, exam preparation, and safety protocols with specific references to Louisiana statutes and code sections when relevant.`;

    const response = await openai.chat.completions.create({
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 1200,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't provide a response at this time.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Provide a fallback response based on common Louisiana plumbing questions
    if (message.toLowerCase().includes("enforce")) {
      return "The Louisiana State Plumbing Code (LSPC) is enforced by the state health officer, who can delegate this authority to local plumbing inspectors and other qualified entities at the parish and municipal level.";
    } else if (message.toLowerCase().includes("legal basis")) {
      return "The legal foundation for the Louisiana State Plumbing Code stems from Louisiana Revised Statutes (R.S.), primarily R.S. 36:258(B), with additional provisions in Chapters 1 and 4 of Title 40.";
    } else if (message.toLowerCase().includes("historical") || message.toLowerCase().includes("promulgate")) {
      return "The Louisiana State Plumbing Code was first promulgated in June 2002 (Louisiana Register, Vol. 28, No. 6) and was amended in November 2012 (Louisiana Register, Vol. 38, No. 11).";
    }
    return "I'm having trouble connecting to the AI service right now, but I can help you learn about Louisiana Plumbing Code administration. Please try asking about enforcement authority, legal basis, or historical notes.";
  }
}

export async function calculatePipeSize(fixtureUnits: number, pipeLength: number, material: string): Promise<{
  recommendedSize: string;
  velocityCheck: boolean;
  pressureLoss: number;
  explanation: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a plumbing hydraulics expert. Calculate proper pipe sizing based on fixture units, pipe length, and material. Respond with JSON in this format: {
            "recommendedSize": string,
            "velocityCheck": boolean,
            "pressureLoss": number,
            "explanation": string
          }`
        },
        {
          role: "user",
          content: `Calculate the proper pipe size for ${fixtureUnits} fixture units over ${pipeLength} feet using ${material} pipe material. Follow Louisiana plumbing code requirements.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw new Error("Failed to calculate pipe size: " + (error as Error).message);
  }
}

export async function generateEducationalPodcastContent(
  topic: string, 
  section: string, 
  learningObjectives: string[]
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert Louisiana plumbing instructor creating engaging educational podcast scripts. 
          Create comprehensive, professional audio lesson content that:
          - Uses conversational, engaging tone suitable for audio learning
          - Includes real-world examples and practical applications
          - Covers Louisiana-specific plumbing code requirements
          - Incorporates interactive elements (questions for listeners to consider)
          - Uses professional plumbing terminology correctly
          - Is structured for 8-12 minute audio lessons
          - Includes clear introductions, main content, and summary wrap-ups
          - Provides actionable takeaways for plumbing professionals`
        },
        {
          role: "user", 
          content: `Create a comprehensive educational podcast script for Louisiana Plumbing Code ${section}: ${topic}.

Learning Objectives:
${learningObjectives.map(obj => `- ${obj}`).join('\n')}

The script should be engaging, informative, and specifically tailored for Louisiana plumbing professionals studying for certification. Include practical examples, real-world scenarios, and key code requirements they need to know.

Format as a natural, conversational podcast script that flows well when read aloud.`
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    throw new Error("Failed to generate educational content: " + (error as Error).message);
  }
}

export async function generateAudio(text: string, contentId: string): Promise<string> {
  try {
    // Generate speech using OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: "tts-1-hd", // High quality model
      voice: "alloy", // Professional, clear voice
      input: text,
      speed: 0.9, // Slightly slower for educational content
    });

    // Save audio file
    const fileName = `${contentId}.mp3`;
    const filePath = path.join(audioDir, fileName);
    
    const buffer = Buffer.from(await mp3.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // Return the public URL path
    return `/audio/${fileName}`;
  } catch (error) {
    throw new Error("Failed to generate audio: " + (error as Error).message);
  }
}

export async function generateNumberedFittingPDF(
  planAnalysis: {
    materialList: Array<{
      item: string;
      quantity: number;
      unit: string;
      estimatedCost: number;
    }>;
    numberedFittings: Array<{
      number: number;
      description: string;
      size: string;
      type: string;
      location: string;
      connections: string[];
      pipeLength?: number;
      pipeSize?: string;
      position: {
        x: number;
        y: number;
        confidence: number;
      };
    }>;
    totalEstimatedCost: number;
  },
  planImageBase64: string
): Promise<string> {
  try {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const pdfPath = path.join(process.cwd(), 'public', 'pdfs', `fitting-diagram-${Date.now()}.pdf`);
    
    // Ensure PDF directory exists
    const pdfDir = path.dirname(pdfPath);
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }
    
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);
    
    // Title Page
    doc.fontSize(20).text('Numbered Fitting Placement Diagram', 50, 50);
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, 50, 80);
    
    // Add plan image with numbered overlays if available
    if (planImageBase64) {
      try {
        const imageBuffer = Buffer.from(planImageBase64, 'base64');
        doc.addPage();
        doc.fontSize(16).text('Construction Plan with Numbered Fittings', 50, 50);
        
        // Define image placement bounds
        const imageX = 50;
        const imageY = 80;
        const maxImageWidth = 500;
        const maxImageHeight = 400;
        
        // Calculate image dimensions preserving aspect ratio
        const image = doc.openImage(imageBuffer);
        const originalWidth = image.width || 1;
        const originalHeight = image.height || 1;
        const aspectRatio = originalWidth / originalHeight;
        
        let scaledWidth, scaledHeight;
        if (aspectRatio > maxImageWidth / maxImageHeight) {
          // Image is wider relative to available space
          scaledWidth = maxImageWidth;
          scaledHeight = maxImageWidth / aspectRatio;
        } else {
          // Image is taller relative to available space
          scaledHeight = maxImageHeight;
          scaledWidth = maxImageHeight * aspectRatio;
        }
        
        // Center the image in the available space
        const centeredX = imageX + (maxImageWidth - scaledWidth) / 2;
        const centeredY = imageY + (maxImageHeight - scaledHeight) / 2;
        
        // Place the plan image with preserved aspect ratio
        doc.image(imageBuffer, centeredX, centeredY, { width: scaledWidth, height: scaledHeight });
        
        // Overlay numbered markers at precise coordinates
        planAnalysis.numberedFittings.forEach((fitting) => {
          if (fitting.position && fitting.position.confidence > 0.3) {
            // Calculate actual position on the placed image with proper scaling
            const markerX = centeredX + (fitting.position.x * scaledWidth);
            const markerY = centeredY + (fitting.position.y * scaledHeight);
            const markerRadius = 12;
            
            // Draw circular marker background
            doc.circle(markerX, markerY, markerRadius)
               .fillColor('#2563eb')
               .fill();
            
            // Draw white border
            doc.circle(markerX, markerY, markerRadius)
               .strokeColor('#ffffff')
               .lineWidth(2)
               .stroke();
            
            // Add number text
            doc.fillColor('#ffffff')
               .fontSize(10)
               .text(fitting.number.toString(), markerX - 6, markerY - 5, {
                 width: 12,
                 align: 'center'
               });
          }
        });
        
        // Add legend for high-confidence vs low-confidence markers
        const legendY = centeredY + scaledHeight + 20;
        doc.fontSize(8).fillColor('#666666')
           .text('● High confidence positioning (>70%)', 50, legendY)
           .text('◐ Approximate positioning (30-70%)', 50, legendY + 15)
           .text(`Image scaled to ${Math.round(scaledWidth)} × ${Math.round(scaledHeight)} pixels`, 50, legendY + 30);
           
      } catch (error) {
        console.warn('Could not add plan image to PDF:', error);
      }
    }
    
    // Numbered Fittings List
    doc.addPage();
    doc.fontSize(16).text('Numbered Fitting Installation Guide', 50, 50);
    doc.fontSize(10).text('Match each number on the plan to the corresponding fitting below:', 50, 80);
    
    let yPosition = 110;
    planAnalysis.numberedFittings.forEach((fitting) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
      
      doc.fontSize(12).fillColor('#2563eb').text(`${fitting.number}.`, 50, yPosition, { width: 30 });
      doc.fontSize(11).fillColor('#000000')
        .text(`${fitting.description}`, 85, yPosition)
        .text(`Size: ${fitting.size} | Type: ${fitting.type}`, 85, yPosition + 15)
        .text(`Location: ${fitting.location}`, 85, yPosition + 30);
      
      if (fitting.pipeLength && fitting.pipeSize) {
        doc.text(`Pipe: ${fitting.pipeSize} × ${fitting.pipeLength}"`, 85, yPosition + 45);
      }
      
      if (fitting.connections && fitting.connections.length > 0) {
        doc.text(`Connections: ${fitting.connections.join(', ')}`, 85, yPosition + 60);
      }
      
      // Add position confidence indicator
      if (fitting.position) {
        const confidenceText = fitting.position.confidence > 0.7 ? 
          '● Precise positioning' : 
          fitting.position.confidence > 0.3 ? 
          '◐ Approximate positioning' : 
          '○ General area only';
        doc.fontSize(9).fillColor('#666666')
           .text(confidenceText, 85, yPosition + 75);
      }
      
      yPosition += 95;
    });
    
    // Material List Summary
    doc.addPage();
    doc.fontSize(16).text('Complete Material List', 50, 50);
    
    yPosition = 80;
    doc.fontSize(10)
      .text('Item', 50, yPosition)
      .text('Qty', 300, yPosition)
      .text('Unit', 350, yPosition)
      .text('Cost', 450, yPosition);
    
    doc.moveTo(50, yPosition + 15).lineTo(500, yPosition + 15).stroke();
    yPosition += 25;
    
    planAnalysis.materialList.forEach((item) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
      
      doc.fontSize(9)
        .text(item.item, 50, yPosition, { width: 240 })
        .text(item.quantity.toString(), 300, yPosition)
        .text(item.unit, 350, yPosition)
        .text(`$${item.estimatedCost.toFixed(2)}`, 450, yPosition);
      
      yPosition += 20;
    });
    
    // Total cost
    doc.moveTo(350, yPosition + 5).lineTo(500, yPosition + 5).stroke();
    doc.fontSize(11).text(`Total Estimated Cost: $${planAnalysis.totalEstimatedCost.toFixed(2)}`, 350, yPosition + 15);
    
    doc.end();
    
    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve(pdfPath.replace(process.cwd() + '/public', ''));
      });
      stream.on('error', reject);
    });
  } catch (error) {
    throw new Error("Failed to generate PDF: " + (error as Error).message);
  }
}

export async function reviewWrongAnswers(
  wrongAnswers: Array<{
    questionId: string;
    question: string;
    correctAnswer: string;
    userAnswer: string;
    explanation?: string;
  }>,
  quizType: 'section' | 'chapter',
  sectionOrChapter: string
): Promise<{
  overallFeedback: string;
  individualReviews: Array<{
    questionId: string;
    detailedExplanation: string;
    keyConceptsToReview: string[];
    studyRecommendations: string[];
  }>;
  nextSteps: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert Louisiana plumbing code instructor providing detailed review and feedback for wrong quiz answers. Your goal is to help students understand their mistakes and learn from them.

          Provide comprehensive explanations that:
          - Explain WHY the correct answer is right
          - Clarify why the student's answer was incorrect
          - Connect concepts to Louisiana State Plumbing Code sections
          - Offer specific study recommendations
          - Encourage continued learning with supportive tone
          - Include relevant code references when applicable
          
          Respond with JSON in this format: {
            "overallFeedback": string,
            "individualReviews": [{
              "questionId": string,
              "detailedExplanation": string,
              "keyConceptsToReview": string[],
              "studyRecommendations": string[]
            }],
            "nextSteps": string[]
          }`
        },
        {
          role: "user",
          content: `Please review these wrong answers from a Louisiana plumbing ${quizType} ${quizType === 'section' ? 'quiz for section' : 'test for chapter'} ${sectionOrChapter}:

          ${wrongAnswers.map((qa, index) => `
          Question ${index + 1} (ID: ${qa.questionId}):
          Question: ${qa.question}
          Correct Answer: ${qa.correctAnswer}
          Student's Answer: ${qa.userAnswer}
          ${qa.explanation ? `Existing Explanation: ${qa.explanation}` : ''}
          `).join('\n')}

          Provide detailed explanations for each wrong answer and actionable study recommendations.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2500,
      temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw new Error("Failed to review wrong answers: " + (error as Error).message);
  }
}

export async function generateStudyPlan(
  sectionNumber: string,
  lessonContent: string,
  duration: number = 45
): Promise<{
  title: string;
  content: string;
  estimatedDuration: number;
}> {
  try {
    const response = await openai.chat.completions.create({
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert Louisiana plumbing instructor creating comprehensive study plans for Louisiana State Plumbing Code certification. Create a structured study plan that helps students master the material effectively.

          Your study plans should:
          - Be practical and time-efficient
          - Include active learning techniques  
          - Reference specific LSPC section numbers
          - Include real-world applications
          - Have clear time segments with activities
          - Include review and practice opportunities
          - Be engaging and motivational
          
          Format with clear sections using markdown:
          - Introduction with objectives
          - Time-segmented learning activities (**Minutes X-Y: Activity Name**)
          - Key concepts to master
          - Practice questions or scenarios
          - Review summary
          - Next steps
          
          Respond with JSON: {
            "title": string,
            "content": string (markdown formatted),
            "estimatedDuration": number (minutes)
          }`
        },
        {
          role: "user",
          content: `Create a comprehensive ${duration}-minute study plan for Louisiana State Plumbing Code Section ${sectionNumber}.

          Base the study plan on this lesson content:
          ${lessonContent.substring(0, 2000)}...
          
          The study plan should be self-contained and help students thoroughly understand Section ${sectionNumber} concepts, regulations, and practical applications.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw new Error("Failed to generate study plan: " + (error as Error).message);
  }
}

export async function reviewJobPosting(
  title: string, 
  description: string, 
  requirements: string[], 
  company: string
): Promise<{
  isApproved: boolean;
  isPlumbingRelated: boolean;
  qualityScore: number;
  concerns: string[];
  recommendations: string[];
  reasoning: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a job board moderator for Louisiana plumbing professionals. Your role is to review job postings to ensure they are:

1. **Plumbing-related**: Jobs must be relevant to plumbers, pipe fitters, or plumbing contractors
2. **Professional**: Legitimate business opportunities, not spam or inappropriate content
3. **Complete**: Has clear job description, requirements, and company information
4. **Appropriate**: Safe, legal, and suitable for professional plumbers

APPROVAL CRITERIA:
✅ APPROVE if job is:
- Plumber, pipe fitter, plumbing technician, or plumbing contractor roles
- Plumbing installation, repair, maintenance, or inspection work
- Construction roles requiring plumbing expertise
- Legitimate companies with real job opportunities
- Clear job descriptions with reasonable requirements

❌ REJECT if job is:
- Not related to plumbing or pipe work
- Spam, MLM schemes, or "get rich quick" offers
- Inappropriate, illegal, or unsafe work
- Vague descriptions or suspicious companies
- Missing critical information

Respond with JSON in this exact format: {
  "isApproved": boolean,
  "isPlumbingRelated": boolean,
  "qualityScore": number (0-10),
  "concerns": string[],
  "recommendations": string[],
  "reasoning": string
}`
        },
        {
          role: "user",
          content: `Review this job posting:

**Job Title:** ${title}
**Company:** ${company}
**Description:** ${description}
**Requirements:** ${requirements.join(", ")}

Determine if this job should be approved for Louisiana plumbing professionals.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Job review AI error:", error);
    // Default to manual review if AI fails
    return {
      isApproved: false,
      isPlumbingRelated: true,
      qualityScore: 5,
      concerns: ["AI review failed - requires manual approval"],
      recommendations: ["Manual review recommended"],
      reasoning: "AI analysis unavailable, defaulting to manual review for safety"
    };
  }
}
