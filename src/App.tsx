import React, { useRef, useEffect, useState } from 'react';
import { Send, MoreVertical, Search, Phone, Video, Smile, Paperclip, Mic, ArrowLeft, X, StopCircle } from 'lucide-react';
import { Theme, type EmojiClickData } from 'emoji-picker-react';
import { useChat } from './hooks/useChat';
import ChatBubble from './components/ChatBubble';
import type{ Attachment } from './types';
import { blobToBase64 } from './services/geminiService';
import './App.css';
import EmojiPicker from 'emoji-picker-react';

const App: React.FC = () => {
  const { messages, inputText, setInputText, handleSend, handleReset } = useChat();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // UI States
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Audio Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 100);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setInputText((prev) => prev + emojiData.emoji);
  };

  // --- Image Handling ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) return;
      
      const base64 = await blobToBase64(file);
      setAttachment({
        type: 'image',
        url: URL.createObjectURL(file),
        data: base64,
        mimeType: file.type
      });
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearAttachment = () => {
    setAttachment(null);
  };

  // --- Audio Recording Handling ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' }); // Gemini handles mp3/wav/etc
        const base64 = await blobToBase64(audioBlob);
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Directly send audio message
        const audioAttachment: Attachment = {
            type: 'audio',
            url: audioUrl,
            data: base64,
            mimeType: 'audio/mp3'
        };
        handleSend("", audioAttachment);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Timer
      setRecordingDuration(0);
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop()); // Stop stream
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- Send Wrapper ---
  const onSend = () => {
    if (inputText.trim() || attachment) {
      handleSend(inputText, attachment);
      setAttachment(null);
      setShowEmojiPicker(false);
    }
  };

  return (
    <div className="app-container">
       {/* Main Container */}
      <div className="main-window">
        
        {/* WhatsApp Header */}
        <header className="header">
          <div className="header-left">
            <button className="back-btn">
                <ArrowLeft size={24} />
            </button>
            <div className="avatar-container">
                <div className="meta-ring">
                    <div className="meta-avatar-inner">
                        <div className="meta-gradient-overlay"></div>
                        <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/a/ab/Meta-Logo.png" 
                            alt="Meta AI" 
                            className="meta-logo" 
                        />
                    </div>
                </div>
                <span className="online-indicator"></span>
            </div>
            
            <div className="header-info">
              <h1 className="header-title">Meta AI</h1>
              <p className="header-subtitle">
                 with Llama 3
              </p>
            </div>
          </div>

          <div className="header-actions">
             <div className="divider mobile-hide"></div>
             <button className="icon-btn"><Search size={20} /></button>
             <button 
                onClick={handleReset}
                className="icon-btn" 
                title="Clear Chat"
             >
                <MoreVertical size={20} />
             </button>
          </div>
        </header>

        {/* Chat Area Background */}
        <div className="chat-background"></div>

        {/* Messages List */}
        <div className="messages-list">
          <div className="encryption-notice">
            <div className="notice-box">
              Messages are generated by AI. Some messages may be inaccurate.
            </div>
          </div>

          {messages.length === 0 && (
             <div className="empty-state">
                 <div className="welcome-ring">
                    <div className="welcome-inner">
                        <div className="welcome-overlay"></div>
                    </div>
                 </div>
                 <h2 className="empty-title">Ask Meta AI anything</h2>
                 <p className="empty-desc">
                     Get answers, learn something new, or translate languages instantly.
                 </p>
                 
                 <div className="suggestion-grid">
                    <button onClick={() => handleSend("Tell me a fun fact")} className="suggestion-btn">
                        💡 Tell me a fun fact
                    </button>
                    <button onClick={() => handleSend("Write a React component")} className="suggestion-btn">
                        ⚛️ Write a React component
                    </button>
                    <button onClick={() => handleSend("Translate 'Hello' to Tamil")} className="suggestion-btn">
                        🌏 Translate to Tamil
                    </button>
                     <button onClick={() => handleSend("Help me plan a trip")} className="suggestion-btn">
                        ✈️ Plan a trip
                    </button>
                 </div>
             </div>
          )}

          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Emoji Picker Popover */}
        {showEmojiPicker && (
            <div className="emoji-picker-container">
                <EmojiPicker 
                    onEmojiClick={onEmojiClick} 
                    theme={Theme.AUTO}
                    searchDisabled={false}
                    width="100%"
                    height={350}
                    previewConfig={{ showPreview: false }}
                />
            </div>
        )}

        {/* Input Area */}
        <div className="input-area">
            
            {/* Attachment Preview (Image) */}
            {attachment && attachment.type === 'image' && (
                <div className="attachment-preview">
                    <div className="preview-card">
                        <img src={attachment.url} alt="Preview" />
                        <button className="remove-attachment" onClick={clearAttachment}>
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            <button 
                className={`icon-btn ${showEmojiPicker ? 'active-emoji-btn' : ''}`}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
                {showEmojiPicker ? <X size={24} /> : <Smile size={24} />}
            </button>
            
            <button className="icon-btn" onClick={() => fileInputRef.current?.click()}>
                <Paperclip size={24} />
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="image/*" 
                style={{ display: 'none' }} 
            />

            <div className="input-wrapper">
                {isRecording ? (
                    <div className="recording-status">
                        <div className="recording-dot"></div>
                        <span className="recording-time">{formatDuration(recordingDuration)}</span>
                        <span className="recording-text">Recording...</span>
                    </div>
                ) : (
                    <textarea
                        ref={textareaRef}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Message"
                        className="chat-input"
                        rows={1}
                        onClick={() => setShowEmojiPicker(false)}
                    />
                )}
            </div>

            {inputText.trim() || attachment ? (
                <button onClick={onSend} className="send-btn">
                    <Send size={20} fill="white" />
                </button>
            ) : (
                isRecording ? (
                    <button onClick={stopRecording} className="send-btn recording-stop">
                         <StopCircle size={24} />
                    </button>
                ) : (
                    <button onClick={startRecording} className="icon-btn mic-btn">
                        <Mic size={24} />
                    </button>
                )
            )}
        </div>
      </div>
    </div>
  );
};

export default App;