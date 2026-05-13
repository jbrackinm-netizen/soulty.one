import { drizzle } from 'drizzle-orm/libsql/web';
import { createClient } from '@libsql/client/web';
import type { InferInsertModel } from 'drizzle-orm';
import * as schema from './schema';

export * from './schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const db = drizzle(client, { schema });

export type NewProject  = InferInsertModel<typeof schema.projects>;
export type NewTask     = InferInsertModel<typeof schema.tasks>;
export type NewDocument = InferInsertModel<typeof schema.documents>;
export type NewMeeting  = InferInsertModel<typeof schema.meetings>;
export type NewQuestion = InferInsertModel<typeof schema.questions>;