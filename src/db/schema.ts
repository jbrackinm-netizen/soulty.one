import { sql } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const projectStatusEnum = pgEnum("project_status", ["active", "paused", "complete"]);
export const questionStatusEnum = pgEnum("question_status", ["open", "reviewing", "resolved"]);
export const taskStatusEnum = pgEnum("task_status", ["todo", "in_progress", "done"]);

// ─── Projects ────────────────────────────────────────────────────────────────
export const projects = pgTable("projects", {
  id:          serial("id").primaryKey(),
  name:        text("name").notNull(),
  description: text("description"),
  status:      projectStatusEnum("status").notNull().default("active"),
  createdAt:   text("created_at").notNull().default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
  updatedAt:   text("updated_at").notNull().default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
});

// ─── Documents ───────────────────────────────────────────────────────────────
export const documents = pgTable("documents", {
  id:          serial("id").primaryKey(),
  projectId:   integer("project_id").references(() => projects.id),
  title:       text("title").notNull(),
  description: text("description"),
  tags:        text("tags"),          // JSON array stored as string
  uploadedBy:  text("uploaded_by").notNull().default("Council"),
  fileName:    text("file_name"),
  fileSize:    integer("file_size"),
  fileType:    text("file_type"),
  createdAt:   text("created_at").notNull().default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
});

// ─── Council Q&A ─────────────────────────────────────────────────────────────
export const questions = pgTable("questions", {
  id:        serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  question:  text("question").notNull(),
  answer:    text("answer"),
  status:    questionStatusEnum("status").notNull().default("open"),
  author:    text("author").notNull().default("Council"),
  createdAt: text("created_at").notNull().default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
  updatedAt: text("updated_at").notNull().default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
});

// ─── Meeting Notes ────────────────────────────────────────────────────────────
export const meetings = pgTable("meetings", {
  id:          serial("id").primaryKey(),
  projectId:   integer("project_id").references(() => projects.id),
  title:       text("title").notNull(),
  date:        text("date").notNull(),
  summary:     text("summary"),
  decisions:   text("decisions"),    // JSON array stored as string
  actionItems: text("action_items"), // JSON array stored as string
  createdAt:   text("created_at").notNull().default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
});

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasks = pgTable("tasks", {
  id:        serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  task:      text("task").notNull(),
  owner:     text("owner"),
  status:    taskStatusEnum("status").notNull().default("todo"),
  dueDate:   text("due_date"),
  createdAt: text("created_at").notNull().default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
  updatedAt: text("updated_at").notNull().default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type Project  = typeof projects.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Meeting  = typeof meetings.$inferSelect;
export type Task     = typeof tasks.$inferSelect;

export type NewProject  = typeof projects.$inferInsert;
export type NewDocument = typeof documents.$inferInsert;
export type NewQuestion = typeof questions.$inferInsert;
export type NewMeeting  = typeof meetings.$inferInsert;
export type NewTask     = typeof tasks.$inferInsert;
