import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

async function check() {
    const { data, error } = await supabase.from('inventaire_lignes').select('inventaire_id, materiel_id, scanne_par').limit(10);
    console.log("Lignes d'inventaires:", data);
}
check();
