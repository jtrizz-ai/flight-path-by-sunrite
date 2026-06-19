"use client";

import { useEffect, useState } from "react";

export function LlmConfigSection() {
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [masked, setMasked] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/llm-config", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setBaseUrl(d.baseUrl ?? "");
        setModel(d.model ?? "");
        setMasked(d.apiKeyMasked ?? "");
      })
      .catch(() => {});
  }, []);

  async function onSave() {
    setSaving(true);
    setError(null);
    const patch: Record<string, string> = { baseUrl, model };
    if (apiKey) patch.apiKey = apiKey;
    const res = await fetch("/api/admin/llm-config", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    if (res.ok) {
      const d = await res.json();
      setMasked(d.apiKeyMasked ?? "");
      setApiKey("");
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Save failed");
    }
  }

  async function onTest() {
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/chat/health", { cache: "no-store" });
    const d = await res.json();
    setTesting(false);
    setTestResult(d.ok ? `OK — model: ${d.model}` : `Fail: ${d.error}`);
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid var(--color-fp-line)",
    borderRadius: "14px",
    color: "var(--color-fp-ink)",
  };

  return (
    <div
      className="rounded-[18px] p-6"
      style={{
        backgroundColor: "var(--color-fp-card)",
        border: "1px solid var(--color-fp-card-line)",
      }}
    >
      <h2
        className="font-[var(--font-fp-sans)] text-[16px] font-bold mb-1"
        style={{ color: "var(--color-fp-ink)" }}
      >
        AI Configuration
      </h2>
      <p
        className="font-[var(--font-fp-sans)] text-[12px] mb-4"
        style={{ color: "var(--color-fp-ink-3)" }}
      >
        Configure the local LLM endpoint used by the chat assistant.
      </p>

      <div className="space-y-4">
        <label className="block">
          <span
            className="block pb-1.5 font-[var(--font-fp-mono)] text-[10px] tracking-[0.2em] uppercase"
            style={{ color: "var(--color-fp-ink-3)" }}
          >
            Base URL
          </span>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://localhost:1234/v1"
            className="w-full px-4 py-2.5 font-mono text-[13px] focus:outline-none"
            style={inputStyle}
          />
        </label>

        <label className="block">
          <span
            className="block pb-1.5 font-[var(--font-fp-mono)] text-[10px] tracking-[0.2em] uppercase"
            style={{ color: "var(--color-fp-ink-3)" }}
          >
            Model
          </span>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-4 py-2.5 font-mono text-[13px] focus:outline-none"
            style={inputStyle}
          />
        </label>

        <label className="block">
          <span
            className="block pb-1.5 font-[var(--font-fp-mono)] text-[10px] tracking-[0.2em] uppercase"
            style={{ color: "var(--color-fp-ink-3)" }}
          >
            API Token{" "}
            {masked && (
              <span style={{ color: "var(--color-fp-ink-3)", textTransform: "none" }}>
                (current: {masked})
              </span>
            )}
          </span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Leave blank to keep current"
            className="w-full px-4 py-2.5 font-mono text-[13px] focus:outline-none"
            style={inputStyle}
          />
        </label>

        {error && (
          <div
            className="font-[var(--font-fp-sans)] text-[13px]"
            style={{ color: "var(--color-fp-accent)" }}
          >
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-full px-5 py-2 font-[var(--font-fp-mono)] text-[11px] font-bold tracking-[0.1em] uppercase transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "var(--color-fp-accent)", color: "#fff" }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onTest}
            disabled={testing}
            className="rounded-full px-5 py-2 font-[var(--font-fp-mono)] text-[11px] font-bold tracking-[0.1em] uppercase"
            style={{
              border: "1px solid var(--color-fp-line)",
              color: "var(--color-fp-ink-2)",
            }}
          >
            {testing ? "Testing..." : "Test Connection"}
          </button>
          {testResult && (
            <span
              className="font-[var(--font-fp-mono)] text-[12px]"
              style={{ color: "var(--color-fp-ink-3)" }}
            >
              {testResult}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
