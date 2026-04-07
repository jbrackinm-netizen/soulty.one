import { db, questions } from "@/db";
import { eq, desc } from "drizzle-orm";
import { Card, CardBody } from "@/components/ui/card";
import { CouncilVisualizerWrapper } from "./visualizer-wrapper";
import { Eye } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CouncilVisualizerPage() {
  // Get only open/reviewing questions that haven't been answered yet
  const openQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.status, "open"))
    .orderBy(desc(questions.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Eye className="h-5 w-5 text-soul-600" />
            Council Visualizer
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Watch the AI council deliberate in real-time. Select a question to begin.
          </p>
        </div>
        <Link
          href="/council"
          className="text-xs text-soul-600 hover:underline"
        >
          Back to Council Chamber
        </Link>
      </div>

      {openQuestions.length === 0 ? (
        <Card>
          <CardBody>
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400">
                No open questions to deliberate. Add questions in{" "}
                <Link href="/questions" className="text-soul-600 hover:underline">
                  Council Q&A
                </Link>
                .
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <CouncilVisualizerWrapper questions={openQuestions} />
      )}
    </div>
  );
}
