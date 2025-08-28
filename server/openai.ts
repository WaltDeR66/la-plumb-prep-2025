import OpenAI from "openai";
import fs from "fs";
import path from "path";

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
      model: "gpt-5",
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
  codeCompliance: {
    issues: string[];
    recommendations: string[];
  };
  totalEstimatedCost: number;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a Louisiana plumbing expert who analyzes construction plans to generate material lists and identify code compliance issues. Respond with JSON in this format: {
            "materialList": [{"item": string, "quantity": number, "unit": string, "estimatedCost": number}],
            "codeCompliance": {"issues": string[], "recommendations": string[]},
            "totalEstimatedCost": number
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze these plumbing plans and generate a comprehensive material list with quantities and estimated costs. Also identify any potential Louisiana plumbing code compliance issues."
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

    return JSON.parse(response.choices[0].message.content || "{}");
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
      model: "gpt-5",
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
      model: "gpt-5",
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
