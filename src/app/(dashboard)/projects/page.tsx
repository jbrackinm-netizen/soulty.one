import { db, projects } from "@/db";
import { Card, CardBody } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { FolderOpen, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const rows = await db.select().from(projects).orderBy(projects.name);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{rows.length} project{rows.length !== 1 ? "s" : ""}</p>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-soul-600 px-4 py-2 text-sm font-medium text-white hover:bg-soul-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardBody>
            <div className="py-12 text-center">
              <FolderOpen className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No projects yet. Create your first project.</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(project => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-soul-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-soul-50 group-hover:bg-soul-100 transition-colors">
                  <FolderOpen className="h-5 w-5 text-soul-600" />
                </div>
                <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-soul-700 transition-colors">{project.name}</h3>
              {project.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{project.description}</p>
              )}
              <p className="mt-3 text-xs text-gray-400">{formatDate(project.createdAt)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
