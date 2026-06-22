'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppHeader } from './AppHeader';
import { TabBar, type TabId } from './TabBar';
import { SideDrawer } from './SideDrawer';
import { HomeView } from './HomeView';
import { ScheduleView } from './ScheduleView';
import { TallyView } from './TallyView';
import { ChatView, type ChatMessage, type ChatSource } from './ChatView';
import { ChatSidebar } from './ChatSidebar';
import type { ChatThreadSummary } from '@/lib/types';

export type ContentPageSummary = {
  slug: string;
  title: string;
  icon: string | null;
};

export function FlightPathApp({
  userName,
  userEmail,
  userRole,
  pages,
}: {
  userName: string;
  userInitials?: string;
  userEmail: string;
  userRole: string;
  pages: ContentPageSummary[];
}) {
  const [currentTab, setCurrentTab] = useState<'home' | TabId>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Multi-thread state
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [threadsLoaded, setThreadsLoaded] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Bump to force a thread-list refresh (after send/delete).
  const [threadsVersion, setThreadsVersion] = useState(0);
  // Guards against an interleaved load when the active thread changes.
  const activeLoadToken = useRef(0);

  // ── Refresh the conversation list on mount and after mutations ─────────
  // Inline async work (rather than calling a useCallback) so the linter can
  // see the setState calls happen after `await` and don't cascade renders.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/chat/threads', { cache: 'no-store' });
        const data = await r.json();
        if (!cancelled && Array.isArray(data.threads)) {
          setThreads(data.threads);
        }
      } catch {
        /* leave existing list */
      } finally {
        if (!cancelled) setThreadsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [threadsVersion]);

  // ── Open a thread by id: fetch its messages and swap them in ─────────────
  const openThread = useCallback(
    (id: string) => {
      const token = ++activeLoadToken.current;
      setActiveThreadId(id);
      setHistoryLoaded(false);
      setMessages([]);
      (async () => {
        try {
          const r = await fetch(`/api/chat/threads/${encodeURIComponent(id)}`, {
            cache: 'no-store',
          });
          if (!r.ok) throw new Error('thread fetch failed');
          const data = await r.json();
          if (token !== activeLoadToken.current) return; // a newer load won
          const fetched: ChatMessage[] = (data.thread?.messages ?? []).map(
            (m: { id: string; role: string; content: string; sources?: ChatSource[] }) => ({
              id: m.id,
              role: m.role === 'user' ? 'me' : 'ai',
              text: m.content,
              sources: m.sources ?? undefined,
            })
          );
          setMessages(fetched);
        } catch {
          if (token !== activeLoadToken.current) return;
          setMessages([]);
        } finally {
          if (token === activeLoadToken.current) setHistoryLoaded(true);
        }
      })();
    },
    []
  );

  // ── "New chat": clear the active thread + composer; thread is created on first send ──
  const startNewChat = useCallback(() => {
    activeLoadToken.current++; // invalidate any in-flight load
    setActiveThreadId(null);
    setMessages([]);
    setHistoryLoaded(true);
  }, []);

  // ── Delete a thread. If it was active, fall back to the most recent ──────
  const deleteThread = useCallback(
    async (id: string) => {
      // Optimistic removal from the sidebar.
      const remaining = threads.filter((t) => t.id !== id);
      setThreads(remaining);

      try {
        await fetch(`/api/chat/threads/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      } catch {
        /* server is the source of truth; refresh on failure */
      }

      if (id === activeThreadId) {
        const next = remaining[0];
        if (next) {
          await openThread(next.id);
        } else {
          startNewChat();
        }
      }
      setThreadsVersion((v) => v + 1);
    },
    [threads, activeThreadId, openThread, startNewChat]
  );

  // ── Send a message. Creates a new thread on demand. ──────────────────────
  const handleSendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'me',
        text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      const targetThreadId = activeThreadId;
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(targetThreadId ? { message: text, threadId: targetThreadId } : { message: text }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Chat failed');

        // Track the (possibly new) thread id so subsequent sends append.
        if (data.threadId && data.threadId !== activeThreadId) {
          setActiveThreadId(data.threadId);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'ai',
            text: data.answer ?? '(no answer)',
            sources: data.sources,
          },
        ]);

        // Sidebar preview/title may have changed.
        setThreadsVersion((v) => v + 1);
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
    [activeThreadId]
  );

  // On first chat entry with no active thread but threads exist, load the most
  // recent so the user resumes where they left off (matches Claude.ai). Inlined
  // (not via openThread) so the set-state-in-effect rule can see the await.
  useEffect(() => {
    if (
      currentTab !== 'chat' ||
      activeThreadId !== null ||
      !threadsLoaded ||
      threads.length === 0 ||
      isTyping
    ) {
      return;
    }
    let cancelled = false;
    const token = ++activeLoadToken.current;
    const top = threads[0];
    // Clear + show loading state before the fetch so the user sees immediate
    // feedback when switching threads. These setStates DO cause an extra
    // render — that's the intended UX here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveThreadId(top.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistoryLoaded(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages([]);
    (async () => {
      try {
        const r = await fetch(`/api/chat/threads/${encodeURIComponent(top.id)}`, {
          cache: 'no-store',
        });
        if (!r.ok) throw new Error('thread fetch failed');
        const data = await r.json();
        if (cancelled || token !== activeLoadToken.current) return;
        const fetched: ChatMessage[] = (data.thread?.messages ?? []).map(
          (m: { id: string; role: string; content: string; sources?: ChatSource[] }) => ({
            id: m.id,
            role: m.role === 'user' ? 'me' : 'ai',
            text: m.content,
            sources: m.sources ?? undefined,
          })
        );
        setMessages(fetched);
      } catch {
        if (!cancelled && token === activeLoadToken.current) setMessages([]);
      } finally {
        if (!cancelled && token === activeLoadToken.current) setHistoryLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentTab, activeThreadId, threadsLoaded, threads, isTyping]);

  const handleNavigate = (tab: 'home' | TabId) => {
    setCurrentTab(tab);
    setDrawerOpen(false);
    // Log tab navigation as a page view
    fetch('/api/track/page-view', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: `/flight-path?tab=${tab}`, title: tab }),
    }).catch(() => {});
  };

  // Track app open on mount (fire-and-forget)
  useEffect(() => {
    fetch('/api/track/app-open', { method: 'POST' }).catch(() => {});
  }, []);

  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Title for the chat header: the active thread's title, or a hint when starting fresh.
  const activeThreadTitle =
    activeThreadId ? threads.find((t) => t.id === activeThreadId)?.title ?? 'Conversation' : null;

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
        {currentTab === 'schedule' && <ScheduleView pages={pages} />}
        {currentTab === 'tally' && <TallyView />}
        {currentTab === 'chat' && (
          <ChatView
            messages={messages}
            onSend={handleSendMessage}
            isTyping={isTyping || !historyLoaded ? isTyping : false}
            onOpenSidebar={() => setSidebarOpen(true)}
            onNewChat={startNewChat}
            activeThreadTitle={activeThreadTitle}
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
          userRole={userRole}
          userInitials={userInitials}
          onClose={() => setDrawerOpen(false)}
          onNavigate={handleNavigate}
        />
      )}

      {/* Chat conversations sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        threads={threads}
        activeThreadId={activeThreadId}
        isLoading={!threadsLoaded}
        onClose={() => setSidebarOpen(false)}
        onSelect={openThread}
        onNewChat={startNewChat}
        onDelete={deleteThread}
      />
    </div>
  );
}
