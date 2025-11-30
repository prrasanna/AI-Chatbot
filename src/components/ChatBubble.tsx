import React, { useState } from 'react';
import { type Message, Role } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { ChevronDown, ThumbsUp, ThumbsDown, CornerUpLeft, Copy, Forward } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
  searchQuery?: string;
  onReply: (message: Message) => void;
  onCopy: (text: string) => void;
  onForward: (message: Message) => void;
  onReact: (id: string, reaction: 'like' | 'dislike') => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, searchQuery, onReply, onCopy, onForward, onReact }) => {
  const [showMenu, setShowMenu] = useState(false);
  const isUser = message.role === Role.USER;

  // Simple highlighting logic
  const renderContentWithHighlight = (content: string) => {
    if (!searchQuery || !content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return <MarkdownRenderer content={content} />;
    }

    // If searching, simple text render with highlights (Markdown might break with regex split)
    // For simplicity in search mode, we render plain text with highlights or try to preserve basic md
    // Here we wrap MarkdownRenderer but highlight container text color
    return (
       <div className="search-highlight-wrapper">
          <MarkdownRenderer content={content} />
       </div>
    );
  };

  return (
    <div className={`bubble-row ${isUser ? 'user' : 'model'}`}>
      <div className={`bubble ${isUser ? 'user' : 'model'} ${searchQuery && message.content.toLowerCase().includes(searchQuery.toLowerCase()) ? 'highlighted-bubble' : ''}`}>
        
        {/* Reply Context */}
        {message.replyTo && (
          <div className="bubble-quote">
            <div className="quote-bar"></div>
            <div className="quote-content">
              <span className="quote-author">{message.replyTo.isUser ? 'You' : 'Meta AI'}</span>
              <p className="quote-text">{message.replyTo.text.substring(0, 100)}...</p>
            </div>
          </div>
        )}

        {/* Forwarded Label */}
        {message.isForwarded && (
          <div className="forwarded-label">
            <Forward size={12} className="forward-icon-label" /> Forwarded
          </div>
        )}

        {/* Render Attachment (Image) */}
        {message.attachment?.type === 'image' && (
            <div className="bubble-image-container">
                <img src={message.attachment.url} alt="Sent image" className="bubble-image" />
            </div>
        )}

        {/* Render Attachment (Audio) */}
        {message.attachment?.type === 'audio' && (
            <div className="bubble-audio-container">
                <audio controls src={message.attachment.url} className="bubble-audio" />
            </div>
        )}

        {/* Render Text Content */}
        {(message.content || (!message.attachment && !message.content)) && (
            <div className={isUser ? "" : "content-offset"}>
                {message.content ? (
                    renderContentWithHighlight(message.content)
                ) : (
                    /* Show typing indicator */
                    !message.attachment && (
                        <div className="typing-indicator">
                            <div className="dot" style={{ animationDelay: '0ms' }}></div>
                            <div className="dot" style={{ animationDelay: '150ms' }}></div>
                            <div className="dot" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    )
                )}
            </div>
        )}

        {/* Reactions & Timestamp Container */}
        <div className="bubble-footer">
            {/* AI Like/Unlike Actions */}
            {!isUser && !message.isStreaming && message.content && (
              <div className="reaction-actions">
                <button 
                  className={`reaction-btn ${message.reaction === 'like' ? 'active-like' : ''}`}
                  onClick={() => onReact(message.id, 'like')}
                  title="Good response"
                >
                  <ThumbsUp size={12} />
                </button>
                <button 
                  className={`reaction-btn ${message.reaction === 'dislike' ? 'active-dislike' : ''}`}
                  onClick={() => onReact(message.id, 'dislike')}
                  title="Bad response"
                >
                  <ThumbsDown size={12} />
                </button>
              </div>
            )}

            <div className="timestamp">
                <span>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
                {isUser && (
                    <svg viewBox="0 0 16 15" width="16" height="15" className="check-icon">
                        <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-7.655a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-7.655a.365.365 0 0 0-.063-.51z"></path>
                    </svg>
                )}
            </div>
        </div>

        {/* Message Menu (Caret) */}
        {!message.isStreaming && (
          <div className="bubble-menu-trigger" onClick={() => setShowMenu(!showMenu)}>
            <ChevronDown size={18} />
          </div>
        )}

        {showMenu && (
          <>
            <div className="menu-backdrop" onClick={() => setShowMenu(false)}></div>
            <div className={`bubble-menu-dropdown ${isUser ? 'left' : 'right'}`}>
              <button onClick={() => { onReply(message); setShowMenu(false); }}>
                <CornerUpLeft size={14} /> Reply
              </button>
              <button onClick={() => { onCopy(message.content); setShowMenu(false); }}>
                <Copy size={14} /> Copy
              </button>
              <button onClick={() => { onForward(message); setShowMenu(false); }}>
                <Forward size={14} /> Forward
              </button>
            </div>
          </>
        )}

        {/* CSS Triangle Tails */}
        {isUser ? <span className="tail-user" /> : <span className="tail-model" />}
      </div>
    </div>
  );
};

export default ChatBubble;