"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown } from "lucide-react";
import type { Project } from "@/db";

export function AddQuestionForm({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [projectId, setProjectId] = useState("");
  const [author, setAuthor] = useState("Council");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        projectId: projectId ? Number(projectId) : null,
        author,
        status: "open",
      }),
    });
    setQuestion(""); setProjectId(""); setOpen(false);
    setSubmitting(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex w-full items-center justify-between text-sm font-semibold text-gray-900"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-soul-600" />
            Ask a Question
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </CardHeader>
      {open && (
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
              <textarea required rows={2} value={question} onChange={e => setQuestion(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-soul-400 focus:ring-2 focus:ring-soul-100"
                placeholder="What structural calculations support the panel system?" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select value={projectId} onChange={e => setProjectId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-soul-400 focus:ring-2 focus:ring-soul-100">
                  <option value="">— General —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asked by</label>
                <input value={author} onChange={e => setAuthor(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-soul-400 focus:ring-2 focus:ring-soul-100" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Submit Question"}</Button>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </form>
        </CardBody>
      )}
    </Card>
  );
}
