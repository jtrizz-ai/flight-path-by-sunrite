'use client';

import { useState } from 'react';
import { AppHeader } from './AppHeader';
import { TabBar, type TabId } from './TabBar';
import { SideDrawer } from './SideDrawer';
import { HomeView } from './HomeView';
import { ScheduleView } from './ScheduleView';
import { TallyView } from './TallyView';
import { ChatView, type ChatMessage } from './ChatView';

const initialMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'ai',
    text: 'Welcome to Flight Path, Jonathan. Ask me anything about the program — the Door Pitch, your Schedule, or RepCard.',
  },
  {
    id: '2',
    role: 'me',
    text: 'What is the goal for week one?',
  },
  {
    id: '3',
    role: 'ai',
    text: 'Week one focuses on the Door Pitch and your daily Tally goals: 40 doors, 15 conversations, and 5 appointments. Open the Schedule tab to start.',
  },
];

export function FlightPathApp({ userName, userEmail }: { userName: string; userEmail: string }) {
  const [currentTab, setCurrentTab] = useState<'home' | TabId>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Tally state
  const [doors, setDoors] = useState(0);
  const [conversations, setConversations] = useState(0);
  const [appointments, setAppointments] = useState(0);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const handleSendMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'me',
      text,
    };
    setMessages((prev) => [...prev, userMsg]);

    // Placeholder AI reply (live app answers from Flight Path content)
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: "Thanks! This is a preview of the Flight Path assistant. In the live app it answers from your Flight Path Program content.",
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 500);
  };

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
        {currentTab === 'chat' && <ChatView messages={messages} onSend={handleSendMessage} />}
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
