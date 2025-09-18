import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = "https://hacsmddazijrghfcoigl.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhY3NtZGRhemlqcmdoZmNvaWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDU5OTQsImV4cCI6MjA3MzI4MTk5NH0.TvVm0dUGVE32gEBdcoNLD3qo78BxgQy8DFJUpubdn9M";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);