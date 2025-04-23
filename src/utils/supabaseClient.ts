import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://epkuyjtbdzmagcawnrne.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwa3V5anRiZHptYWdjYXducm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzUwNDQsImV4cCI6MjA2MTAxMTA0NH0.z4KcnN_dNp5RlqrlIkMp3uvBRO5NJtbDDsoZvnf3dmI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
