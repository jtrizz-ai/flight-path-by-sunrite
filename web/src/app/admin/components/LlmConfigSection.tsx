"use client";

import { useEffect, useState } from "react";

export default function LlmConfigSection() {
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
      .catch(() => {
        /* leave empty; user can retry by reloading */
      });
  }, []);

  async function onSave() {
    setSaving(true);
    setError(null);
    const patch: Record<string, string> = { baseUrl, model };
    if (apiKey) patch.apiKey = apiKey; // only send when the user typed a new one
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

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-2">AI Configuration</h2>
      <p className="text-gray-400 text-sm mb-4">
        Configure the local LLM endpoint used by the chat assistant.
      </p>

      <div className="space-y-4">
        <label className="block">
          <span className="block pb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Base URL
          </span>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://localhost:1234/v1"
            className="w-full bg-slate-800 border border-white/10 rounded-md px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-orange-500"
          />
        </label>

        <label className="block">
          <span className="block pb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Model
          </span>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-slate-800 border border-white/10 rounded-md px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-orange-500"
          />
        </label>

        <label className="block">
          <span className="block pb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
            API Token{" "}
            {masked && <span className="text-gray-500 normal-case">(current: {masked})</span>}
          </span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Leave blank to keep current"
            className="w-full bg-slate-800 border border-white/10 rounded-md px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-orange-500"
          />
        </label>

        {error && <div className="text-sm text-orange-400">{error}</div>}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-md"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={onTest}
            disabled={testing}
            className="border border-white/20 hover:border-white/40 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-md"
          >
            {testing ? "Testing…" : "Test connection"}
          </button>
          {testResult && (
            <span className="text-sm text-gray-400 font-mono">{testResult}</span>
          )}
        </div>
      </div>
    </div>
  );
}
