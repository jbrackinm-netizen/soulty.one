import { db, meetings, projects } from "@/db";
import { desc } from "drizzle-orm";
import { Card, CardBody } from "@/components/ui/card";
import { AddMeetingForm } from "./add-meeting-form";
import { Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const [mtgs, allProjects] = await Promise.all([
    db.select().from(meetings).orderBy(desc(meetings.date)),
    db.select().from(projects).orderBy(projects.name),
  ]);

  const projectMap = Object.fromEntries(allProjects.map(p => [p.id, p.name]));

  return (
    <div className="space-y-6">
      <AddMeetingForm projects={allProjects} />

      {mtgs.length === 0 ? (
        <Card>
          <CardBody>
            <div className="py-12 text-center">
              <Calendar className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No meeting notes yet. Log your first meeting above.</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {mtgs.map(m => {
            const decisions: string[]   = m.decisions    ? JSON.parse(m.decisions)    : [];
            const actions: string[]     = m.actionItems  ? JSON.parse(m.actionItems)  : [];
            return (
              <div key={m.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{m.title}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs text-gray-500">{formatDate(m.date)}</span>
                      {m.projectId && (
                        <span className="text-xs text-gray-400">· {projectMap[m.projectId] ?? "Unknown"}</span>
                      )}
                    </div>
                  </div>
                </div>

                {m.summary && (
                  <p className="text-sm text-gray-600 mb-3">{m.summary}</p>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {decisions.length > 0 && (
                    <div className="rounded-lg bg-soul-50 border border-soul-100 p-3">
                      <p className="text-xs font-semibold text-soul-700 mb-1.5">Decisions</p>
                      <ul className="space-y-1">
                        {decisions.map((d, i) => (
                          <li key={i} className="text-xs text-soul-900 flex gap-1.5">
                            <span className="text-soul-500">·</span>{d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {actions.length > 0 && (
                    <div className="rounded-lg bg-green-50 border border-green-100 p-3">
                      <p className="text-xs font-semibold text-green-700 mb-1.5">Action Items</p>
                      <ul className="space-y-1">
                        {actions.map((a, i) => (
                          <li key={i} className="text-xs text-green-900 flex gap-1.5">
                            <span className="text-green-500">✓</span>{a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
