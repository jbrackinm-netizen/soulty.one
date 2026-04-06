"use client";

import { useEffect } from "react";
import { useNexusBrain } from "@/hooks/useNexusBrain";
import { ProjectItem, TaskItem, NoteItem, MeetingItem } from "@/hooks/useNexusBrain";

interface NexusInsightProps {
  projects: ProjectItem[];
  tasks: TaskItem[];
  notes: NoteItem[];
  meetings: MeetingItem[];
}

export function NexusInsight({
  projects,
  tasks,
  notes,
  meetings,
}: NexusInsightProps) {
  const { loading, error, data, getInsight } = useNexusBrain({
    onError: (err) => console.error("Nexus Brain error:", err),
  });

  useEffect(() => {
    // Fetch insight on component mount
    getInsight(projects, tasks, notes, meetings);
  }, [projects, tasks, notes, meetings, getInsight]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <p className="text-slate-400">Analyzing project state...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Project Summary
        </h2>
        <p className="text-lg text-slate-100">{data.summary}</p>
        <p className="text-xs text-slate-500 mt-3">
          Updated {new Date(data.timestamp).toLocaleTimeString()}
        </p>
      </div>

      {/* Priorities */}
      {data.priorities.length > 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
            🎯 Priorities
          </h3>
          <ul className="space-y-2">
            {data.priorities.map((priority, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-amber-400 font-bold">{i + 1}.</span>
                <span className="text-slate-200">{priority}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Blockers */}
      {data.blockers.length > 0 && (
        <div className="bg-slate-900 border border-red-700/30 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">
            🚫 Blockers
          </h3>
          <ul className="space-y-2">
            {data.blockers.map((blocker, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-red-400 font-bold">•</span>
                <span className="text-slate-200">{blocker}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="bg-slate-900 border border-emerald-700/30 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">
            💡 Recommendations
          </h3>
          <ul className="space-y-2">
            {data.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-emerald-400">✓</span>
                <span className="text-slate-200">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Actions */}
      {data.nextActions.length > 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">
            ⚡ Next Actions
          </h3>
          <ol className="space-y-2">
            {data.nextActions.map((action, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-blue-400 font-bold">{i + 1}.</span>
                <span className="text-slate-200">{action}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
