"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown } from "lucide-react";
import type { Project } from "@/db";

export function AddTaskForm({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState("");
  const [owner, setOwner] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("todo");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task,
        owner: owner || null,
        projectId: projectId ? Number(projectId) : null,
        status,
        dueDate: dueDate || null,
      }),
    });
    setTask(""); setOwner(""); setProjectId(""); setDueDate(""); setOpen(false);
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
            Add Task
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </CardHeader>
      {open && (
        <CardBody>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Task *</label>
              <input required value={task} onChange={e => setTask(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-soul-400 focus:ring-2 focus:ring-soul-100"
                placeholder="Design panel locking system" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <input value={owner} onChange={e => setOwner(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-soul-400 focus:ring-2 focus:ring-soul-100"
                placeholder="J. Brackin" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-soul-400 focus:ring-2 focus:ring-soul-100">
                <option value="todo">To-do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-soul-400 focus:ring-2 focus:ring-soul-100" />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Add Task"}</Button>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </form>
        </CardBody>
      )}
    </Card>
  );
}
