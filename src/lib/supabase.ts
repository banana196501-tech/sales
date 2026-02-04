import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://xpxsluytdqeqfhjrjokd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweHNsdXl0ZHFlcWZoanJqb2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNzczNDMsImV4cCI6MjA4NTY1MzM0M30.g-BBM8a2tRsXnl4uvmcX2sHNt-l7RZM-CQUalhTeqeo';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };