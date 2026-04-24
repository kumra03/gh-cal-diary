import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqjaayvnesifrqolqqrz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxamFheXZuZXNpZnJxb2xxcXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTQzMTMsImV4cCI6MjA5MTMzMDMxM30.qiR67FsPtwxIA1xmJt4yrCZAaIDk-87tgdrPT6LY1S8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
