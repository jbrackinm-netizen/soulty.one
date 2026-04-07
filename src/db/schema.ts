import { sqliteTable, text, integer, real, primaryKey, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Projects table
export const projects = sqliteTable(
  'projects',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    status: text().default('planning'), // 'planning' | 'active' | 'completed' | 'paused'
    progress: integer().default(0), // 0-100
    description: text(),
    createdAt: text().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    statusIdx: index('projects_status_idx').on(table.status),
  })
);

// Tasks table
export const tasks = sqliteTable(
  'tasks',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    projectId: integer().references(() => projects.id, { onDelete: 'cascade' }),
    title: text().notNull(),
    description: text(),
    status: text().default('todo'), // 'todo' | 'in_progress' | 'review' | 'done'
    priority: text().default('medium'), // 'low' | 'medium' | 'high' | 'urgent'
    dueDate: text(), // ISO date string
    createdAt: text().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    projectIdIdx: index('tasks_project_idx').on(table.projectId),
    statusIdx: index('tasks_status_idx').on(table.status),
  })
);

// Documents table
export const documents = sqliteTable(
  'documents',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    projectId: integer().references(() => projects.id, { onDelete: 'cascade' }),
    title: text().notNull(),
    content: text(),
    tags: text(), // JSON array as string
    createdAt: text().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    projectIdIdx: index('documents_project_idx').on(table.projectId),
  })
);

// Meetings table
export const meetings = sqliteTable(
  'meetings',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    projectId: integer().references(() => projects.id, { onDelete: 'cascade' }),
    title: text().notNull(),
    date: text(), // ISO datetime string
    attendees: text(), // JSON array as string
    summary: text(),
    decisions: text(), // JSON array as string
    nextSteps: text(), // JSON array as string
    createdAt: text().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    projectIdIdx: index('meetings_project_idx').on(table.projectId),
    dateIdx: index('meetings_date_idx').on(table.date),
  })
);

// Questions table (for AI Council)
export const questions = sqliteTable(
  'questions',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    projectId: integer().references(() => projects.id, { onDelete: 'cascade' }),
    title: text().notNull(),
    content: text(),
    answer: text(),
    status: text().default('open'), // 'open' | 'in_progress' | 'resolved'
    createdAt: text().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    projectIdIdx: index('questions_project_idx').on(table.projectId),
    statusIdx: index('questions_status_idx').on(table.status),
  })
);
