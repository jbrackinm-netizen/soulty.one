import { db } from '@/db';
import { projects, tasks, documents, meetings, questions } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    // Fetch all data in parallel
    const [projectsList, tasksList, documentsList, meetingsList, questionsList] = await Promise.all([
      db.select().from(projects).limit(10).orderBy(desc(projects.createdAt)),
      db.select().from(tasks).limit(20).orderBy(desc(tasks.createdAt)),
      db.select().from(documents).limit(20).orderBy(desc(documents.createdAt)),
      db.select().from(meetings).limit(10).orderBy(desc(meetings.createdAt)),
      db.select().from(questions).limit(10).orderBy(desc(questions.createdAt)),
    ]);

    return Response.json({
      success: true,
      data: {
        projects: projectsList,
        tasks: tasksList,
        documents: documentsList,
        meetings: meetingsList,
        questions: questionsList,
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
      },
      { status: 500 }
    );
  }
}