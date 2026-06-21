"use client";

import { useEffect, useState } from "react";

type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  town: string | null;
  hireDate: string | null;
};

export default function ProfileForm({
  signOutAction,
}: {
  signOutAction: () => Promise<void>;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [town, setTown] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setProfile(d.user);
          setFullName(d.user.fullName ?? "");
          setAvatarUrl(d.user.avatarUrl ?? "");
          setPhone(d.user.phone ?? "");
          setTown(d.user.town ?? "");
          setHireDate(d.user.hireDate ?? "");
        }
      })
      .catch(() => {
        /* leave loading state; user can retry by reloading */
      });
  }, []);

  async function onSave() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName,
        avatarUrl: avatarUrl || null,
        phone: phone || null,
        town: town || null,
        hireDate: hireDate || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSavedAt(Date.now());
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Save failed");
    }
  }

  if (!profile) {
    return <div style={{ color: "var(--color-fp-ink-3)" }}>Loading…</div>;
  }

  const inputCls =
    "w-full rounded-[var(--radius-fp-button)] border border-[color:var(--color-fp-line)] bg-[color:var(--color-fp-card)] px-4 py-3 text-[var(--color-fp-ink)] focus:outline-none focus:border-[color:var(--color-fp-accent)]";

  return (
    <div className="space-y-5">
      <Field label="FULL NAME">
        <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>
      <Field label="AVATAR URL">
        <input
          className={inputCls}
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://…"
        />
      </Field>
      <Field label="PHONE">
        <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      <Field label="TOWN">
        <input className={inputCls} value={town} onChange={(e) => setTown(e.target.value)} />
      </Field>
      <Field label="HIRE DATE">
        <input
          type="date"
          className={inputCls}
          value={hireDate}
          onChange={(e) => setHireDate(e.target.value)}
        />
      </Field>

      {error && <div className="text-sm text-[var(--color-fp-accent)]">{error}</div>}
      {savedAt && !error && (
        <div className="text-sm" style={{ color: "var(--color-fp-ink-3)" }}>
          Saved.
        </div>
      )}

      <div className="flex items-center gap-4 pt-4">
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded-[var(--radius-fp-button)] bg-[var(--color-fp-accent)] px-6 py-3 font-[var(--font-fp-mono)] text-xs uppercase tracking-[0.2em] text-black disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => signOutAction()}
          className="font-[var(--font-fp-mono)] text-xs uppercase tracking-[0.2em] hover:opacity-80"
          style={{ color: "var(--color-fp-ink-3)" }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span
        className="block pb-2 font-[var(--font-fp-mono)] text-[10px] uppercase tracking-[0.2em]"
        style={{ color: "var(--color-fp-ink-3)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
