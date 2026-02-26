import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

async function check() {
    // Try to insert directly, bypassing any API logic
    console.log("Testing raw insert...");

    // Get a materiel that exists
    const { data: mats } = await supabase.from('materiels').select('id').limit(1);
    const materielId = mats?.[0]?.id;

    if (materielId) {
        console.log(`Using materiel_id: ${materielId}`);
        // Insert into campaign 1
        const { error: err1 } = await supabase.from('inventaire_lignes').insert({
            inventaire_id: 1,
            materiel_id: materielId
        });
        console.log("Insert campaign 1:", err1?.message || "Success");

        // Insert into campaign 2
        const { error: err2 } = await supabase.from('inventaire_lignes').insert({
            inventaire_id: 2,
            materiel_id: materielId
        });
        console.log("Insert campaign 2:", err2?.message || "Success");
    }
}
check();
