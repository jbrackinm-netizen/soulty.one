"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, X } from "lucide-react";
import type { Project } from "@/db";

export function AddMeetingForm({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [summary, setSummary] = useState("");
  const [projectId, setProjectId] = useState("");
  const [decisionInput, setDecisionInput] = useState("");
  const [decisions, setDecisions] = useState<string[]>([]);
  const [actionInput, setActionInput] = useState("");
  const [actions, setActions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function addDecision() {
    if (decisionInput.trim()) { setDecisions(d => [...d, decisionInput.trim()]); setDecisionInput(""); }
  }
  function addAction() {
    if (actionInput.trim()) { setActions(a => [...a, actionInput.trim()]); setActionInput(""); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, date, summary,
        projectId: projectId ? Number(projectId) : null,
        decisions: JSON.stringify(decisions),
        nextSteps: JSON.stringify(actions),
      }),
    });
    setTitle(""); setSummary(""); setDecisions([]); setActions([]); setOpen(false);
    setSubmitting(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <button onClick={() => setOpen(o => !o)}
          className="flex w-full items-center justify-between text-sm font-semibold text-gray-900">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-soul-600" />
            Log Meeting
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </CardHeader>
      {open && (
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input required value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-soul-400 focus:ring-2 focus:ring-soul-100"
                  placeholder="Council Kick-off" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-soul-400 focus:ring-2 focus:ring-soul-100" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-soul-400 focus:ring-2 focus:ring-soul-100">
                <option value="">— General —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
              <textarea rows={2} value={summary} onChange={e => setSummary(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-soul-400 focus:ring-2 focus:ring-soul-100"
                placeholder="What was this meeting about?" />
            </div>
            {/* Decisions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Decisions</label>
              <div className="flex gap-2">
                <input value={decisionInput} onChange={e => setDecisionInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addDecision())}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-soul-400 focus:ring-2 focus:ring-soul-100"
                  placeholder="Add a decision, press Enter" />
                <Button type="button" variant="secondary" onClick={addDecision}>Add</Button>
              </div>
              {decisions.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {decisions.map((d, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-soul-500">·</span>
                      <span className="flex-1">{d}</span>
                      <button type="button" onClick={() => setDecisions(prev => prev.filter((_, j) => j !== i))}>
                        <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Action Items */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Items</label>
              <div className="flex gap-2">
                <input value={actionInput} onChange={e => setActionInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addAction())}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-soul-400 focus:ring-2 focus:ring-soul-100"
                  placeholder="Add an action item, press Enter" />
                <Button type="button" variant="secondary" onClick={addAction}>Add</Button>
              </div>
              {actions.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {actions.map((a, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-500">✓</span>
                      <span className="flex-1">{a}</span>
                      <button type="button" onClick={() => setActions(prev => prev.filter((_, j) => j !== i))}>
                        <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save Meeting"}</Button>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </form>
        </CardBody>
      )}
    </Card>
  );
}
