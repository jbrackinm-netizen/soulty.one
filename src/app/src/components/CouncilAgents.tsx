'use client';

interface CouncilAgentsProps {
  summary?: string;
  priorities?: string[];
  blockers?: string[];
  recommendations?: string[];
  nextActions?: string[];
}

interface AgentCardProps {
  title: string;
  role: string;
  color: string;
  confidence: number;
  items: string[];
}

function AgentCard({ title, role, color, confidence, items }: AgentCardProps) {
  const colorClasses = {
    blue: 'bg-blue-900/30 border-blue-700 text-blue-400',
    emerald: 'bg-emerald-900/30 border-emerald-700 text-emerald-400',
    purple: 'bg-purple-900/30 border-purple-700 text-purple-400',
  };

  const bgClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <div className={`border rounded-lg p-6 ${bgClass} hover:-translate-y-0.5 transition`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm opacity-75 mt-1">{role}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{confidence}%</p>
          <p className="text-xs opacity-75">Confidence</p>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="w-full bg-black/30 rounded-full h-2 mb-4 overflow-hidden">
        <div
          className={`h-full rounded-full bg-current`}
          style={{ width: `${confidence}%` }}
        />
      </div>

      {/* Items List */}
      {items && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm flex items-start gap-2">
              <span className="text-lg leading-none mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm opacity-60 italic">No items to display</p>
      )}
    </div>
  );
}

export function CouncilAgents({
  summary,
  priorities = [],
  blockers = [],
  recommendations = [],
  nextActions = [],
}: CouncilAgentsProps) {
  // Calculate consensus
  const consensusScore = 85; // Default; can be dynamic from API
  const consensusStatus =
    consensusScore >= 80 ? 'Strong Consensus' : 'Moderate Consensus';

  return (
    <div className="space-y-8">
      {/* Summary */}
      {summary && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-3">
            📋 Council Summary
          </h2>
          <p className="text-slate-300 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Three Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AgentCard
          title="Architect"
          role="Strategic Vision"
          color="blue"
          confidence={85}
          items={recommendations}
        />
        <AgentCard
          title="Developer"
          role="Implementation Expert"
          color="emerald"
          confidence={78}
          items={nextActions}
        />
        <AgentCard
          title="Auditor"
          role="Risk & Compliance"
          color="purple"
          confidence={92}
          items={blockers}
        />
      </div>

      {/* Consensus Section */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          🤝 Council Consensus
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-400 font-semibold text-lg">
              {consensusStatus}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {consensusScore}% agreement across all agents
            </p>
          </div>
          <div className="w-24 h-24 flex items-center justify-center">
            <div className="relative w-full h-full">
              <svg className="transform -rotate-90 w-full h-full">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-slate-700"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-emerald-500"
                  strokeDasharray={`${consensusScore * 2.83} 283`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-slate-100">
                  {consensusScore}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Priorities Section */}
      {priorities && priorities.length > 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            🎯 Priorities
          </h2>
          <ol className="space-y-3">
            {priorities.map((priority, idx) => (
              <li key={idx} className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-amber-900/40 border border-amber-700 rounded-full flex items-center justify-center text-amber-400 font-semibold text-sm">
                  {idx + 1}
                </span>
                <span className="text-slate-300 pt-1">{priority}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
