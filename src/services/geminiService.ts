import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

// Use import.meta.env for Vite frontend
const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  throw new Error("❌ VITE_API_KEY is missing! Add it in your .env file.");
}

const ai = new GoogleGenAI({ apiKey });

let chatSession: Chat | null = null;

const SYSTEM_INSTRUCTION = `
You are Meta AI, a helpful, intelligent, and versatile assistant. 
You are capable of answering a wide range of questions, from complex technical coding problems to casual daily life queries.
- Be concise but thorough.
- Format code snippets using Markdown code blocks with language specification (e.g., \`\`\`javascript).
- Use a friendly, conversational tone similar to a helpful assistant on WhatsApp.
- If the user speaks in Tamil (Tanglish), reply in English but acknowledge the context if necessary, or reply in Tamil if explicitly requested. 
- Prioritize clarity and helpfulness.
`;

export const getChatSession = (): Chat => {
  if (!chatSession) {
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });
  }
  return chatSession;
};

export const resetChatSession = () => {
  chatSession = null;
};

export const sendMessageStream = async (
  message: string
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const chat = getChatSession();
  try {
    const result = await chat.sendMessageStream({ message });
    return result;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }
};
