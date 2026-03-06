import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  real,
} from "drizzle-orm/sqlite-core";

// ─── Projects ────────────────────────────────────────────────────────────────
export const projects = sqliteTable("projects", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  name:        text("name").notNull(),
  description: text("description"),
  status:      text("status", { enum: ["active", "paused", "complete"] }).notNull().default("active"),
  createdAt:   text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt:   text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// ─── Documents ───────────────────────────────────────────────────────────────
export const documents = sqliteTable("documents", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  projectId:   integer("project_id").references(() => projects.id),
  title:       text("title").notNull(),
  description: text("description"),
  tags:        text("tags"),          // JSON array stored as string
  uploadedBy:  text("uploaded_by").notNull().default("Council"),
  fileName:    text("file_name"),
  fileSize:    integer("file_size"),
  fileType:    text("file_type"),
  createdAt:   text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ─── Council Q&A ─────────────────────────────────────────────────────────────
export const questions = sqliteTable("questions", {
  id:        integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").references(() => projects.id),
  question:  text("question").notNull(),
  answer:    text("answer"),
  status:    text("status", { enum: ["open", "reviewing", "resolved"] }).notNull().default("open"),
  author:    text("author").notNull().default("Council"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// ─── Meeting Notes ────────────────────────────────────────────────────────────
export const meetings = sqliteTable("meetings", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  projectId:   integer("project_id").references(() => projects.id),
  title:       text("title").notNull(),
  date:        text("date").notNull(),
  summary:     text("summary"),
  decisions:   text("decisions"),    // JSON array stored as string
  actionItems: text("action_items"), // JSON array stored as string
  createdAt:   text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasks = sqliteTable("tasks", {
  id:        integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").references(() => projects.id),
  task:      text("task").notNull(),
  owner:     text("owner"),
  status:    text("status", { enum: ["todo", "in_progress", "done"] }).notNull().default("todo"),
  dueDate:   text("due_date"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
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
