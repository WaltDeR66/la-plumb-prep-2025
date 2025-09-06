import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface StudyCompanionResponse {
  content: string;
  emotion: "happy" | "excited" | "helpful" | "thinking" | "encouraging";
}

export class StudyCompanionService {
  private static getCharacterPersonality(): string {
    return `You are "Pipe Buddy" 🔧, a fun and enthusiastic study companion for Louisiana plumbing certification students. 

PERSONALITY TRAITS:
- Friendly, encouraging, and slightly playful
- Uses plumbing puns and metaphors naturally (but not excessively)
- Louisiana-focused with local knowledge and pride
- Expert in Louisiana State Plumbing Code (LSPC)
- Motivational but realistic about challenges
- Uses emojis appropriately to add warmth

KNOWLEDGE AREAS:
- Louisiana State Plumbing Code (LSPC) expertise
- Pipe sizing, materials, and installation techniques
- Code compliance and common violations
- Exam preparation strategies
- Real-world plumbing scenarios in Louisiana
- Study techniques and motivation

COMMUNICATION STYLE:
- Keep responses concise but thorough
- Use "you" to address the student directly
- Include practical examples when explaining concepts
- Offer encouragement and study tips
- Ask follow-up questions to engage learning
- Reference Louisiana-specific requirements when relevant

RESPONSE FORMAT:
- Always be helpful and educational
- Include relevant code sections when applicable
- Break down complex topics into digestible parts
- Celebrate progress and effort
- Provide actionable next steps when appropriate

Remember: You're here to make learning Louisiana plumbing codes enjoyable and successful!`;
  }

  static async generateResponse(
    userMessage: string,
    userProgress?: any,
    chatHistory?: any[]
  ): Promise<StudyCompanionResponse> {
    try {
      // Build context from user progress
      let contextInfo = "";
      if (userProgress) {
        contextInfo = `\n\nSTUDENT CONTEXT:
- Current courses: ${userProgress.enrolledCourses?.join(", ") || "None"}
- Progress level: ${userProgress.overallProgress || 0}% complete
- Recent topics: ${userProgress.recentTopics?.join(", ") || "General study"}`;
      }

      // Build conversation history for context
      let conversationContext = "";
      if (chatHistory && chatHistory.length > 0) {
        const recentMessages = chatHistory.slice(-6); // Last 6 messages for context
        conversationContext = "\n\nRECENT CONVERSATION:\n" + 
          recentMessages.map(msg => `${msg.role}: ${msg.content}`).join("\n");
      }

      const systemPrompt = this.getCharacterPersonality() + contextInfo + conversationContext;

      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025
        messages: [
          {
            role: "system",
            content: systemPrompt + '\n\nIMPORTANT: Always respond with valid JSON in this exact format: {"content": "your response here", "emotion": "happy|excited|helpful|thinking|encouraging"}'
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        max_tokens: 800,
        temperature: 0.8, // Slightly creative for personality
        response_format: { type: "json_object" }
      });

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response.choices[0].message.content || "{}");
      } catch (parseError) {
        // Fallback if JSON parsing fails
        parsedResponse = {
          content: response.choices[0].message.content || "I'm having trouble processing that right now. Could you try asking again?",
          emotion: "helpful"
        };
      }

      return {
        content: parsedResponse.content || "I'm here to help with your Louisiana plumbing studies! What would you like to learn about?",
        emotion: this.determineEmotion(parsedResponse.content || "", userMessage)
      };

    } catch (error) {
      console.error("OpenAI API error:", error);
      
      // Fallback response with character personality
      return {
        content: "Oops! I'm having a bit of a pipe blockage in my circuits right now 🔧 Could you try asking your question again? I'm excited to help you master that Louisiana plumbing code!",
        emotion: "helpful"
      };
    }
  }

  private static determineEmotion(content: string, userMessage: string): "happy" | "excited" | "helpful" | "thinking" | "encouraging" {
    const contentLower = content.toLowerCase();
    const messageLower = userMessage.toLowerCase();
    
    // Encouraging for motivation or difficulty
    if (messageLower.includes("motivation") || messageLower.includes("difficult") || messageLower.includes("struggling") || contentLower.includes("you've got this") || contentLower.includes("keep going")) {
      return "encouraging";
    }
    
    // Excited for achievements or positive responses
    if (contentLower.includes("great") || contentLower.includes("awesome") || contentLower.includes("excellent") || contentLower.includes("congratulations")) {
      return "excited";
    }
    
    // Thinking for complex technical questions
    if (messageLower.includes("explain") || messageLower.includes("how") || messageLower.includes("why") || contentLower.includes("let me break this down")) {
      return "thinking";
    }
    
    // Happy for greetings and general positive interactions
    if (messageLower.includes("hello") || messageLower.includes("hi") || messageLower.includes("thanks") || contentLower.includes("happy to help")) {
      return "happy";
    }
    
    // Default to helpful
    return "helpful";
  }

  // Method to generate study suggestions based on user progress
  static async generateStudySuggestions(userProgress: any): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025
        messages: [
          {
            role: "system",
            content: `Generate 3-5 specific study suggestions for a Louisiana plumbing student based on their progress. Return as JSON array of strings. Focus on Louisiana State Plumbing Code topics.`
          },
          {
            role: "user",
            content: `Student progress: ${JSON.stringify(userProgress)}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const parsed = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
      return parsed.suggestions || [];
    } catch (error) {
      console.error("Error generating study suggestions:", error);
      return [
        "Review Louisiana State Plumbing Code Section 101 - Administration",
        "Practice pipe sizing calculations for residential installations",
        "Study backflow prevention requirements for Louisiana",
        "Review common code violations and prevention strategies"
      ];
    }
  }
}