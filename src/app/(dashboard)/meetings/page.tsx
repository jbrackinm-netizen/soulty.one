import { db, meetings, projects } from "@/db";
import { desc } from "drizzle-orm";
import { Card, CardBody } from "@/components/ui/card";
import { AddMeetingForm } from "./add-meeting-form";
import { MeetingCard } from "./meeting-card";
import { Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const [mtgs, allProjects] = await Promise.all([
    db.select().from(meetings).orderBy(desc(meetings.date)),
    db.select().from(projects).orderBy(projects.name),
  ]);

  const projectMap = Object.fromEntries(allProjects.map((p) => [p.id, p.name]));

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
          {mtgs.map((m) => (
            <MeetingCard key={m.id} meeting={m} projectMap={projectMap} />
          ))}
        </div>
      )}
    </div>
  );
}
