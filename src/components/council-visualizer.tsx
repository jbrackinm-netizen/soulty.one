"use client";

import { useState, useEffect } from "react";
import { Brain, Cpu, Shield, Users, Loader2, CheckCircle, Circle } from "lucide-react";

type AgentStatus = "idle" | "thinking" | "done" | "error";

interface AgentState {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  status: AgentStatus;
  result: string | null;
}

interface CouncilVisualizerProps {
  questionId: number;
  questionText: string;
  onComplete?: (result: {
    architect: string;
    dev: string;
    auditor: string;
    synthesis: string;
  }) => void;
  autoStart?: boolean;
}

const initialAgents: Omit<AgentState, "status" | "result">[] = [
  {
    id: "architect",
    label: "Architect",
    icon: Brain,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
  },
  {
    id: "dev",
    label: "Dev",
    icon: Cpu,
    color: "text-soul-600",
    bgColor: "bg-soul-50 border-soul-200",
  },
  {
    id: "auditor",
    label: "Auditor",
    icon: Shield,
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
  },
];

export function CouncilVisualizer({
  questionId,
  questionText,
  onComplete,
  autoStart = false,
}: CouncilVisualizerProps) {
  const [agents, setAgents] = useState<AgentState[]>(
    initialAgents.map((a) => ({ ...a, status: "idle", result: null })),
  );
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [synthesisStatus, setSynthesisStatus] = useState<AgentStatus>("idle");
  const [phase, setPhase] = useState<"idle" | "agents" | "synthesis" | "complete">("idle");

  useEffect(() => {
    if (autoStart && phase === "idle") {
      runCouncil();
    }
  }, [autoStart]); // eslint-disable-line react-hooks/exhaustive-deps

  async function callAgent(agentId: string): Promise<string> {
    const res = await fetch(`/api/agents/${agentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Agent failed" }));
      throw new Error(err.error);
    }
    const data = await res.json();
    return data.analysis;
  }

  async function runCouncil() {
    setPhase("agents");

    // Set all agents to thinking
    setAgents((prev) => prev.map((a) => ({ ...a, status: "thinking", result: null })));
    setSynthesis(null);
    setSynthesisStatus("idle");

    // Run all three agents in parallel
    const results: Record<string, string> = {};
    await Promise.all(
      initialAgents.map(async (agent) => {
        try {
          const analysis = await callAgent(agent.id);
          results[agent.id] = analysis;
          setAgents((prev) =>
            prev.map((a) =>
              a.id === agent.id ? { ...a, status: "done", result: analysis } : a,
            ),
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Failed";
          setAgents((prev) =>
            prev.map((a) =>
              a.id === agent.id ? { ...a, status: "error", result: msg } : a,
            ),
          );
        }
      }),
    );

    // Synthesis phase — call the answer endpoint which does the fan-out internally
    // But since we already have the agent results, call Claude directly for synthesis
    setPhase("synthesis");
    setSynthesisStatus("thinking");

    try {
      const res = await fetch("/api/agents/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Synthesis failed" }));
        throw new Error(err.error);
      }
      const data = await res.json();
      setSynthesis(data.synthesis);
      setSynthesisStatus("done");
      setPhase("complete");
      onComplete?.({
        architect: data.architect,
        dev: data.dev,
        auditor: data.auditor,
        synthesis: data.synthesis,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Synthesis failed";
      setSynthesis(msg);
      setSynthesisStatus("error");
    }
  }

  function StatusIcon({ status }: { status: AgentStatus }) {
    switch (status) {
      case "thinking":
        return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
      case "done":
        return <CheckCircle className="h-3.5 w-3.5" />;
      case "error":
        return <Circle className="h-3.5 w-3.5 text-red-500" />;
      default:
        return <Circle className="h-3.5 w-3.5 text-gray-300" />;
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-soul-50 to-blue-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-soul-600" />
            <h3 className="text-sm font-bold text-gray-900">Council Deliberation</h3>
          </div>
          {phase === "idle" && (
            <button
              onClick={runCouncil}
              className="flex items-center gap-1.5 rounded-lg bg-soul-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-soul-700 transition-colors"
            >
              <Users className="h-3.5 w-3.5" />
              Convene
            </button>
          )}
          {phase === "complete" && (
            <span className="text-xs font-medium text-green-600">Deliberation complete</span>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-600 line-clamp-2">{questionText}</p>
      </div>

      {/* Agent pipeline visualization */}
      <div className="px-5 py-4">
        {/* Agent cards */}
        <div className="grid gap-3 sm:grid-cols-3 mb-4">
          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <div
                key={agent.id}
                className={`rounded-lg border p-3 transition-all ${
                  agent.status === "thinking"
                    ? `${agent.bgColor} animate-pulse`
                    : agent.status === "done"
                      ? agent.bgColor
                      : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 ${agent.status !== "idle" ? agent.color : "text-gray-400"}`} />
                  <span className="text-xs font-bold uppercase tracking-wide">
                    {agent.label}
                  </span>
                  <span className="ml-auto">
                    <StatusIcon status={agent.status} />
                  </span>
                </div>
                {agent.result && agent.status === "done" && (
                  <p className="text-xs leading-relaxed line-clamp-4">{agent.result}</p>
                )}
                {agent.status === "thinking" && (
                  <p className="text-xs text-gray-500 italic">Analyzing...</p>
                )}
                {agent.status === "error" && (
                  <p className="text-xs text-red-600">{agent.result}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Synthesis */}
        {(synthesisStatus !== "idle" || phase === "synthesis" || phase === "complete") && (
          <div
            className={`rounded-lg border p-4 transition-all ${
              synthesisStatus === "thinking"
                ? "bg-green-50 border-green-200 animate-pulse"
                : synthesisStatus === "done"
                  ? "bg-green-50 border-green-200"
                  : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className={`h-4 w-4 ${synthesisStatus !== "idle" ? "text-green-600" : "text-gray-400"}`} />
              <span className="text-xs font-bold uppercase tracking-wide text-green-800">
                Council Synthesis
              </span>
              <span className="ml-auto">
                <StatusIcon status={synthesisStatus} />
              </span>
            </div>
            {synthesisStatus === "thinking" && (
              <p className="text-xs text-gray-500 italic">Synthesizing perspectives...</p>
            )}
            {synthesis && synthesisStatus === "done" && (
              <p className="text-sm leading-relaxed text-green-900">{synthesis}</p>
            )}
            {synthesisStatus === "error" && (
              <p className="text-xs text-red-600">{synthesis}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
