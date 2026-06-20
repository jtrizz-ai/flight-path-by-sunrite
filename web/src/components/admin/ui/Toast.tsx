"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type ToastType = "success" | "error" | "info";

type ToastItem = { id: number; message: string; type: ToastType };

type ToastContextValue = {
  show: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful no-op if used outside a provider (e.g. during isolated testing).
    return { show: () => {} };
  }
  return ctx;
}

const toneStyles: Record<ToastType, React.CSSProperties> = {
  success: {
    backgroundColor: "rgba(76,175,80,0.12)",
    border: "1px solid rgba(76,175,80,0.35)",
    color: "#7FE08A",
  },
  error: {
    backgroundColor: "rgba(232,71,42,0.12)",
    border: "1px solid rgba(232,71,42,0.4)",
    color: "var(--color-fp-accent-2)",
  },
  info: {
    backgroundColor: "rgba(255,255,255,0.06)",
    border: "1px solid var(--color-fp-line)",
    color: "var(--color-fp-ink)",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const show = useCallback((message: string, type: ToastType = "info") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] flex flex-col items-center gap-2 pointer-events-none">
            {toasts.map((t) => (
              <ToastRow key={t.id} toast={t} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

function ToastRow({ toast }: { toast: ToastItem }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, []);
  return (
    <div
      className="pointer-events-auto rounded-[12px] px-4 py-2.5 font-[var(--font-fp-sans)] text-[13px] shadow-lg transition-all duration-300"
      style={{
        ...toneStyles[toast.type],
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(-8px)",
      }}
    >
      {toast.message}
    </div>
  );
}
