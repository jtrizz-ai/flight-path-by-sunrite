"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AdminButton } from "./AdminButton";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={() => !loading && onCancel()}
    >
      <div
        className="w-full max-w-sm rounded-[18px] p-6"
        style={{
          backgroundColor: "var(--color-fp-bg-2)",
          border: "1px solid var(--color-fp-card-line)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="font-[var(--font-fp-sans)] text-[16px] font-bold mb-2"
          style={{ color: "var(--color-fp-ink)" }}
        >
          {title}
        </h3>
        <p
          className="font-[var(--font-fp-sans)] text-[13px] leading-relaxed mb-5"
          style={{ color: "var(--color-fp-ink-2)" }}
        >
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <AdminButton variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </AdminButton>
          <AdminButton variant={tone === "danger" ? "danger" : "primary"} size="sm" onClick={onConfirm} disabled={loading}>
            {loading ? "Working..." : confirmLabel}
          </AdminButton>
        </div>
      </div>
    </div>,
    document.body
  );
}
