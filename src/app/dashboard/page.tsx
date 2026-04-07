import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'SoulT Council Dashboard',
};

export default async function DashboardPage() {
  let initialData = {
    projects: [],
    tasks: [],
    documents: [],
    meetings: [],
    questions: [],
  };

  try {
    const res = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/dashboard`, {
      cache: 'no-store',
    });

    if (res.ok) {
      const response = await res.json();
      initialData = response.data;
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-8">
      {/* Header */}
      <header className="border-b border-slate-800 pb-6">
        <h1 className="text-4xl font-bold text-slate-100">SoulT AI Council</h1>
        <p className="text-slate-400 mt-2">Real-time project intelligence</p>
      </header>

      {/* Dashboard Client */}
      <DashboardClient initialData={initialData} />
    </div>
  );
}