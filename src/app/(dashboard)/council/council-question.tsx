"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Users, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { Question } from "@/db";

type AgentCouncilResult = {
  architect: string;
  dev: string;
  auditor: string;
  synthesis: string;
};

type Props = { q: Question; projectMap: Record<number, string> };

const panels: { key: keyof AgentCouncilResult; label: string; color: string }[] = [
  { key: "architect", label: "Architect Agent",    color: "bg-blue-50 border-blue-100 text-blue-800" },
  { key: "dev",       label: "Dev Agent",          color: "bg-soul-50 border-soul-100 text-soul-800" },
  { key: "auditor",   label: "Auditor Agent",      color: "bg-orange-50 border-orange-100 text-orange-800" },
  { key: "synthesis", label: "Council Synthesis",   color: "bg-green-50 border-green-100 text-green-800" },
];

// Maps old-style DB labels to new agent keys for backward compat
const labelToKey: Record<string, keyof AgentCouncilResult> = {
  "Architect Agent":   "architect",
  "Dev Agent":         "dev",
  "Auditor Agent":     "auditor",
  "Council Synthesis": "synthesis",
  // Legacy labels from the old council system
  "Technical Advisor": "architect",
  "Strategic Advisor": "dev",
  "Risk Analyst":      "auditor",
};

export function CouncilQuestion({ q, projectMap }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentCouncilResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Detect existing council answer in DB (supports both old and new formats)
  const existingCouncilAnswer =
    q.status === "resolved" &&
    q.answer &&
    (q.answer.includes("**Architect Agent**") ||
     q.answer.includes("**Technical Advisor**"))
      ? q.answer
      : null;

  async function conveneCouncil() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: q.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        setError(err.error);
        return;
      }
      const data = await res.json();
      setResult({
        architect: data.architect,
        dev: data.dev,
        auditor: data.auditor,
        synthesis: data.synthesis,
      });
      setExpanded(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reach council.");
    } finally {
      setLoading(false);
    }
  }

  // Parse an existing DB answer string into panel data
  function parseExistingAnswer(answer: string) {
    return answer.split("---").map((section, i) => {
      const match = section.match(/\*\*(.+?)\*\*\n([\s\S]+)/);
      if (!match) return null;
      const [, rawLabel, text] = match;
      const label = rawLabel.trim();
      const key = labelToKey[label];
      const panel = key ? panels.find((p) => p.key === key) : null;
      const color = panel?.color ?? "bg-gray-50 border-gray-200 text-gray-800";
      const displayLabel = panel?.label ?? label;
      return { key: i, label: displayLabel, color, text: text.trim() };
    }).filter(Boolean);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Question header */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900">{q.question}</p>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <Badge variant={statusVariant(q.status)}>{q.status}</Badge>
              {q.projectId && (
                <span className="text-xs text-gray-500">{projectMap[q.projectId] ?? "Unknown"}</span>
              )}
              <span className="text-xs text-gray-400">{q.author} · {formatDate(q.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!result && !existingCouncilAnswer && (
              <button
                onClick={conveneCouncil}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg bg-soul-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-soul-700 disabled:opacity-60 transition-colors"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Users className="h-3.5 w-3.5" />
                )}
                {loading ? "Convening…" : "Convene Council"}
              </button>
            )}
            {(result || existingCouncilAnswer) && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {expanded ? "Hide" : "View Council"}
              </button>
            )}
          </div>
        </div>
        {error && (
          <p className="mt-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>

      {/* Fresh council result panels */}
      {expanded && result && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
          <div className="grid gap-3 sm:grid-cols-2">
            {panels.map(({ key, label, color }) => (
              <div key={key} className={`rounded-lg border p-3.5 ${color}`}>
                <p className="text-xs font-bold mb-2 uppercase tracking-wide">{label}</p>
                <p className="text-sm leading-relaxed">{result[key]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing council answer from DB */}
      {expanded && existingCouncilAnswer && !result && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
          <div className="grid gap-3 sm:grid-cols-2">
            {parseExistingAnswer(existingCouncilAnswer).map((panel) => panel && (
              <div key={panel.key} className={`rounded-lg border p-3.5 ${panel.color}`}>
                <p className="text-xs font-bold mb-2 uppercase tracking-wide">{panel.label}</p>
                <p className="text-sm leading-relaxed">{panel.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
