/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const viteEnv: Partial<ImportMetaEnv> = import.meta.env ?? {};
const supabaseUrl = viteEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = viteEnv.VITE_SUPABASE_ANON_KEY || '';

// Initialize only if keys are provided, allowing graceful degradation for local testing
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
