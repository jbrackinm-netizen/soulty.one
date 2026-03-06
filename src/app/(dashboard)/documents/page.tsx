import { db, documents, projects } from "@/db";
import { desc } from "drizzle-orm";
import { Card, CardBody } from "@/components/ui/card";
import { AddDocumentForm } from "./add-document-form";
import { FileText, File } from "lucide-react";
import { formatDate, parseTags } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const [docs, allProjects] = await Promise.all([
    db.select().from(documents).orderBy(desc(documents.createdAt)),
    db.select().from(projects).orderBy(projects.name),
  ]);

  const projectMap = Object.fromEntries(allProjects.map(p => [p.id, p.name]));

  return (
    <div className="space-y-6">
      <AddDocumentForm projects={allProjects} />

      {docs.length === 0 ? (
        <Card>
          <CardBody>
            <div className="py-12 text-center">
              <FileText className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No documents yet. Add your first document above.</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map(doc => (
            <div key={doc.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-soul-200 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 shrink-0">
                  <File className="h-5 w-5 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{doc.title}</h3>
                  <p className="text-xs text-gray-500">
                    {doc.projectId ? projectMap[doc.projectId] ?? "—" : "General"}
                  </p>
                </div>
              </div>
              {doc.description && (
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">{doc.description}</p>
              )}
              <div className="flex flex-wrap gap-1 mb-2">
                {parseTags(doc.tags).map(t => (
                  <span key={t} className="inline-flex rounded-full bg-soul-50 px-2 py-0.5 text-xs text-soul-700">{t}</span>
                ))}
              </div>
              <p className="text-xs text-gray-400">{doc.uploadedBy} · {formatDate(doc.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
