const { createClient } = require('@supabase/supabase-js');

async function check() {
    try {
        const url = 'https://hckfizhzvslhyxsaftnx.supabase.co';
        const key = 'sb_publishable_mWORlipYfNbwlhdgq6WM5g_lEiFxWMW';

        const supabase = createClient(url, key);

        console.log("Searching for codes matching 'PSY-2026inf-001' or similar...");
        const { data, error } = await supabase
            .from('materiels')
            .select('numero_inventaire, nom')
            .or(`numero_inventaire.ilike.%001%,numero_inventaire.ilike.%inf%`);

        if (error) {
            console.error("DB Error:", error);
        } else {
            console.log("Records found:");
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Script error:", e);
    }
}

check();
