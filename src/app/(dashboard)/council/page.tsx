import { db, questions, projects } from "@/db";
import { desc } from "drizzle-orm";
import { Card, CardBody } from "@/components/ui/card";
import { CouncilQuestion } from "./council-question";
import { Users, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CouncilPage() {
  const [qs, allProjects] = await Promise.all([
    db.select().from(questions).orderBy(desc(questions.createdAt)),
    db.select().from(projects).orderBy(projects.name),
  ]);

  const projectMap = Object.fromEntries(allProjects.map((p) => [p.id, p.name]));

  const open     = qs.filter((q) => q.status === "open" || q.status === "reviewing");
  const resolved = qs.filter((q) => q.status === "resolved");

  return (
    <div className="space-y-8">
      {/* Intro banner */}
      <div className="rounded-xl bg-soul-600 px-6 py-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-5 w-5 text-soul-200" />
          <h2 className="font-bold text-lg">AI Council Chamber</h2>
        </div>
        <p className="text-soul-100 text-sm">
          Bring any open question before the council. Three specialized AI advisors — Technical, Strategic,
          and Risk — deliberate independently, then the Council Chair synthesizes a recommendation.
        </p>
      </div>

      {/* Open petitions */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Open Petitions ({open.length})
        </h3>
        {open.length === 0 ? (
          <Card>
            <CardBody>
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">No open questions. Add questions in Council Q&A.</p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {open.map((q) => (
              <CouncilQuestion key={q.id} q={q} projectMap={projectMap} />
            ))}
          </div>
        )}
      </section>

      {/* Resolved */}
      {resolved.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Resolved ({resolved.length})
          </h3>
          <div className="space-y-4">
            {resolved.map((q) => (
              <CouncilQuestion key={q.id} q={q} projectMap={projectMap} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
