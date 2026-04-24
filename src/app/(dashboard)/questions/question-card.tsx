"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Sparkles, Trash2, Pencil, X, Check, Loader2 } from "lucide-react";
import type { Question, Project } from "@/db";

type Props = {
  q: Question;
  projectMap: Record<number, string>;
};

export function QuestionCard({ q, projectMap }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "manual" | "ai">("idle");
  const [manualAnswer, setManualAnswer] = useState(q.answer ?? "");
  const [streamedAnswer, setStreamedAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleManualSave() {
    setSaving(true);
    await fetch(`/api/questions/${q.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: manualAnswer, status: "resolved" }),
    });
    setSaving(false);
    setMode("idle");
    router.refresh();
  }

  async function handleAskAI() {
    setMode("ai");
    setStreamedAnswer("");

    const res = await fetch("/api/ai/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: q.id }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      setStreamedAnswer(`Error: ${err.error}`);
      setMode("idle");
      return;
    }

    const data = await res.json();
    setStreamedAnswer(data.answer ?? "No answer returned.");
    setMode("idle");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this question?")) return;
    await fetch(`/api/questions/${q.id}`, { method: "DELETE" });
    router.refresh();
  }

  const displayAnswer = mode === "ai" ? streamedAnswer : q.answer;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">{q.title}</p>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <Badge variant={statusVariant(q.status)}>{q.status}</Badge>
            {q.projectId && (
              <span className="text-xs text-gray-500">{projectMap[q.projectId] ?? "Unknown"}</span>
            )}
            <span className="text-xs text-gray-400">{formatDate(q.createdAt)}</span>
          </div>
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {mode === "idle" && (
            <>
              <button
                onClick={handleAskAI}
                title="Ask AI Council"
                className="flex items-center gap-1 rounded-lg bg-soul-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-soul-700 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Ask AI
              </button>
              <button
                onClick={() => setMode("manual")}
                title="Answer manually"
                className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleDelete}
                title="Delete question"
                className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {mode === "manual" && (
            <button
              onClick={() => setMode("idle")}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {mode === "ai" && (
            <div className="flex items-center gap-1 text-xs text-soul-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Thinking…</span>
            </div>
          )}
        </div>
      </div>

      {/* Answer display */}
      {displayAnswer && mode !== "manual" && (
        <div className="mt-3 rounded-lg bg-green-50 border border-green-100 px-4 py-3">
          <p className="text-xs font-semibold text-green-700 mb-1">
            {mode === "ai" ? "AI Council Answer (streaming…)" : "Answer"}
          </p>
          <p className="text-sm text-green-900 whitespace-pre-wrap">{displayAnswer}</p>
        </div>
      )}

      {/* Manual answer form */}
      {mode === "manual" && (
        <div className="mt-3 space-y-2">
          <textarea
            value={manualAnswer}
            onChange={(e) => setManualAnswer(e.target.value)}
            placeholder="Write your answer…"
            rows={3}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-soul-300 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleManualSave}
              disabled={saving || !manualAnswer.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-soul-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-soul-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save answer
            </button>
            <button
              onClick={() => { setMode("idle"); setManualAnswer(q.answer ?? ""); }}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
