"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { File, Trash2 } from "lucide-react";
import { formatDate, parseTags } from "@/lib/utils";
import type { Document } from "@/db";

type Props = {
  doc: Document;
  projectMap: Record<number, string>;
};

export function DocumentCard({ doc, projectMap }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this document?")) return;
    setDeleting(true);
    await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-soul-200 transition-colors ${deleting ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 shrink-0">
          <File className="h-5 w-5 text-gray-500" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-900 text-sm truncate">{doc.title}</h3>
          <p className="text-xs text-gray-500">
            {doc.projectId ? (projectMap[doc.projectId] ?? "—") : "General"}
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="shrink-0 rounded-md p-1 text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {doc.description && (
        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{doc.description}</p>
      )}
      <div className="flex flex-wrap gap-1 mb-2">
        {parseTags(doc.tags).map((t) => (
          <span key={t} className="inline-flex rounded-full bg-soul-50 px-2 py-0.5 text-xs text-soul-700">
            {t}
          </span>
        ))}
      </div>
      <p className="text-xs text-gray-400">
        {doc.uploadedBy} · {formatDate(doc.createdAt)}
      </p>
    </div>
  );
}
