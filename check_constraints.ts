import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

async function check() {
    // Attempt to insert a dummy record for a materiel that might already be in an inventory
    console.log("Checking duplicates...");

    // We can just try to insert a line for materiel 1 on a fake inventaire 9999
    const { data: mats } = await supabase.from('materiels').select('id').limit(1);
    const materielId = mats?.[0]?.id;

    if (materielId) {
        // Try inserting it to inventaire 1
        const { error: err1 } = await supabase.from('inventaire_lignes').insert({
            inventaire_id: 1,
            materiel_id: materielId
        });
        console.log("Insert 1 error:", err1?.message || "Success");

        // Try inserting to inventaire 2
        const { error: err2 } = await supabase.from('inventaire_lignes').insert({
            inventaire_id: 2,
            materiel_id: materielId
        });
        console.log("Insert 2 error:", err2?.message || "Success");
    }
}
check();
