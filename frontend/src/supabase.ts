import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hckfizhzvslhyxsaftnx.supabase.co';
const supabaseKey = 'sb_publishable_mWORlipYfNbwlhdgq6WM5g_lEiFxWMW'; // Updated by user

export const supabase = createClient(supabaseUrl, supabaseKey);
