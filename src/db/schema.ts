import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const projects = sqliteTable(
  'projects',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    status: text('status').default('planning'),
    progress: integer('progress').default(0),
    description: text('description'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    statusIdx: index('projects_status_idx').on(table.status),
  })
);

export const tasks = sqliteTable(
  'tasks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').default('todo'),
    priority: text('priority').default('medium'),
    dueDate: text('due_date'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    projectIdIdx: index('tasks_project_idx').on(table.projectId),
    statusIdx: index('tasks_status_idx').on(table.status),
  })
);

export const documents = sqliteTable(
  'documents',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content'),
    tags: text('tags'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    projectIdIdx: index('documents_project_idx').on(table.projectId),
  })
);

export const meetings = sqliteTable(
  'meetings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    date: text('date'),
    attendees: text('attendees'),
    summary: text('summary'),
    decisions: text('decisions'),
    nextSteps: text('next_steps'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    projectIdIdx: index('meetings_project_idx').on(table.projectId),
    dateIdx: index('meetings_date_idx').on(table.date),
  })
);

export const questions = sqliteTable(
  'questions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content'),
    answer: text('answer'),
    status: text('status').default('open'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    projectIdIdx: index('questions_project_idx').on(table.projectId),
    statusIdx: index('questions_status_idx').on(table.status),
  })
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
