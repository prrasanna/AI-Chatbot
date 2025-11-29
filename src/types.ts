export const Role = {
  USER: 'user',
  MODEL: 'model'
} as const;

export type Role = typeof Role[keyof typeof Role];

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}