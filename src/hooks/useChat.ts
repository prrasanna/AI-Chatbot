import { useState, useRef } from 'react';
import { type Message, Role, type Attachment, type ReplyContext } from '../types';
import { sendMessageStream, resetChatSession } from '../services/geminiService';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref to track if we are currently streaming
  const isStreamingRef = useRef(false);

  const handleReset = () => {
    resetChatSession();
    setMessages([]);
  };

  const reactToMessage = (messageId: string, reaction: 'like' | 'dislike' | null) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, reaction: msg.reaction === reaction ? null : reaction } : msg
    ));
  };

  const handleSend = async (text: string = inputText, attachment: Attachment | null = null, replyTo: ReplyContext | null = null) => {
    const trimmedText = text.trim();
    
    // Don't send if both text and attachment are empty
    if ((!trimmedText && !attachment) || isLoading) return;

    // Add User Message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: trimmedText,
      timestamp: Date.now(),
      attachment: attachment,
      replyTo: replyTo
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    isStreamingRef.current = true;

    try {
      // Add Placeholder AI Message
      const aiMessageId = (Date.now() + 1).toString();
      const initialAiMessage: Message = {
        id: aiMessageId,
        role: Role.MODEL,
        content: '',
        timestamp: Date.now(),
        isStreaming: true
      };
      
      setMessages(prev => [...prev, initialAiMessage]);

      // Construct context for the AI if it's a reply
      let prompt = userMessage.content;
      if (replyTo) {
        prompt = `[Replying to ${replyTo.isUser ? 'User' : 'AI'}: "${replyTo.text}"]\n${prompt}`;
      }

      const stream = await sendMessageStream(prompt, userMessage.attachment || null);
      
      let fullContent = '';

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullContent += chunkText;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: fullContent } 
                : msg
            )
          );
        }
      }
      
      // Mark as finished
      setMessages(prev => 
        prev.map(msg => 
            msg.id === aiMessageId 
            ? { ...msg, isStreaming: false } 
            : msg
        )
      );

    } catch (error) {
      console.error("Failed to generate response", error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: Role.MODEL,
        content: "I'm having trouble connecting right now. Please try again later.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      isStreamingRef.current = false;
    }
  };

  return {
    messages,
    inputText,
    setInputText,
    isLoading,
    handleSend,
    handleReset,
    reactToMessage
  };
};