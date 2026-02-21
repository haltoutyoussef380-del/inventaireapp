
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

async function check() {
    const { count: mCount } = await supabase.from('materiels').select('*', { count: 'exact', head: true });
    const { count: iCount } = await supabase.from('inventaires').select('*', { count: 'exact', head: true });
    const { count: lCount } = await supabase.from('inventaire_lignes').select('*', { count: 'exact', head: true });

    console.log(`Materiels: ${mCount}`);
    console.log(`Inventaires: ${iCount}`);
    console.log(`Lignes: ${lCount}`);

    const { data: mats } = await supabase.from('materiels').select('statut').limit(5);
    console.log("Statuts:", mats);
}

check();
