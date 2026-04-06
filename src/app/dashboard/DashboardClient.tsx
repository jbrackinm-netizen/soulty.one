'use client';

import { useState } from 'react';
import { NexusInsight } from '@/components/NexusInsight';
import { useNexusBrain, ProjectItem, TaskItem, NoteItem, MeetingItem } from '@/hooks/useNexusBrain';

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
  const { loading, error, data, getAction } = useNexusBrain();
  const [currentMode, setCurrentMode] = useState<'insight' | 'blockers' | 'priorities' | 'next_steps' | 'summary'>('insight');

  const handleAction = async (actionType: 'blockers' | 'priorities' | 'next_steps' | 'summary') => {
    setCurrentMode(actionType);
    await getAction(actionType, projects, tasks, notes, meetings);
  };

  return (
    <div className="space-y-8">
      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => handleAction('blockers')}
          disabled={loading}
          className="px-6 py-3 bg-red-900/30 border border-red-700 text-red-400 rounded-lg font-semibold hover:bg-red-900/50 disabled:opacity-50 transition"
        >
          🚫 Show Blockers
        </button>

        <button
          onClick={() => handleAction('priorities')}
          disabled={loading}
          className="px-6 py-3 bg-amber-900/30 border border-amber-700 text-amber-400 rounded-lg font-semibold hover:bg-amber-900/50 disabled:opacity-50 transition"
        >
          🎯 Show Priorities
        </button>

        <button
          onClick={() => handleAction('next_steps')}
          disabled={loading}
          className="px-6 py-3 bg-blue-900/30 border border-blue-700 text-blue-400 rounded-lg font-semibold hover:bg-blue-900/50 disabled:opacity-50 transition"
        >
          ⚡ Next Steps
        </button>

        <button
          onClick={() => handleAction('summary')}
          disabled={loading}
          className="px-6 py-3 bg-emerald-900/30 border border-emerald-700 text-emerald-400 rounded-lg font-semibold hover:bg-emerald-900/50 disabled:opacity-50 transition"
        >
          📊 Summary
        </button>
      </div>

      {/* Analysis Display */}
      {loading && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <p className="text-slate-400 animate-pulse">Nexus Brain analyzing...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
          <p className="text-red-400">Error: {error}</p>
        </div>
      )}

      {data && (
        <NexusInsight 
          projects={projects} 
          tasks={tasks} 
          notes={notes} 
          meetings={meetings} 
        />
      )}
    </div>
  );
}
