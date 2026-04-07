'use client';

import { useState } from 'react';
import { CouncilAgents } from '@/components/CouncilAgents';

interface ProjectItem {
  id: string | number;
  name: string;
  status?: string;
  progress?: number;
  description?: string;
}

interface TaskItem {
  id: string | number;
  title: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  description?: string;
}

interface NoteItem {
  id: string | number;
  title: string;
  content: string;
  createdAt?: string;
  tags?: string[];
}

interface MeetingItem {
  id: string | number;
  title: string;
  date?: string;
  attendees?: string[];
  summary?: string;
  decisions?: string[];
  nextSteps?: string[];
}

interface DashboardClientProps {
  projects: ProjectItem[];
  tasks: TaskItem[];
  notes: NoteItem[];
  meetings: MeetingItem[];
}

export default function DashboardClient({
  projects,
  tasks,
  notes,
  meetings,
}: DashboardClientProps) {
  const [loading, setLoading] = useState(false);
  const [councilData, setCouncilData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeWithCouncil = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/nexus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'insight',
          projects,
          tasks,
          notes,
          meetings,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setCouncilData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={analyzeWithCouncil}
          disabled={loading}
          className="px-6 py-3 bg-amber-900/30 border border-amber-700 text-amber-400 rounded-lg font-semibold hover:bg-amber-900/50 disabled:opacity-50 transition"
        >
          {loading ? '🔄 Analyzing...' : '🎯 Run Council Analysis'}
        </button>
        <div className="px-6 py-3 bg-slate-900 border border-slate-700 text-slate-400 rounded-lg font-semibold">
          Projects: {projects.length}
        </div>
        <div className="px-6 py-3 bg-slate-900 border border-slate-700 text-slate-400 rounded-lg font-semibold">
          Tasks: {tasks.length}
        </div>
        <div className="px-6 py-3 bg-slate-900 border border-slate-700 text-slate-400 rounded-lg font-semibold">
          Meetings: {meetings.length}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
          <p className="text-red-400">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 text-center">
          <p className="text-slate-400 text-lg animate-pulse">
            🧠 Nexus Brain analyzing your council...
          </p>
        </div>
      )}

      {/* Council Results */}
      {councilData && !loading && (
        <div className="space-y-6">
          <CouncilAgents
            summary={councilData.summary}
            priorities={councilData.priorities || []}
            blockers={councilData.blockers || []}
            recommendations={councilData.recommendations || []}
            nextActions={councilData.nextActions || []}
          />

          {/* Raw Data Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Projects */}
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">
                📁 Projects ({projects.length})
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {projects.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="bg-slate-800 rounded p-3 text-sm text-slate-300"
                  >
                    <p className="font-semibold text-slate-100">{p.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {p.status || 'No status'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks */}
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">
                ✓ Tasks ({tasks.length})
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {tasks.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="bg-slate-800 rounded p-3 text-sm text-slate-300"
                  >
                    <p className="font-semibold text-slate-100">{t.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {t.priority} · {t.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!councilData && !loading && (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-8 text-center">
          <p className="text-slate-400">
            Click "Run Council Analysis" to begin. The AI Council will evaluate your projects, tasks, and meetings to provide strategic insights.
          </p>
        </div>
      )}
    </div>
  );
}
