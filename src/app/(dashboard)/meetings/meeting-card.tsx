"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Trash2, Sparkles, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Meeting } from "@/db";

type Props = {
  meeting: Meeting;
  projectMap: Record<number, string>;
};

export function MeetingCard({ meeting: m, projectMap }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decisions: string[] = m.decisions ? JSON.parse(m.decisions) : [];
  const actions: string[] = m.actionItems ? JSON.parse(m.actionItems) : [];

  async function handleDelete() {
    if (!confirm("Delete this meeting?")) return;
    setDeleting(true);
    await fetch(`/api/meetings/${m.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleSummarize() {
    setSummarizing(true);
    setError(null);
    const res = await fetch("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId: m.id }),
    });
    setSummarizing(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      setError(err.error);
      return;
    }
    const data = await res.json();
    setAiSummary(data.summary);
    router.refresh();
  }

  const displaySummary = aiSummary ?? m.summary;

  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-opacity ${deleting ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{m.title}</h3>
          <div className="mt-1 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">{formatDate(m.date)}</span>
            {m.projectId && (
              <span className="text-xs text-gray-400">· {projectMap[m.projectId] ?? "Unknown"}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleSummarize}
            disabled={summarizing}
            title="Summarize with AI"
            className="flex items-center gap-1 rounded-lg bg-soul-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-soul-700 disabled:opacity-50 transition-colors"
          >
            {summarizing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {summarizing ? "Summarizing…" : "AI Summary"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {displaySummary && (
        <div className={`mb-3 rounded-lg px-3 py-2 ${aiSummary ? "bg-soul-50 border border-soul-100" : ""}`}>
          {aiSummary && <p className="text-xs font-semibold text-soul-700 mb-1">AI Summary</p>}
          <p className="text-sm text-gray-600">{displaySummary}</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {decisions.length > 0 && (
          <div className="rounded-lg bg-soul-50 border border-soul-100 p-3">
            <p className="text-xs font-semibold text-soul-700 mb-1.5">Decisions</p>
            <ul className="space-y-1">
              {decisions.map((d, i) => (
                <li key={i} className="text-xs text-soul-900 flex gap-1.5">
                  <span className="text-soul-500">·</span>{d}
                </li>
              ))}
            </ul>
          </div>
        )}
        {actions.length > 0 && (
          <div className="rounded-lg bg-green-50 border border-green-100 p-3">
            <p className="text-xs font-semibold text-green-700 mb-1.5">Action Items</p>
            <ul className="space-y-1">
              {actions.map((a, i) => (
                <li key={i} className="text-xs text-green-900 flex gap-1.5">
                  <span className="text-green-500">✓</span>{a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
