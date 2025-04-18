import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dffoglyresgtixpkzwgc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmZm9nbHlyZXNndGl4cGt6d2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMDkyMDUsImV4cCI6MjA1OTU4NTIwNX0.Yc0Y8HGMu-30aquZ0N9f0l17wN_MOG5Dl2gC4Q6M8j8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
