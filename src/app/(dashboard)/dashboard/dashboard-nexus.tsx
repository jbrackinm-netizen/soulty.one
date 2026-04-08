"use client";

import { useState } from "react";
import { Brain, Loader2, ChevronDown, ChevronUp, Zap } from "lucide-react";
import type { NexusResponse } from "@/hooks/useNexusBrain";

interface DashboardNexusProps {
  projects: { name: string; status?: string; description?: string }[];
  tasks: { title: string; status?: string; owner?: string; dueDate?: string }[];
  meetings: { title: string; date?: string; summary?: string; decisions?: string[] }[];
}

export function DashboardNexus({ projects, tasks, meetings }: DashboardNexusProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<NexusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  async function fetchInsight() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/nexus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projects,
          tasks,
          notes: [],
          meetings,
          mode: "insight",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error);
      }
      const result: NexusResponse = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get insight");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-soul-200 bg-gradient-to-br from-soul-50 to-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-soul-600">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Nexus Brain</h2>
            <p className="text-xs text-gray-500">AI-powered project analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!data && !loading && (
            <button
              onClick={fetchInsight}
              className="flex items-center gap-1.5 rounded-lg bg-soul-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-soul-700 transition-colors"
            >
              <Zap className="h-3.5 w-3.5" />
              Analyze
            </button>
          )}
          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-soul-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Analyzing...
            </div>
          )}
          {data && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expanded ? "Collapse" : "Expand"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="px-5 pb-4">
          <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Insight content */}
      {data && expanded && (
        <div className="border-t border-soul-100 px-5 py-4 space-y-4">
          {/* Summary */}
          <div>
            <p className="text-sm text-gray-900 font-medium">{data.summary}</p>
            <p className="text-xs text-gray-400 mt-1">
              Updated {new Date(data.timestamp).toLocaleTimeString()}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Priorities */}
            {data.priorities.length > 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Priorities</p>
                <ul className="space-y-1.5">
                  {data.priorities.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-amber-900">
                      <span className="font-bold text-amber-600">{i + 1}.</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Blockers */}
            {data.blockers.length > 0 && (
              <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">Blockers</p>
                <ul className="space-y-1.5">
                  {data.blockers.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-red-900">
                      <span className="text-red-500">-</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {data.recommendations.length > 0 && (
              <div className="rounded-lg bg-green-50 border border-green-100 p-3">
                <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">Recommendations</p>
                <ul className="space-y-1.5">
                  {data.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-green-900">
                      <span className="text-green-500">+</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Actions */}
            {data.nextActions.length > 0 && (
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Next Actions</p>
                <ol className="space-y-1.5">
                  {data.nextActions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-blue-900">
                      <span className="font-bold text-blue-600">{i + 1}.</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={fetchInsight}
            disabled={loading}
            className="text-xs text-soul-600 hover:text-soul-700 font-medium transition-colors disabled:opacity-50"
          >
            Refresh analysis
          </button>
        </div>
      )}
    </div>
  );
}
