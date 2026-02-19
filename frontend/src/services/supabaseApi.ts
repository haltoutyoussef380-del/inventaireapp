import { supabase } from '../supabase';

export const materielService = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('materiels')
            .select('*, categories(code, libelle)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    create: async (materiel: any) => {
        // 1. Sanitize Payload
        // Remove empty strings for optional fields (creates DB errors on dates)
        const payload = { ...materiel };
        if (!payload.date_acquisition) delete payload.date_acquisition;
        if (payload.categorie_id) payload.categorie_id = parseInt(payload.categorie_id, 10);

        // 2. Get Category Code
        const { data: cat } = await supabase.from('categories').select('code').eq('id', payload.categorie_id).single();
        const codeCat = cat?.code || 'INC';

        // 3. Generate Number (Approximation for demo)
        const year = new Date().getFullYear();
        const prefix = `PSY-${year}-${codeCat}`;

        // Find last sequence
        const { data: last } = await supabase
            .from('materiels')
            .select('numero_inventaire')
            .ilike('numero_inventaire', `${prefix}-%`)
            .order('numero_inventaire', { ascending: false })
            .limit(1)
            .single();

        let sequence = 1;
        if (last) {
            const parts = last.numero_inventaire.split('-');
            const lastSeq = parseInt(parts[3]);
            if (!isNaN(lastSeq)) sequence = lastSeq + 1;
        }

        const numero_inventaire = `${prefix}-${sequence.toString().padStart(4, '0')}`;

        const { data, error } = await supabase
            .from('materiels')
            .insert([{ ...payload, numero_inventaire }])
            .select()
            .single();

        if (error) {
            console.error("Supabase Create Error:", error);
            throw error;
        }
        return data;
    },

    uploadPhoto: async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('materiel-photos')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage.from('materiel-photos').getPublicUrl(filePath);
        return data.publicUrl;
    },

    getBarcodeUrl: (code: string) => {
        // Using bwip-js locally or via a public API for simple img src
        // Since we removed the backend, we can use a public API or a client-side lib.
        // Let's use a robust public API for now to save setup time, or we can use the bwip-js client side.
        return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${code}&scale=3&includetext`;
    }
};

export const categorieService = {
    getAll: async () => {
        const { data, error } = await supabase.from('categories').select('*');
        if (error) throw error;
        return data;
    }
};

export const inventaireService = {
    create: async (inventaire: any) => {
        const { data, error } = await supabase
            .from('inventaires')
            .insert([inventaire])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    getMaterielByCode: async (code: string) => {
        const { data: materiel, error } = await supabase
            .from('materiels')
            .select('*')
            .eq('numero_inventaire', code)
            .single();

        if (error || !materiel) throw new Error('Matériel non trouvé');
        return materiel;
    },

    confirmScan: async (scanData: { inventaire_id: number, materiel_id: number, user_id: string }) => {
        // Check if already scanned in this inventory
        const { data: existing } = await supabase
            .from('inventaire_lignes')
            .select('id')
            .eq('inventaire_id', scanData.inventaire_id)
            .eq('materiel_id', scanData.materiel_id)
            .single();

        if (existing) {
            throw new Error('Déjà scanné dans cet inventaire');
        }

        const { data: ligne, error: lineError } = await supabase
            .from('inventaire_lignes')
            .insert([{
                inventaire_id: scanData.inventaire_id,
                materiel_id: scanData.materiel_id,
                scanne_par: scanData.user_id,
                presence: true
            }])
            .select()
            .single();


        if (lineError) throw lineError;
        return ligne;
    },

    getAll: async () => {
        const { data, error } = await supabase
            .from('inventaires')
            .select('*')
            .order('date_debut', { ascending: false });
        if (error) throw error;
        return data;
    },

    getStats: async (inventaireId: number, userId: string) => {
        const { count, error } = await supabase
            .from('inventaire_lignes')
            .select('*', { count: 'exact', head: true })
            .eq('inventaire_id', inventaireId)
            .eq('scanne_par', userId);

        if (error) throw error;
        return { scannedCount: count || 0 };
    }
};

// Hack: Create a second client to allow Admin to create users without logging himself out
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '../supabase';

export const userService = {
    getAgents: async () => {
        // Fetch profiles where role = agent
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'agent');

        if (error) throw error;
        return data;
    },

    createAgent: async (email: string, password: string, name: string) => {
        // 1. Create a temporary client
        const tempClient = createClient(supabaseUrl, supabaseAnonKey);

        // 2. Sign up the new user
        const { data, error } = await tempClient.auth.signUp({
            email,
            password,
            options: {
                data: { role: 'agent', full_name: name } // We pass metadata to trigger the trigger? No, we update profile manually if needed
            }
        });

        if (error) throw error;

        // 3. Since we have a trigger that creates profile on signup, we might want to update the name immediately
        // But for now, let's assume the Trigger in SQL handles the insertion into 'profiles'.
        // If the trigger just sets ID, we might need to update the profile with the name.

        if (data.user) {
            // Update the profile with the name/role if the trigger basic insert wasn't enough
            // But we can't use tempClient to update 'profiles' effectively if RLS blocks it.
            // The Admin (main 'supabase' client) CAN update profiles.

            const { error: profileError } = await supabase
                .from('profiles')
                .update({ role: 'agent', email: email }) // Ensure role is agent
                .eq('id', data.user.id);

            if (profileError) console.error("Error updating profile role:", profileError);
        }

        return data;
    }
};
