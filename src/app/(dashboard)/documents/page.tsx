import { db, documents, projects } from "@/db";
import { desc } from "drizzle-orm";
import { Card, CardBody } from "@/components/ui/card";
import { AddDocumentForm } from "./add-document-form";
import { DocumentCard } from "./document-card";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const [docs, allProjects] = await Promise.all([
    db.select().from(documents).orderBy(desc(documents.createdAt)),
    db.select().from(projects).orderBy(projects.name),
  ]);

  const projectMap = Object.fromEntries(allProjects.map((p) => [p.id, p.name]));

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
          {docs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} projectMap={projectMap} />
          ))}
        </div>
      )}
    </div>
  );
}
