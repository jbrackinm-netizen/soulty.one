import { createClient } from '@/utils/supabase/server';
import { NexusInsight } from '@/components/NexusInsight';
import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'SoulT Council Dashboard',
};

export default async function DashboardPage() {
  const supabase = createClient();

  // Fetch all data in parallel
  const [
    { data: projects = [] },
    { data: tasks = [] },
    { data: notes = [] },
    { data: meetings = [] }
  ] = await Promise.all([
    supabase.from('projects').select('id, name, status, progress, description'),
    supabase.from('tasks').select('id, title, status, priority, dueDate, description'),
    supabase.from('notes').select('id, title, content, createdAt, tags'),
    supabase.from('meetings').select('id, title, date, attendees, summary, decisions, nextSteps'),
  ]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-8">
      <header>
        <h1 className="text-4xl font-bold text-slate-100">SoulT AI Council</h1>
        <p className="text-slate-400 mt-2">Real-time project intelligence</p>
      </header>

      <DashboardClient 
        projects={projects} 
        tasks={tasks} 
        notes={notes} 
        meetings={meetings} 
      />
    </div>
  );
}
