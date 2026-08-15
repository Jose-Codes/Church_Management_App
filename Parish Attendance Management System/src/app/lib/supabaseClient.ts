import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// This app shares the Supabase project used by the parish's
// church-management app (same churches/classes/students, same auth users —
// see /supabase/catequist-attendance-app.sql for the extra tables/columns
// this app adds on top of that shared schema).
//
// The anon key is safe to ship in the browser bundle — Row Level Security on
// every table is what actually enforces who can read/write what. Override
// either value per-environment with a .env.local (see .env.example).
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://tmebalbhbdvpmeyykcvb.supabase.co";

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZWJhbGJoYmR2cG1leXlrY3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMjA1MDgsImV4cCI6MjA5OTg5NjUwOH0.Evm25zgTqH1a7Va1gpPNzT0TBYzz1kcd8yhkkb3pe4s";

let client: SupabaseClient | null = null;

// Lazy singleton, same pattern as church-management's lib/supabaseBrowser.js.
export function getSupabase(): SupabaseClient {
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}
