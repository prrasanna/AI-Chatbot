export const Role = {
  USER: "user",
  MODEL: "model",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export interface Attachment {
  type: "image" | "audio";
  url: string; // Blob URL for preview
  data?: string; // Base64 string for API
  mimeType?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  attachment?: Attachment | null;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}
