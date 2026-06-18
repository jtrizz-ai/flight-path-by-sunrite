'use client';

import { useRef, useEffect, useState } from 'react';

export type ChatMessage = {
  id: string;
  role: 'ai' | 'me';
  text: string;
};

export function ChatView({
  messages,
  onSend,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  return (
    <div className="absolute inset-0 flex flex-col" style={{ backgroundColor: 'var(--color-fp-bg)' }}>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5">
        <div className="flex flex-col gap-3 max-w-3xl mx-auto">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
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
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[80%] px-3.5 py-2.5"
        style={{
          backgroundColor: isMe ? 'var(--color-fp-accent)' : 'var(--color-fp-card)',
          border: isMe ? 'none' : '1px solid var(--color-fp-card-line)',
          borderRadius: '16px',
          borderBottomLeftRadius: isMe ? '16px' : '5px',
          borderBottomRightRadius: isMe ? '5px' : '16px',
        }}
      >
        <div
          className="font-[var(--font-fp-mono)] text-[9px] tracking-[0.16em] uppercase mb-1"
          style={{ color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--color-fp-ink-3)' }}
        >
          {who}
        </div>
        <div
          className="font-[var(--font-fp-sans)] text-[13.5px] leading-relaxed"
          style={{ color: isMe ? '#fff' : 'var(--color-fp-ink)' }}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
}
