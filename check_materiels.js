const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read from .env.local
const envPath = path.join(__dirname, 'frontend', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
    console.error("Could not find Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function checkData() {
    console.log("Checking for duplicate numero_inventaire...");
    const { data, error } = await supabase
        .from('materiels')
        .select('numero_inventaire, nom')
        .in('numero_inventaire', ['PSY-2026-INF-0001', 'PSY-2026-BUR-0001', 'PSY-2026-INF-0002']);

    if (error) {
        console.error(error);
    } else {
        console.log("Data found for requested codes:");
        console.log(JSON.stringify(data, null, 2));
    }
}

checkData();
