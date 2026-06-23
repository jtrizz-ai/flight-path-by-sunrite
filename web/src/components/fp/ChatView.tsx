'use client';

import { useRef, useEffect, useState } from 'react';
import SourceCard from './SourceCard';
import TypingIndicator from './TypingIndicator';
import { MarkdownResponse } from './MarkdownResponse';

export type ChatSource = { pageId: string; title: string; slug: string; snippet: string };

export type ChatMessage = {
  id: string;
  role: 'ai' | 'me';
  text: string;
  sources?: ChatSource[];
};

export function ChatView({
  messages,
  onSend,
  isTyping = false,
  onOpenSidebar,
  onNewChat,
  activeThreadTitle,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  isTyping?: boolean;
  onOpenSidebar: () => void;
  onNewChat: () => void;
  activeThreadTitle: string | null;
}) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  return (
    <div className="absolute inset-0 flex flex-col" style={{ backgroundColor: 'var(--color-fp-bg)' }}>
      {/* Top bar: history + active title + new chat */}
      <div
        className="flex items-center gap-2 px-3.5 py-2.5 border-b"
        style={{
          borderColor: 'var(--color-fp-line)',
          backgroundColor: 'rgba(6,6,7,0.6)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <button
          onClick={onOpenSidebar}
          aria-label="Open conversations"
          className="w-9 h-9 flex items-center justify-center rounded-[8px] transition-colors hover:bg-white/5"
          style={{ color: 'var(--color-fp-ink-3)', border: '1px solid var(--color-fp-line)' }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>

        <div className="flex-1 min-w-0 px-1">
          <div
            className="font-[var(--font-fp-mono)] text-[9px] tracking-[0.18em] uppercase"
            style={{ color: 'var(--color-fp-ink-3)' }}
          >
            {activeThreadTitle === null ? 'New conversation' : 'Conversation'}
          </div>
          <div
            className="font-[var(--font-fp-sans)] text-[13px] truncate"
            style={{ color: 'var(--color-fp-ink)' }}
          >
            {activeThreadTitle ?? 'Flight Path AI'}
          </div>
        </div>

        <button
          onClick={onNewChat}
          aria-label="Start new chat"
          className="flex items-center gap-1.5 h-9 px-3 rounded-[8px] transition-colors hover:bg-white/5"
          style={{
            color: activeThreadTitle === null ? '#fff' : 'var(--color-fp-ink-2)',
            backgroundColor:
              activeThreadTitle === null ? 'var(--color-fp-accent)' : 'transparent',
            border:
              activeThreadTitle === null
                ? '1px solid var(--color-fp-accent)'
                : '1px solid var(--color-fp-line)',
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="font-[var(--font-fp-mono)] text-[10px] tracking-[0.14em] uppercase">
            New chat
          </span>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5">
        <div className="flex flex-col gap-5 max-w-3xl mx-auto">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
      </div>

      {/* Composer */}
      <div
        className="flex items-center gap-2.5 px-3.5 py-3 border-t"
        style={{
          backgroundColor: 'rgba(6,6,7,0.6)',
          backdropFilter: 'blur(12px)',
          borderColor: 'var(--color-fp-line)',
        }}
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Message Flight Path AI..."
          className="flex-1 h-11 px-4 rounded-full font-[var(--font-fp-sans)] text-[14px] outline-none transition-colors"
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            color: 'var(--color-fp-ink)',
            border: '1px solid var(--color-fp-line)',
          }}
        />
        <button
          onClick={handleSend}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'var(--color-fp-accent)' }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isMe = message.role === 'me';
  const who = isMe ? 'You' : 'Flight Path AI';

  return (
    <div className={`flex flex-col gap-2 ${isMe ? 'items-end' : 'items-start'}`}>
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
        <div
          className="max-w-[85%] px-5 py-4"
          style={{
            backgroundColor: isMe ? 'var(--color-fp-accent)' : 'var(--color-fp-card)',
            border: isMe ? 'none' : '1px solid var(--color-fp-card-line)',
            borderRadius: '16px',
            borderBottomLeftRadius: isMe ? '16px' : '5px',
            borderBottomRightRadius: isMe ? '5px' : '16px',
          }}
        >
          <div
            className="font-[var(--font-fp-mono)] text-[9px] tracking-[0.16em] uppercase mb-1.5"
            style={{ color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--color-fp-ink-3)' }}
          >
            {who}
          </div>
          <div style={{ color: isMe ? '#fff' : 'var(--color-fp-ink)' }}>
            {isMe ? (
              <span className="font-[var(--font-fp-sans)] text-[14px] leading-[1.6] whitespace-pre-wrap">
                {message.text}
              </span>
            ) : (
              <MarkdownResponse>{message.text}</MarkdownResponse>
            )}
          </div>
        </div>
      </div>
      {!isMe && message.sources && message.sources.length > 0 && (
        <div className="max-w-[85%] w-full flex flex-col gap-2 mt-1">
          {message.sources.map((s) => (
            <SourceCard key={s.pageId} source={s} />
          ))}
        </div>
      )}
    </div>
  );
}
