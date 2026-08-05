'use client';
import { useState } from 'react';
import { Brain, Zap, Loader2 } from 'lucide-react';

interface CouncilResponse {
  question: string;
  responses: {
    strategic: string | null;
    tactical: string | null;
    visual: string | null;
  };
  timestamp: string;
}

const MODEL_LABELS = {
  strategic: { label: 'Claude — Strategic', icon: '🧠' },
  tactical: { label: 'GPT-4 — Tactical', icon: '⚡' },
  visual: { label: 'Gemini — Visual', icon: '👁' },
};

export default function NexusPage() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CouncilResponse | null>(null);
  const [taskType, setTaskType] = useState('reasoning');
  const [error, setError] = useState<string | null>(null);

  async function askCouncil() {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch('/api/nexus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'council', question, taskType }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResponse(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Brain className="w-8 h-8 text-blue-600" /> Nexus Brain
        </h1>
        <p className="text-gray-500 mt-1">Multi-model AI council — Claude, GPT-4, and Gemini deliberate on your question</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 space-y-4">
        <div className="flex gap-3">
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="reasoning">Reasoning</option>
            <option value="planning">Planning</option>
            <option value="code">Code</option>
            <option value="vision">Vision</option>
          </select>
          <span className="text-xs text-gray-400 self-center">Task type routes to best model</span>
        </div>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask the council anything — strategy, technical problems, decisions..."
          className="w-full h-28 p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => e.key === 'Enter' && e.metaKey && askCouncil()}
        />
        <button
          onClick={askCouncil}
          disabled={loading || !question.trim()}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Consulting Council...</> : <><Zap className="w-4 h-4" /> Ask the Council</>}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-6">{error}</div>
      )}

      {response && (
        <div className="space-y-4">
          <div className="text-sm text-gray-500">Council response for: <em>{response.question}</em></div>
          {(Object.entries(response.responses) as [string, string | null][]).map(([key, content]) => {
            const meta = MODEL_LABELS[key as keyof typeof MODEL_LABELS];
            if (!content) return null;
            return (
              <div key={key} className={`bg-white border-l-4 ${
                key === 'strategic' ? 'border-blue-500' : key === 'tactical' ? 'border-green-500' : 'border-purple-500'
              } border border-gray-200 rounded-2xl p-6`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{meta.icon}</span>
                  <h3 className="font-bold text-gray-900">{meta.label}</h3>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
