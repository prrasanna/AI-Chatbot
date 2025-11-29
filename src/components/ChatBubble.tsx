import React from 'react';
import type { Message } from '../types';
import { Role } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`bubble-row ${isUser ? 'user' : 'model'}`}>
      <div className={`bubble ${isUser ? 'user' : 'model'}`}>
        
        {/* Render Content */}
        <div className={isUser ? "" : "content-offset"}>
            {message.content ? (
                <MarkdownRenderer content={message.content} />
            ) : (
                <div className="typing-indicator">
                    <div className="dot" style={{ animationDelay: '0ms' }}></div>
                    <div className="dot" style={{ animationDelay: '150ms' }}></div>
                    <div className="dot" style={{ animationDelay: '300ms' }}></div>
                </div>
            )}
        </div>

        {/* Timestamp & Read Receipts */}
        <div className="timestamp">
            <span>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
            {isUser && (
                // Double tick icon (static blue to simulate 'read')
                <svg viewBox="0 0 16 15" width="16" height="15" className="check-icon">
                    <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-7.655a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-7.655a.365.365 0 0 0-.063-.51z"></path>
                </svg>
            )}
        </div>

        {/* CSS Triangle Tails */}
        {isUser ? (
             <span className="tail-user" />
        ) : (
             <span className="tail-model" />
        )}
      </div>
    </div>
  );
};

export default ChatBubble;