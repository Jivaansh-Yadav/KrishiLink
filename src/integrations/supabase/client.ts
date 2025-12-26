import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jamftlvwvvkixefimiya.supabase.co';
const supabaseKey = 'sb_publishable_IyOXdVAA4bR7qUMVE51uYw_C56oYVv8';

export const supabase = createClient(supabaseUrl, supabaseKey);
