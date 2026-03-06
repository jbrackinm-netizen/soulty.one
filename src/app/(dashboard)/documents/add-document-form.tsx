"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown } from "lucide-react";
import type { Project } from "@/db";

export function AddDocumentForm({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [tags, setTags] = useState("");
  const [uploadedBy, setUploadedBy] = useState("Council");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        projectId: projectId ? Number(projectId) : null,
        tags: tags ? JSON.stringify(tags.split(",").map(t => t.trim()).filter(Boolean)) : null,
        uploadedBy,
      }),
    });
    setTitle(""); setDescription(""); setProjectId(""); setTags(""); setOpen(false);
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
            Add Document
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </CardHeader>
      {open && (
        <CardBody>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input required value={title} onChange={e => setTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-soul-400 focus:ring-2 focus:ring-soul-100"
                placeholder="Document title" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Uploaded by</label>
              <input value={uploadedBy} onChange={e => setUploadedBy(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-soul-400 focus:ring-2 focus:ring-soul-100"
                placeholder="Your name" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-soul-400 focus:ring-2 focus:ring-soul-100"
                placeholder="What is this document about?" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
              <input value={tags} onChange={e => setTags(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-soul-400 focus:ring-2 focus:ring-soul-100"
                placeholder="structural, panels, engineering" />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save Document"}</Button>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </form>
        </CardBody>
      )}
    </Card>
  );
}
