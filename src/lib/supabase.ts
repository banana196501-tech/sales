import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://drlesfoyosvosmbovwsr.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImQyM2Q4ZjMxLTk1OWQtNDQ4My1hZjFmLTVkYmQ2NzdmNTcxZiJ9.eyJwcm9qZWN0SWQiOiJkcmxlc2ZveW9zdm9zbWJvdndzciIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzcwMDg4ODI5LCJleHAiOjIwODU0NDg4MjksImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.FzFGNgEI13Vth7oIVe0119tCQEkceK-zERlT9T6Feno';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };