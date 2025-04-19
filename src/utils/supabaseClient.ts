import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://myfxdqzhesqyzbxnwybq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15ZnhkcXpoZXNxeXpieG53eWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNjQyNTMsImV4cCI6MjA2MDY0MDI1M30.Ovzzkkoc4zcr2noE7P_vxEudXnf-aFsDAEBUXzICjeA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
