const { createClient } = require('@supabase/supabase-js');

async function check() {
    try {
        const url = 'https://hckfizhzvslhyxsaftnx.supabase.co';
        const key = 'sb_publishable_mWORlipYfNbwlhdgq6WM5g_lEiFxWMW';

        const supabase = createClient(url, key);

        const { data, error } = await supabase
            .from('materiels')
            .select('numero_inventaire, nom, photo_url')
            .in('numero_inventaire', ['PSY-2026-INF-0001', 'PSY-2026-BUR-0001', 'PSY-2026-INF-0002']);

        if (error) {
            console.error("DB Error:", error);
        } else {
            console.log("Found records:");
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Script error:", e);
    }
}

check();
