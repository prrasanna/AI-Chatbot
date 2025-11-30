import {
  GoogleGenAI,
  Chat,
  type GenerateContentResponse,
  type Part
} from "@google/genai";

import type { Attachment } from "../types";

// ✅ FIXED: Correct API key for Vite (NO process.env in frontend)
const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY
});

// Store chat session
let chatSession: Chat | null = null;

// System instruction for chatbot
const SYSTEM_INSTRUCTION = `
You are Meta AI, a helpful, intelligent, and versatile assistant.
You can process text, images, and audio.
Respond concisely but clearly. Use markdown for code.
If the user talks in Tamil (Tanglish), reply in English unless asked for Tamil.
Be friendly and conversational.
`;

export const getChatSession = (): Chat => {
  if (!chatSession) {
    chatSession = ai.chats.create({
      model: "gemini-2.5-flash",
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

// SEND MESSAGE WITH STREAMING
export const sendMessageStream = async (
  message: string,
  attachment: Attachment | null
): Promise<AsyncIterable<GenerateContentResponse>> => {

  const chat = getChatSession();

  const parts: Part[] = [];

  // --- HANDLE ATTACHMENT (image/audio) ---
  if (attachment && attachment.data && attachment.mimeType) {
    const base64Data = attachment.data.split(",")[1]; // strip "data:*/*;base64,"

    parts.push({
      inlineData: {
        mimeType: attachment.mimeType,
        data: base64Data,
      },
    });
  }

  // --- HANDLE TEXT MESSAGE ---
  if (message && message.trim().length > 0) {
    parts.push({ text: message });
  }

  if (parts.length === 0) {
    throw new Error("Cannot send empty message");
  }

  try {
    // Gemini SDK accepts string OR Part[]
    const payload = parts.length === 1 && parts[0].text
      ? parts[0].text
      : parts;

    const result = await chat.sendMessageStream({
      message: payload,
    });

    return result;

  } catch (err) {
    console.error("Gemini API Error:", err);
    throw err;
  }
};

// Convert blob → base64 (image/audio)
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
