import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log("Testing raw insert...");

    // Get a materiel that exists
    const { data: mats } = await supabase.from('materiels').select('id').limit(1);
    const materielId = mats?.[0]?.id;

    if (materielId) {
        console.log('Using materiel_id:', materielId);

        const { error: err1 } = await supabase.from('inventaire_lignes').insert({
            inventaire_id: 1,
            materiel_id: materielId
        });
        console.log("Insert campaign 1:", err1?.message || "Success");

        const { error: err2 } = await supabase.from('inventaire_lignes').insert({
            inventaire_id: 2,
            materiel_id: materielId
        });
        console.log("Insert campaign 2:", err2?.message || "Success");
    } else {
        console.log("No materiel found");
    }
}
check();
