'use client';

import { useState } from 'react';
import { CouncilAgents } from '@/components/CouncilAgents';

interface Project {
  id: number;
  name: string;
  status?: string;
  progress?: number;
  description?: string;
}

interface Task {
  id: number;
  projectId?: number;
  title: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  description?: string;
}

interface Document {
  id: number;
  projectId?: number;
  title: string;
  content?: string;
  tags?: string;
}

interface Meeting {
  id: number;
  projectId?: number;
  title: string;
  date?: string;
  attendees?: string;
  summary?: string;
  decisions?: string;
  nextSteps?: string;
}

interface DashboardData {
  projects: Project[];
  tasks: Task[];
  documents: Document[];
  meetings: Meeting[];
  questions: any[];
}

export default function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState<DashboardData>(initialData);
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
          projects: data.projects,
          tasks: data.tasks,
          documents: data.documents,
          meetings: data.meetings,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      setCouncilData(result);
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
          Projects: {data.projects.length}
        </div>
        <div className="px-6 py-3 bg-slate-900 border border-slate-700 text-slate-400 rounded-lg font-semibold">
          Tasks: {data.tasks.length}
        </div>
        <div className="px-6 py-3 bg-slate-900 border border-slate-700 text-slate-400 rounded-lg font-semibold">
          Meetings: {data.meetings.length}
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
        </div>
      )}

      {/* Data Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">📁 Projects</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.projects.slice(0, 5).map((p) => (
              <div key={p.id} className="bg-slate-800 rounded p-3 text-sm text-slate-300">
                <p className="font-semibold text-slate-100">{p.name}</p>
                <p className="text-xs text-slate-500 mt-1">{p.status || 'No status'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">��� Tasks</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.tasks.slice(0, 5).map((t) => (
              <div key={t.id} className="bg-slate-800 rounded p-3 text-sm text-slate-300">
                <p className="font-semibold text-slate-100">{t.title}</p>
                <p className="text-xs text-slate-500 mt-1">{t.priority} · {t.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

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