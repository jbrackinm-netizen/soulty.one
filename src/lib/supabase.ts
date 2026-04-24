import { createClient } from "@supabase/supabase-js";

// Support both naming styles: SUPABASE_URL (production) and NEXT_PUBLIC_SUPABASE_URL (Next.js convention)
const supabaseUrl =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "";

const supabaseAnonKey =
  process.env.SUPABASE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

// Supabase client — reserved for Phase 2 pgvector migration.
// Currently no routes use this; all DB access goes through Drizzle/libsql.
// Set SUPABASE_URL and SUPABASE_KEY (or NEXT_PUBLIC_ variants) to enable.
export const supabase = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
