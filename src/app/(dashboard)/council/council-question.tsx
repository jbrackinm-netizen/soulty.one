"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Users, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { Question } from "@/db";

type CouncilResult = {
  technical: string;
  strategic: string;
  risk: string;
  synthesis: string;
};

type Props = { q: Question; projectMap: Record<number, string> };

export function CouncilQuestion({ q, projectMap }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CouncilResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // If already resolved with a council answer, show it collapsed by default
  const existingCouncilAnswer =
    q.status === "resolved" && q.answer?.includes("**Technical Advisor**") ? q.answer : null;

  async function conveneCouncil() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/ai/council", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: q.id }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      setError(err.error);
      return;
    }
    const data: CouncilResult = await res.json();
    setResult(data);
    setExpanded(true);
    router.refresh();
  }

  const panels: { key: keyof CouncilResult; label: string; color: string }[] = [
    { key: "technical",  label: "Technical Advisor",  color: "bg-blue-50 border-blue-100 text-blue-800" },
    { key: "strategic",  label: "Strategic Advisor",  color: "bg-soul-50 border-soul-100 text-soul-800" },
    { key: "risk",       label: "Risk Analyst",       color: "bg-orange-50 border-orange-100 text-orange-800" },
    { key: "synthesis",  label: "Council Synthesis",  color: "bg-green-50 border-green-100 text-green-800" },
  ];

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

      {/* Council deliberation panels */}
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

      {/* Existing council answer (already in DB) */}
      {expanded && existingCouncilAnswer && !result && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
          <div className="grid gap-3 sm:grid-cols-2">
            {existingCouncilAnswer.split("---").map((section, i) => {
              const match = section.match(/\*\*(.+?)\*\*\n([\s\S]+)/);
              if (!match) return null;
              const [, label, text] = match;
              const colorMap: Record<string, string> = {
                "Technical Advisor": "bg-blue-50 border-blue-100 text-blue-800",
                "Strategic Advisor": "bg-soul-50 border-soul-100 text-soul-800",
                "Risk Analyst":      "bg-orange-50 border-orange-100 text-orange-800",
                "Council Synthesis": "bg-green-50 border-green-100 text-green-800",
              };
              const color = colorMap[label.trim()] ?? "bg-gray-50 border-gray-200 text-gray-800";
              return (
                <div key={i} className={`rounded-lg border p-3.5 ${color}`}>
                  <p className="text-xs font-bold mb-2 uppercase tracking-wide">{label.trim()}</p>
                  <p className="text-sm leading-relaxed">{text.trim()}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
