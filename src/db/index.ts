import { neon } from "@netlify/neon";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(); // automatically uses env NETLIFY_DATABASE_URL

export const db = drizzle(sql, { schema });

export * from "./schema";
