'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppHeader } from './AppHeader';
import { TabBar, type TabId } from './TabBar';
import { SideDrawer } from './SideDrawer';
import { HomeView } from './HomeView';
import { ScheduleView } from './ScheduleView';
import { TallyView } from './TallyView';
import { ChatView, type ChatMessage, type ChatSource } from './ChatView';

export function FlightPathApp({ userName, userEmail }: { userName: string; userEmail: string }) {
  const [currentTab, setCurrentTab] = useState<'home' | TabId>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Tally state
  const [doors, setDoors] = useState(0);
  const [conversations, setConversations] = useState(0);
  const [appointments, setAppointments] = useState(0);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Load chat history once (when the user first navigates to chat or mounts).
  useEffect(() => {
    let cancelled = false;
    fetch('/api/chat/threads', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.thread) return;
        setMessages(
          d.thread.messages.map(
            (m: {
              id: string;
              role: string;
              content: string;
              sources?: ChatSource[];
            }) => ({
              id: m.id,
              role: m.role === 'user' ? 'me' : 'ai',
              text: m.content,
              sources: m.sources ?? undefined,
            })
          )
        );
      })
      .catch(() => {
        /* leave empty; user can still send new messages */
      })
      .finally(() => {
        if (!cancelled) setHistoryLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'me',
        text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Chat failed');
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'ai',
            text: data.answer ?? '(no answer)',
            sources: data.sources,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'ai',
            text: "Sorry — I couldn't reach the Flight Path assistant. Try again in a moment.",
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    []
  );

  const handleNavigate = (tab: 'home' | TabId) => {
    setCurrentTab(tab);
    setDrawerOpen(false);
  };

  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-fp-bg)' }}>
      {/* Grain overlay */}
      <div className="grain-overlay" />

      {/* Header */}
      <AppHeader
        userName={userName}
        onHomeClick={() => setCurrentTab('home')}
        onMenuClick={() => setDrawerOpen(true)}
      />

      {/* Active view */}
      <div className="flex-1 relative overflow-hidden">
        {currentTab === 'home' && <HomeView userName={userName} />}
        {currentTab === 'schedule' && <ScheduleView />}
        {currentTab === 'tally' && (
          <TallyView
            doors={doors}
            conversations={conversations}
            appointments={appointments}
            onDoorsChange={setDoors}
            onConversationsChange={setConversations}
            onAppointmentsChange={setAppointments}
          />
        )}
        {currentTab === 'chat' && (
          <ChatView
            messages={messages}
            onSend={handleSendMessage}
            isTyping={isTyping || !historyLoaded ? isTyping : false}
          />
        )}
      </div>

      {/* Tab bar (show only if not on home) */}
      {currentTab !== 'home' && (
        <TabBar activeTab={currentTab as TabId} onTabChange={(tab) => setCurrentTab(tab)} />
      )}

      {/* Side drawer */}
      {drawerOpen && (
        <SideDrawer
          isOpen={drawerOpen}
          userName={userName}
          userEmail={userEmail}
          userInitials={userInitials}
          onClose={() => setDrawerOpen(false)}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}
