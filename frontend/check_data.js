import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log("Checking inventaires...");
    const { data: invs, error: e1 } = await supabase.from('inventaires').select('id, nom, statut').order('created_at', { ascending: false }).limit(3);
    console.log("Recent Inventaires:", invs);

    if (invs && invs.length > 0) {
        const latestId = invs[0].id;
        console.log("\nChecking inventaire_lignes for latest inventaire (" + latestId + ")...");
        const { data: lignes, error: e2 } = await supabase.from('inventaire_lignes')
            .select('id, inventaire_id, materiel_id, presence')
            .eq('inventaire_id', latestId)
            .limit(10);
        console.log(`Lignes for inventaire ${latestId}:`, lignes);

        if (invs.length > 1) {
            const prevId = invs[1].id;
            console.log("\nChecking inventaire_lignes for previous inventaire (" + prevId + ")...");
            const { data: lignesPrev, error: e3 } = await supabase.from('inventaire_lignes')
                .select('id, inventaire_id, materiel_id, presence')
                .eq('inventaire_id', prevId)
                .limit(10);
            console.log(`Lignes for inventaire ${prevId}:`, lignesPrev);
        }
    }
}
check();
