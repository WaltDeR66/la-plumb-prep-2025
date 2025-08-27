import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    const systemPrompt = `You are an expert Louisiana plumbing mentor with decades of experience. You help apprentices and journeymen with:
    - Louisiana plumbing code interpretation
    - Installation techniques and best practices
    - Problem-solving guidance
    - Exam preparation
    - Safety protocols
    
    Provide helpful, accurate, and encouraging responses. Reference specific Louisiana plumbing codes when relevant.
    ${context ? `Context: ${context}` : ''}`;

    const response = await openai.chat.completions.create({
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
      max_tokens: 800,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't provide a response at this time.";
  } catch (error) {
    throw new Error("Failed to get mentor response: " + (error as Error).message);
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
