import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://hckfizhzvslhyxsaftnx.supabase.co';
export const supabaseAnonKey = 'sb_publishable_mWORlipYfNbwlhdgq6WM5g_lEiFxWMW'; // Updated by user

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
