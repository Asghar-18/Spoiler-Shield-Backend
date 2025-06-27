import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.type";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Use service role key for backend operations
export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Client for user operations (with anon key)
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);